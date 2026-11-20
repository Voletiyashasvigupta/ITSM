import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AppBar, Avatar, Badge, Box, Button, ButtonBase, Chip, Divider, FormControl, IconButton, InputAdornment, InputLabel, Alert, CircularProgress,
  Dialog, DialogActions, DialogContent, DialogTitle, List, ListItemButton, ListItemIcon, ListItemText, Menu, MenuItem, Paper, Select,
  TextField, Toolbar, Typography,
} from '@mui/material'
import DashboardRounded from '@mui/icons-material/DashboardRounded'
import SearchRounded from '@mui/icons-material/SearchRounded'
import NotificationsNoneRounded from '@mui/icons-material/NotificationsNoneRounded'
import ControlPointRounded from '@mui/icons-material/ControlPointRounded'
import LaptopMacRounded from '@mui/icons-material/LaptopMacRounded'
import ManageAccountsRounded from '@mui/icons-material/ManageAccountsRounded'
import LocalParkingRounded from '@mui/icons-material/LocalParkingRounded'
import MedicalServicesRounded from '@mui/icons-material/MedicalServicesRounded'
import ReceiptLongRounded from '@mui/icons-material/ReceiptLongRounded'
import TaskAltRounded from '@mui/icons-material/TaskAltRounded'
import SettingsOutlined from '@mui/icons-material/SettingsOutlined'
import KeyboardArrowRightRounded from '@mui/icons-material/KeyboardArrowRightRounded'
import SupportAgentRounded from '@mui/icons-material/SupportAgentRounded'
import LogoutRounded from '@mui/icons-material/LogoutRounded'
import AuthScreen from './auth/AuthScreen'
import PasswordSettings from './auth/PasswordSettings'
import UserAccessPage from './auth/UserAccessPage'
import { useAuth } from './auth/AuthContext'
import type { PortalUser } from './auth/AuthContext'
import { useLocation, useNavigate } from 'react-router-dom'

type Request = { id: string; backendId?: string; title: string; category: string; status: string; date: string; color: string; description?: string }
type Approval = { id: string; requestId: string; requestNumber: string; title: string; employee: string; initials: string; requested: string; decision?: string }
type Approver = { id: string; fullName: string }
type RequestReceiptData = { number: string; service: string; status: string; approver: string; createdAt: string; details: Array<{ label: string; value: string }> }
type LiveCatalogItem = { sys_id?: string; name?: string; short_description?: string; category?: string | { display_value?: string } }
type RequestField = { name: string; label: string; kind: 'select' | 'text' | 'date' | 'textarea'; options?: string[]; required?: boolean; helper?: string }
type RequestDetail = { id: string; requestNumber: string; serviceName: string; description: string; requesterId: string; requestedForId: string; approverId: string | null; status: string; externalId?: string | null; externalSystem?: string | null; fields: Record<string,string>; createdAt: string; updatedAt: string }
type RequestHistoryRow = { id: string; actorId: string; action: string; fromStatus: string | null; toStatus: string | null; comment?: string | null; createdAt: string }
type IncidentRecord = { id: string; title: string; description: string; category: string; priority: string; status: string; reporterId: string; assigneeId?: string | null; createdAt: string; updatedAt: string }
type IncidentDetailRecord = { incident: IncidentRecord; comments: Array<{ id: string; authorId: string; comment: string; createdAt: string }> }
const initialRequests: Request[] = []
const initialApprovals: Approval[] = []
const services = [
  { title: 'Request a device', description: 'Laptops, monitors and accessories', icon: <LaptopMacRounded />, tint: 'tint-blue', group: 'IT' },
  { title: 'Access and accounts', description: 'Software, shared drives and access', icon: <ManageAccountsRounded />, tint: 'tint-violet', group: 'IT' },
  { title: 'Workplace services', description: 'Facilities, parking and office needs', icon: <LocalParkingRounded />, tint: 'tint-orange', group: 'Facilities' },
  { title: 'People support', description: 'Benefits, onboarding and HR help', icon: <MedicalServicesRounded />, tint: 'tint-green', group: 'HR' },
]
const serviceForms: Record<string, { intro: string; fields: RequestField[] }> = {
  'Request a device': { intro: 'Choose the equipment and tell us how it will be used. Your answers help IT prepare the right device.', fields: [
    { name: 'item', label: 'What do you need?', kind: 'select', options: ['Laptop', 'Desktop computer', 'Monitor', 'Docking station', 'Keyboard or mouse', 'Headset or webcam', 'Mobile phone', 'Other'], required: true },
    { name: 'workStyle', label: 'Primary work setup', kind: 'select', options: ['Office based', 'Hybrid', 'Remote'], required: true },
    { name: 'location', label: 'Office or delivery location', kind: 'text', required: true, helper: 'Enter an office/site name. Do not include a home address.' },
    { name: 'neededBy', label: 'When do you need it?', kind: 'date', required: true },
    { name: 'reason', label: 'Business reason', kind: 'textarea', required: true },
  ] },
  'Access and accounts': { intro: 'Request a new account or a change to your access. Include the application and the work you need to perform.', fields: [
    { name: 'accessType', label: 'What access help do you need?', kind: 'select', options: ['New access', 'Change existing access', 'Remove access', 'Unlock account or reset sign-in', 'Shared mailbox or distribution list', 'VPN or network access', 'Hardware token / MFA'], required: true },
    { name: 'application', label: 'Application, system, or shared resource', kind: 'text', required: true, helper: 'For example: SAP, Salesforce, a shared drive, or a team mailbox.' },
    { name: 'accessLevel', label: 'Access level needed', kind: 'select', options: ['Standard user', 'Read only', 'Contributor / editor', 'Approver', 'Other / not sure'], required: true },
    { name: 'duration', label: 'How long is access needed?', kind: 'select', options: ['Ongoing role requirement', 'Temporary — up to 30 days', 'Temporary — 1 to 6 months', 'Not sure'], required: true },
    { name: 'reason', label: 'Business justification', kind: 'textarea', required: true },
  ] },
  'Workplace services': { intro: 'Tell the Facilities team what you need and which workplace is affected.', fields: [
    { name: 'requestType', label: 'What workplace help do you need?', kind: 'select', options: ['Maintenance or repair', 'Parking', 'Office move or seating', 'Access badge', 'Furniture or equipment', 'Office supplies', 'Cleaning or pest issue', 'Safety concern', 'Other'], required: true },
    { name: 'location', label: 'Office / site and room or area', kind: 'text', required: true },
    { name: 'neededBy', label: 'Preferred date', kind: 'date', required: true },
    { name: 'urgency', label: 'Impact', kind: 'select', options: ['Routine', 'Affects my work', 'Affects a team or shared area', 'Safety concern'], required: true },
    { name: 'reason', label: 'Describe the issue or what is needed', kind: 'textarea', required: true },
  ] },
  'People support': { intro: 'Select the HR topic and describe the help you need. Avoid entering medical, financial, or other sensitive personal details here.', fields: [
    { name: 'topic', label: 'What People team help do you need?', kind: 'select', options: ['Benefits', 'Payroll question', 'Leave policy or balance', 'Onboarding', 'Employment verification', 'Employment or workplace policy', 'Personal information update', 'Other'], required: true },
    { name: 'contactMethod', label: 'Preferred follow-up', kind: 'select', options: ['Email', 'Phone or video call', 'No preference'], required: true },
    { name: 'neededBy', label: 'When do you need a response?', kind: 'date' },
    { name: 'reason', label: 'How can the People team help?', kind: 'textarea', required: true, helper: 'Please do not include bank details, health information, or government ID numbers.' },
  ] },
}
function deviceSpecificationFields(item: string | undefined): RequestField[] {
  if (!item) return []
  const fields: RequestField[] = [
    { name: 'brandModel', label: 'Preferred brand or model (optional)', kind: 'text', helper: 'A preference only; availability and company standards will be checked.' },
    { name: 'specificationNotes', label: 'Other specifications or compatibility needs', kind: 'textarea', helper: 'Mention required ports, software compatibility, accessibility needs, or other details.' },
  ]
  if (item === 'Laptop' || item === 'Desktop computer') fields.unshift(
    { name: 'operatingSystem', label: 'Operating system', kind: 'select', options: ['Windows', 'macOS', 'Linux', 'No preference'] },
    { name: 'memory', label: 'Memory (RAM)', kind: 'select', options: ['8 GB', '16 GB', '32 GB', '64 GB', 'No preference'] },
    { name: 'storage', label: 'Storage', kind: 'select', options: ['256 GB SSD', '512 GB SSD', '1 TB SSD', '2 TB SSD', 'No preference'] },
    { name: 'performance', label: 'Performance level', kind: 'select', options: ['Standard office work', 'Development / design', 'High performance', 'No preference'] },
  )
  else if (item === 'Monitor') fields.unshift(
    { name: 'screenSize', label: 'Screen size', kind: 'select', options: ['24 inch', '27 inch', '32 inch', 'No preference'] },
    { name: 'resolution', label: 'Resolution', kind: 'select', options: ['Full HD (1080p)', 'QHD (1440p)', '4K', 'No preference'] },
  )
  else if (item === 'Mobile phone') fields.unshift(
    { name: 'phonePlatform', label: 'Preferred platform', kind: 'select', options: ['iOS', 'Android', 'No preference'] },
    { name: 'phoneStorage', label: 'Storage capacity', kind: 'select', options: ['128 GB', '256 GB', '512 GB', 'No preference'] },
  )
  else if (item === 'Docking station' || item === 'Keyboard or mouse' || item === 'Headset or webcam') fields.unshift(
    { name: 'deviceCompatibility', label: 'Connects to / compatible with', kind: 'text', helper: 'Enter your computer model, operating system, or connection type if known.' },
  )
  return fields
}
function conditionalRequestFields(service: string, values: Record<string, string>): RequestField[] {
  if (service === 'Request a device') return deviceSpecificationFields(values.item)
  if (service === 'Access and accounts') {
    const shared: RequestField = { name: 'accessTarget', label: 'Who needs this access?', kind: 'text', required: true, helper: 'Enter the employee or team name. Do not enter a password.' }
    switch (values.accessType) {
      case 'New access': return [shared,
        { name: 'accessRoleDetails', label: 'Role or permission requested', kind: 'text', required: true },
        { name: 'accessStart', label: 'When should access begin?', kind: 'date', required: true },
      ]
      case 'Change existing access': return [shared,
        { name: 'currentAccess', label: 'Current access level', kind: 'text', required: true },
        { name: 'newAccess', label: 'What should change?', kind: 'text', required: true },
      ]
      case 'Remove access': return [shared,
        { name: 'removeAccess', label: 'Which access should be removed?', kind: 'text', required: true },
        { name: 'accessEnd', label: 'When should it be removed?', kind: 'date', required: true },
      ]
      case 'Unlock account or reset sign-in': return [
        { name: 'accountName', label: 'Account username or work email', kind: 'text', required: true },
        { name: 'signInIssue', label: 'Sign-in issue', kind: 'select', options: ['Account locked', 'Forgot password', 'MFA problem', 'Other'], required: true },
      ]
      case 'Shared mailbox or distribution list': return [
        { name: 'mailboxName', label: 'Mailbox or list name', kind: 'text', required: true },
        { name: 'mailAction', label: 'What do you need?', kind: 'select', options: ['Create', 'Add member', 'Remove member', 'Change owner', 'Send as / send on behalf'], required: true },
        { name: 'mailMembers', label: 'People to add or remove', kind: 'textarea' },
      ]
      case 'VPN or network access': return [
        { name: 'networkLocation', label: 'Network or location needed', kind: 'text', required: true },
        { name: 'networkDuration', label: 'Access duration', kind: 'select', options: ['Ongoing', 'Up to 30 days', '1 to 6 months'], required: true },
      ]
      case 'Hardware token / MFA': return [
        { name: 'mfaAction', label: 'MFA help needed', kind: 'select', options: ['Enroll a new device', 'Replace a lost or broken token', 'Reset MFA', 'Troubleshoot sign-in'], required: true },
      ]
      default: return []
    }
  }
  if (service === 'Workplace services') {
    switch (values.requestType) {
      case 'Maintenance or repair': return [
        { name: 'maintenanceType', label: 'Type of issue', kind: 'select', options: ['Electrical / lighting', 'Heating / cooling', 'Plumbing', 'Door / lock', 'Furniture', 'Other'], required: true },
        { name: 'assetReference', label: 'Asset or room reference (if known)', kind: 'text' },
      ]
      case 'Parking': return [
        { name: 'parkingType', label: 'Parking request', kind: 'select', options: ['New permit', 'Renew permit', 'Change permit', 'Visitor parking'], required: true },
        { name: 'parkingSchedule', label: 'Days or schedule needed', kind: 'text', required: true },
      ]
      case 'Office move or seating': return [
        { name: 'moveFrom', label: 'Current office / area', kind: 'text', required: true },
        { name: 'moveTo', label: 'New office / area or team', kind: 'text', required: true },
        { name: 'movePeople', label: 'Number of people affected', kind: 'select', options: ['Just me', '2–5', '6–20', 'More than 20'], required: true },
      ]
      case 'Access badge': return [
        { name: 'badgeAction', label: 'Badge request', kind: 'select', options: ['New badge', 'Replace damaged badge', 'Report lost badge', 'Change access areas'], required: true },
        { name: 'badgeAreas', label: 'Building or access areas needed', kind: 'text', required: true },
      ]
      case 'Furniture or equipment': return [
        { name: 'furnitureItem', label: 'Item needed', kind: 'select', options: ['Desk', 'Chair', 'Storage', 'Ergonomic equipment', 'Meeting room equipment', 'Other'], required: true },
        { name: 'furnitureQuantity', label: 'Quantity', kind: 'text', required: true },
      ]
      case 'Office supplies': return [
        { name: 'supplyItems', label: 'Supplies and quantities', kind: 'textarea', required: true },
        { name: 'deliveryPoint', label: 'Delivery point / department', kind: 'text', required: true },
      ]
      case 'Cleaning or pest issue': return [
        { name: 'cleaningArea', label: 'Area affected', kind: 'text', required: true },
        { name: 'cleaningTime', label: 'Best time to access the area', kind: 'text' },
      ]
      case 'Safety concern': return [
        { name: 'safetyHazard', label: 'Type of safety concern', kind: 'select', options: ['Slip / trip hazard', 'Damaged equipment', 'Blocked exit', 'Other'], required: true },
        { name: 'immediateRisk', label: 'Is anyone at immediate risk?', kind: 'select', options: ['Yes', 'No', 'Not sure'], required: true, helper: 'For immediate danger, contact local emergency or site safety staff now.' },
      ]
      default: return []
    }
  }
  if (service === 'People support') {
    switch (values.topic) {
      case 'Benefits': return [
        { name: 'benefitArea', label: 'Benefits area', kind: 'select', options: ['Health / wellbeing', 'Retirement', 'Insurance', 'Enrollment or eligibility', 'Other'], required: true },
        { name: 'benefitAction', label: 'What help do you need?', kind: 'select', options: ['Information', 'How to enroll', 'Update or correction', 'Resolve an issue'], required: true },
      ]
      case 'Payroll question': return [
        { name: 'payrollArea', label: 'Payroll topic', kind: 'select', options: ['Pay statement', 'Pay date', 'Hours or overtime', 'Tax form', 'Other'], required: true },
        { name: 'payPeriod', label: 'Pay period or date in question', kind: 'text', required: true, helper: 'Do not include bank account or tax ID numbers.' },
      ]
      case 'Leave policy or balance': return [
        { name: 'leaveType', label: 'Leave type', kind: 'select', options: ['Annual / vacation', 'Sick leave', 'Parental', 'Unpaid', 'Other / not sure'], required: true },
        { name: 'leaveHelp', label: 'What do you need help with?', kind: 'select', options: ['Understand policy', 'How to submit a request', 'Balance question', 'Correct an existing entry'], required: true },
      ]
      case 'Onboarding': return [
        { name: 'onboardingStage', label: 'Onboarding stage', kind: 'select', options: ['Before first day', 'First week', 'New team / role change'], required: true },
        { name: 'startDate', label: 'Start date', kind: 'date', required: true },
        { name: 'onboardingNeeds', label: 'Support needed', kind: 'select', options: ['Documents / process', 'Orientation', 'Benefits enrollment', 'Other'], required: true },
      ]
      case 'Employment verification': return [
        { name: 'verificationPurpose', label: 'Purpose', kind: 'select', options: ['Rental / mortgage', 'Visa / immigration', 'Loan', 'Other'], required: true },
        { name: 'verificationDelivery', label: 'How should the letter be delivered?', kind: 'select', options: ['To me', 'Directly to the requesting organization'], required: true },
      ]
      case 'Employment or workplace policy': return [
        { name: 'policyArea', label: 'Policy area', kind: 'select', options: ['Code of conduct', 'Remote work', 'Expenses', 'Timekeeping', 'Other'], required: true },
      ]
      case 'Personal information update': return [
        { name: 'profileUpdateArea', label: 'Information to update', kind: 'select', options: ['Preferred name', 'Work contact details', 'Emergency contact', 'Other'], required: true },
        { name: 'profileUpdateMethod', label: 'What help is needed?', kind: 'select', options: ['How to update it', 'Request a correction', 'System access issue'], required: true },
      ]
      default: return []
    }
  }
  return []
}
const employeeNav = [
  { label: 'Overview', icon: <DashboardRounded /> },
  { label: 'Service catalog', icon: <SearchRounded /> },
  { label: 'My requests', icon: <ReceiptLongRounded /> },
]
const managementNav = [
  { label: 'Requests', icon: <ReceiptLongRounded /> },
  { label: 'Approvals', icon: <TaskAltRounded /> },
  { label: 'User access', icon: <ManageAccountsRounded /> },
]
const incidentNav = { label: 'Incidents', icon: <SupportAgentRounded /> }

function statusTone(status: Request['status']) { return status === 'Completed' ? 'success' : status === 'Awaiting approval' || status === 'Pending sync' ? 'warning' : 'info' }

export default function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, loading: authLoading, logout, apiFetch, isImpersonating, impersonate, stopImpersonating } = useAuth()
  const [active, setActive] = useState('Overview')
  const [requests, setRequests] = useState(initialRequests)
  const [approvals, setApprovals] = useState<Approval[]>(initialApprovals)
  const [busy, setBusy] = useState(false)
  const [workspaceLoading, setWorkspaceLoading] = useState(false)
  const [workspaceError, setWorkspaceError] = useState('')
  const [requestDetail, setRequestDetail] = useState<RequestDetail | null>(null)
  const [requestHistory, setRequestHistory] = useState<RequestHistoryRow[]>([])
  const [incidentRows, setIncidentRows] = useState<Array<{ id: string; title: string; category: string; priority: string; status: string; createdAt: string }>>([])
  const [incidentDetail, setIncidentDetail] = useState<IncidentDetailRecord | null>(null)
  const [incidentComment, setIncidentComment] = useState('')
  const [incidentFormOpen, setIncidentFormOpen] = useState(false)
  const [incidentForm, setIncidentForm] = useState({ title: '', category: 'IT', priority: 'MEDIUM', description: '' })
  const [query, setQuery] = useState('')
  const [toast, setToast] = useState('')
  const [liveCatalog, setLiveCatalog] = useState<LiveCatalogItem[]>([])
  const [catalogStale, setCatalogStale] = useState(false)
  const [catalogFilter, setCatalogFilter] = useState('All teams')
  const [selectedService, setSelectedService] = useState<string | null>(null)
  const [requestFields, setRequestFields] = useState<Record<string, string>>({})
  const [approvers, setApprovers] = useState<Approver[]>([])
  const [approversLoading, setApproversLoading] = useState(false)
  const [receipt, setReceipt] = useState<RequestReceiptData | null>(null)
  const [notificationsAnchor, setNotificationsAnchor] = useState<HTMLElement | null>(null)
  const [profileAnchor, setProfileAnchor] = useState<HTMLElement | null>(null)
  const [impersonationOpen, setImpersonationOpen] = useState(false)
  const [impersonationUsers, setImpersonationUsers] = useState<PortalUser[]>([])
  const [impersonationUserId, setImpersonationUserId] = useState('')
  const [impersonationBusy, setImpersonationBusy] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const routeToPage: Record<string,string> = { '/': 'Overview', '/catalog': 'Service catalog', '/requests': 'My requests', '/manage/requests': 'Requests', '/approvals': 'Approvals', '/incidents': 'Incidents', '/access': 'User access', '/settings': 'Settings', '/requests/receipt': 'Request receipt' }
  const pageToRoute: Record<string,string> = { 'Overview': '/', 'Service catalog': '/catalog', 'My requests': '/requests', 'Requests': '/manage/requests', 'Approvals': '/approvals', 'Incidents': '/incidents', 'User access': '/access', 'Settings': '/settings', 'Request receipt': '/requests/receipt' }
  useEffect(() => {
    const requestPath = location.pathname.match(/^\/requests\/([0-9a-f-]{36})$/i)
    if (requestPath) {
      setActive('Request Detail'); setSelectedService(null)
      if (requestDetail?.id !== requestPath[1]) void Promise.all([apiFetch(`/api/requests/${requestPath[1]}`),apiFetch(`/api/requests/${requestPath[1]}/history`)]).then(async ([detail,history])=>{if(detail.ok&&history.ok){setRequestDetail(await detail.json() as RequestDetail);setRequestHistory(await history.json() as RequestHistoryRow[])}})
      return
    }
    const incidentPath = location.pathname.match(/^\/incidents\/([0-9a-f-]{36})$/i)
    if (incidentPath) {
      setActive('Incident Detail'); setSelectedService(null)
      if (incidentDetail?.incident.id !== incidentPath[1]) void apiFetch(`/api/incidents/${incidentPath[1]}`).then(async (response)=>{if(response.ok)setIncidentDetail(await response.json() as IncidentDetailRecord)})
      return
    }
    const page = routeToPage[location.pathname]
    if (page) { if (active !== page) setActive(page); if (location.pathname !== '/requests/new') setSelectedService(null) }
    if (location.pathname === '/requests/new') { setActive('Service catalog'); setSelectedService(new URLSearchParams(location.search).get('service')) }
  }, [location.pathname, location.search])
  useEffect(() => {
    if (selectedService) { navigate(`/requests/new?service=${encodeURIComponent(selectedService)}`); return }
    const path = pageToRoute[active]
    if (path && location.pathname !== path) navigate(path)
  }, [active, selectedService])
  useEffect(() => {
    setActive('Overview')
    setRequests([])
    setApprovals([])
    setIncidentRows([])
    setSelectedService(null)
    setRequestFields({})
    setReceipt(null)
    setToast('')
    setQuery('')
    setLiveCatalog([])
    setCatalogStale(false)
    setCatalogFilter('All teams')
    setApprovers([])
  }, [user?.id])

  const loadWorkspace = async () => {
    setWorkspaceLoading(true); setWorkspaceError('')
    try {
      const [requestResponse, approvalResponse, incidentResponse] = await Promise.all([
        apiFetch('/api/requests?page=0&size=50'), apiFetch('/api/approvals/pending'), apiFetch('/api/incidents'),
      ])
      if (!requestResponse.ok || !approvalResponse.ok || !incidentResponse.ok) throw new Error('Some workspace data could not be loaded. Try again.')
      const requestPage = await requestResponse.json() as { content?: Array<{ id: string; requestNumber: string; serviceName: string; status: string; createdAt: string; description: string }> }
      const approvalData = await approvalResponse.json() as Array<{ id: string; requestId: string; requestNumber: string; serviceName: string; requesterId: string; createdAt: string; decision: string }>
      const incidentData = await incidentResponse.json() as Array<{ id: string; title: string; category: string; priority: string; status: string; createdAt: string }>
      setRequests((requestPage.content ?? []).map((r) => ({ backendId: r.id, id: r.requestNumber, title: r.serviceName, category: 'Service request', status: r.status.replaceAll('_', ' '), date: new Date(r.createdAt).toLocaleDateString(), color: 'amber', description: r.description })))
      setApprovals(approvalData.filter((a) => a.decision === 'PENDING').map((a) => ({ id: a.id, requestId: a.requestId, requestNumber: a.requestNumber, title: a.serviceName, employee: a.requesterId, initials: a.requesterId.slice(0, 2).toUpperCase(), requested: new Date(a.createdAt).toLocaleDateString() })))
      setIncidentRows(incidentData)
    } catch (cause) { setWorkspaceError(cause instanceof Error ? cause.message : 'Workspace data could not be loaded.') }
    finally { setWorkspaceLoading(false) }
  }
  useEffect(() => { if (user) void loadWorkspace() }, [user?.id])
  useEffect(() => {
    if (!user || user.role !== 'MANAGER_ADMIN' || isImpersonating) return
    void apiFetch('/api/auth/admin/users').then(async (response) => {
      if (!response.ok) return
      const users = await response.json() as PortalUser[]
      setImpersonationUsers(users.filter((candidate) => candidate.active !== false && candidate.id !== user.id && candidate.role))
    }).catch(() => setImpersonationUsers([]))
  }, [user?.id, user?.role, isImpersonating, apiFetch])

  const filteredServices = useMemo(() => services.filter((s) => `${s.title} ${s.description} ${s.group}`.toLowerCase().includes(query.toLowerCase())), [query])
  const displayedCatalog = useMemo(() => {
    const catalogItems = !liveCatalog.length ? filteredServices : liveCatalog.map((item, index) => {
      const fallback = services[index % services.length]
      const category = typeof item.category === 'string' ? item.category : item.category?.display_value
      return {
        title: item.name || 'Service request',
        description: item.short_description || 'View details and submit this service request.',
        icon: fallback.icon,
        tint: fallback.tint,
        group: category || fallback.group,
      }
    })
    return catalogItems.filter((item) => {
      const matchesSearch = `${item.title} ${item.description} ${item.group}`.toLowerCase().includes(query.toLowerCase())
      const matchesTeam = catalogFilter === 'All teams' || item.group.toLowerCase().includes(catalogFilter.toLowerCase())
      return matchesSearch && matchesTeam
    })
  }, [liveCatalog, filteredServices, query, catalogFilter])
  const isManagerAdmin = user?.role === 'MANAGER_ADMIN'
  const firstName = user?.fullName.split(/\s+/)[0] ?? 'there'
  const initials = user?.fullName.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase() ?? 'N'
  const title = selectedService ? selectedService : active === 'Overview' ? `Good morning, ${firstName}` : active
  const todayLabel = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date()).toUpperCase()

  useEffect(() => {
    if (!user) return
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 2500)
    apiFetch('/api/catalog?limit=100', { signal: controller.signal })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('Catalog is using sample data')))
      .then((result: { stale?: boolean; items?: LiveCatalogItem[] }) => {
        if (Array.isArray(result.items)) setLiveCatalog(result.items)
        setCatalogStale(Boolean(result.stale))
      })
      .catch(() => undefined)
      .finally(() => window.clearTimeout(timeout))
    return () => { controller.abort(); window.clearTimeout(timeout) }
  }, [apiFetch, user])

  useEffect(() => {
    function handleSearchShortcut(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleSearchShortcut)
    return () => window.removeEventListener('keydown', handleSearchShortcut)
  }, [])

  useEffect(() => {
    if (!user) return
    setApproversLoading(true)
    apiFetch('/api/auth/approvers')
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('Could not load approvers')))
      .then((result: Approver[]) => setApprovers(Array.isArray(result) ? result : []))
      .catch(() => setApprovers([]))
      .finally(() => setApproversLoading(false))
  }, [apiFetch, user])

  if (authLoading) return <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', color: 'text.secondary' }}>Checking your sign-in…</Box>
  if (!user) return <AuthScreen />

  async function submitRequest(service: string) {
    const definition = serviceForms[service] ?? { intro: '', fields: [
      { name: 'requestType', label: 'What do you need?', kind: 'text' as const, required: true },
      { name: 'neededBy', label: 'When do you need it?', kind: 'date' as const },
      { name: 'reason', label: 'Business reason and details', kind: 'textarea' as const, required: true },
    ] }
    const approver = approvers.find((candidate) => candidate.id === requestFields.approverId)
    const approverName = approver?.fullName || requestFields.approverName?.trim()
    if (!approverName) {
      setToast('Enter the name of the manager who should approve this request.')
      window.setTimeout(() => setToast(''), 5000)
      return
    }
    const conditional = conditionalRequestFields(service, requestFields)
    if ([...definition.fields, ...conditional].some((field) => field.required && !requestFields[field.name]?.trim())) {
      setToast('Complete all required fields before submitting.'); window.setTimeout(() => setToast(''), 5000); return
    }
    if (!requestFields.approverId) { setToast('Select an active manager or administrator to approve this request.'); window.setTimeout(() => setToast(''), 5000); return }
    const allFields = [...definition.fields, ...conditional]
    const detailItems = allFields.filter((field) => requestFields[field.name]?.trim()).map((field) => ({ label: field.label, value: requestFields[field.name].trim() }))
    const details = [...detailItems.map((item) => `${item.label}: ${item.value}`), `Requested approver: ${approverName}`].join('\n')
    try {
      setBusy(true)
      const response = await apiFetch('/api/requests', {
        method: 'POST',
        headers: { 'Idempotency-Key': crypto.randomUUID() },
        body: JSON.stringify({ serviceName: service, description: details, requestedForId: user?.id ?? '', approverId: requestFields.approverId, fields: requestFields }),
      })
      if (!response.ok) {
        const body = await response.json().catch(() => ({})) as { detail?: string; message?: string }
        throw new Error(body.detail || body.message || `Request failed (${response.status})`)
      }
      const result = await response.json() as { id: string; requestNumber?: string; status: string; createdAt?: string }
      const dateValue = result.createdAt ? new Date(result.createdAt) : new Date()
      const date = dateValue.toLocaleDateString()
      const requestNumber = result.requestNumber || `NSR-${dateValue.toISOString().slice(0, 10).replace(/-/g, '')}-${(result.id || crypto.randomUUID()).replace(/-/g, '').slice(0, 8).toUpperCase()}`
      const status = result.status.replaceAll('_', ' ')
      setRequests((current) => [{ id: requestNumber, backendId: result.id, title: service, category: 'New request', status, date, color: 'amber', description: details.replace(/\n/g, ' · ') }, ...current])
      setReceipt({ number: requestNumber, service, status, approver: approverName, createdAt: dateValue.toLocaleString(), details: [...detailItems, { label: 'Approver', value: approverName }] })
      setSelectedService(null)
      setRequestFields({})
      setActive('Request receipt')
      void loadWorkspace()
    } catch (cause) {
      setToast(cause instanceof Error ? cause.message : 'Could not submit the request')
    } finally { setBusy(false) }
    window.setTimeout(() => setToast(''), 5000)
  }

  async function decideApproval(id: string, approve: boolean) {
    const comment = approve ? '' : window.prompt('Add a reason for rejecting this request:')?.trim()
    if (!approve && !comment) return
    try {
      const response = await apiFetch(`/api/approvals/${id}/${approve ? 'approve' : 'reject'}`, { method: 'POST', body: JSON.stringify({ comment }) })
      if (!response.ok) throw new Error((await response.json().catch(() => ({}))).message || `Could not ${approve ? 'approve' : 'reject'} request`)
      await loadWorkspace()
      setToast(approve ? 'Request approved.' : 'Request rejected.')
    } catch (cause) { setToast(cause instanceof Error ? cause.message : 'Approval could not be saved.') }
    window.setTimeout(() => setToast(''), 5000)
  }

  async function createIncident() {
    setBusy(true)
    try {
      const response = await apiFetch('/api/incidents', { method: 'POST', body: JSON.stringify(incidentForm) })
      if (!response.ok) throw new Error((await response.json().catch(() => ({}))).message || `Incident could not be created (${response.status})`)
      setIncidentForm({ title: '', category: 'IT', priority: 'MEDIUM', description: '' }); setIncidentFormOpen(false); await loadWorkspace()
      setToast('Incident reported.')
    } catch (cause) { setToast(cause instanceof Error ? cause.message : 'Incident could not be created.') }
    finally { setBusy(false); window.setTimeout(() => setToast(''), 5000) }
  }

  async function openRequest(request: Request) {
    if (!request.backendId) return
    try {
      const [detailResponse, historyResponse] = await Promise.all([apiFetch(`/api/requests/${request.backendId}`), apiFetch(`/api/requests/${request.backendId}/history`)] )
      if (!detailResponse.ok || !historyResponse.ok) throw new Error('Request details could not be loaded.')
      setRequestDetail(await detailResponse.json() as RequestDetail)
      setRequestHistory(await historyResponse.json() as RequestHistoryRow[])
      setSelectedService(null); setActive('Request Detail'); navigate(`/requests/${request.backendId}`)
    } catch (cause) { setToast(cause instanceof Error ? cause.message : 'Request details could not be loaded.'); window.setTimeout(() => setToast(''),5000) }
  }

  async function openIncident(id: string) {
    try {
      const response = await apiFetch(`/api/incidents/${id}`)
      if (!response.ok) throw new Error('Incident details could not be loaded.')
      setIncidentDetail(await response.json() as IncidentDetailRecord); setActive('Incident Detail'); navigate(`/incidents/${id}`)
    } catch (cause) { setToast(cause instanceof Error ? cause.message : 'Incident details could not be loaded.'); window.setTimeout(() => setToast(''),5000) }
  }

  async function addIncidentComment() {
    if (!incidentDetail || !incidentComment.trim()) return
    const response = await apiFetch(`/api/incidents/${incidentDetail.incident.id}/comments`,{method:'POST',body:JSON.stringify({comment:incidentComment})})
    if (!response.ok) { setToast('Comment could not be saved.'); return }
    setIncidentComment(''); await openIncident(incidentDetail.incident.id)
  }

  async function updateIncidentStatus(status: string) {
    if (!incidentDetail) return
    const response = await apiFetch(`/api/incidents/${incidentDetail.incident.id}/status`,{method:'PATCH',body:JSON.stringify({status})})
    if (!response.ok) { setToast('Incident status could not be updated.'); return }
    await openIncident(incidentDetail.incident.id); await loadWorkspace()
  }

  return <Box className="app-shell">
    <Box component="aside" className="sidebar">
      <Box className="brand"><Box className="brand-mark">N</Box><Box><Typography className="brand-name">Northstar Bank</Typography><Typography className="brand-caption">SERVICE HUB</Typography></Box></Box>
      <Box className="workspace-label">WORKSPACE</Box>
      <List className="nav-list" disablePadding>
        {employeeNav.map((item) => <ListItemButton key={item.label} selected={active === item.label} onClick={() => { setSelectedService(null); setRequestFields({}); setActive(item.label) }} className="nav-item">
          <ListItemIcon>{item.icon}</ListItemIcon><ListItemText primary={item.label} />
        </ListItemButton>)}
        <ListItemButton selected={active === incidentNav.label} onClick={() => { setSelectedService(null); setActive(incidentNav.label) }} className="nav-item"><ListItemIcon>{incidentNav.icon}</ListItemIcon><ListItemText primary={incidentNav.label} /></ListItemButton>
      </List>
      {isManagerAdmin && <><Box className="workspace-label management-label">MANAGEMENT</Box><List className="nav-list" disablePadding>
        {managementNav.map((item) => <ListItemButton key={item.label} selected={active === item.label} onClick={() => { setSelectedService(null); setRequestFields({}); setActive(item.label) }} className="nav-item">
          <ListItemIcon>{item.icon}</ListItemIcon><ListItemText primary={item.label} />
        </ListItemButton>)}
      </List></>}
      <Box className="sidebar-bottom"><Divider /><ListItemButton onClick={() => { setSelectedService(null); setRequestFields({}); setActive('Settings') }} className="nav-item settings-item"><ListItemIcon><SettingsOutlined /></ListItemIcon><ListItemText primary="Settings" /></ListItemButton>
        <Box className="profile"><Avatar className="profile-avatar">{initials}</Avatar><Box sx={{ minWidth: 0, flex: 1 }}><Typography className="profile-name">{user.fullName}</Typography><Typography className="profile-role">{user.role === 'MANAGER_ADMIN' ? 'Manager + Administrator' : 'Employee'}</Typography></Box><IconButton aria-label="Sign out" size="small" onClick={logout}><LogoutRounded fontSize="small" /></IconButton></Box>
      </Box>
    </Box>

    <Box className="main-column">
      <AppBar position="static" elevation={0} color="transparent" className="topbar"><Toolbar className="topbar-inner">
        <Typography className="crumb">Workspace <span>/</span> {active}</Typography>
        <Box className="topbar-actions"><TextField inputRef={searchRef} size="small" placeholder="Search services" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { setSelectedService(null); setRequestFields({}); setActive('Service catalog') } }} className="search-field" slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRounded fontSize="small" /></InputAdornment>, endAdornment: <InputAdornment position="end"><IconButton aria-label="Search services" size="small" onClick={() => { setSelectedService(null); setRequestFields({}); setActive('Service catalog') }}><SearchRounded fontSize="small" /></IconButton><kbd>Ctrl K</kbd></InputAdornment> } }} />
          <IconButton aria-label="Notifications" className="notification-button" onClick={(event) => setNotificationsAnchor(event.currentTarget)}><Badge color="error" badgeContent={requests.length} max={9}><NotificationsNoneRounded /></Badge></IconButton>
          <IconButton aria-label="Open account menu" onClick={(event) => setProfileAnchor(event.currentTarget)} sx={{ p: 0 }}><Avatar className="top-avatar">{initials}</Avatar></IconButton>
          <Menu anchorEl={notificationsAnchor} open={Boolean(notificationsAnchor)} onClose={() => setNotificationsAnchor(null)}><Box sx={{ px: 2, py: 1 }}><Typography sx={{ fontWeight: 700, fontSize: 13 }}>Notifications</Typography></Box><Divider />{requests.length === 0 ? <MenuItem disabled><ListItemText primary="You’re all caught up" secondary="Request updates will appear here." /></MenuItem> : requests.slice(0, 5).map((request) => <MenuItem key={request.id} onClick={() => { setNotificationsAnchor(null); setSelectedService(null); setRequestFields({}); setActive('My requests') }}><ListItemText primary={request.title} secondary={`${request.id} · ${request.status}`} /></MenuItem>)}</Menu>
          <Menu anchorEl={profileAnchor} open={Boolean(profileAnchor)} onClose={() => setProfileAnchor(null)}><Box sx={{ px: 2, py: 1.25 }}><Typography sx={{ fontWeight: 700, fontSize: 13 }}>{user.fullName}</Typography><Typography color="text.secondary" sx={{ fontSize: 11 }}>{user.email}</Typography><Typography color="text.secondary" sx={{ fontSize: 10, mt: .5 }}>{isManagerAdmin ? 'Manager + Administrator' : 'Employee'}</Typography></Box><Divider />{isManagerAdmin && !isImpersonating && <MenuItem onClick={() => { setProfileAnchor(null); setImpersonationUserId(''); setImpersonationOpen(true) }}>Test as user</MenuItem>}<MenuItem onClick={() => { setProfileAnchor(null); setSelectedService(null); setRequestFields({}); setActive('Settings') }}>Account settings</MenuItem><MenuItem onClick={() => { setProfileAnchor(null); logout() }}>Sign out</MenuItem></Menu>
        </Box>
      </Toolbar></AppBar>

      <Box component="main" className="page-content">
        {isImpersonating && <Alert severity="warning" sx={{ mb: 2 }} action={<Button color="inherit" size="small" onClick={() => { stopImpersonating(); setActive('Overview') }}>Stop testing</Button>}>Testing as <strong>{user.fullName}</strong> ({user.email}). Actions you take will be saved to this user’s account.</Alert>}
        <Dialog open={impersonationOpen} onClose={() => !impersonationBusy && setImpersonationOpen(false)} fullWidth maxWidth="sm">
          <DialogTitle>Test as a user</DialogTitle>
          <DialogContent><Typography color="text.secondary" sx={{ mb: 2 }}>Choose an active account with assigned portal access. This uses that user’s permissions and saves any actions to their account.</Typography><FormControl fullWidth><InputLabel id="impersonation-user-label">User account</InputLabel><Select labelId="impersonation-user-label" label="User account" value={impersonationUserId} onChange={(event) => setImpersonationUserId(event.target.value)}>{impersonationUsers.map((candidate) => <MenuItem key={candidate.id} value={candidate.id}>{candidate.fullName} · {candidate.email} ({candidate.role === 'MANAGER_ADMIN' ? 'Manager + Administrator' : 'Employee'})</MenuItem>)}</Select></FormControl>{impersonationUsers.length === 0 && <Typography color="text.secondary" sx={{ mt: 1 }}>No other active accounts with assigned access are available.</Typography>}</DialogContent>
          <DialogActions><Button disabled={impersonationBusy} onClick={() => setImpersonationOpen(false)}>Cancel</Button><Button variant="contained" disabled={impersonationBusy || !impersonationUserId} onClick={() => { setImpersonationBusy(true); void impersonate(impersonationUserId).then(() => { setImpersonationOpen(false); setActive('Overview') }).catch((cause) => setToast(cause instanceof Error ? cause.message : 'Could not start user testing.')).finally(() => setImpersonationBusy(false)) }}>{impersonationBusy ? 'Starting…' : 'Start testing'}</Button></DialogActions>
        </Dialog>
        <Box className="page-heading"><Box><Typography className="eyebrow">{selectedService ? 'SERVICE REQUEST' : todayLabel}</Typography><Typography variant="h4" className="page-title">{title}</Typography><Typography className="page-subtitle">{selectedService ? 'Complete the details below so the right team can handle your request.' : active === 'Overview' ? 'Your internal banking services, requests, and approvals.' : `Manage your ${active.toLowerCase()} in one place.`}</Typography></Box>{!selectedService && <Button variant="contained" startIcon={<ControlPointRounded />} onClick={() => setActive('Service catalog')}>New request</Button>}</Box>
        <Box key={`${active}-${selectedService ?? ''}`} className="page-transition">
        {toast && <Paper className="toast"><TaskAltRounded />{toast}</Paper>}
        {workspaceError && <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => void loadWorkspace()}>Retry</Button>} sx={{ mb: 2 }}>{workspaceError}</Alert>}
        {workspaceLoading && <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, color: 'text.secondary' }}><CircularProgress size={16} /> Loading your workspace…</Box>}

        {active === 'Incident Detail' && incidentDetail ? <Paper className="content-card"><Button onClick={() => setActive('Incidents')}>Back to incidents</Button><Typography variant="h5" sx={{ mt: 2 }}>{incidentDetail.incident.title}</Typography><Typography color="text.secondary">{incidentDetail.incident.id} · {incidentDetail.incident.category} · {incidentDetail.incident.priority}</Typography><Typography sx={{ my: 2, whiteSpace: 'pre-wrap' }}>{incidentDetail.incident.description}</Typography><Chip label={incidentDetail.incident.status} />{isManagerAdmin && <FormControl sx={{ ml: 2, minWidth: 200 }}><InputLabel>Update status</InputLabel><Select label="Update status" value={incidentDetail.incident.status} onChange={(e) => void updateIncidentStatus(e.target.value)}>{['OPEN','IN_PROGRESS','RESOLVED','CLOSED'].map((s) => <MenuItem key={s} value={s}>{s.replaceAll('_',' ')}</MenuItem>)}</Select></FormControl>}<Typography variant="h6" sx={{ mt: 3 }}>Comments</Typography>{incidentDetail.comments.map((c) => <Box className="request-row" key={c.id}><Box className="request-main"><Typography>{c.comment}</Typography><Typography className="request-id">{c.authorId} · {new Date(c.createdAt).toLocaleString()}</Typography></Box></Box>)}<TextField fullWidth label="Add a comment" multiline minRows={2} sx={{ mt: 2 }} value={incidentComment} onChange={(e) => setIncidentComment(e.target.value)} /><Button sx={{ mt: 1 }} variant="contained" disabled={!incidentComment.trim()} onClick={() => void addIncidentComment()}>Add comment</Button></Paper> : active === 'Request Detail' && requestDetail ? <RequestDetailReport request={requestDetail} history={requestHistory} requesterName={user?.id === requestDetail.requesterId ? user.fullName : impersonationUsers.find((candidate) => candidate.id === requestDetail.requesterId)?.fullName || requestDetail.requesterId} requestedForName={user?.id === requestDetail.requestedForId ? user.fullName : impersonationUsers.find((candidate) => candidate.id === requestDetail.requestedForId)?.fullName || requestDetail.requestedForId} approverName={approvers.find((candidate) => candidate.id === requestDetail.approverId)?.fullName} onBack={() => { setActive(isManagerAdmin ? 'Requests' : 'My requests'); setRequestDetail(null) }} /> : selectedService ? <ServiceRequestForm service={selectedService} values={requestFields} setValues={setRequestFields} approvers={approvers} approversLoading={approversLoading} busy={busy} onCancel={() => { setSelectedService(null); setRequestFields({}) }} onSubmit={() => void submitRequest(selectedService)} /> : active === 'Request receipt' && receipt ? <RequestReceipt receipt={receipt} onRequests={() => setActive('My requests')} onCatalog={() => setActive('Service catalog')} /> : active === 'Settings' ? <PasswordSettings /> : active === 'User access' && isManagerAdmin ? <UserAccessPage /> : active === 'Incidents' ? <Paper className="content-card"><Box className="section-heading in-card"><Box><Typography variant="h6">Incident reports</Typography><Typography className="section-note">Report and track operational issues.</Typography></Box><Button variant="contained" onClick={() => setIncidentFormOpen(true)}>Report incident</Button></Box>{incidentFormOpen && <Box className="request-form-grid" sx={{ mb: 3 }}><TextField label="Title" required value={incidentForm.title} onChange={(e) => setIncidentForm({ ...incidentForm, title: e.target.value })} /><FormControl><InputLabel>Category</InputLabel><Select label="Category" value={incidentForm.category} onChange={(e) => setIncidentForm({ ...incidentForm, category: e.target.value })}>{['IT','Facilities','HR','Security','Other'].map((x) => <MenuItem key={x} value={x}>{x}</MenuItem>)}</Select></FormControl><FormControl><InputLabel>Priority</InputLabel><Select label="Priority" value={incidentForm.priority} onChange={(e) => setIncidentForm({ ...incidentForm, priority: e.target.value })}>{['LOW','MEDIUM','HIGH','CRITICAL'].map((x) => <MenuItem key={x} value={x}>{x}</MenuItem>)}</Select></FormControl><TextField label="Description" required multiline minRows={3} value={incidentForm.description} onChange={(e) => setIncidentForm({ ...incidentForm, description: e.target.value })} /><Box><Button onClick={() => setIncidentFormOpen(false)}>Cancel</Button><Button variant="contained" disabled={busy || !incidentForm.title.trim() || !incidentForm.description.trim()} onClick={() => void createIncident()}>{busy ? 'Saving…' : 'Submit incident'}</Button></Box></Box>}{incidentRows.length === 0 ? <Typography color="text.secondary" sx={{ py: 3 }}>No incidents have been reported.</Typography> : incidentRows.map((incident) => <Box className="request-row" key={incident.id} onClick={() => void openIncident(incident.id)} sx={{ cursor: "pointer" }}><Box className="request-symbol amber"><SupportAgentRounded /></Box><Box className="request-main"><Typography className="request-name">{incident.title}</Typography><Typography className="request-id">{incident.id} · {incident.category} · {incident.priority}</Typography></Box><Chip size="small" label={incident.status} /></Box>)}</Paper> : active === 'Service catalog' ? <>
          <Paper className="catalog-banner"><Box><Typography className="banner-kicker">SERVICE CATALOG</Typography><Typography variant="h5" className="banner-title">How can we help?</Typography><Typography className="banner-copy">Find the right service and we’ll take it from there.</Typography></Box><SupportAgentRounded className="banner-art" /></Paper>
          <Box className="catalog-toolbar"><Box><Typography variant="h6">Browse by team</Typography><Typography className="section-note">Choose a team to narrow the service list.</Typography></Box><Box className="catalog-filters">{['All teams', 'IT', 'Facilities', 'HR'].map((team) => <Chip key={team} label={team} clickable color={catalogFilter === team ? 'primary' : 'default'} variant={catalogFilter === team ? 'filled' : 'outlined'} onClick={() => setCatalogFilter(team)} />)}</Box></Box>
          {!liveCatalog.length && <Alert severity="warning" sx={{ mb: 2 }}>The live catalog is unavailable. These sample services can be used for local requests.</Alert>}<Box className="section-heading catalog-list-heading"><Box><Typography variant="h6">Available services</Typography><Typography className="section-note">{displayedCatalog.length} {displayedCatalog.length === 1 ? 'service' : 'services'} match your selection.</Typography></Box><Chip label={liveCatalog.length ? (catalogStale ? 'Last known data' : 'ServiceNow catalog') : 'Sample catalog'} variant="outlined" /></Box>
          <Box className="service-grid">{displayedCatalog.map((service, index) => <ButtonBase component={Paper} key={`${service.title}-${index}`} className="service-card" aria-label={`Start request: ${service.title}`} onClick={() => setSelectedService(service.title)}><Box className={`service-icon ${service.tint}`}>{service.icon}</Box><Chip size="small" label={service.group} className="group-chip" /><Typography className="service-title">{service.title}</Typography><Typography className="service-description">{service.description}</Typography><Box className="service-action">Start a request <KeyboardArrowRightRounded /></Box></ButtonBase>)}</Box>
        </> : active === 'My requests' ? <>
          <Paper className="content-card"><Box className="section-heading in-card"><Box><Typography variant="h6">Your requests</Typography><Typography className="section-note">Requests are saved to your account and remain here after you sign out.</Typography></Box><Button variant="outlined" startIcon={<ControlPointRounded />} onClick={() => setActive('Service catalog')}>New request</Button></Box><RequestTable requests={requests} onOpen={openRequest} /></Paper>
        </> : active === 'Requests' && isManagerAdmin ? <>
          <Paper className="content-card"><Box className="section-heading in-card"><Box><Typography variant="h6">Request queue</Typography><Typography className="section-note">Review requests from employees or start a new request from the service catalog.</Typography></Box><Button variant="contained" startIcon={<ControlPointRounded />} onClick={() => setActive('Service catalog')}>Add new request</Button></Box>
            <RequestTable requests={requests} onOpen={openRequest} />
          </Paper>
        </> : active === 'Approvals' ? <>
          <Paper className="content-card"><Box className="section-heading in-card"><Box><Typography variant="h6">Approval queue</Typography><Typography className="section-note">Only the employee selected as approver can decide.</Typography></Box><Chip size="small" label={`${approvals.length} pending`} color="warning" variant="outlined" /></Box>
            <ApprovalQueue approvals={approvals} onApprove={(id) => void decideApproval(id,true)} onReject={(id) => void decideApproval(id,false)} />
          </Paper>
        </> : active === 'Overview' ? <>
          <Paper className="overview-welcome">
            <Box className="overview-copy"><Typography className="overview-kicker">NORTHSTAR BANK · EMPLOYEE WORKSPACE</Typography><Typography variant="h5">Your work, supported.</Typography><Typography>Request the tools, access, and workplace help you need from one secure service hub.</Typography><Button variant="contained" endIcon={<KeyboardArrowRightRounded />} onClick={() => setActive('Service catalog')}>Explore services</Button></Box>
            <Box className="overview-side"><Box className="overview-mark"><SupportAgentRounded /></Box><Typography className="overview-side-label">YOUR WORKSPACE</Typography><Typography className="overview-side-value">{isManagerAdmin ? 'Manager + Administrator' : 'Employee'}</Typography><Typography className="overview-side-note">{user.department?.replaceAll('_', ' ') || 'Department not set'}</Typography></Box>
          </Paper>
          <Box className="stat-grid">
            <StatCard label="Requests" value={String(requests.length)} delta="Saved for your account" icon={<ReceiptLongRounded />} tint="tint-blue" />
            <StatCard label="Pending approvals" value={String(approvals.length)} delta="Assigned to your account" icon={<TaskAltRounded />} tint="tint-orange" />
            <StatCard label="Active incidents" value={String(incidentRows.filter((i) => !['RESOLVED','CLOSED'].includes(i.status)).length)} delta="Operational issues" icon={<SupportAgentRounded />} tint="tint-green" />
          </Box>
          <Box className="dashboard-grid"><Paper className="content-card requests-card"><Box className="section-heading in-card"><Box><Typography variant="h6">Recent requests</Typography><Typography className="section-note">Requests submitted during this session</Typography></Box><Button endIcon={<KeyboardArrowRightRounded />} onClick={() => setActive('My requests')}>View all</Button></Box><RequestTable requests={requests.slice(0, 3)} compact /></Paper>
            {user.role === 'MANAGER_ADMIN' && <Paper className="content-card approval-card"><Box className="section-heading in-card"><Box><Typography variant="h6">Needs your attention</Typography><Typography className="section-note">Requests awaiting your approval</Typography></Box><Chip size="small" label={`${approvals.length} pending`} color="warning" variant="outlined" /></Box>{approvals.slice(0,3).map((approval) => <Box className="approval-item" key={approval.id}><Typography className="approval-title">{approval.requestNumber} · {approval.title}</Typography><Button size="small" onClick={() => setActive('Approvals')}>Review</Button></Box>)}{approvals.length === 0 && <Typography color="text.secondary" sx={{ py: 2 }}>No pending approvals.</Typography>}</Paper>}
          </Box>
          <Box className="section-heading catalog-heading"><Box><Typography variant="h6">Quick access</Typography><Typography className="section-note">Start with one of the most requested services.</Typography></Box><Button endIcon={<KeyboardArrowRightRounded />} onClick={() => setActive('Service catalog')}>Browse catalog</Button></Box>
          <Box className="service-grid quick-grid">{services.slice(0, 3).map((service) => <ButtonBase component={Paper} key={service.title} className="service-card quick-card" aria-label={`Start request: ${service.title}`} onClick={() => setSelectedService(service.title)}><Box className={`service-icon ${service.tint}`}>{service.icon}</Box><Typography className="service-title">{service.title}</Typography><Typography className="service-description">{service.description}</Typography><Box className="service-action">Get started <KeyboardArrowRightRounded /></Box></ButtonBase>)}</Box>
        </> : <Paper className="content-card placeholder"><Box className="placeholder-icon">{employeeNav.concat(managementNav).find((item) => item.label === active)?.icon ?? <SettingsOutlined />}</Box><Typography variant="h6">{active}</Typography><Typography className="section-note">This workspace is ready for the next feature in the service portal.</Typography><Button variant="outlined" onClick={() => setActive('Overview')}>Back to overview</Button></Paper>}
        </Box>
        <Box className="footer"><span>Northstar Bank · Internal Service Hub</span><span>Need help? Contact your service desk</span></Box>
      </Box>
    </Box>
  </Box>
}

function RequestDetailReport({ request, history, requesterName, requestedForName, approverName, onBack }: { request: RequestDetail; history: RequestHistoryRow[]; requesterName: string; requestedForName: string; approverName?: string; onBack: () => void }) {
  const resolvedApproverName = approverName || request.description.match(/^Requested approver:\s*(.+)$/m)?.[1]?.trim() || request.approverId || 'Not assigned'
  const details = Object.entries(request.fields ?? {}).filter(([key, value]) => key !== 'approverId' && Boolean(value?.trim()))
  const fieldLabel = (key: string) => key.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replaceAll('_', ' ').replace(/^./, (letter) => letter.toUpperCase())
  return <Paper className="content-card">
    <Button onClick={onBack}>Back to requests</Button>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap', mt: 2 }}>
      <Box><Typography variant="h5">{request.serviceName}</Typography><Typography color="text.secondary">{request.requestNumber}</Typography></Box>
      <Chip label={request.status.replaceAll('_', ' ')} color={statusTone(request.status)} />
    </Box>
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 1.5, mt: 3 }}>
      <RequestReportMeta label="Requested by" value={requesterName} />
      <RequestReportMeta label="Requested for" value={requestedForName} />
      <RequestReportMeta label="Approver" value={resolvedApproverName} />
      <RequestReportMeta label="Submitted" value={new Date(request.createdAt).toLocaleString()} />
      <RequestReportMeta label="Last updated" value={new Date(request.updatedAt).toLocaleString()} />
      {(request.externalId || request.externalSystem) && <RequestReportMeta label="External reference" value={[request.externalSystem, request.externalId].filter(Boolean).join(' · ')} />}
    </Box>
    <Typography variant="h6" sx={{ mt: 3 }}>Request details</Typography>
    {details.length > 0 ? <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 1.25, mt: 1.5 }}>
      {details.map(([key, value]) => <Paper key={key} variant="outlined" sx={{ p: 1.5, borderColor: 'divider' }}><Typography variant="caption" color="text.secondary">{fieldLabel(key)}</Typography><Typography sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{value}</Typography></Paper>)}
    </Box> : <Typography color="text.secondary" sx={{ mt: 1 }}>No structured request fields were recorded.</Typography>}
    <Typography variant="subtitle1" sx={{ fontWeight: 700, mt: 3 }}>Request description</Typography>
    <Typography sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', mt: .5 }}>{request.description}</Typography>
    <Typography variant="h6" sx={{ mt: 3 }}>Activity history</Typography>
    {history.length === 0 ? <Typography color="text.secondary" sx={{ mt: 1 }}>No activity has been recorded yet.</Typography> : history.map((event) => <Box className="request-row" key={event.id} sx={{ alignItems: 'flex-start', py: 1 }}>
      <Box className="request-main"><Typography className="request-name">{event.action.replaceAll('_', ' ')}</Typography><Typography className="request-id">{event.fromStatus || 'Created'} → {event.toStatus || '—'} · {event.actorId} · {new Date(event.createdAt).toLocaleString()}</Typography>{event.comment && <Typography sx={{ mt: .5, whiteSpace: 'pre-wrap' }}>{event.comment}</Typography>}</Box>
    </Box>)}
  </Paper>
}

function RequestReportMeta({ label, value }: { label: string; value: string }) {
  return <Paper variant="outlined" sx={{ p: 1.5, borderColor: 'divider' }}><Typography variant="caption" color="text.secondary">{label}</Typography><Typography sx={{ overflowWrap: 'anywhere' }}>{value}</Typography></Paper>
}

export function ApprovalQueue({ approvals, onApprove, onReject }: { approvals: Approval[]; onApprove: (id: string) => void; onReject: (id: string) => void }) {
  if (approvals.length === 0) return <Typography color="text.secondary" sx={{ py: 3 }}>There are no requests awaiting your approval.</Typography>
  return <Box className="approval-list">{approvals.map((approval) => <Box className="approval-item" key={approval.id}><Avatar className="approval-avatar">{approval.initials}</Avatar><Box className="approval-copy"><Typography className="approval-title">{approval.title}</Typography><Typography className="approval-detail">{approval.requestNumber} · Requested by {approval.employee} · {approval.requested}</Typography></Box><Button size="small" color="success" onClick={() => onApprove(approval.id)}>Approve</Button><Button size="small" color="error" onClick={() => onReject(approval.id)}>Reject</Button></Box>)}</Box>
}

export function ServiceRequestForm({ service, values, setValues, approvers, approversLoading, busy, onCancel, onSubmit }: { service: string; values: Record<string, string>; setValues: (values: Record<string, string>) => void; approvers: Approver[]; approversLoading: boolean; busy: boolean; onCancel: () => void; onSubmit: () => void }) {
  const form = serviceForms[service] ?? { intro: 'Provide the key details so the responsible service team can route your request.', fields: [
    { name: 'requestType', label: 'What do you need?', kind: 'text' as const, required: true },
    { name: 'neededBy', label: 'When do you need it?', kind: 'date' as const },
    { name: 'reason', label: 'Business reason and details', kind: 'textarea' as const, required: true },
  ] }
  const specifications = conditionalRequestFields(service, values)
  const visibleFields = [...form.fields, ...specifications]
  const canSubmit = visibleFields.filter((field) => field.required).every((field) => values[field.name]?.trim()) && Boolean(values.approverId) && !busy
  return <Paper className="content-card request-form-card">
    <Box className="form-header"><Box><Typography className="form-kicker">{services.find((item) => item.title === service)?.group ?? 'SERVICE DESK'}</Typography><Typography variant="h6">{service}</Typography><Typography className="section-note">{form.intro}</Typography></Box><Chip label="Request details" variant="outlined" /></Box>
    <Divider sx={{ my: 2.5 }} />
    <Box className="request-form-grid">{form.fields.map((field) => field.kind === 'select' ? <FormControl key={field.name} fullWidth required={field.required}>
      <InputLabel id={`${field.name}-label`}>{field.label}</InputLabel><Select labelId={`${field.name}-label`} label={field.label} value={values[field.name] ?? ''} onChange={(event) => {
        const nextValues = { ...values, [field.name]: event.target.value }
        if (['item', 'accessType', 'requestType', 'topic'].includes(field.name)) {
          for (const spec of conditionalRequestFields(service, values)) delete nextValues[spec.name]
          if (field.name === 'item') for (const spec of ['operatingSystem', 'memory', 'storage', 'performance', 'screenSize', 'resolution', 'phonePlatform', 'phoneStorage', 'deviceCompatibility', 'brandModel', 'specificationNotes']) delete nextValues[spec]
        }
        setValues(nextValues)
      }}>{field.options?.map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}</Select>{field.helper && <Typography className="field-helper">{field.helper}</Typography>}
    </FormControl> : <TextField key={field.name} fullWidth required={field.required} type={field.kind === 'date' ? 'date' : 'text'} multiline={field.kind === 'textarea'} minRows={field.kind === 'textarea' ? 4 : undefined} label={field.label} value={values[field.name] ?? ''} onChange={(event) => setValues({ ...values, [field.name]: event.target.value })} helperText={field.helper} slotProps={field.kind === 'date' ? { inputLabel: { shrink: true } } : undefined} />)}
      {specifications.length > 0 && <>
        <Box sx={{ gridColumn: '1 / -1', mt: 1 }}><Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{service === 'Request a device' ? 'Device specifications' : 'More details for this request'}</Typography><Typography className="section-note">These details help route your request to the right team.</Typography></Box>
        {specifications.map((field) => field.kind === 'select' ? <FormControl key={field.name} fullWidth>
          <InputLabel id={`${field.name}-label`}>{field.label}</InputLabel><Select labelId={`${field.name}-label`} label={field.label} value={values[field.name] ?? ''} onChange={(event) => setValues({ ...values, [field.name]: event.target.value })}>{field.options?.map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}</Select>{field.helper && <Typography className="field-helper">{field.helper}</Typography>}
        </FormControl> : <TextField key={field.name} fullWidth multiline={field.kind === 'textarea'} minRows={field.kind === 'textarea' ? 3 : undefined} label={field.label} value={values[field.name] ?? ''} onChange={(event) => setValues({ ...values, [field.name]: event.target.value })} helperText={field.helper} />)}
      </>}
      {approvers.length > 0 ? <FormControl fullWidth required>
        <InputLabel id="approver-label">Manager or Administrator who should approve</InputLabel><Select labelId="approver-label" label="Manager or Administrator who should approve" value={values.approverId ?? ''} onChange={(event) => { const approver = approvers.find((item) => item.id === event.target.value); setValues({ ...values, approverId: event.target.value, approverName: approver?.fullName ?? '' }) }}>
          {approvers.map((approver) => <MenuItem key={approver.id} value={approver.id}>{approver.fullName}</MenuItem>)}
        </Select><Typography className="field-helper">{approversLoading ? 'Refreshing the manager list…' : 'Choose the manager you expect to review this request.'}</Typography>
      </FormControl> : <TextField fullWidth required label="Manager who should approve" value={values.approverName ?? ''} onChange={(event) => setValues({ ...values, approverName: event.target.value })} helperText={approversLoading ? 'Loading manager list. You can enter the manager name here.' : 'No active manager list is available; enter the manager’s full name.'} />}
    </Box>
    <Box className="form-notice"><SupportAgentRounded /><Typography>Your selected approver receives the request in their portal approval queue. The request is saved locally and ServiceNow fulfillment remains a future integration.</Typography></Box>
    <Box className="form-actions"><Button color="inherit" disabled={busy} onClick={onCancel}>Cancel</Button><Button variant="contained" disabled={!canSubmit} onClick={onSubmit}>{busy ? <><CircularProgress size={16} sx={{ mr: 1 }} />Submitting…</> : 'Submit request'}</Button></Box>
  </Paper>
}

function RequestReceipt({ receipt, onRequests, onCatalog }: { receipt: RequestReceiptData; onRequests: () => void; onCatalog: () => void }) {
  return <Paper className="content-card receipt-card">
    <Box className="receipt-success"><Box className="receipt-check"><TaskAltRounded /></Box><Box><Typography className="receipt-kicker">REQUEST RECEIVED</Typography><Typography variant="h6">Your request has been recorded</Typography></Box><Chip label={receipt.status} color="warning" variant="outlined" /></Box>
    <Box className="receipt-number"><Typography className="section-note">REQUEST NUMBER</Typography><Typography>{receipt.number}</Typography><Typography className="section-note">Submitted {receipt.createdAt}</Typography></Box>
    <Divider sx={{ my: 2.5 }} />
    <Box className="receipt-info"><Box><Typography className="section-note">Service</Typography><Typography>{receipt.service}</Typography></Box><Box><Typography className="section-note">Requested approver</Typography><Typography>{receipt.approver}</Typography></Box></Box>
    <Typography className="receipt-section-title">Request details</Typography>
    <Box className="receipt-details">{receipt.details.map((item) => <Box className="receipt-detail" key={item.label}><Typography>{item.label}</Typography><Typography>{item.value}</Typography></Box>)}</Box>
    <Box className="form-notice"><SupportAgentRounded /><Typography>The approver’s name is recorded on this receipt, but approval notifications and approval routing are not active yet.</Typography></Box>
    <Box className="form-actions"><Button onClick={onCatalog}>Create another request</Button><Button variant="contained" onClick={onRequests}>My requests</Button></Box>
  </Paper>
}

function StatCard({ label, value, delta, icon, tint }: { label: string; value: string; delta: string; icon: React.ReactNode; tint: string }) {
  return <Paper className="stat-card"><Box className="stat-top"><Typography className="stat-label">{label}</Typography><Box className={`stat-icon ${tint}`}>{icon}</Box></Box><Typography className="stat-value">{value}</Typography><Typography className="stat-delta">{delta}</Typography></Paper>
}

function RequestTable({ requests, compact = false, onOpen }: { requests: Request[]; compact?: boolean; onOpen?: (request: Request) => void }) {
  return <Box className="request-list">{requests.length === 0 ? <Typography color="text.secondary" sx={{ py: 3 }}>No requests have been submitted in this session.</Typography> : requests.map((request, idx) => <Box className={`request-row ${compact ? 'compact-row' : ''}`} key={request.id} role={onOpen ? 'button' : undefined} tabIndex={onOpen ? 0 : undefined} aria-label={onOpen ? `Open request ${request.id}` : undefined} onClick={() => onOpen?.(request)} onKeyDown={(event) => { if (onOpen && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); onOpen(request) } }} sx={onOpen ? { cursor: 'pointer', '&:hover': { backgroundColor: 'rgba(45, 78, 200, 0.045)' }, '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 } } : undefined}>
    <Box className={`request-symbol ${request.color}`}><ReceiptLongRounded /></Box><Box className="request-main"><Typography className="request-name">{request.title}</Typography><Typography className="request-id">{request.id} <span>·</span> {request.category}</Typography></Box>
    {!compact && request.description && <Typography className="request-detail">{request.description}</Typography>}{!compact && <Typography className="request-date">{request.date}</Typography>}<Chip size="small" label={request.status} color={statusTone(request.status)} className="status-chip" />{!compact && <KeyboardArrowRightRounded fontSize="small" aria-hidden="true" />}{idx < requests.length - 1 && !compact && <Divider className="request-divider" />}
  </Box>)}</Box>
}
