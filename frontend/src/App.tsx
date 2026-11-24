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
import AttachFileRounded from '@mui/icons-material/AttachFileRounded'
import TuneRounded from '@mui/icons-material/TuneRounded'
import MoreHorizRounded from '@mui/icons-material/MoreHorizRounded'
import LightbulbOutlined from '@mui/icons-material/LightbulbOutlined'
import HelpOutlineRounded from '@mui/icons-material/HelpOutlineRounded'
import KeyboardArrowDownRounded from '@mui/icons-material/KeyboardArrowDownRounded'
import KeyboardArrowUpRounded from '@mui/icons-material/KeyboardArrowUpRounded'
import MenuRounded from '@mui/icons-material/MenuRounded'
import MenuBookRounded from '@mui/icons-material/MenuBookRounded'
import ArticleOutlined from '@mui/icons-material/ArticleOutlined'
import ClearRounded from '@mui/icons-material/ClearRounded'
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded'
import CloudUploadRounded from '@mui/icons-material/CloudUploadRounded'
import ContentCopyRounded from '@mui/icons-material/ContentCopyRounded'
import RestartAltRounded from '@mui/icons-material/RestartAltRounded'
import SaveOutlined from '@mui/icons-material/SaveOutlined'
import FileDownloadOutlined from '@mui/icons-material/FileDownloadOutlined'
import PrintOutlined from '@mui/icons-material/PrintOutlined'
import InsertDriveFileOutlined from '@mui/icons-material/InsertDriveFileOutlined'
import HistoryToggleOffRounded from '@mui/icons-material/HistoryToggleOffRounded'
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
type IncidentRecord = {
  id: string
  incidentNumber?: string
  caller?: string
  category: string
  subcategory?: string
  service?: string
  serviceOffering?: string
  channel?: string
  state?: string
  impact?: string
  urgency?: string
  priority: string
  assignedTo?: string
  shortDescription?: string
  description: string
  title: string
  status: string
  reporterId: string
  assigneeId?: string | null
  createdAt: string
  updatedAt: string
}
type IncidentDetailRecord = { incident: IncidentRecord; comments: Array<{ id: string; authorId: string; comment: string; createdAt: string }> }

type KnowledgeArticle = {
  id: string
  title: string
  category: string
  summary: string
  content: string
  views: number
  updated: string
  tags: string[]
}

const knowledgeBaseArticles: KnowledgeArticle[] = [
  {
    id: 'KB001001',
    title: 'Self-Service Password Reset & Account Unlock Procedure',
    category: 'Access & Security',
    summary: 'Steps to reset forgotten Active Directory, Windows workstation, and portal passwords via Northstar Self-Service.',
    content: '1. Visit password reset portal.\n2. Complete SMS or Authenticator 2FA verification.\n3. Enter your new password meeting complexity criteria (min 12 chars).\n4. Wait 60 seconds for synchronization across Active Directory and core banking services.',
    views: 1420,
    updated: '2026-11-10',
    tags: ['password', 'reset', 'login', 'account', 'unlock', 'credentials', 'access', 'auth']
  },
  {
    id: 'KB001002',
    title: 'Outlook and Exchange Email Synchronization & Disconnected Status Fix',
    category: 'Email & Messaging',
    summary: 'How to resolve "Need Password", "Disconnected", or mailbox sync delays in Microsoft Outlook.',
    content: '1. Close Outlook completely.\n2. Open Windows Credential Manager -> Windows Credentials.\n3. Remove cached MicrosoftOffice / Outlook credentials.\n4. Restart Outlook and enter your Northstar SSO credentials.\n5. Verify status bar shows "Connected to: Microsoft Exchange".',
    views: 890,
    updated: '2026-11-15',
    tags: ['outlook', 'email', 'exchange', 'sync', 'mailbox', 'disconnected', 'mail', 'creds']
  },
  {
    id: 'KB001003',
    title: 'Remote VPN Connection Troubleshooting (Cisco AnyConnect)',
    category: 'Network',
    summary: 'Diagnosing common VPN connection failures, timeouts, and certificate validation errors.',
    content: '1. Ensure you have an active internet connection.\n2. Open Cisco AnyConnect and connect to vpn.northstarbank.internal.\n3. When prompted, select Banking-Employees group.\n4. Approve the Push notification on your mobile device.\n5. If "Login failed", reboot your local network router and retry.',
    views: 654,
    updated: '2026-11-08',
    tags: ['vpn', 'network', 'connection', 'cisco', 'remote', 'wifi', 'internet', 'timeout', 'anyconnect']
  },
  {
    id: 'KB001004',
    title: 'Software Installation & License Approval Guidelines',
    category: 'Software',
    summary: 'Pre-approved corporate software catalog and procedures for requesting non-standard software.',
    content: '1. Check the Northstar Software Center on your workstation for pre-approved packages.\n2. For enterprise tools (Tableau, IntelliJ, Figma), submit a Service Catalog request with Manager approval.\n3. Standard turnaround time is 2-4 business hours after approval.',
    views: 520,
    updated: '2026-10-25',
    tags: ['software', 'install', 'license', 'app', 'application', 'download', 'program', 'permission']
  },
  {
    id: 'KB001005',
    title: 'Hardware Replacement, Peripherals, and Monitor Setup',
    category: 'Hardware',
    summary: 'How to replace malfunctioning hardware accessories or order dual-monitor setups.',
    content: '1. Test cables and docking stations with an alternate USB-C port.\n2. If damage is confirmed, submit a "Request a device" service request.\n3. Standard delivery to branch locations is 1-2 business days.',
    views: 430,
    updated: '2026-11-02',
    tags: ['hardware', 'laptop', 'monitor', 'keyboard', 'mouse', 'dock', 'cable', 'screen', 'device']
  },
  {
    id: 'KB001006',
    title: 'Core Banking & Teller Portal Transaction Error Troubleshooting',
    category: 'Banking Systems',
    summary: 'Resolving session timeouts, ledger posting errors, and printer dispatch faults in Teller stations.',
    content: '1. Clear browser cache and local storage (Ctrl + Shift + R).\n2. Verify local receipt printer IP connectivity.\n3. Check if core banking host batch processing is underway.\n4. If error code TB-504 persists, contact Branch Operations Lead.',
    views: 780,
    updated: '2026-11-18',
    tags: ['teller', 'portal', 'banking', 'transaction', 'settlement', 'batch', 'printer', 'ledger', 'timeout']
  },
  {
    id: 'KB001007',
    title: 'Database Query Timeouts and Pool Exhaustion Diagnostics',
    category: 'Database',
    summary: 'Steps for engineering teams diagnosing slow SQL execution and connection timeouts.',
    content: '1. Check active connection pool usage via Grafana dashboard.\n2. Review slow query log for table scans on unindexed foreign keys.\n3. Ensure client timeout is configured to >= 30 seconds for batch reports.',
    views: 310,
    updated: '2026-11-05',
    tags: ['database', 'sql', 'query', 'mysql', 'timeout', 'pool', 'connection', 'db', 'slow']
  }
]

const initialIncidentForm = {
  incidentNumber: 'INC0010001',
  caller: '',
  category: 'Inquiry / Help',
  subcategory: '-- None --',
  service: '',
  serviceOffering: '',
  channel: '-- None --',
  state: 'New',
  impact: '3 - Low',
  urgency: '3 - Low',
  priority: '4 - Low',
  assignedTo: '',
  shortDescription: '',
  description: '',
}

function computeIncidentPriority(impact: string, urgency: string): string {
  const imp = impact.startsWith('1') ? 1 : impact.startsWith('2') ? 2 : 3
  const urg = urgency.startsWith('1') ? 1 : urgency.startsWith('2') ? 2 : 3
  if (imp === 1 && urg === 1) return '1 - Critical'
  if ((imp === 1 && urg === 2) || (imp === 2 && urg === 1)) return '2 - High'
  if ((imp === 1 && urg === 3) || (imp === 2 && urg === 2) || (imp === 3 && urg === 1)) return '3 - Moderate'
  return '4 - Low'
}
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
  const [incidentRows, setIncidentRows] = useState<IncidentRecord[]>([])
  const [incidentDetail, setIncidentDetail] = useState<IncidentDetailRecord | null>(null)
  const [incidentComment, setIncidentComment] = useState('')
  const [incidentFormOpen, setIncidentFormOpen] = useState(false)
  const [incidentForm, setIncidentForm] = useState(initialIncidentForm)
  const [incidentSearchQuery, setIncidentSearchQuery] = useState('')
  const [incidentSearchFilter, setIncidentSearchFilter] = useState('Knowledge & Catalog (All)')
  const [relatedOpen, setRelatedOpen] = useState(true)
  const [selectedArticle, setSelectedArticle] = useState<KnowledgeArticle | null>(null)
  const [formMenuAnchor, setFormMenuAnchor] = useState<HTMLElement | null>(null)
  const [moreMenuAnchor, setMoreMenuAnchor] = useState<HTMLElement | null>(null)
  const [attachmentsOpen, setAttachmentsOpen] = useState(false)
  const [incidentAttachments, setIncidentAttachments] = useState<Array<{ name: string; size: string; type: string; date: string }>>([])
  const [streamDrawerOpen, setStreamDrawerOpen] = useState(false)
  const [workNotesList, setWorkNotesList] = useState<Array<{ note: string; author: string; time: string }>>([])
  const [currentWorkNote, setCurrentWorkNote] = useState('')
  const [lookupModal, setLookupModal] = useState<'caller' | 'service' | 'serviceOffering' | 'assignedTo' | null>(null)
  const [suggestionsAnchor, setSuggestionsAnchor] = useState<HTMLElement | null>(null)
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
      const incidentData = await incidentResponse.json() as IncidentRecord[]
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

  const effectiveIncidentQuery = (incidentSearchQuery || incidentForm.shortDescription || '').trim().toLowerCase()

  const displayedSearchResults = useMemo(() => {
    if (!effectiveIncidentQuery || effectiveIncidentQuery.length < 2) return []

    const kbResults = (incidentSearchFilter === 'Catalog Items') ? [] : knowledgeBaseArticles.filter((article) => {
      const target = `${article.id} ${article.title} ${article.category} ${article.summary} ${article.tags.join(' ')}`.toLowerCase()
      return target.includes(effectiveIncidentQuery) || article.tags.some((tag) => effectiveIncidentQuery.includes(tag))
    }).map((article) => ({
      key: `kb-${article.id}`,
      type: 'kb' as const,
      id: article.id,
      title: article.title,
      category: article.category,
      summary: article.summary,
      article
    }))

    const catResults = (incidentSearchFilter === 'Knowledge Articles') ? [] : displayedCatalog.filter((item) => {
      const target = `${item.title} ${item.description} ${item.group}`.toLowerCase()
      return target.includes(effectiveIncidentQuery)
    }).map((item, idx) => ({
      key: `cat-${idx}-${item.title}`,
      type: 'catalog' as const,
      id: `CAT-${idx + 1}`,
      title: item.title,
      category: item.group || 'IT',
      summary: item.description,
      article: null as unknown as KnowledgeArticle
    }))

    return [...kbResults, ...catResults]
  }, [effectiveIncidentQuery, incidentSearchFilter, displayedCatalog])
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

  async function openNewIncidentForm() {
    setIncidentFormOpen(true)
    setIncidentSearchQuery('')
    setSelectedArticle(null)
    setRelatedOpen(true)
    setIncidentAttachments([])
    setWorkNotesList([])
    setCurrentWorkNote('')
    setStreamDrawerOpen(false)
    let nextNum = 'INC0010001'
    try {
      const res = await apiFetch('/api/incidents/next-number')
      if (res.ok) {
        const data = await res.json() as { number?: string; nextNumber?: string }
        if (data.number || data.nextNumber) nextNum = (data.number || data.nextNumber)!
      }
    } catch {}
    setIncidentForm({
      ...initialIncidentForm,
      incidentNumber: nextNum,
      caller: user?.fullName || user?.email || '',
      priority: computeIncidentPriority(initialIncidentForm.impact, initialIncidentForm.urgency),
    })
  }

  async function createIncident(stayOnForm = false) {
    if (!incidentForm.shortDescription.trim()) {
      setToast('Short description is required before submitting.')
      window.setTimeout(() => setToast(''), 5000)
      return
    }
    setBusy(true)
    try {
      let fullDescription = incidentForm.description
      if (incidentAttachments.length > 0) {
        fullDescription += `\n\n[Attachments (${incidentAttachments.length}): ${incidentAttachments.map((a) => a.name).join(', ')}]`
      }
      if (workNotesList.length > 0) {
        fullDescription += `\n\n[Internal Work Notes: ${workNotesList.map((w) => `${w.author} (${w.time}): ${w.note}`).join(' | ')}]`
      }
      const payload = {
        ...incidentForm,
        title: incidentForm.shortDescription || 'Incident',
        shortDescription: incidentForm.shortDescription,
        description: fullDescription,
        caller: incidentForm.caller || user?.fullName || user?.email || 'Employee',
      }
      const response = await apiFetch('/api/incidents', { method: 'POST', body: JSON.stringify(payload) })
      if (!response.ok) throw new Error((await response.json().catch(() => ({}))).message || `Incident could not be created (${response.status})`)
      const createdRecord = await response.json() as { id: string }
      await loadWorkspace()
      setToast(`Incident ${incidentForm.incidentNumber} submitted successfully.`)
      if (stayOnForm) {
        await openIncident(createdRecord.id)
      } else {
        setIncidentForm(initialIncidentForm)
        setIncidentAttachments([])
        setWorkNotesList([])
        setIncidentFormOpen(false)
      }
    } catch (cause) { setToast(cause instanceof Error ? cause.message : 'Incident could not be created.') }
    finally { setBusy(false); window.setTimeout(() => setToast(''), 5000) }
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return
    const files = Array.from(e.target.files)
    const newAttachments = files.map((f) => ({
      name: f.name,
      size: `${Math.max(1, Math.round(f.size / 1024))} KB`,
      type: f.type || 'file',
      date: new Date().toLocaleTimeString()
    }))
    setIncidentAttachments((prev) => [...prev, ...newAttachments])
    setToast(`Attached ${files.length} file(s) to incident ${incidentForm.incidentNumber}.`)
    window.setTimeout(() => setToast(''), 5000)
  }

  function removeAttachment(index: number) {
    setIncidentAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  function addWorkNote() {
    if (!currentWorkNote.trim()) return
    const newEntry = {
      note: currentWorkNote.trim(),
      author: user?.fullName || user?.email || 'Support Engineer',
      time: new Date().toLocaleTimeString()
    }
    setWorkNotesList((prev) => [newEntry, ...prev])
    setCurrentWorkNote('')
    setToast('Internal work note recorded.')
    window.setTimeout(() => setToast(''), 5000)
  }

  function copyIncidentNumber() {
    setFormMenuAnchor(null)
    navigator.clipboard?.writeText(incidentForm.incidentNumber)
    setToast(`Copied ${incidentForm.incidentNumber} to clipboard.`)
    window.setTimeout(() => setToast(''), 5000)
  }

  function applyTemplate(type: 'password' | 'email' | 'vpn' | 'hardware') {
    setFormMenuAnchor(null)
    if (type === 'password') {
      setIncidentForm((prev) => ({
        ...prev,
        category: 'Inquiry / Help',
        subcategory: 'Internal Application',
        service: 'Access and accounts',
        serviceOffering: 'Active Directory SSO',
        impact: '3 - Low',
        urgency: '3 - Low',
        priority: '4 - Low',
        shortDescription: 'Domain user password reset and account unlock request',
        description: 'Caller is locked out of local banking workstation and requires Active Directory credential reset.',
      }))
      setToast('Applied template: Password Reset')
    } else if (type === 'email') {
      setIncidentForm((prev) => ({
        ...prev,
        category: 'Software',
        subcategory: 'Email',
        service: 'Email Service',
        serviceOffering: 'Exchange Online',
        impact: '1 - High',
        urgency: '2 - Medium',
        priority: '2 - High',
        shortDescription: 'Outlook disconnected - Exchange mail synchronization failure',
        description: 'Outlook desktop client displays "Disconnected" status. Webmail works normally.',
      }))
      setToast('Applied template: Email Outage')
    } else if (type === 'vpn') {
      setIncidentForm((prev) => ({
        ...prev,
        category: 'Network',
        subcategory: 'Internal Application',
        service: 'Remote Access',
        serviceOffering: 'Cisco AnyConnect VPN',
        impact: '2 - Medium',
        urgency: '2 - Medium',
        priority: '3 - Moderate',
        shortDescription: 'VPN authentication failure from branch remote workstation',
        description: 'Cisco AnyConnect client times out during multi-factor authentication handshake.',
      }))
      setToast('Applied template: VPN Issue')
    } else if (type === 'hardware') {
      setIncidentForm((prev) => ({
        ...prev,
        category: 'Hardware',
        subcategory: '-- None --',
        service: 'Request a device',
        serviceOffering: 'Hardware Docking & Peripherals',
        impact: '3 - Low',
        urgency: '2 - Medium',
        priority: '4 - Low',
        shortDescription: 'Docking station display ports not detecting external dual monitors',
        description: 'External monitors intermittently flicker and lose signal via USB-C docking station.',
      }))
      setToast('Applied template: Hardware Issue')
    }
    window.setTimeout(() => setToast(''), 5000)
  }

  function saveDraftLocally() {
    setMoreMenuAnchor(null)
    try {
      localStorage.setItem('sn_incident_draft', JSON.stringify({ form: incidentForm, date: new Date().toISOString() }))
      setToast('Incident draft saved locally.')
    } catch { setToast('Could not save draft.') }
    window.setTimeout(() => setToast(''), 5000)
  }

  function restoreDraftLocally() {
    setMoreMenuAnchor(null)
    try {
      const raw = localStorage.getItem('sn_incident_draft')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed.form) {
          setIncidentForm((prev) => ({ ...prev, ...parsed.form, incidentNumber: prev.incidentNumber }))
          setToast(`Restored draft from ${new Date(parsed.date).toLocaleTimeString()}.`)
        }
      } else { setToast('No saved draft found.') }
    } catch { setToast('Could not restore draft.') }
    window.setTimeout(() => setToast(''), 5000)
  }

  function exportDraftJSON() {
    setMoreMenuAnchor(null)
    const blob = new Blob([JSON.stringify(incidentForm, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${incidentForm.incidentNumber || 'incident'}.json`
    a.click()
    URL.revokeObjectURL(url)
    setToast(`Exported ${incidentForm.incidentNumber}.json`)
    window.setTimeout(() => setToast(''), 5000)
  }

  function printForm() {
    setMoreMenuAnchor(null)
    window.print()
  }

  function resetForm() {
    setMoreMenuAnchor(null)
    setIncidentForm({ ...initialIncidentForm, incidentNumber: incidentForm.incidentNumber, caller: user?.fullName || user?.email || '' })
    setIncidentAttachments([])
    setWorkNotesList([])
    setToast('Form fields cleared.')
    window.setTimeout(() => setToast(''), 5000)
  }

  const categorySuggestions: Record<string, string[]> = {
    'Inquiry / Help': [
      'Assistance required resetting domain account password',
      'Guidance on branch service catalog request routing',
      'Need multi-factor authentication token replacement'
    ],
    'Software': [
      'Outlook client displays Disconnected from Exchange server',
      'Core banking teller application crash on launch',
      'License expired or validation error for desktop software'
    ],
    'Hardware': [
      'Dual monitor dock not detecting HDMI/DisplayPort signals',
      'Laptop keyboard unresponsive following sleep state',
      'Battery swollen or degraded and requires replacement'
    ],
    'Network': [
      'Cisco AnyConnect VPN disconnected with TLS error',
      'Unable to resolve internal corporate DNS hostnames',
      'Branch Wi-Fi network dropping client connections'
    ],
    'Database': [
      'SQL query execution timeout during batch transaction posting',
      'Connection pool exhaustion error on core database instance'
    ]
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

        {active === 'Incident Detail' && incidentDetail ? (
          <Paper className="content-card">
            <Button onClick={() => setActive('Incidents')} sx={{ mb: 2 }}>Back to incidents</Button>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h5">
                  {incidentDetail.incident.incidentNumber ? `${incidentDetail.incident.incidentNumber} - ` : ''}
                  {incidentDetail.incident.shortDescription || incidentDetail.incident.title}
                </Typography>
                <Typography color="text.secondary">
                  Reported by {incidentDetail.incident.caller || incidentDetail.incident.reporterId} · {new Date(incidentDetail.incident.createdAt).toLocaleString()}
                </Typography>
              </Box>
              <Chip label={incidentDetail.incident.state || incidentDetail.incident.status} color="primary" />
            </Box>

            <Box className="sn-detail-grid">
              <Box className="sn-detail-item"><Typography className="sn-detail-label">Incident Number</Typography><Typography className="sn-detail-value">{incidentDetail.incident.incidentNumber || incidentDetail.incident.id}</Typography></Box>
              <Box className="sn-detail-item"><Typography className="sn-detail-label">Caller</Typography><Typography className="sn-detail-value">{incidentDetail.incident.caller || incidentDetail.incident.reporterId}</Typography></Box>
              <Box className="sn-detail-item"><Typography className="sn-detail-label">Category</Typography><Typography className="sn-detail-value">{incidentDetail.incident.category}</Typography></Box>
              <Box className="sn-detail-item"><Typography className="sn-detail-label">Subcategory</Typography><Typography className="sn-detail-value">{incidentDetail.incident.subcategory || '-- None --'}</Typography></Box>
              <Box className="sn-detail-item"><Typography className="sn-detail-label">Service</Typography><Typography className="sn-detail-value">{incidentDetail.incident.service || 'Not specified'}</Typography></Box>
              <Box className="sn-detail-item"><Typography className="sn-detail-label">Service offering</Typography><Typography className="sn-detail-value">{incidentDetail.incident.serviceOffering || 'Not specified'}</Typography></Box>
              <Box className="sn-detail-item"><Typography className="sn-detail-label">Channel</Typography><Typography className="sn-detail-value">{incidentDetail.incident.channel || '-- None --'}</Typography></Box>
              <Box className="sn-detail-item"><Typography className="sn-detail-label">State</Typography><Typography className="sn-detail-value">{incidentDetail.incident.state || incidentDetail.incident.status}</Typography></Box>
              <Box className="sn-detail-item"><Typography className="sn-detail-label">Impact</Typography><Typography className="sn-detail-value">{incidentDetail.incident.impact || '3 - Low'}</Typography></Box>
              <Box className="sn-detail-item"><Typography className="sn-detail-label">Urgency</Typography><Typography className="sn-detail-value">{incidentDetail.incident.urgency || '3 - Low'}</Typography></Box>
              <Box className="sn-detail-item"><Typography className="sn-detail-label">Priority</Typography><Typography className="sn-detail-value">{incidentDetail.incident.priority}</Typography></Box>
              <Box className="sn-detail-item"><Typography className="sn-detail-label">Assigned to</Typography><Typography className="sn-detail-value">{incidentDetail.incident.assignedTo || incidentDetail.incident.assigneeId || 'Unassigned'}</Typography></Box>
            </Box>

            <Typography variant="h6" sx={{ mt: 2 }}>Description</Typography>
            <Typography sx={{ my: 1, whiteSpace: 'pre-wrap', color: 'text.secondary' }}>
              {incidentDetail.incident.description || 'No detailed description provided.'}
            </Typography>

            {isManagerAdmin && (
              <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                <FormControl sx={{ minWidth: 220 }} size="small">
                  <InputLabel>Update state</InputLabel>
                  <Select
                    label="Update state"
                    value={incidentDetail.incident.state || incidentDetail.incident.status}
                    onChange={(e) => void updateIncidentStatus(e.target.value)}
                  >
                    {['New', 'In Progress', 'On Hold', 'Resolved', 'Closed', 'Canceled'].map((s) => (
                      <MenuItem key={s} value={s}>{s}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            )}

            <Divider sx={{ my: 3 }} />
            <Typography variant="h6">Comments & Activity</Typography>
            {incidentDetail.comments.length === 0 ? (
              <Typography color="text.secondary" sx={{ py: 1 }}>No comments yet.</Typography>
            ) : (
              incidentDetail.comments.map((c) => (
                <Box className="request-row" key={c.id}>
                  <Box className="request-main">
                    <Typography>{c.comment}</Typography>
                    <Typography className="request-id">{c.authorId} · {new Date(c.createdAt).toLocaleString()}</Typography>
                  </Box>
                </Box>
              ))
            )}
            <TextField
              fullWidth
              label="Add a comment"
              multiline
              minRows={2}
              sx={{ mt: 2 }}
              value={incidentComment}
              onChange={(e) => setIncidentComment(e.target.value)}
            />
            <Button
              sx={{ mt: 1 }}
              variant="contained"
              disabled={!incidentComment.trim()}
              onClick={() => void addIncidentComment()}
            >
              Add comment
            </Button>
          </Paper>
        ) : active === 'Request Detail' && requestDetail ? <RequestDetailReport request={requestDetail} history={requestHistory} requesterName={user?.id === requestDetail.requesterId ? user.fullName : impersonationUsers.find((candidate) => candidate.id === requestDetail.requesterId)?.fullName || requestDetail.requesterId} requestedForName={user?.id === requestDetail.requestedForId ? user.fullName : impersonationUsers.find((candidate) => candidate.id === requestDetail.requestedForId)?.fullName || requestDetail.requestedForId} approverName={approvers.find((candidate) => candidate.id === requestDetail.approverId)?.fullName} onBack={() => { setActive(isManagerAdmin ? 'Requests' : 'My requests'); setRequestDetail(null) }} /> : selectedService ? <ServiceRequestForm service={selectedService} values={requestFields} setValues={setRequestFields} approvers={approvers} approversLoading={approversLoading} busy={busy} onCancel={() => { setSelectedService(null); setRequestFields({}) }} onSubmit={() => void submitRequest(selectedService)} /> : active === 'Request receipt' && receipt ? <RequestReceipt receipt={receipt} onRequests={() => setActive('My requests')} onCatalog={() => setActive('Service catalog')} /> : active === 'Settings' ? <PasswordSettings /> : active === 'User access' && isManagerAdmin ? <UserAccessPage /> : active === 'Incidents' ? (
          <Paper className="content-card">
            <Box className="section-heading in-card">
              <Box>
                <Typography variant="h6">Incident reports</Typography>
                <Typography className="section-note">Report and track operational issues with ServiceNow alignment.</Typography>
              </Box>
              {!incidentFormOpen && (
                <Button variant="contained" onClick={() => void openNewIncidentForm()}>
                  Report incident
                </Button>
              )}
            </Box>

            {incidentFormOpen && (
              <Box className="sn-incident-card">
                <Box className="sn-form-header">
                  <Box className="sn-header-left">
                    <IconButton
                      size="small"
                      className="sn-menu-icon-btn"
                      title="Form context menu"
                      aria-label="Form context menu"
                      onClick={(e) => setFormMenuAnchor(e.currentTarget)}
                    >
                      <MenuRounded className="sn-menu-icon" />
                    </IconButton>
                    <Box>
                      <Typography className="sn-title">Incident</Typography>
                      <Typography className="sn-subtitle">New record</Typography>
                    </Box>
                  </Box>
                  <Box className="sn-header-right">
                    <IconButton
                      size="small"
                      title="Manage Attachments"
                      aria-label="Manage Attachments"
                      onClick={() => setAttachmentsOpen(true)}
                    >
                      <Badge badgeContent={incidentAttachments.length} color="primary">
                        <AttachFileRounded fontSize="small" />
                      </Badge>
                    </IconButton>
                    <IconButton
                      size="small"
                      title="Activity stream & Work notes"
                      aria-label="Activity stream & Work notes"
                      color={streamDrawerOpen ? "warning" : "default"}
                      onClick={() => setStreamDrawerOpen(!streamDrawerOpen)}
                    >
                      <TuneRounded fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      title="More options"
                      aria-label="More options"
                      onClick={(e) => setMoreMenuAnchor(e.currentTarget)}
                    >
                      <MoreHorizRounded fontSize="small" />
                    </IconButton>
                    <Button
                      variant="contained"
                      className="sn-submit-btn"
                      disabled={busy}
                      onClick={() => void createIncident()}
                    >
                      {busy ? 'Submitting…' : 'Submit'}
                    </Button>
                  </Box>
                </Box>

                {streamDrawerOpen && (
                  <Box className="sn-worknotes-container">
                    <Box className="sn-worknotes-header">
                      <Typography className="sn-worknotes-title">
                        <HistoryToggleOffRounded fontSize="small" /> Internal IT Work Notes & Activity Stream
                      </Typography>
                      <Typography className="sn-worknotes-caption">
                        Visible only to support engineers (not visible to caller)
                      </Typography>
                    </Box>
                    <textarea
                      className="sn-worknotes-textarea"
                      placeholder="Type internal diagnosis notes or troubleshooting steps..."
                      value={currentWorkNote}
                      onChange={(e) => setCurrentWorkNote(e.target.value)}
                    />
                    <Box className="sn-worknotes-actions">
                      <Button
                        size="small"
                        variant="contained"
                        color="warning"
                        disabled={!currentWorkNote.trim()}
                        onClick={addWorkNote}
                        sx={{ textTransform: 'none', fontSize: 12 }}
                      >
                        Add Work Note
                      </Button>
                    </Box>
                    {workNotesList.length > 0 && (
                      <Box className="sn-worknotes-list">
                        <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#92400e', mb: 0.5 }}>
                          Internal Activity Stream ({workNotesList.length}):
                        </Typography>
                        {workNotesList.map((entry, idx) => (
                          <Box key={idx} className="sn-worknote-entry">
                            <Typography sx={{ fontSize: 12, color: '#1e293b' }}>{entry.note}</Typography>
                            <Typography sx={{ fontSize: 10, color: '#78350f', mt: 0.5 }}>
                              {entry.author} · {entry.time}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    )}
                  </Box>
                )}

                <Box className="sn-form-body">
                  <Box className="sn-form-column">
                    <Box className="sn-field-row">
                      <Typography className="sn-field-label">Number</Typography>
                      <Box className="sn-field-input-wrap sn-number-wrap">
                        <input
                          className="sn-input-styled sn-number-input"
                          readOnly
                          value={incidentForm.incidentNumber}
                        />
                      </Box>
                    </Box>

                    <Box className="sn-field-row">
                      <Typography className="sn-field-label">
                        <span className="sn-required">*</span> Caller
                      </Typography>
                      <Box className="sn-field-input-wrap">
                        <input
                          className="sn-input-styled"
                          value={incidentForm.caller}
                          onChange={(e) => setIncidentForm({ ...incidentForm, caller: e.target.value })}
                          placeholder="Search caller..."
                        />
                        <IconButton
                          size="small"
                          className="sn-search-icon-btn"
                          title="Look up Caller"
                          onClick={() => setLookupModal('caller')}
                        >
                          <SearchRounded fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>

                    <Box className="sn-field-row">
                      <Typography className="sn-field-label">Category</Typography>
                      <Box className="sn-field-input-wrap">
                        <select
                          className="sn-select-styled"
                          value={incidentForm.category}
                          onChange={(e) => setIncidentForm({ ...incidentForm, category: e.target.value })}
                        >
                          {['Inquiry / Help', 'Software', 'Hardware', 'Network', 'Database'].map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </Box>
                    </Box>

                    <Box className="sn-field-row">
                      <Typography className="sn-field-label">Subcategory</Typography>
                      <Box className="sn-field-input-wrap">
                        <select
                          className="sn-select-styled"
                          value={incidentForm.subcategory}
                          onChange={(e) => setIncidentForm({ ...incidentForm, subcategory: e.target.value })}
                        >
                          {['-- None --', 'Antivirus', 'Email', 'Internal Application', 'Operating System'].map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </Box>
                    </Box>

                    <Box className="sn-field-row">
                      <Typography className="sn-field-label">Service</Typography>
                      <Box className="sn-field-input-wrap">
                        <input
                          className="sn-input-styled"
                          value={incidentForm.service}
                          onChange={(e) => setIncidentForm({ ...incidentForm, service: e.target.value })}
                        />
                        <IconButton
                          size="small"
                          className="sn-search-icon-btn"
                          title="Look up Service"
                          onClick={() => setLookupModal('service')}
                        >
                          <SearchRounded fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>

                    <Box className="sn-field-row">
                      <Typography className="sn-field-label">Service offering</Typography>
                      <Box className="sn-field-input-wrap">
                        <input
                          className="sn-input-styled"
                          value={incidentForm.serviceOffering}
                          onChange={(e) => setIncidentForm({ ...incidentForm, serviceOffering: e.target.value })}
                        />
                        <IconButton
                          size="small"
                          className="sn-search-icon-btn"
                          title="Look up Service offering"
                          onClick={() => setLookupModal('serviceOffering')}
                        >
                          <SearchRounded fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  </Box>

                  <Box className="sn-form-column">
                    <Box className="sn-field-row">
                      <Typography className="sn-field-label">Channel</Typography>
                      <Box className="sn-field-input-wrap">
                        <select
                          className="sn-select-styled"
                          value={incidentForm.channel}
                          onChange={(e) => setIncidentForm({ ...incidentForm, channel: e.target.value })}
                        >
                          {['-- None --', 'Email', 'Phone', 'Self-service', 'Walk-in', 'Chat'].map((ch) => (
                            <option key={ch} value={ch}>{ch}</option>
                          ))}
                        </select>
                      </Box>
                    </Box>

                    <Box className="sn-field-row">
                      <Typography className="sn-field-label">State</Typography>
                      <Box className="sn-field-input-wrap">
                        <select
                          className="sn-select-styled"
                          value={incidentForm.state}
                          onChange={(e) => setIncidentForm({ ...incidentForm, state: e.target.value })}
                        >
                          {['New', 'In Progress', 'On Hold', 'Resolved', 'Closed', 'Canceled'].map((st) => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                        </select>
                      </Box>
                    </Box>

                    <Box className="sn-field-row">
                      <Typography className="sn-field-label">Impact</Typography>
                      <Box className="sn-field-input-wrap">
                        <select
                          className="sn-select-styled"
                          value={incidentForm.impact}
                          onChange={(e) => {
                            const newImp = e.target.value
                            setIncidentForm({
                              ...incidentForm,
                              impact: newImp,
                              priority: computeIncidentPriority(newImp, incidentForm.urgency)
                            })
                          }}
                        >
                          {['1 - High', '2 - Medium', '3 - Low'].map((imp) => (
                            <option key={imp} value={imp}>{imp}</option>
                          ))}
                        </select>
                      </Box>
                    </Box>

                    <Box className="sn-field-row">
                      <Typography className="sn-field-label">Urgency</Typography>
                      <Box className="sn-field-input-wrap">
                        <select
                          className="sn-select-styled"
                          value={incidentForm.urgency}
                          onChange={(e) => {
                            const newUrg = e.target.value
                            setIncidentForm({
                              ...incidentForm,
                              urgency: newUrg,
                              priority: computeIncidentPriority(incidentForm.impact, newUrg)
                            })
                          }}
                        >
                          {['1 - High', '2 - Medium', '3 - Low'].map((urg) => (
                            <option key={urg} value={urg}>{urg}</option>
                          ))}
                        </select>
                      </Box>
                    </Box>

                    <Box className="sn-field-row">
                      <Typography className="sn-field-label">
                        <a href="#priority" className="sn-link-label" onClick={(e) => e.preventDefault()}>Priority</a>
                      </Typography>
                      <Box className="sn-field-input-wrap">
                        <input
                          className="sn-input-styled sn-readonly-input"
                          readOnly
                          value={incidentForm.priority}
                        />
                      </Box>
                    </Box>

                    <Box className="sn-field-row">
                      <Typography className="sn-field-label">Assigned to</Typography>
                      <Box className="sn-field-input-wrap">
                        <input
                          className="sn-input-styled"
                          value={incidentForm.assignedTo}
                          onChange={(e) => setIncidentForm({ ...incidentForm, assignedTo: e.target.value })}
                        />
                        <IconButton
                          size="small"
                          className="sn-search-icon-btn"
                          title="Look up Assignee"
                          onClick={() => setLookupModal('assignedTo')}
                        >
                          <SearchRounded fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  </Box>
                </Box>

                <Box className="sn-fullwidth-rows">
                  <Box className="sn-field-row sn-fullwidth-row">
                    <Typography className="sn-field-label">
                      <span className="sn-required">*</span> Short description
                    </Typography>
                    <Box className="sn-field-input-wrap">
                      <input
                        className="sn-input-styled"
                        value={incidentForm.shortDescription}
                        onChange={(e) => setIncidentForm({ ...incidentForm, shortDescription: e.target.value })}
                        placeholder="Short description of the issue"
                        required
                      />
                      <IconButton
                        size="small"
                        className="sn-lightbulb-btn"
                        title="Suggestions for this category"
                        onClick={(e) => setSuggestionsAnchor(e.currentTarget)}
                      >
                        <LightbulbOutlined fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>

                  <Box className="sn-field-row sn-fullwidth-row">
                    <Typography className="sn-field-label">Description</Typography>
                    <Box className="sn-field-input-wrap">
                      <textarea
                        className="sn-textarea-styled"
                        rows={3}
                        value={incidentForm.description}
                        onChange={(e) => setIncidentForm({ ...incidentForm, description: e.target.value })}
                        placeholder="Detailed explanation"
                      />
                    </Box>
                  </Box>
                </Box>

                <Box className="sn-related-section">
                  <Box className="sn-related-pill-container">
                    <Box
                      className="sn-related-pill"
                      onClick={() => setRelatedOpen(!relatedOpen)}
                      role="button"
                      tabIndex={0}
                    >
                      Related Search Results {relatedOpen ? <KeyboardArrowUpRounded fontSize="small" /> : <KeyboardArrowDownRounded fontSize="small" />}
                    </Box>
                  </Box>
                  {relatedOpen && (
                    <>
                      <Box className="sn-related-search-row">
                        <Box className="sn-related-label-wrap">
                          <Typography className="sn-related-label">Related Search</Typography>
                          <HelpOutlineRounded className="sn-help-icon" titleAccess="Search knowledge articles and services to resolve issues without waiting" />
                        </Box>
                        <Box className="sn-related-input-wrap">
                          <SearchRounded className="sn-inner-search-icon" />
                          <input
                            className="sn-related-input"
                            placeholder="Search articles or services..."
                            value={incidentSearchQuery}
                            onChange={(e) => setIncidentSearchQuery(e.target.value)}
                          />
                          {incidentSearchQuery && (
                            <IconButton
                              size="small"
                              sx={{ position: 'absolute', right: 8, padding: '2px' }}
                              onClick={() => setIncidentSearchQuery('')}
                            >
                              <ClearRounded fontSize="small" />
                            </IconButton>
                          )}
                        </Box>
                        <select
                          className="sn-select-styled sn-related-select"
                          value={incidentSearchFilter}
                          onChange={(e) => setIncidentSearchFilter(e.target.value)}
                        >
                          <option value="Knowledge & Catalog (All)">Knowledge & Catalog (All)</option>
                          <option value="Knowledge Articles">Knowledge Articles</option>
                          <option value="Catalog Items">Catalog Items</option>
                        </select>
                      </Box>

                      {effectiveIncidentQuery && (
                        <Box className="sn-related-results">
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>
                              Found {displayedSearchResults.length} {displayedSearchResults.length === 1 ? 'match' : 'matches'} for "{effectiveIncidentQuery}"
                            </Typography>
                            {incidentSearchQuery && (
                              <Button size="small" variant="text" onClick={() => setIncidentSearchQuery('')}>
                                Reset search
                              </Button>
                            )}
                          </Box>

                          {displayedSearchResults.length === 0 ? (
                            <Typography color="text.secondary" sx={{ py: 1, fontSize: 13 }}>
                              No matching articles or catalog services found. You can submit this incident or try other keywords.
                            </Typography>
                          ) : (
                            displayedSearchResults.map((result) => (
                              <Paper key={result.key} className="sn-related-result-card" elevation={0}>
                                <Box className="sn-result-header">
                                  {result.type === 'kb' ? (
                                    <>
                                      <Chip size="small" icon={<MenuBookRounded fontSize="small" />} label={`Article · ${result.id}`} color="primary" variant="outlined" sx={{ height: 22, fontSize: 11 }} />
                                      <Chip size="small" label={result.category} sx={{ height: 22, fontSize: 11 }} />
                                    </>
                                  ) : (
                                    <>
                                      <Chip size="small" icon={<ArticleOutlined fontSize="small" />} label="Service Catalog" color="success" variant="outlined" sx={{ height: 22, fontSize: 11 }} />
                                      <Chip size="small" label={result.category} sx={{ height: 22, fontSize: 11 }} />
                                    </>
                                  )}
                                </Box>
                                <Typography
                                  className="sn-result-title"
                                  onClick={() => result.type === 'kb' && setSelectedArticle(result.article)}
                                >
                                  {result.title}
                                </Typography>
                                <Typography className="sn-result-summary">
                                  {result.summary}
                                </Typography>
                                <Box className="sn-result-actions">
                                  {result.type === 'kb' ? (
                                    <>
                                      <Button size="small" variant="outlined" onClick={() => setSelectedArticle(result.article)}>
                                        Read article
                                      </Button>
                                      <Button
                                        size="small"
                                        variant="text"
                                        color="success"
                                        onClick={() => {
                                          setIncidentFormOpen(false);
                                          setToast(`Resolved using ${result.id}. Incident report cancelled.`);
                                          window.setTimeout(() => setToast(''), 5000);
                                        }}
                                      >
                                        This solves my issue
                                      </Button>
                                    </>
                                  ) : (
                                    <Button
                                      size="small"
                                      variant="contained"
                                      onClick={() => {
                                        setIncidentFormOpen(false);
                                        setSelectedService(result.title);
                                      }}
                                    >
                                      Start request
                                    </Button>
                                  )}
                                </Box>
                              </Paper>
                            ))
                          )}
                        </Box>
                      )}
                    </>
                  )}
                </Box>

                <Box className="sn-form-footer">
                  <Button onClick={() => setIncidentFormOpen(false)} variant="outlined">
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    className="sn-submit-btn"
                    disabled={busy || !incidentForm.shortDescription.trim()}
                    onClick={() => void createIncident()}
                  >
                    {busy ? 'Submitting…' : 'Submit'}
                  </Button>
                </Box>
              </Box>
            )}

            {incidentRows.length === 0 ? (
              <Typography color="text.secondary" sx={{ py: 3 }}>
                No incidents have been reported.
              </Typography>
            ) : (
              incidentRows.map((incident) => (
                <Box
                  className="request-row"
                  key={incident.id}
                  onClick={() => void openIncident(incident.id)}
                  sx={{ cursor: "pointer" }}
                >
                  <Box className="request-symbol amber"><SupportAgentRounded /></Box>
                  <Box className="request-main">
                    <Typography className="request-name">
                      {incident.incidentNumber ? `${incident.incidentNumber} - ` : ''}
                      {incident.shortDescription || incident.title}
                    </Typography>
                    <Typography className="request-id">
                      {incident.category} · Priority: {incident.priority} · Caller: {incident.caller || incident.reporterId}
                    </Typography>
                  </Box>
                  <Chip size="small" label={incident.state || incident.status} color="primary" variant="outlined" />
                </Box>
              ))
            )}
          </Paper>
        ) : active === 'Service catalog' ? <>
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
    {selectedArticle && (
      <Dialog open onClose={() => setSelectedArticle(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="caption" color="primary" sx={{ fontWeight: 700 }}>
              {selectedArticle.id} · {selectedArticle.category}
            </Typography>
            <Typography variant="h6">{selectedArticle.title}</Typography>
          </Box>
          <IconButton onClick={() => setSelectedArticle(null)} size="small">
            <ClearRounded />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary', fontWeight: 500 }}>
            {selectedArticle.summary}
          </Typography>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Resolution Steps:</Typography>
          <Typography variant="body2" sx={{ whiteSpace: 'pre-line', lineHeight: 1.8, bgcolor: '#f8fafc', p: 2, borderRadius: 1.5, border: '1px solid #e2e8f0' }}>
            {selectedArticle.content}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedArticle(null)}>Close</Button>
          <Button
            variant="contained"
            color="success"
            onClick={() => {
              const articleTitle = selectedArticle.title;
              setSelectedArticle(null);
              setIncidentFormOpen(false);
              setToast(`Issue resolved with: ${articleTitle}. Incident cancelled.`);
              window.setTimeout(() => setToast(''), 5000);
            }}
          >
            This solves my issue
          </Button>
        </DialogActions>
      </Dialog>
    )}

    {/* Form Context Menu (Hamburger Icon) */}
    <Menu
      anchorEl={formMenuAnchor}
      open={Boolean(formMenuAnchor)}
      onClose={() => setFormMenuAnchor(null)}
    >
      <MenuItem onClick={() => { setFormMenuAnchor(null); void createIncident(true); }}>
        <ListItemIcon><SaveOutlined fontSize="small" /></ListItemIcon>
        <ListItemText primary="Save" secondary="Save record and stay on form" />
      </MenuItem>
      <MenuItem onClick={() => { setFormMenuAnchor(null); void openNewIncidentForm(); }}>
        <ListItemIcon><RestartAltRounded fontSize="small" /></ListItemIcon>
        <ListItemText primary="Reload form" secondary="Reset form with fresh number" />
      </MenuItem>
      <MenuItem onClick={copyIncidentNumber}>
        <ListItemIcon><ContentCopyRounded fontSize="small" /></ListItemIcon>
        <ListItemText primary="Copy incident number" secondary={incidentForm.incidentNumber} />
      </MenuItem>
      <Divider />
      <Typography sx={{ px: 2, py: 0.5, fontSize: 11, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}>
        Apply Standard Templates
      </Typography>
      <MenuItem onClick={() => applyTemplate('password')}>
        <ListItemText primary="Template: Password Reset" secondary="Inquiry / Help · Active Directory SSO" />
      </MenuItem>
      <MenuItem onClick={() => applyTemplate('email')}>
        <ListItemText primary="Template: Email Outage" secondary="Software · Exchange Online · High Priority" />
      </MenuItem>
      <MenuItem onClick={() => applyTemplate('vpn')}>
        <ListItemText primary="Template: VPN Failure" secondary="Network · Cisco AnyConnect VPN" />
      </MenuItem>
      <MenuItem onClick={() => applyTemplate('hardware')}>
        <ListItemText primary="Template: Hardware Dock Issue" secondary="Hardware · Docking Station & Monitors" />
      </MenuItem>
    </Menu>

    {/* More Options Menu (...) */}
    <Menu
      anchorEl={moreMenuAnchor}
      open={Boolean(moreMenuAnchor)}
      onClose={() => setMoreMenuAnchor(null)}
    >
      <MenuItem onClick={saveDraftLocally}>
        <ListItemIcon><SaveOutlined fontSize="small" /></ListItemIcon>
        <ListItemText primary="Save draft" secondary="Save work in progress to browser storage" />
      </MenuItem>
      <MenuItem onClick={restoreDraftLocally}>
        <ListItemIcon><RestartAltRounded fontSize="small" /></ListItemIcon>
        <ListItemText primary="Restore draft" secondary="Load previously saved draft" />
      </MenuItem>
      <MenuItem onClick={exportDraftJSON}>
        <ListItemIcon><FileDownloadOutlined fontSize="small" /></ListItemIcon>
        <ListItemText primary="Export as JSON" secondary="Download incident draft as JSON" />
      </MenuItem>
      <MenuItem onClick={printForm}>
        <ListItemIcon><PrintOutlined fontSize="small" /></ListItemIcon>
        <ListItemText primary="Print form" secondary="Open browser print preview" />
      </MenuItem>
      <Divider />
      <MenuItem onClick={resetForm} sx={{ color: 'error.main' }}>
        <ListItemIcon><DeleteOutlineRounded fontSize="small" color="error" /></ListItemIcon>
        <ListItemText primary="Clear all fields" secondary="Reset all form inputs" />
      </MenuItem>
    </Menu>

    {/* Short Description Suggestions Menu (Lightbulb) */}
    <Menu
      anchorEl={suggestionsAnchor}
      open={Boolean(suggestionsAnchor)}
      onClose={() => setSuggestionsAnchor(null)}
      slotProps={{ paper: { sx: { maxWidth: 440 } } }}
    >
      <Typography sx={{ px: 2, py: 1, fontSize: 11, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}>
        Suggestions for {incidentForm.category}
      </Typography>
      {(categorySuggestions[incidentForm.category] || categorySuggestions['Inquiry / Help']).map((suggestion, idx) => (
        <MenuItem
          key={idx}
          onClick={() => {
            setIncidentForm({ ...incidentForm, shortDescription: suggestion })
            setSuggestionsAnchor(null)
          }}
        >
          <ListItemIcon><LightbulbOutlined fontSize="small" color="primary" /></ListItemIcon>
          <ListItemText primary={<Typography sx={{ fontSize: 13 }}>{suggestion}</Typography>} />
        </MenuItem>
      ))}
    </Menu>

    {/* Manage Attachments Dialog (Paperclip) */}
    <Dialog
      open={attachmentsOpen}
      onClose={() => setAttachmentsOpen(false)}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AttachFileRounded color="primary" />
          <Typography variant="h6">Manage Attachments</Typography>
        </Box>
        <IconButton onClick={() => setAttachmentsOpen(false)} size="small">
          <ClearRounded />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Box className="sn-attachment-dropzone">
          <CloudUploadRounded sx={{ fontSize: 40, color: '#94a3b8', mb: 1 }} />
          <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#334155', mb: 0.5 }}>
            Attach files to incident {incidentForm.incidentNumber}
          </Typography>
          <Typography sx={{ fontSize: 12, color: '#64748b', mb: 2 }}>
            Upload screenshots, logs, or diagnostic reports (images, PDFs, text files)
          </Typography>
          <Button
            variant="contained"
            component="label"
            startIcon={<CloudUploadRounded />}
            size="small"
          >
            Choose files
            <input
              type="file"
              multiple
              hidden
              onChange={handleFileUpload}
            />
          </Button>
        </Box>

        <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#475569', mb: 1, textTransform: 'uppercase' }}>
          Attached files ({incidentAttachments.length})
        </Typography>

        {incidentAttachments.length === 0 ? (
          <Typography sx={{ fontSize: 13, color: '#94a3b8', fontStyle: 'italic', py: 1 }}>
            No files attached yet.
          </Typography>
        ) : (
          <List dense disablePadding>
            {incidentAttachments.map((file, idx) => (
              <Box key={idx} className="sn-attachment-item">
                <Box className="sn-attachment-item-info">
                  <InsertDriveFileOutlined sx={{ color: '#0284c7' }} />
                  <Box>
                    <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>
                      {file.name}
                    </Typography>
                    <Typography sx={{ fontSize: 11, color: '#64748b' }}>
                      {file.size} · Uploaded {file.date}
                    </Typography>
                  </Box>
                </Box>
                <IconButton
                  size="small"
                  color="error"
                  title="Remove attachment"
                  onClick={() => removeAttachment(idx)}
                >
                  <DeleteOutlineRounded fontSize="small" />
                </IconButton>
              </Box>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 1.5 }}>
        <Button onClick={() => setAttachmentsOpen(false)} variant="contained">
          Done ({incidentAttachments.length})
        </Button>
      </DialogActions>
    </Dialog>

    {/* Lookups Dialog (Magnifying Glass Search for Caller, Service, Service Offering, Assigned to) */}
    <Dialog
      open={Boolean(lookupModal)}
      onClose={() => setLookupModal(null)}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SearchRounded color="primary" />
          <Typography variant="h6">
            {lookupModal === 'caller' && 'Select Caller'}
            {lookupModal === 'service' && 'Select Service'}
            {lookupModal === 'serviceOffering' && 'Select Service Offering'}
            {lookupModal === 'assignedTo' && 'Select Assignee'}
          </Typography>
        </Box>
        <IconButton onClick={() => setLookupModal(null)} size="small">
          <ClearRounded />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 0 }}>
        {lookupModal === 'caller' && (
          <Box>
            {[
              { name: user?.fullName || 'Current User', title: `${user?.role || 'User'} · ${user?.email || 'Logged In'}` },
              { name: 'Sarah Jenkins', title: 'Branch Operations Lead · Charlotte Branch' },
              { name: 'David Miller', title: 'Senior Commercial Loan Officer · Lending Dept' },
              { name: 'Elena Rostova', title: 'Teller Supervisor · Retail Banking' },
              { name: 'Marcus Chen', title: 'Risk & Compliance Analyst · Audit' },
              { name: 'Rachel Green', title: 'Human Resources Business Partner · HR' },
              { name: 'James Wilson', title: 'Customer Service Representative · Call Center' },
            ].map((item, idx) => (
              <Box
                key={idx}
                className="sn-lookup-item"
                onClick={() => {
                  setIncidentForm({ ...incidentForm, caller: item.name })
                  setLookupModal(null)
                }}
              >
                <Box>
                  <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{item.name}</Typography>
                  <Typography sx={{ fontSize: 11, color: '#64748b' }}>{item.title}</Typography>
                </Box>
                <Chip size="small" label="Select" variant="outlined" sx={{ height: 22, fontSize: 11 }} />
              </Box>
            ))}
          </Box>
        )}

        {lookupModal === 'service' && (
          <Box>
            {[
              { name: 'Access and accounts', desc: 'Identity, domain accounts, passwords, MFA, permissions' },
              { name: 'Request a device', desc: 'Laptops, monitors, peripherals, docking stations' },
              { name: 'Workplace services', desc: 'Facilities, badges, physical maintenance, desk setup' },
              { name: 'People support', desc: 'Payroll, leave, HR inquiries, employee verification' },
              { name: 'Email Service', desc: 'Exchange Online, Outlook clients, distribution lists' },
              { name: 'Remote Access', desc: 'Cisco AnyConnect VPN, virtual desktops, remote gateway' },
              { name: 'Core Banking Platform', desc: 'Teller systems, loan origination, ledger databases' },
              { name: 'Network Infrastructure', desc: 'Branch Wi-Fi, LAN switches, internal corporate DNS' },
            ].map((item, idx) => (
              <Box
                key={idx}
                className="sn-lookup-item"
                onClick={() => {
                  setIncidentForm({ ...incidentForm, service: item.name })
                  setLookupModal(null)
                }}
              >
                <Box>
                  <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{item.name}</Typography>
                  <Typography sx={{ fontSize: 11, color: '#64748b' }}>{item.desc}</Typography>
                </Box>
                <Chip size="small" label="Select" variant="outlined" sx={{ height: 22, fontSize: 11 }} />
              </Box>
            ))}
          </Box>
        )}

        {lookupModal === 'serviceOffering' && (
          <Box>
            {[
              { name: 'Active Directory SSO', desc: 'Single sign-on, Kerberos, Windows domain sign-in' },
              { name: 'Cisco AnyConnect VPN', desc: 'Branch to HQ encrypted IPsec/TLS tunnels' },
              { name: 'Exchange Online', desc: 'Corporate email routing and mailbox store' },
              { name: 'Hardware Docking & Peripherals', desc: 'Thunderbolt 4 / USB-C multi-display docks' },
              { name: 'Core Teller Workstation Image', desc: 'Standard Windows 11 Enterprise banking OS image' },
              { name: 'Branch Wi-Fi & LAN', desc: '802.1X secure wireless network for branch devices' },
              { name: 'Internal Financial Ledger API', desc: 'High-availability transaction processing cluster' },
            ].map((item, idx) => (
              <Box
                key={idx}
                className="sn-lookup-item"
                onClick={() => {
                  setIncidentForm({ ...incidentForm, serviceOffering: item.name })
                  setLookupModal(null)
                }}
              >
                <Box>
                  <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{item.name}</Typography>
                  <Typography sx={{ fontSize: 11, color: '#64748b' }}>{item.desc}</Typography>
                </Box>
                <Chip size="small" label="Select" variant="outlined" sx={{ height: 22, fontSize: 11 }} />
              </Box>
            ))}
          </Box>
        )}

        {lookupModal === 'assignedTo' && (
          <Box>
            {[
              { name: 'Service Desk Tier 1', role: 'First Response & Triage Team' },
              { name: 'Identity & Access Admin', role: 'Security & Active Directory Team' },
              { name: 'Network Operations Lead', role: 'Infrastructure & WAN Team' },
              { name: 'Hardware Support Specialist', role: 'Workstation & Peripheral Support' },
              { name: 'Core Banking DBA', role: 'Database Administration & Performance' },
              { name: 'Alex Rivera', role: 'Senior Support Engineer (On Call)' },
              { name: 'Jordan Taylor', role: 'Desktop Systems Administrator' },
            ].map((item, idx) => (
              <Box
                key={idx}
                className="sn-lookup-item"
                onClick={() => {
                  setIncidentForm({ ...incidentForm, assignedTo: item.name })
                  setLookupModal(null)
                }}
              >
                <Box>
                  <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{item.name}</Typography>
                  <Typography sx={{ fontSize: 11, color: '#64748b' }}>{item.role}</Typography>
                </Box>
                <Chip size="small" label="Select" variant="outlined" sx={{ height: 22, fontSize: 11 }} />
              </Box>
            ))}
          </Box>
        )}
      </DialogContent>
    </Dialog>
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
