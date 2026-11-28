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
import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded'
import ArrowUpwardRounded from '@mui/icons-material/ArrowUpwardRounded'
import ArrowDownwardRounded from '@mui/icons-material/ArrowDownwardRounded'
import InfoOutlined from '@mui/icons-material/InfoOutlined'
import CalendarTodayOutlined from '@mui/icons-material/CalendarTodayOutlined'
import FilterListRounded from '@mui/icons-material/FilterListRounded'
import PlayArrowRounded from '@mui/icons-material/PlayArrowRounded'
import FirstPageRounded from '@mui/icons-material/FirstPageRounded'
import LastPageRounded from '@mui/icons-material/LastPageRounded'
import KeyboardArrowLeftRounded from '@mui/icons-material/KeyboardArrowLeftRounded'
import TimelineRounded from '@mui/icons-material/TimelineRounded'
import CheckRounded from '@mui/icons-material/CheckRounded'
import CheckCircleOutlineRounded from '@mui/icons-material/CheckCircleOutlineRounded'
import ErrorOutlineRounded from '@mui/icons-material/ErrorOutlineRounded'
import HourglassEmptyRounded from '@mui/icons-material/HourglassEmptyRounded'
import DoneAllRounded from '@mui/icons-material/DoneAllRounded'
import AnalyticsRounded from '@mui/icons-material/AnalyticsRounded'
import SharedAdminDashboard from './admin/SharedAdminDashboard'
import AuthScreen from './auth/AuthScreen'
import PasswordSettings from './auth/PasswordSettings'
import UserAccessPage from './auth/UserAccessPage'
import ProblemManagement, { type ProblemRecord } from './problems/ProblemManagement'
import ReportProblemRounded from '@mui/icons-material/ReportProblemRounded'
import ChangeManagement from './changes/ChangeManagement'
import PublishedWithChangesRounded from '@mui/icons-material/PublishedWithChangesRounded'
import { useAuth } from './auth/AuthContext'
import type { PortalUser } from './auth/AuthContext'
import { useLocation, useNavigate } from 'react-router-dom'

/** Table view item representing an employee service request in the portal. */
type Request = { id: string; backendId?: string; title: string; category: string; status: string; date: string; createdAt?: string; color: string; description?: string; requesterId?: string; requestedForId?: string; approverId?: string }

/** Pending approval item displayed in the manager/approver queue. */
type Approval = { id: string; requestId: string; requestNumber: string; title: string; employee: string; initials: string; requested: string; decision?: string }

/** Designated approver option retrieved from GET /api/auth/approvers. */
type Approver = { id: string; fullName: string }

/** Structured receipt modal data displayed immediately after successful request submission. */
type RequestReceiptData = { number: string; service: string; status: string; approver: string; createdAt: string; details: Array<{ label: string; value: string }> }

/** Catalog item projected from ServiceNow integration or fallback sample catalog. */
type LiveCatalogItem = { sys_id?: string; name?: string; short_description?: string; category?: string | { display_value?: string } }

/** Definition of a dynamic input field in a service catalog form. */
type RequestField = { name: string; label: string; kind: 'select' | 'text' | 'date' | 'textarea'; options?: string[]; required?: boolean; helper?: string }

/** Full details of a service request retrieved from GET /api/requests/{id}. */
type RequestDetail = { id: string; requestNumber: string; serviceName: string; description: string; requesterId: string; requestedForId: string; approverId: string | null; status: string; externalId?: string | null; externalSystem?: string | null; fields: Record<string,string>; createdAt: string; updatedAt: string }

/** Audit timeline entry retrieved from GET /api/requests/{id}/history. */
type RequestHistoryRow = { id: string; actorId: string; action: string; fromStatus: string | null; toStatus: string | null; comment?: string | null; createdAt: string }

/** Incident record matching the schema of northstar_incident_service. */
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

/** Detailed incident record including chronological work notes and comments. */
type IncidentDetailRecord = { incident: IncidentRecord; comments: Array<{ id: string; authorId: string; comment: string; createdAt: string }> }

/** Knowledge Base self-service article. */
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
  'Request a device': { intro: 'Select equipment needed. Required fields only.', fields: [
    { name: 'item', label: 'What do you need?', kind: 'select', options: ['Laptop', 'Desktop computer', 'Monitor', 'Docking station', 'Keyboard or mouse', 'Headset or webcam', 'Mobile phone', 'Other'], required: true },
    { name: 'neededBy', label: 'When do you need it?', kind: 'date', required: true },
    { name: 'reason', label: 'Business reason', kind: 'textarea', required: true },
  ] },
  'Access and accounts': { intro: 'Request application or directory access.', fields: [
    { name: 'accessType', label: 'What access help do you need?', kind: 'select', options: ['New access', 'Change existing access', 'Remove access', 'Unlock account or reset sign-in', 'Shared mailbox or distribution list', 'VPN or network access', 'Hardware token / MFA'], required: true },
    { name: 'application', label: 'Application, system, or shared resource', kind: 'text', required: true, helper: 'For example: SAP, Salesforce, a shared drive, or a team mailbox.' },
    { name: 'accessLevel', label: 'Access level needed', kind: 'select', options: ['Standard user', 'Read only', 'Contributor / editor', 'Approver', 'Other / not sure'], required: true },
    { name: 'duration', label: 'How long is access needed?', kind: 'select', options: ['Ongoing role requirement', 'Temporary — up to 30 days', 'Temporary — 1 to 6 months', 'Not sure'], required: true },
    { name: 'reason', label: 'Business justification', kind: 'textarea', required: true },
  ] },
  'Workplace services': { intro: 'Submit a facilities service request.', fields: [
    { name: 'requestType', label: 'What workplace help do you need?', kind: 'select', options: ['Maintenance or repair', 'Parking', 'Office move or seating', 'Access badge', 'Furniture or equipment', 'Office supplies', 'Cleaning or pest issue', 'Safety concern', 'Other'], required: true },
    { name: 'neededBy', label: 'Preferred date', kind: 'date', required: true },
    { name: 'reason', label: 'Describe the issue or what is needed', kind: 'textarea', required: true },
  ] },
  'People support': { intro: 'Submit an HR support inquiry.', fields: [
    { name: 'topic', label: 'What People team help do you need?', kind: 'select', options: ['Benefits', 'Payroll question', 'Leave policy or balance', 'Onboarding', 'Employment verification', 'Employment or workplace policy', 'Personal information update', 'Other'], required: true },
    { name: 'reason', label: 'How can the People team help?', kind: 'textarea', required: true },
  ] },
}
function conditionalRequestFields(service: string, values: Record<string, string>): RequestField[] {
  if (service === 'Access and accounts' && values.accessType === 'New access') {
    const shared: RequestField = { name: 'accessTarget', label: 'Who needs this access?', kind: 'text', required: true, helper: 'Enter the employee or team name.' }
    return [
      shared,
      { name: 'accessRoleDetails', label: 'Role or permission requested', kind: 'text', required: true },
      { name: 'accessStart', label: 'When should access begin?', kind: 'date', required: true },
    ]
  }
  return []
}
const employeeNav = [
  { label: 'Overview', icon: <DashboardRounded /> },
  { label: 'Service catalog', icon: <SearchRounded /> },
  { label: 'Requests', icon: <ReceiptLongRounded /> },
]
const managementNav = [
  { label: 'Admin dashboard', icon: <AnalyticsRounded /> },
  { label: 'Requests', icon: <ReceiptLongRounded /> },
  { label: 'Approvals', icon: <TaskAltRounded /> },
  { label: 'User access', icon: <ManageAccountsRounded /> },
]
const incidentNav = { label: 'Incidents', icon: <SupportAgentRounded /> }
const problemNav = { label: 'Problems', icon: <ReportProblemRounded /> }
const changeNav = { label: 'Changes', icon: <PublishedWithChangesRounded /> }

function statusTone(status: Request['status']) { return status === 'Completed' ? 'success' : status === 'Awaiting approval' || status === 'Pending sync' ? 'warning' : 'info' }

export default function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, loading: authLoading, logout, apiFetch, isImpersonating, impersonate, stopImpersonating } = useAuth()
  const isManagerAdmin = user?.role === 'MANAGER_ADMIN'
  const [active, setActive] = useState(isManagerAdmin ? 'Admin dashboard' : 'Overview')
  const [requests, setRequests] = useState(initialRequests)
  const [approvals, setApprovals] = useState<Approval[]>(initialApprovals)
  const [busy, setBusy] = useState(false)
  const [workspaceLoading, setWorkspaceLoading] = useState(false)
  const [workspaceError, setWorkspaceError] = useState('')
  const [requestDetail, setRequestDetail] = useState<RequestDetail | null>(null)
  const [requestHistory, setRequestHistory] = useState<RequestHistoryRow[]>([])
  const [incidentRows, setIncidentRows] = useState<IncidentRecord[]>([])
  const [incidentDetail, setIncidentDetail] = useState<IncidentDetailRecord | null>(null)
  const [problems, setProblems] = useState<ProblemRecord[]>([])
  const [selectedProblem] = useState<ProblemRecord | null>(null)
  const [changesCount, setChangesCount] = useState<number>(0)
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
  useEffect(() => {
    if (toast) {
      const timer = window.setTimeout(() => setToast(''), 2000)
      return () => window.clearTimeout(timer)
    }
  }, [toast])
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
  const [readNotifIds, setReadNotifIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('itsm_read_notifications')
      return saved ? (JSON.parse(saved) as string[]) : []
    } catch {
      return []
    }
  })
  const [notifFilter, setNotifFilter] = useState<'all' | 'requests' | 'incidents' | 'approvals'>('all')

  const notificationsList = useMemo(() => {
    const list: Array<{
      id: string
      type: 'request' | 'incident' | 'approval'
      ticketNumber: string
      title: string
      status: string
      timestamp: number
      rawRecord: any
    }> = []

    approvals.forEach((app) => {
      const time = app.requested ? new Date(app.requested).getTime() : Date.now()
      list.push({
        id: `app-${app.id}`,
        type: 'approval',
        ticketNumber: app.requestNumber || 'APPROVAL',
        title: `${app.title} (From ${app.employee})`,
        status: 'PENDING APPROVAL',
        timestamp: isNaN(time) ? Date.now() : time,
        rawRecord: app,
      })
    })

    incidentRows.forEach((inc) => {
      const time = inc.createdAt ? new Date(inc.createdAt).getTime() : Date.now()
      list.push({
        id: `inc-${inc.id}`,
        type: 'incident',
        ticketNumber: inc.incidentNumber || inc.id.slice(0, 8),
        title: inc.shortDescription || inc.title || 'Incident reported',
        status: inc.state || inc.status || 'NEW',
        timestamp: isNaN(time) ? Date.now() : time,
        rawRecord: inc,
      })
    })

    requests.forEach((req) => {
      // Check if current user is request riser (requester / requestedFor) or regarding approver
      const userKey = user?.id?.toLowerCase()
      const userEmail = user?.email?.toLowerCase()
      const userFullName = user?.fullName?.toLowerCase()
      const reqRequester = req.requesterId?.toLowerCase()
      const reqRequestedFor = req.requestedForId?.toLowerCase()
      const reqApprover = req.approverId?.toLowerCase()

      const isRiser = Boolean(
        user && (
          (reqRequester && (reqRequester === userKey || reqRequester === userEmail)) ||
          (reqRequestedFor && (reqRequestedFor === userKey || reqRequestedFor === userEmail))
        )
      )

      const isApprover = Boolean(
        user && reqApprover && (
          reqApprover === userKey ||
          reqApprover === userEmail ||
          (userFullName && reqApprover === userFullName)
        )
      )

      // Only the regarding approver or request riser should see their request notifications
      if (!isRiser && !isApprover) {
        return
      }

      // If user is solely the approver and already has a pending approval card for this request, avoid duplicate
      if (!isRiser && isApprover && approvals.some((a) => a.requestNumber === req.id || a.requestId === req.backendId)) {
        return
      }

      const time = req.createdAt ? new Date(req.createdAt).getTime() : (req.date ? new Date(req.date).getTime() : Date.now())
      list.push({
        id: `req-${req.backendId || req.id}`,
        type: 'request',
        ticketNumber: req.id,
        title: req.title,
        status: req.status,
        timestamp: isNaN(time) ? Date.now() : time,
        rawRecord: req,
      })
    })

    return list.sort((a, b) => b.timestamp - a.timestamp)
  }, [requests, incidentRows, approvals, user])

  const unreadCount = useMemo(() => {
    const readSet = new Set(readNotifIds)
    return notificationsList.filter((n) => !readSet.has(n.id)).length
  }, [notificationsList, readNotifIds])

  function markAllNotificationsRead() {
    const allIds = notificationsList.map((n) => n.id)
    setReadNotifIds(allIds)
    try {
      localStorage.setItem('itsm_read_notifications', JSON.stringify(allIds))
    } catch {}
  }

  function handleNotificationClick(notif: (typeof notificationsList)[0]) {
    if (!readNotifIds.includes(notif.id)) {
      const updated = [...readNotifIds, notif.id]
      setReadNotifIds(updated)
      try {
        localStorage.setItem('itsm_read_notifications', JSON.stringify(updated))
      } catch {}
    }
    setNotificationsAnchor(null)

    if (notif.type === 'request') {
      void openRequest(notif.rawRecord)
    } else if (notif.type === 'incident') {
      void openIncident(notif.rawRecord.id)
    } else if (notif.type === 'approval') {
      setActive('Approvals')
    }
  }

  function formatRelativeTime(timestamp: number) {
    if (!timestamp || isNaN(timestamp)) return 'Recent'
    const diff = Math.floor((Date.now() - timestamp) / 1000)
    if (diff < 45) return 'Just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
    return new Date(timestamp).toLocaleDateString()
  }
  const [impersonationOpen, setImpersonationOpen] = useState(false)
  const [impersonationUsers, setImpersonationUsers] = useState<PortalUser[]>([])
  const [impersonationUserId, setImpersonationUserId] = useState('')
  const [impersonationBusy, setImpersonationBusy] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const routeToPage: Record<string,string> = {
    '/': isManagerAdmin ? 'Admin dashboard' : 'Overview',
    '/dashboard': 'Admin dashboard',
    '/manage/dashboard': 'Admin dashboard',
    '/catalog': 'Service catalog',
    '/requests': 'Requests',
    '/manage/requests': 'Requests',
    '/approvals': 'Approvals',
    '/incidents': 'Incidents',
    '/problems': 'Problems',
    '/manage/problems': 'Problems',
    '/changes': 'Changes',
    '/manage/changes': 'Changes',
    '/access': 'User access',
    '/settings': 'Settings',
    '/requests/receipt': 'Request receipt',
  }
  const pageToRoute: Record<string,string> = {
    'Overview': isManagerAdmin ? '/dashboard' : '/',
    'Admin dashboard': isManagerAdmin ? '/' : '/manage/dashboard',
    'Dashboard': '/dashboard',
    'Service catalog': '/catalog',
    'My requests': '/requests',
    'Requests': isManagerAdmin ? '/manage/requests' : '/requests',
    'Approvals': '/approvals',
    'Incidents': '/incidents',
    'Problems': isManagerAdmin ? '/manage/problems' : '/problems',
    'Changes': isManagerAdmin ? '/manage/changes' : '/changes',
    'User access': '/access',
    'Settings': '/settings',
    'Request receipt': '/requests/receipt',
  }
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
    if (location.pathname === '/requests/new') {
      setActive('Service catalog')
      const svc = new URLSearchParams(location.search).get('service')
      if (svc && !selectedService) void openServiceForm(svc)
    }
  }, [location.pathname, location.search])
  useEffect(() => {
    if (selectedService) { navigate(`/requests/new?service=${encodeURIComponent(selectedService)}`); return }
    const path = pageToRoute[active]
    if (path && location.pathname !== path) navigate(path)
  }, [active, selectedService])
  useEffect(() => {
    setActive(isManagerAdmin ? 'Admin dashboard' : 'Overview')
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
  }, [user?.id, isManagerAdmin])

  const [navHistory, setNavHistory] = useState<string[]>([])
  const lastActiveRef = useRef(active)

  useEffect(() => {
    if (active !== lastActiveRef.current) {
      const prev = lastActiveRef.current
      setNavHistory((prevHistory) => {
        if (prevHistory[prevHistory.length - 1] === prev) return prevHistory
        return [...prevHistory, prev]
      })
      lastActiveRef.current = active
    }
  }, [active])

  function handleGlobalBack() {
    if (selectedService) {
      setSelectedService(null)
      setRequestFields({})
      return
    }
    if (incidentFormOpen) {
      setIncidentFormOpen(false)
      return
    }
    if (active === 'Incident Detail') {
      setActive('Incidents')
      setIncidentDetail(null)
      return
    }
    if (active === 'Request Detail') {
      setActive('Requests')
      setRequestDetail(null)
      return
    }
    if (active === 'Request receipt') {
      setActive('Requests')
      setReceipt(null)
      return
    }
    if (navHistory.length > 0) {
      const prev = navHistory[navHistory.length - 1]
      setNavHistory((h) => h.slice(0, -1))
      lastActiveRef.current = prev
      setActive(prev)
      return
    }
    if (window.history.state && typeof window.history.state.idx === 'number' && window.history.state.idx > 0) {
      navigate(-1)
      return
    }
    if (active !== 'Admin dashboard' && active !== 'Overview') {
      setActive(isManagerAdmin ? 'Admin dashboard' : 'Overview')
    } else {
      setActive('Service catalog')
    }
  }

  /**
   * Refreshes all workspace data in parallel across backend microservices:
   * - GET /api/requests: Employee/Manager request list.
   * - GET /api/approvals/pending: Approvals awaiting decision.
   * - GET /api/incidents: IT/Support incidents.
   * - GET /api/problems: Problem tickets.
   * - GET /api/changes/dashboard/summary: Change management metrics.
   */
  const loadWorkspace = async () => {
    setWorkspaceLoading(true); setWorkspaceError('')
    try {
      const [requestResponse, approvalResponse, incidentResponse, problemResponse] = await Promise.all([
        apiFetch('/api/requests?page=0&size=50'),
        apiFetch('/api/approvals/pending'),
        apiFetch('/api/incidents'),
        apiFetch('/api/problems'),
      ])
      if (!requestResponse.ok || !approvalResponse.ok || !incidentResponse.ok) throw new Error('Some workspace data could not be loaded. Try again.')
      const requestPage = await requestResponse.json() as { content?: Array<{ id: string; requestNumber: string; serviceName: string; status: string; createdAt: string; description: string; requesterId?: string; requestedForId?: string; approverId?: string }> }
      const approvalData = await approvalResponse.json() as Array<{ id: string; requestId: string; requestNumber: string; serviceName: string; requesterId: string; createdAt: string; decision: string }>
      const incidentData = await incidentResponse.json() as IncidentRecord[]
      if (problemResponse.ok) {
        const problemData = await problemResponse.json() as ProblemRecord[]
        setProblems(problemData)
      }
      void apiFetch('/api/changes/dashboard/summary').then(async (res) => {
        if (res.ok) {
          const stats = await res.json()
          setChangesCount(stats.totalChanges ?? 0)
        }
      }).catch(() => {})
      setRequests((requestPage.content ?? []).map((r) => ({ backendId: r.id, id: r.requestNumber, title: r.serviceName, category: 'Service request', status: r.status.replaceAll('_', ' '), date: new Date(r.createdAt).toLocaleDateString(), createdAt: r.createdAt, color: 'amber', description: r.description, requesterId: r.requesterId, requestedForId: r.requestedForId, approverId: r.approverId })))
      setApprovals(approvalData.filter((a) => a.decision === 'PENDING').map((a) => ({ id: a.id, requestId: a.requestId, requestNumber: a.requestNumber, title: a.serviceName, employee: a.requesterId, initials: a.requesterId.slice(0, 2).toUpperCase(), requested: new Date(a.createdAt).toLocaleDateString() })))
      setIncidentRows(incidentData)
    } catch (cause) { setWorkspaceError(cause instanceof Error ? cause.message : 'Workspace data could not be loaded.') }
    finally { setWorkspaceLoading(false) }
  }
  useEffect(() => {
    if (!user) return
    void loadWorkspace()
    const timer = window.setInterval(() => {
      Promise.all([
        apiFetch('/api/requests?page=0&size=50'),
        apiFetch('/api/approvals/pending'),
        apiFetch('/api/incidents'),
        apiFetch('/api/problems'),
      ]).then(async ([requestResponse, approvalResponse, incidentResponse, problemResponse]) => {
        if (requestResponse.ok && approvalResponse.ok && incidentResponse.ok) {
          const requestPage = await requestResponse.json() as { content?: Array<{ id: string; requestNumber: string; serviceName: string; status: string; createdAt: string; description: string; requesterId?: string; requestedForId?: string; approverId?: string }> }
          const approvalData = await approvalResponse.json() as Array<{ id: string; requestId: string; requestNumber: string; serviceName: string; requesterId: string; createdAt: string; decision: string }>
          const incidentData = await incidentResponse.json() as IncidentRecord[]
          if (problemResponse.ok) {
            const problemData = await problemResponse.json() as ProblemRecord[]
            setProblems(problemData)
          }
          setRequests((requestPage.content ?? []).map((r) => ({ backendId: r.id, id: r.requestNumber, title: r.serviceName, category: 'Service request', status: r.status.replaceAll('_', ' '), date: new Date(r.createdAt).toLocaleDateString(), createdAt: r.createdAt, color: 'amber', description: r.description, requesterId: r.requesterId, requestedForId: r.requestedForId, approverId: r.approverId })))
          setApprovals(approvalData.filter((a) => a.decision === 'PENDING').map((a) => ({ id: a.id, requestId: a.requestId, requestNumber: a.requestNumber, title: a.serviceName, employee: a.requesterId, initials: a.requesterId.slice(0, 2).toUpperCase(), requested: new Date(a.createdAt).toLocaleDateString() })))
          setIncidentRows(incidentData)
        }
      }).catch(() => undefined)
    }, 5000)
    return () => window.clearInterval(timer)
  }, [user?.id, apiFetch])
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
  const firstName = user?.fullName.split(/\s+/)[0] ?? 'there'
  const initials = user?.fullName.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase() ?? 'N'
  const title = selectedService ? selectedService : active === 'Overview' ? `Good morning, ${firstName}` : active
  const todayLabel = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date()).toUpperCase()

  useEffect(() => {
    if (!user) return
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 15000)
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

  /**
   * Submits a validated service catalog request to the Request Service (POST /api/requests).
   * - Validates static and conditional required fields.
   * - Requires selecting an active manager/administrator approver.
   * - Generates an Idempotency-Key header to prevent duplicate submissions on retry.
   * - On success, generates a receipt view and updates local request state.
   */
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
      const requestNumber = result.requestNumber || requestFields.requestNumber || `NSR-${dateValue.toISOString().slice(0, 10).replace(/-/g, '')}-${(result.id || crypto.randomUUID()).replace(/-/g, '').slice(0, 8).toUpperCase()}`
      const status = result.status.replaceAll('_', ' ')
      setRequests((current) => [{ id: requestNumber, backendId: result.id, title: service, category: 'New request', status, date, color: 'amber', description: details.replace(/\n/g, ' · '), requesterId: user?.id, requestedForId: user?.id, approverId: requestFields.approverId }, ...current])
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

  /**
   * Decides an approval request via POST /api/approvals/{id}/approve or /reject.
   * Enforces a mandatory explanation comment if the action is a rejection.
   */
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

  /**
   * Opens the dynamic service request form for a selected catalog item.
   * Retrieves the next available request ticket number from GET /api/requests/next-number.
   */
  async function openServiceForm(serviceTitle: string) {
    let nextNum = 'REQ' + String(10001 + requests.length).padStart(7, '0')
    try {
      const res = await apiFetch('/api/requests/next-number')
      if (res.ok) {
        const data = await res.json() as { number?: string }
        if (data.number) nextNum = data.number
      }
    } catch {}
    setRequestFields({ requestNumber: nextNum })
    setSelectedService(serviceTitle)
  }

  /**
   * Initializes and opens the incident reporting form modal.
   * Pre-fetches the next incident ticket number (GET /api/incidents/next-number)
   * and calculates initial priority based on the ITIL impact/urgency matrix.
   */
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

  /**
   * Submits a new incident report to the Incident Service (POST /api/incidents).
   * Bundles attached file metadata and internal work notes into the description.
   * 
   * @param stayOnForm If true, keeps the user on the detail view after creation.
   */
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

  /**
   * Retrieves full details and audit history for a request (GET /api/requests/{id} & /history),
   * sets the active view to 'Request Detail', and updates the browser route.
   */
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

  /**
   * Retrieves incident details and comments from GET /api/incidents/{id},
   * transitions view to 'Incident Detail', and updates the browser route.
   */
  async function openIncident(id: string) {
    try {
      const response = await apiFetch(`/api/incidents/${id}`)
      if (!response.ok) throw new Error('Incident details could not be loaded.')
      setIncidentDetail(await response.json() as IncidentDetailRecord); setActive('Incident Detail'); navigate(`/incidents/${id}`)
    } catch (cause) { setToast(cause instanceof Error ? cause.message : 'Incident details could not be loaded.'); window.setTimeout(() => setToast(''),5000) }
  }

  /**
   * Adds an internal comment or public work note to the active incident (POST /api/incidents/{id}/comments).
   */
  async function addIncidentComment() {
    if (!incidentDetail || !incidentComment.trim()) return
    const response = await apiFetch(`/api/incidents/${incidentDetail.incident.id}/comments`,{method:'POST',body:JSON.stringify({comment:incidentComment})})
    if (!response.ok) { setToast('Comment could not be saved.'); return }
    setIncidentComment(''); await openIncident(incidentDetail.incident.id)
  }

  /**
   * Updates an incident's lifecycle status (PATCH /api/incidents/{id}/status) (Manager/Admin only).
   */
  async function updateIncidentStatus(status: string) {
    if (!incidentDetail) return
    const response = await apiFetch(`/api/incidents/${incidentDetail.incident.id}/status`,{method:'PATCH',body:JSON.stringify({status})})
    if (!response.ok) { setToast('Incident status could not be updated.'); return }
    await openIncident(incidentDetail.incident.id); await loadWorkspace()
  }

  return <Box className="app-shell">
    <Box component="aside" className="sidebar">
      <Box className="brand">
        <Box
          className="brand-mark"
          sx={{
            background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 50%, #0369a1 100%)',
            boxShadow: '0 4px 12px rgba(2, 132, 199, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: '5px',
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L20.66 7V17L12 22L3.34 17V7L12 2Z" stroke="#ffffff" strokeWidth="2" strokeLinejoin="round" />
            <path d="M12 12L12 22M12 12L20.66 7M12 12L3.34 7" stroke="#bae6fd" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="12" r="2.5" fill="#ffffff" />
            <circle cx="12" cy="4" r="1.5" fill="#bae6fd" />
            <circle cx="19" cy="16" r="1.5" fill="#bae6fd" />
            <circle cx="5" cy="16" r="1.5" fill="#bae6fd" />
          </svg>
        </Box>
        <Box>
          <Typography className="brand-name">ITSM</Typography>
          <Typography className="brand-caption">SERVICE HUB</Typography>
        </Box>
      </Box>
      <Box className="workspace-label">WORKSPACE</Box>
      <List className="nav-list" disablePadding>
        {(isManagerAdmin
          ? [
              { label: 'Admin dashboard', icon: <AnalyticsRounded /> },
              { label: 'Service catalog', icon: <SearchRounded /> },
              { label: 'Requests', icon: <ReceiptLongRounded /> },
            ]
          : employeeNav
        ).map((item) => <ListItemButton key={item.label} selected={active === item.label || (isManagerAdmin && item.label === 'Admin dashboard' && active === 'Overview')} onClick={() => { setSelectedService(null); setRequestFields({}); setActive(item.label) }} className="nav-item">
          <ListItemIcon>{item.icon}</ListItemIcon><ListItemText primary={item.label} />
        </ListItemButton>)}
        <ListItemButton selected={active === incidentNav.label} onClick={() => { setSelectedService(null); setActive(incidentNav.label) }} className="nav-item"><ListItemIcon>{incidentNav.icon}</ListItemIcon><ListItemText primary={incidentNav.label} /></ListItemButton>
        <ListItemButton selected={active === problemNav.label} onClick={() => { setSelectedService(null); setActive(problemNav.label) }} className="nav-item"><ListItemIcon>{problemNav.icon}</ListItemIcon><ListItemText primary={problemNav.label} /></ListItemButton>
        <ListItemButton selected={active === changeNav.label} onClick={() => { setSelectedService(null); setActive(changeNav.label) }} className="nav-item"><ListItemIcon>{changeNav.icon}</ListItemIcon><ListItemText primary={changeNav.label} /></ListItemButton>
      </List>
      {isManagerAdmin && <><Box className="workspace-label management-label">MANAGEMENT</Box><List className="nav-list" disablePadding>
        {[
          { label: 'Approvals', icon: <TaskAltRounded /> },
          { label: 'User access', icon: <ManageAccountsRounded /> },
        ].map((item) => <ListItemButton key={item.label} selected={active === item.label} onClick={() => { setSelectedService(null); setRequestFields({}); setActive(item.label) }} className="nav-item">
          <ListItemIcon>{item.icon}</ListItemIcon><ListItemText primary={item.label} />
        </ListItemButton>)}
      </List></>}
      <Box className="sidebar-bottom"><Divider /><ListItemButton onClick={() => { setSelectedService(null); setRequestFields({}); setActive('Settings') }} className="nav-item settings-item"><ListItemIcon><SettingsOutlined /></ListItemIcon><ListItemText primary="Settings" /></ListItemButton>
        <Box className="profile">
          <Avatar className="profile-avatar">{initials}</Avatar>
          <Box sx={{ minWidth: 0, flex: 1, overflow: 'hidden', mr: 0.5 }}>
            <Typography className="profile-name" title={user.fullName} sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.fullName}
            </Typography>
            <Typography className="profile-role" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.role === 'MANAGER_ADMIN' ? 'Manager + Administrator' : 'Employee'}
            </Typography>
          </Box>
          <IconButton
            aria-label="Sign out"
            size="small"
            title="Sign out"
            onClick={logout}
            sx={{ flexShrink: 0, color: '#64748b', p: 0.5, '&:hover': { color: '#ef4444', bgcolor: '#fee2e2' } }}
          >
            <LogoutRounded fontSize="small" />
          </IconButton>
        </Box>
      </Box>
    </Box>

    <Box className="main-column">
      <AppBar position="static" elevation={0} color="transparent" className="topbar"><Toolbar className="topbar-inner">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<ArrowBackRounded sx={{ fontSize: 16 }} />}
            onClick={handleGlobalBack}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              fontSize: 12,
              borderColor: '#cbd5e1',
              color: '#334155',
              bgcolor: '#ffffff',
              px: 1.25,
              py: 0.35,
              minHeight: 28,
              borderRadius: 1,
              boxShadow: 'none',
              '&:hover': { bgcolor: '#f8fafc', borderColor: '#94a3b8' },
            }}
          >
            Back
          </Button>
          <Typography className="crumb">Workspace <span>/</span> {active}</Typography>
        </Box>
        <Box className="topbar-actions"><TextField inputRef={searchRef} size="small" placeholder="Search services" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { setSelectedService(null); setRequestFields({}); setActive('Service catalog') } }} className="search-field" slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRounded fontSize="small" /></InputAdornment>, endAdornment: <InputAdornment position="end"><IconButton aria-label="Search services" size="small" onClick={() => { setSelectedService(null); setRequestFields({}); setActive('Service catalog') }}><SearchRounded fontSize="small" /></IconButton><kbd>Ctrl K</kbd></InputAdornment> } }} />
          <IconButton aria-label="Notifications" className="notification-button" onClick={(event) => setNotificationsAnchor(event.currentTarget)}>
            <Badge color="error" badgeContent={unreadCount} max={99}>
              <NotificationsNoneRounded />
            </Badge>
          </IconButton>
          <IconButton aria-label="Open account menu" onClick={(event) => setProfileAnchor(event.currentTarget)} sx={{ p: 0 }}><Avatar className="top-avatar">{initials}</Avatar></IconButton>
          <Menu
            anchorEl={notificationsAnchor}
            open={Boolean(notificationsAnchor)}
            onClose={() => setNotificationsAnchor(null)}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            slotProps={{
              paper: {
                sx: {
                  width: { xs: 320, sm: 410 },
                  maxWidth: '96vw',
                  maxHeight: 520,
                  borderRadius: 2.5,
                  boxShadow: '0 16px 36px rgba(15, 23, 42, 0.16), 0 0 0 1px rgba(15, 23, 42, 0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  p: 0,
                },
              },
            }}
          >
            <Box sx={{ p: 2, pb: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography sx={{ fontWeight: 800, fontSize: 15, color: '#0f172a' }}>
                  Notifications
                </Typography>
                {unreadCount > 0 ? (
                  <Chip label={`${unreadCount} new`} size="small" color="primary" sx={{ height: 20, fontSize: 11, fontWeight: 700 }} />
                ) : (
                  <Chip label="All caught up" size="small" sx={{ height: 20, fontSize: 10, fontWeight: 600, bgcolor: '#f1f5f9' }} />
                )}
              </Box>

              {unreadCount > 0 && (
                <Button
                  size="small"
                  startIcon={<DoneAllRounded sx={{ fontSize: 15 }} />}
                  onClick={markAllNotificationsRead}
                  sx={{ textTransform: 'none', fontSize: 11, fontWeight: 600, p: 0.5, minWidth: 'auto', color: '#0284c7' }}
                >
                  Mark all read
                </Button>
              )}
            </Box>

            <Box sx={{ px: 2, py: 1, bgcolor: '#f8fafc', display: 'flex', gap: 0.75, borderBottom: '1px solid #f1f5f9', overflowX: 'auto' }}>
              {(['all', 'requests', 'incidents', 'approvals'] as const).map((tab) => {
                const count = tab === 'all'
                  ? notificationsList.length
                  : notificationsList.filter((n) => n.type === (tab === 'approvals' ? 'approval' : tab === 'requests' ? 'request' : 'incident')).length
                if (tab === 'approvals' && count === 0 && !isManagerAdmin) return null
                return (
                  <Chip
                    key={tab}
                    size="small"
                    clickable
                    label={`${tab.charAt(0).toUpperCase() + tab.slice(1)} (${count})`}
                    variant={notifFilter === tab ? 'filled' : 'outlined'}
                    color={notifFilter === tab ? 'primary' : 'default'}
                    onClick={() => setNotifFilter(tab)}
                    sx={{
                      fontSize: 11,
                      fontWeight: notifFilter === tab ? 700 : 500,
                      height: 24,
                      bgcolor: notifFilter === tab ? '#0284c7' : '#ffffff',
                    }}
                  />
                )
              })}
            </Box>

            <Box sx={{ overflowY: 'auto', flex: 1, maxHeight: 360 }}>
              {(() => {
                const filtered = notifFilter === 'all'
                  ? notificationsList
                  : notificationsList.filter((n) => n.type === (notifFilter === 'approvals' ? 'approval' : notifFilter === 'requests' ? 'request' : 'incident'))

                if (filtered.length === 0) {
                  return (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                      <CheckCircleOutlineRounded sx={{ fontSize: 38, color: '#10b981', mb: 1, opacity: 0.8 }} />
                      <Typography sx={{ fontWeight: 700, fontSize: 13, color: '#1e293b' }}>
                        No notifications in this view
                      </Typography>
                      <Typography sx={{ fontSize: 11, color: '#64748b', mt: 0.5 }}>
                        Ticket updates and approval events will appear here in real-time.
                      </Typography>
                    </Box>
                  )
                }

                return filtered.map((notif) => {
                  const isRead = readNotifIds.includes(notif.id)
                  const statusUpper = notif.status.toUpperCase()

                  let statusColor: 'success' | 'error' | 'warning' | 'info' | 'default' = 'info'
                  let StatusIcon = HelpOutlineRounded
                  let borderColor = '#94a3b8'

                  if (statusUpper.includes('APPROV') || statusUpper.includes('RESOLV') || statusUpper.includes('CLOSE') || statusUpper.includes('COMPLETE')) {
                    statusColor = 'success'
                    StatusIcon = CheckCircleOutlineRounded
                    borderColor = '#10b981'
                  } else if (statusUpper.includes('REJECT') || statusUpper.includes('CANCEL')) {
                    statusColor = 'error'
                    StatusIcon = ErrorOutlineRounded
                    borderColor = '#ef4444'
                  } else if (statusUpper.includes('PEND') || statusUpper.includes('FAIL') || statusUpper.includes('WAIT')) {
                    statusColor = 'warning'
                    StatusIcon = HourglassEmptyRounded
                    borderColor = '#f59e0b'
                  } else {
                    statusColor = 'info'
                    StatusIcon = SupportAgentRounded
                    borderColor = '#0284c7'
                  }

                  return (
                    <Box
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      sx={{
                        p: 1.5,
                        px: 2,
                        cursor: 'pointer',
                        bgcolor: isRead ? '#ffffff' : '#f0f9ff',
                        borderLeft: `3px solid ${borderColor}`,
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'all 0.15s ease',
                        '&:hover': {
                          bgcolor: isRead ? '#f8fafc' : '#e0f2fe',
                        },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                          <StatusIcon sx={{ fontSize: 15, color: borderColor }} />
                          <Typography sx={{ fontSize: 10, fontWeight: 800, color: borderColor, letterSpacing: 0.5 }}>
                            {notif.type.toUpperCase()}
                          </Typography>
                          <Typography sx={{ fontSize: 10, color: '#94a3b8' }}>·</Typography>
                          <Typography sx={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>
                            {notif.ticketNumber}
                          </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                          <Typography sx={{ fontSize: 10, color: '#64748b', whiteSpace: 'nowrap' }}>
                            {formatRelativeTime(notif.timestamp)}
                          </Typography>
                          {!isRead && (
                            <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#0284c7' }} />
                          )}
                        </Box>
                      </Box>

                      <Typography sx={{ fontWeight: isRead ? 600 : 700, fontSize: 12.5, color: '#0f172a', mt: 0.5, lineHeight: 1.35 }}>
                        {notif.title}
                      </Typography>

                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                        <Chip
                          label={notif.status}
                          size="small"
                          color={statusColor}
                          variant="outlined"
                          sx={{ height: 19, fontSize: 9.5, fontWeight: 700, px: 0.25 }}
                        />
                        <Typography sx={{ fontSize: 11, color: '#0284c7', fontWeight: 600 }}>
                          View details →
                        </Typography>
                      </Box>
                    </Box>
                  )
                })
              })()}
            </Box>

            <Box sx={{ p: 1.25, px: 2, bgcolor: '#f8fafc', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Button
                size="small"
                onClick={() => { setNotificationsAnchor(null); setActive('Requests') }}
                sx={{ textTransform: 'none', fontSize: 11, fontWeight: 600, color: '#475569', p: 0 }}
              >
                All requests
              </Button>
              <Button
                size="small"
                onClick={() => { setNotificationsAnchor(null); setActive('Incidents') }}
                sx={{ textTransform: 'none', fontSize: 11, fontWeight: 600, color: '#475569', p: 0 }}
              >
                All incidents
              </Button>
            </Box>
          </Menu>
          <Menu anchorEl={profileAnchor} open={Boolean(profileAnchor)} onClose={() => setProfileAnchor(null)}><Box sx={{ px: 2, py: 1.25 }}><Typography sx={{ fontWeight: 700, fontSize: 13 }}>{user.fullName}</Typography><Typography color="text.secondary" sx={{ fontSize: 11 }}>@{user.username || user.email.split('@')[0]} · {user.employeeId || 'EMP-ADMIN'} · {user.email}</Typography><Typography color="text.secondary" sx={{ fontSize: 10, mt: .5 }}>{isManagerAdmin ? 'Manager + Administrator' : 'Employee'}</Typography></Box><Divider />{isManagerAdmin && !isImpersonating && <MenuItem onClick={() => { setProfileAnchor(null); setImpersonationUserId(''); setImpersonationOpen(true) }}>Test as user</MenuItem>}<MenuItem onClick={() => { setProfileAnchor(null); setSelectedService(null); setRequestFields({}); setActive('Settings') }}>Account settings</MenuItem><MenuItem onClick={() => { setProfileAnchor(null); logout() }}>Sign out</MenuItem></Menu>
        </Box>
      </Toolbar></AppBar>

      <Box component="main" className="page-content">
        {isImpersonating && <Alert severity="warning" sx={{ mb: 2 }} action={<Button color="inherit" size="small" onClick={() => { stopImpersonating(); setActive('Overview') }}>Stop testing</Button>}>Testing as <strong>{user.fullName}</strong> ({user.email}). Actions you take will be saved to this user’s account.</Alert>}
        <Dialog open={impersonationOpen} onClose={() => !impersonationBusy && setImpersonationOpen(false)} fullWidth maxWidth="sm">
          <DialogTitle>Test as a user</DialogTitle>
          <DialogContent><Typography color="text.secondary" sx={{ mb: 2 }}>Choose an active account with assigned portal access. This uses that user’s permissions and saves any actions to their account.</Typography><FormControl fullWidth><InputLabel id="impersonation-user-label">User account</InputLabel><Select labelId="impersonation-user-label" label="User account" value={impersonationUserId} onChange={(event) => setImpersonationUserId(event.target.value)}>{impersonationUsers.map((candidate) => <MenuItem key={candidate.id} value={candidate.id}>{candidate.fullName} (@{candidate.username || candidate.email.split('@')[0]}) · {candidate.email} ({candidate.role === 'MANAGER_ADMIN' ? 'Manager + Administrator' : 'Employee'})</MenuItem>)}</Select></FormControl>{impersonationUsers.length === 0 && <Typography color="text.secondary" sx={{ mt: 1 }}>No other active accounts with assigned access are available.</Typography>}</DialogContent>
          <DialogActions><Button disabled={impersonationBusy} onClick={() => setImpersonationOpen(false)}>Cancel</Button><Button variant="contained" disabled={impersonationBusy || !impersonationUserId} onClick={() => { setImpersonationBusy(true); void impersonate(impersonationUserId).then(() => { setImpersonationOpen(false); setActive('Overview') }).catch((cause) => setToast(cause instanceof Error ? cause.message : 'Could not start user testing.')).finally(() => setImpersonationBusy(false)) }}>{impersonationBusy ? 'Starting…' : 'Start testing'}</Button></DialogActions>
        </Dialog>
        {active !== 'Admin dashboard' && (!isManagerAdmin || (active !== 'Overview' && active !== 'Dashboard')) && (
          <Box className="page-heading">
            <Box>
              <Typography className="eyebrow">{selectedService ? 'SERVICE REQUEST' : todayLabel}</Typography>
              <Typography variant="h4" className="page-title">{title}</Typography>
              <Typography className="page-subtitle">{selectedService ? 'Complete the details below so the right team can handle your request.' : active === 'Overview' ? 'Your internal banking services, requests, and approvals.' : `Manage your ${active.toLowerCase()} in one place.`}</Typography>
            </Box>
            {!selectedService && !['User access', 'Approvals', 'Incidents', 'Settings'].includes(active) && (
              <Button variant="contained" startIcon={<ControlPointRounded />} onClick={() => setActive('Service catalog')}>
                New request
              </Button>
            )}
          </Box>
        )}
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
        ) : active === 'Request Detail' && requestDetail ? (
          <RequestDetailReport
            request={requestDetail}
            history={requestHistory}
            requesterName={user?.id === requestDetail.requesterId ? user.fullName : impersonationUsers.find((candidate) => candidate.id === requestDetail.requesterId)?.fullName || requestDetail.requesterId}
            requestedForName={user?.id === requestDetail.requestedForId ? user.fullName : impersonationUsers.find((candidate) => candidate.id === requestDetail.requestedForId)?.fullName || requestDetail.requestedForId}
            approverName={approvers.find((candidate) => candidate.id === requestDetail.approverId)?.fullName}
            onBack={() => { setActive('Requests'); setRequestDetail(null) }}
            apiFetch={apiFetch}
            setToast={setToast}
            onRefreshWorkspace={loadWorkspace}
            onAddItem={() => setActive('Service catalog')}
          />
        ) : selectedService ? <ServiceRequestForm service={selectedService} values={requestFields} setValues={setRequestFields} approvers={approvers} approversLoading={approversLoading} busy={busy} onCancel={() => { setSelectedService(null); setRequestFields({}) }} onSubmit={() => void submitRequest(selectedService)} /> : active === 'Request receipt' && receipt ? <RequestReceipt receipt={receipt} onRequests={() => setActive('Requests')} onCatalog={() => setActive('Service catalog')} /> : active === 'Settings' ? <PasswordSettings onNavigate={(page) => setActive(page)} setToast={setToast} /> : active === 'User access' && isManagerAdmin ? <UserAccessPage /> : (active === 'Admin dashboard' || (isManagerAdmin && (active === 'Overview' || active === 'Dashboard'))) ? <SharedAdminDashboard requestsCount={requests.length} pendingApprovalsCount={approvals.length} openIncidentsCount={incidentRows.filter((i) => !['RESOLVED','CLOSED'].includes(i.status)).length} p1IncidentsCount={incidentRows.filter((i) => i.priority?.includes('1') || i.priority?.toLowerCase().includes('critical')).length} problemsCount={problems.filter((p) => !['RESOLVED', 'CLOSED'].includes(p.status?.toUpperCase() || '')).length} changesCount={changesCount} incidentsList={incidentRows.filter((i) => !['RESOLVED','CLOSED'].includes(i.status))} requestsList={requests} onNavigate={(page) => setActive(page)} onRefresh={loadWorkspace} onOpenIncident={openIncident} onOpenRequest={openRequest} onBack={handleGlobalBack} setToast={setToast} /> : active === 'Incidents' ? (
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
                                        void openServiceForm(result.title);
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
        ) : active === 'Problems' ? (
          <ProblemManagement
            problems={problems}
            loading={workspaceLoading}
            isManagerAdmin={isManagerAdmin}
            currentUserEmail={user?.email}
            onRefresh={loadWorkspace}
            apiFetch={apiFetch}
            setToast={setToast}
            initialSelectedProblem={selectedProblem}
          />
        ) : active === 'Changes' ? (
          <ChangeManagement
            isManagerAdmin={isManagerAdmin}
            currentUserEmail={user?.email}
            currentUserName={user?.fullName}
            apiFetch={apiFetch}
            setToast={setToast}
          />
        ) : active === 'Service catalog' ? <>
          <Paper className="catalog-banner"><Box><Typography className="banner-kicker">SERVICE CATALOG</Typography><Typography variant="h5" className="banner-title">How can we help?</Typography><Typography className="banner-copy">Find the right service and we’ll take it from there.</Typography></Box><SupportAgentRounded className="banner-art" /></Paper>
          <Box className="catalog-toolbar"><Box><Typography variant="h6">Browse by team</Typography><Typography className="section-note">Choose a team to narrow the service list.</Typography></Box><Box className="catalog-filters">{['All teams', 'IT', 'Facilities', 'HR'].map((team) => <Chip key={team} label={team} clickable color={catalogFilter === team ? 'primary' : 'default'} variant={catalogFilter === team ? 'filled' : 'outlined'} onClick={() => setCatalogFilter(team)} />)}</Box></Box>
          {!liveCatalog.length && <Alert severity="warning" sx={{ mb: 2 }}>The live catalog is unavailable. These sample services can be used for local requests.</Alert>}<Box className="section-heading catalog-list-heading"><Box><Typography variant="h6">Available services</Typography><Typography className="section-note">{displayedCatalog.length} {displayedCatalog.length === 1 ? 'service' : 'services'} match your selection.</Typography></Box><Chip label={liveCatalog.length ? (catalogStale ? 'Last known data' : 'ServiceNow catalog') : 'Sample catalog'} variant="outlined" /></Box>
          <Box className="service-grid">{displayedCatalog.map((service, index) => <ButtonBase component={Paper} key={`${service.title}-${index}`} className="service-card" aria-label={`Start request: ${service.title}`} onClick={() => void openServiceForm(service.title)}><Box className={`service-icon ${service.tint}`}>{service.icon}</Box><Chip size="small" label={service.group} className="group-chip" /><Typography className="service-title">{service.title}</Typography><Typography className="service-description">{service.description}</Typography><Box className="service-action">Start a request <KeyboardArrowRightRounded /></Box></ButtonBase>)}</Box>
        </> : (active === 'Requests' || active === 'My requests') ? <>
          {isManagerAdmin ? (
            <Paper className="content-card"><Box className="section-heading in-card"><Box><Typography variant="h6">Request queue</Typography><Typography className="section-note">Review requests from employees or start a new request from the service catalog.</Typography></Box><Button variant="contained" startIcon={<ControlPointRounded />} onClick={() => setActive('Service catalog')}>Add new request</Button></Box>
              <RequestTable requests={requests} onOpen={openRequest} />
            </Paper>
          ) : (
            <Paper className="content-card"><Box className="section-heading in-card"><Box><Typography variant="h6">Your requests</Typography><Typography className="section-note">Requests are saved to your account and remain here after you sign out.</Typography></Box><Button variant="outlined" startIcon={<ControlPointRounded />} onClick={() => setActive('Service catalog')}>New request</Button></Box><RequestTable requests={requests} onOpen={openRequest} /></Paper>
          )}
        </> : active === 'Approvals' ? <>
          <Paper className="content-card"><Box className="section-heading in-card"><Box><Typography variant="h6">Approval queue</Typography><Typography className="section-note">Only the employee selected as approver can decide.</Typography></Box><Chip size="small" label={`${approvals.length} pending`} color="warning" variant="outlined" /></Box>
            <ApprovalQueue approvals={approvals} onApprove={(id) => void decideApproval(id,true)} onReject={(id) => void decideApproval(id,false)} />
          </Paper>
        </> : active === 'Overview' ? <>
          <Paper className="overview-welcome">
            <Box className="overview-copy"><Typography className="overview-kicker">ITSM · EMPLOYEE WORKSPACE</Typography><Typography variant="h5">Your work, supported.</Typography><Typography>Request the tools, access, and workplace help you need from one secure service hub.</Typography><Button variant="contained" endIcon={<KeyboardArrowRightRounded />} onClick={() => setActive('Service catalog')}>Explore services</Button></Box>
            <Box className="overview-side"><Box className="overview-mark"><SupportAgentRounded /></Box><Typography className="overview-side-label">YOUR WORKSPACE</Typography><Typography className="overview-side-value">{isManagerAdmin ? 'Manager + Administrator' : 'Employee'}</Typography><Typography className="overview-side-note">{user.department?.replaceAll('_', ' ') || 'Department not set'}</Typography></Box>
          </Paper>
          <Box className="stat-grid">
            <StatCard label="Requests" value={String(requests.length)} delta="Saved for your account" icon={<ReceiptLongRounded />} tint="tint-blue" />
            <StatCard label="Pending approvals" value={String(approvals.length)} delta="Assigned to your account" icon={<TaskAltRounded />} tint="tint-orange" />
            <StatCard label="Active incidents" value={String(incidentRows.filter((i) => !['RESOLVED','CLOSED'].includes(i.status)).length)} delta="Operational issues" icon={<SupportAgentRounded />} tint="tint-green" />
          </Box>
          <Box className="dashboard-grid"><Paper className="content-card requests-card"><Box className="section-heading in-card"><Box><Typography variant="h6">Recent requests</Typography><Typography className="section-note">Requests submitted during this session</Typography></Box><Button endIcon={<KeyboardArrowRightRounded />} onClick={() => setActive('Requests')}>View all</Button></Box><RequestTable requests={requests.slice(0, 3)} compact /></Paper>
            {user.role === 'MANAGER_ADMIN' && <Paper className="content-card approval-card"><Box className="section-heading in-card"><Box><Typography variant="h6">Needs your attention</Typography><Typography className="section-note">Requests awaiting your approval</Typography></Box><Chip size="small" label={`${approvals.length} pending`} color="warning" variant="outlined" /></Box>{approvals.slice(0,3).map((approval) => <Box className="approval-item" key={approval.id}><Typography className="approval-title">{approval.requestNumber} · {approval.title}</Typography><Button size="small" onClick={() => setActive('Approvals')}>Review</Button></Box>)}{approvals.length === 0 && <Typography color="text.secondary" sx={{ py: 2 }}>No pending approvals.</Typography>}</Paper>}
          </Box>
          <Box className="section-heading catalog-heading">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box>
                <Typography variant="h6">Quick access</Typography>
                <Typography className="section-note">Start with one of the most requested services.</Typography>
              </Box>
              <Chip size="small" label={liveCatalog.length ? (catalogStale ? 'Last known data' : 'ServiceNow catalog') : 'Sample catalog'} variant="outlined" color={liveCatalog.length ? 'success' : 'default'} />
            </Box>
            <Button endIcon={<KeyboardArrowRightRounded />} onClick={() => setActive('Service catalog')}>Browse catalog</Button>
          </Box>
          <Box className="service-grid quick-grid">
            {(displayedCatalog.length ? displayedCatalog : services).slice(0, 4).map((service, index) => (
              <ButtonBase component={Paper} key={`${service.title}-${index}`} className="service-card quick-card" aria-label={`Start request: ${service.title}`} onClick={() => void openServiceForm(service.title)}>
                <Box className={`service-icon ${service.tint}`}>{service.icon}</Box>
                <Chip size="small" label={service.group} className="group-chip" />
                <Typography className="service-title">{service.title}</Typography>
                <Typography className="service-description">{service.description}</Typography>
                <Box className="service-action">Get started <KeyboardArrowRightRounded /></Box>
              </ButtonBase>
            ))}
          </Box>
        </> : <Paper className="content-card placeholder"><Box className="placeholder-icon">{employeeNav.concat(managementNav).find((item) => item.label === active)?.icon ?? <SettingsOutlined />}</Box><Typography variant="h6">{active}</Typography><Typography className="section-note">This workspace is ready for the next feature in the service portal.</Typography><Button variant="outlined" onClick={() => setActive('Overview')}>Back to overview</Button></Paper>}
        </Box>
        <Box className="footer"><span>ITSM · Internal Service Hub</span><span>Need help? Contact your service desk</span></Box>
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

function RequestDetailReport({
  request,
  history,
  requesterName,
  requestedForName,
  approverName,
  onBack,
  apiFetch,
  setToast,
  onRefreshWorkspace,
  onAddItem,
}: {
  request: RequestDetail
  history: RequestHistoryRow[]
  requesterName: string
  requestedForName: string
  approverName?: string
  onBack: () => void
  apiFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
  setToast: (msg: string) => void
  onRefreshWorkspace: () => Promise<void>
  onAddItem: () => void
}) {
  const displayReqNumber = request.requestNumber?.replace(/^NSR-\d{8}-([A-F0-9]{4}).*$/i, 'REQ00000$1') || request.requestNumber || 'REQ0000025'
  const resolvedApproverName = approverName || request.description.match(/^Requested approver:\s*(.+)$/m)?.[1]?.trim() || request.approverId || 'Northstar Administrator'

  const getItemPrice = (itemName: string): number => {
    const lower = itemName.toLowerCase()
    if (lower.includes('iphone') || lower.includes('phone') || lower.includes('mobile')) return 799.99
    if (lower.includes('asus') || lower.includes('desktop') || lower.includes('computer')) return 949.99
    if (lower.includes('laptop') || lower.includes('macbook')) return 839.99
    if (lower.includes('monitor')) return 349.99
    if (lower.includes('dock') || lower.includes('station')) return 199.99
    if (lower.includes('headset') || lower.includes('keyboard')) return 89.99
    if (lower.includes('access') || lower.includes('account') || lower.includes('support')) return 0.00
    return 839.99
  }

  const primaryItemName = request.fields?.item || request.fields?.application || request.fields?.requestType || request.fields?.topic || request.serviceName || 'Standard Service Item'
  const initialPrice = getItemPrice(primaryItemName)

  const [items, setItems] = useState<Array<{
    id: string
    number: string
    quantity: number
    catalog: string
    item: string
    dueDate: string
    price: number
    assignedTo: string
    stage: 'approved' | 'fulfillment' | 'delivery' | 'completed' | 'cancelled'
  }>>(() => {
    const rawDue = request.fields?.neededBy ? `${request.fields.neededBy} 18:00:00` : new Date(new Date(request.createdAt).getTime() + 2 * 86400000).toISOString().slice(0, 19).replace('T', ' ')
    const stage: 'approved' | 'fulfillment' | 'delivery' | 'completed' | 'cancelled' =
      request.status === 'COMPLETED' || request.status === 'FULFILLED' ? 'completed'
      : request.status === 'CANCELLED' || request.status === 'REJECTED' ? 'cancelled'
      : request.status === 'APPROVED' ? 'fulfillment'
      : 'approved'

    const list = [
      {
        id: '1',
        number: displayReqNumber.replace('REQ', 'RITM') + '46',
        quantity: 1,
        catalog: 'Service Catalog',
        item: primaryItemName,
        dueDate: rawDue,
        price: initialPrice,
        assignedTo: 'IT Support Desk',
        stage
      }
    ]
    if (primaryItemName.toLowerCase().includes('laptop') || primaryItemName.toLowerCase().includes('device')) {
      list.push({
        id: '2',
        number: displayReqNumber.replace('REQ', 'RITM') + '45',
        quantity: 1,
        catalog: 'Service Catalog',
        item: 'Apple iPhone 5',
        dueDate: rawDue,
        price: 799.99,
        assignedTo: 'Hardware Support',
        stage
      })
    }
    return list
  })

  const totalPrice = items.reduce((acc, it) => acc + it.price, 0)
  const formattedPrice = `$${totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const [activeTab, setActiveTab] = useState<'ritm' | 'approvers' | 'stream'>('ritm')
  const [requestState, setRequestState] = useState<string>(() => {
    if (request.status === 'APPROVED') return 'Approved'
    if (request.status === 'PENDING_APPROVAL') return 'Pending Approval'
    if (request.status === 'COMPLETED' || request.status === 'FULFILLED') return 'Closed Complete'
    if (request.status === 'CANCELLED') return 'Closed Cancelled'
    if (request.status === 'REJECTED') return 'Rejected'
    return request.status.replaceAll('_', ' ')
  })
  const [approvalState, setApprovalState] = useState<string>(() => {
    if (request.status === 'APPROVED') return 'Approved'
    if (request.status === 'REJECTED') return 'Rejected'
    return 'Requested'
  })

  const openedDate = new Date(request.createdAt).toISOString().slice(0, 19).replace('T', ' ')
  const [dueDate, setDueDate] = useState<string>(() => {
    return request.fields?.neededBy ? `${request.fields.neededBy} 18:00:00` : new Date(new Date(request.createdAt).getTime() + 2 * 86400000).toISOString().slice(0, 19).replace('T', ' ')
  })

  const [formMenuAnchor, setFormMenuAnchor] = useState<HTMLElement | null>(null)
  const [moreMenuAnchor, setMoreMenuAnchor] = useState<HTMLElement | null>(null)
  const [attachmentsOpen, setAttachmentsOpen] = useState(false)
  const [attachments, setAttachments] = useState<Array<{ name: string; size: string; date: string }>>([])
  const [streamDrawerOpen, setStreamDrawerOpen] = useState(false)
  const [workNotes, setWorkNotes] = useState<Array<{ author: string; time: string; note: string }>>([])
  const [currentWorkNote, setCurrentWorkNote] = useState('')
  const [addItemModalOpen, setAddItemModalOpen] = useState(false)
  const [newItemName, setNewItemName] = useState('Monitor 27 inch')
  const [newItemQty, setNewItemQty] = useState('1')
  const [busy, setBusy] = useState(false)

  const handleUpdate = async () => {
    setBusy(true)
    try {
      let targetStatus = request.status
      if (requestState === 'Approved') targetStatus = 'APPROVED'
      else if (requestState === 'Closed Complete') targetStatus = 'COMPLETED'
      else if (requestState === 'Closed Cancelled') targetStatus = 'CANCELLED'

      if (targetStatus !== request.status) {
        await apiFetch(`/api/requests/${request.id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: targetStatus })
        })
      }
      setToast(`Request ${displayReqNumber} updated successfully.`)
      await onRefreshWorkspace()
    } catch {
      setToast(`Request ${displayReqNumber} saved.`)
    } finally {
      setBusy(false)
      window.setTimeout(() => setToast(''), 5000)
    }
  }

  const handleCancelRequest = async () => {
    if (!window.confirm(`Are you sure you want to cancel request ${displayReqNumber}?`)) return
    setBusy(true)
    try {
      await apiFetch(`/api/requests/${request.id}/cancel`, { method: 'POST' })
      setRequestState('Closed Cancelled')
      setApprovalState('Rejected')
      setToast(`Request ${displayReqNumber} has been cancelled.`)
      await onRefreshWorkspace()
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Could not cancel request.')
    } finally {
      setBusy(false)
      window.setTimeout(() => setToast(''), 5000)
    }
  }

  const handleCopyNumber = () => {
    navigator.clipboard?.writeText(displayReqNumber)
    setToast(`Copied ${displayReqNumber} to clipboard.`)
    window.setTimeout(() => setToast(''), 5000)
    setFormMenuAnchor(null)
  }

  const handleAddNewItem = () => {
    const qty = parseInt(newItemQty, 10) || 1
    const price = getItemPrice(newItemName)
    const newRitm = {
      id: String(items.length + 1),
      number: displayReqNumber.replace('REQ', 'RITM') + String(44 - items.length),
      quantity: qty,
      catalog: 'Service Catalog',
      item: newItemName,
      dueDate,
      price: price * qty,
      assignedTo: 'IT Support Desk',
      stage: 'approved' as const
    }
    setItems((prev) => [...prev, newRitm])
    setAddItemModalOpen(false)
    setToast(`Added item ${newItemName} to ${displayReqNumber}. Total updated.`)
    window.setTimeout(() => setToast(''), 5000)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const files = Array.from(e.target.files).map((f) => ({
      name: f.name,
      size: `${Math.max(1, Math.round(f.size / 1024))} KB`,
      date: new Date().toLocaleTimeString()
    }))
    setAttachments((prev) => [...prev, ...files])
    setToast(`Attached ${files.length} file(s) to ${displayReqNumber}.`)
    window.setTimeout(() => setToast(''), 5000)
  }

  const addWorkNote = () => {
    if (!currentWorkNote.trim()) return
    setWorkNotes((prev) => [{ author: requesterName, time: new Date().toLocaleTimeString(), note: currentWorkNote.trim() }, ...prev])
    setCurrentWorkNote('')
    setToast('Internal work note added.')
    window.setTimeout(() => setToast(''), 5000)
  }

  return (
    <Box className="sn-form-container">
      {/* Top Header */}
      <Box className="sn-form-header">
        <Box className="sn-header-left">
          <IconButton size="small" onClick={onBack} title="Back to requests" sx={{ color: '#475569', p: 0.5 }}>
            <ArrowBackRounded fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            className="sn-menu-icon-btn"
            title="Form context menu"
            onClick={(e) => setFormMenuAnchor(e.currentTarget)}
          >
            <MenuRounded className="sn-menu-icon" />
          </IconButton>
          <Box>
            <Typography className="sn-title">Request</Typography>
            <Typography className="sn-subtitle">{displayReqNumber}</Typography>
          </Box>
        </Box>

        <Box className="sn-header-right">
          <IconButton size="small" title="Manage Attachments" onClick={() => setAttachmentsOpen(true)}>
            <Badge badgeContent={attachments.length} color="primary">
              <AttachFileRounded fontSize="small" />
            </Badge>
          </IconButton>
          <IconButton
            size="small"
            title="Activity Timeline"
            color={activeTab === 'stream' ? 'primary' : 'default'}
            onClick={() => setActiveTab(activeTab === 'stream' ? 'ritm' : 'stream')}
          >
            <TimelineRounded fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            title="Activity stream & Work notes"
            color={streamDrawerOpen ? 'warning' : 'default'}
            onClick={() => setStreamDrawerOpen(!streamDrawerOpen)}
          >
            <TuneRounded fontSize="small" />
          </IconButton>
          <IconButton size="small" title="More options" onClick={(e) => setMoreMenuAnchor(e.currentTarget)}>
            <MoreHorizRounded fontSize="small" />
          </IconButton>

          <Button className="sn-req-action-btn" disabled={busy} onClick={handleUpdate}>
            Update
          </Button>
          <Button className="sn-req-action-btn" onClick={() => setAddItemModalOpen(true)}>
            Add New Item
          </Button>
          <Button className="sn-req-action-btn" onClick={handleCancelRequest}>
            Cancel Request
          </Button>
          <Button className="sn-req-action-btn" onClick={handleCopyNumber}>
            Copy
          </Button>
          <Button className="sn-req-action-btn sn-req-action-danger" onClick={() => { if (window.confirm(`Delete request ${displayReqNumber}?`)) { setToast(`Request ${displayReqNumber} deleted.`); onBack(); } }}>
            Delete
          </Button>
          <IconButton size="small" title="Previous Record" onClick={onBack} sx={{ color: '#64748b', p: 0.5 }}>
            <ArrowUpwardRounded fontSize="small" />
          </IconButton>
          <IconButton size="small" title="Next Record" onClick={onBack} sx={{ color: '#64748b', p: 0.5 }}>
            <ArrowDownwardRounded fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {/* Internal IT Work Notes Drawer */}
      {streamDrawerOpen && (
        <Box className="sn-worknotes-container">
          <Box className="sn-worknotes-header">
            <Typography className="sn-worknotes-title">
              <HistoryToggleOffRounded fontSize="small" /> Internal IT Work Notes & Activity Stream
            </Typography>
            <Typography className="sn-worknotes-caption">Visible only to fulfillment engineers</Typography>
          </Box>
          <textarea
            className="sn-worknotes-textarea"
            placeholder="Add fulfillment notes, asset serial numbers, or provisioning status..."
            value={currentWorkNote}
            onChange={(e) => setCurrentWorkNote(e.target.value)}
          />
          <Box className="sn-worknotes-actions">
            <Button size="small" variant="contained" color="warning" disabled={!currentWorkNote.trim()} onClick={addWorkNote} sx={{ textTransform: 'none', fontSize: 12 }}>
              Add Work Note
            </Button>
          </Box>
          {workNotes.length > 0 && (
            <Box className="sn-worknotes-list">
              {workNotes.map((entry, idx) => (
                <Box key={idx} className="sn-worknote-entry">
                  <Typography sx={{ fontSize: 12, color: '#1e293b' }}>{entry.note}</Typography>
                  <Typography sx={{ fontSize: 10, color: '#78350f', mt: 0.5 }}>{entry.author} · {entry.time}</Typography>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      )}

      {/* Main 2-Column Form Body (Required Fields Only, Unwanted Fields Avoided) */}
      <Box className="sn-form-body">
        {/* Left Column */}
        <Box className="sn-form-column">
          <Box className="sn-field-row">
            <Typography className="sn-field-label">Number</Typography>
            <Box className="sn-field-input-wrap sn-number-wrap sn-reference-field-wrap">
              <input className="sn-input-styled sn-number-input" readOnly value={displayReqNumber} />
              <Box className="sn-ref-actions">
                <IconButton
                  size="small"
                  className="sn-ref-btn"
                  title="System Request ID"
                  aria-label="System Request ID"
                  onClick={() => setToast(`Request ID: ${displayReqNumber}`)}
                >
                  <InfoOutlined fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          </Box>

          <Box className="sn-field-row">
            <Typography className="sn-field-label">Requested for</Typography>
            <Box className="sn-field-input-wrap sn-reference-field-wrap">
              <input className="sn-input-styled" readOnly value={requestedForName} />
              <Box className="sn-ref-actions">
                <IconButton
                  size="small"
                  className="sn-ref-btn"
                  title="Look up user"
                  aria-label="Look up user"
                  onClick={() => setToast(`User: ${requestedForName}`)}
                >
                  <SearchRounded fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  className="sn-ref-btn"
                  title="Requester details"
                  aria-label="Requester details"
                  onClick={() => setToast(`Profile details: ${requestedForName}`)}
                >
                  <InfoOutlined fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          </Box>

          <Box className="sn-field-row">
            <Typography className="sn-field-label">Due date</Typography>
            <Box className="sn-field-input-wrap">
              <input
                className="sn-input-styled"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                placeholder="YYYY-MM-DD HH:MM:SS"
              />
              <IconButton size="small" className="sn-calendar-badge" title="Calendar picker">
                <CalendarTodayOutlined fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          <Box className="sn-field-row">
            <Typography className="sn-field-label">Price</Typography>
            <Box className="sn-field-input-wrap">
              <input className="sn-input-styled sn-readonly-input" readOnly value={formattedPrice} />
            </Box>
          </Box>
        </Box>

        {/* Right Column */}
        <Box className="sn-form-column">
          <Box className="sn-field-row">
            <Typography className="sn-field-label">Opened</Typography>
            <Box className="sn-field-input-wrap">
              <input className="sn-input-styled sn-readonly-input" readOnly value={openedDate} />
              <IconButton size="small" className="sn-calendar-badge">
                <CalendarTodayOutlined fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          <Box className="sn-field-row">
            <Typography className="sn-field-label">Opened by</Typography>
            <Box className="sn-field-input-wrap sn-reference-field-wrap">
              <input className="sn-input-styled" readOnly value={requesterName} />
              <Box className="sn-ref-actions">
                <IconButton
                  size="small"
                  className="sn-ref-btn"
                  title="Look up user"
                  aria-label="Look up user"
                  onClick={() => setToast(`User: ${requesterName}`)}
                >
                  <SearchRounded fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  className="sn-ref-btn"
                  title="Opened by details"
                  aria-label="Opened by details"
                  onClick={() => setToast(`Profile details: ${requesterName}`)}
                >
                  <InfoOutlined fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          </Box>

          <Box className="sn-field-row">
            <Typography className="sn-field-label">Approval</Typography>
            <Box className="sn-field-input-wrap">
              <select
                className="sn-select-styled"
                value={approvalState}
                onChange={(e) => setApprovalState(e.target.value)}
              >
                {['Requested', 'Approved', 'Rejected'].map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </Box>
          </Box>

          <Box className="sn-field-row">
            <Typography className="sn-field-label">Request state</Typography>
            <Box className="sn-field-input-wrap">
              <select
                className="sn-select-styled"
                value={requestState}
                onChange={(e) => setRequestState(e.target.value)}
              >
                {['Pending Approval', 'Approved', 'In Inquiry', 'Closed Complete', 'Closed Cancelled'].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Bottom Action Bar */}
      <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Button className="sn-req-action-btn" disabled={busy} onClick={handleUpdate}>
          Update
        </Button>
        <Button className="sn-req-action-btn" onClick={() => setAddItemModalOpen(true)}>
          Add New Item
        </Button>
        <Button className="sn-req-action-btn" onClick={handleCancelRequest}>
          Cancel Request
        </Button>
        <Button className="sn-req-action-btn" onClick={handleCopyNumber}>
          Copy
        </Button>
        <Button className="sn-req-action-btn sn-req-action-danger" onClick={() => { if (window.confirm(`Delete request ${displayReqNumber}?`)) { setToast(`Request ${displayReqNumber} deleted.`); onBack(); } }}>
          Delete
        </Button>
      </Box>

      {/* Related Tabs (Required Lists Only, Avoiding Unwanted Procurement/Licensing Tabs) */}
      <Box className="sn-req-tabs-bar">
        <Box
          className={`sn-req-tab ${activeTab === 'ritm' ? 'active' : ''}`}
          onClick={() => setActiveTab('ritm')}
        >
          Requested Items ({items.length})
        </Box>
        <Box
          className={`sn-req-tab ${activeTab === 'approvers' ? 'active' : ''}`}
          onClick={() => setActiveTab('approvers')}
        >
          Approvers
        </Box>
        <Box
          className={`sn-req-tab ${activeTab === 'stream' ? 'active' : ''}`}
          onClick={() => setActiveTab('stream')}
        >
          Activity Stream ({history.length + workNotes.length})
        </Box>
      </Box>

      {/* Tab 1 Content: Requested Items (RITM) */}
      {activeTab === 'ritm' && (
        <Box className="sn-ritm-container">
          <Box className="sn-ritm-toolbar">
            <Box className="sn-ritm-toolbar-left">
              <IconButton size="small" className="sn-menu-icon-btn">
                <MenuRounded fontSize="small" />
              </IconButton>
              <Typography className="sn-ritm-toolbar-title">Requested Items</Typography>
              <Box className="sn-ritm-search-wrap">
                <Typography sx={{ fontSize: 12, color: '#475569' }}>Go to</Typography>
                <select className="sn-ritm-search-input" defaultValue="Number">
                  <option value="Number">Number</option>
                  <option value="Item">Item</option>
                </select>
                <input className="sn-ritm-search-input" placeholder="Search" />
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography sx={{ fontSize: 12, color: '#64748b' }}>
                1 to {items.length} of {items.length}
              </Typography>
              <IconButton size="small" disabled sx={{ p: 0.2 }}><FirstPageRounded fontSize="small" /></IconButton>
              <IconButton size="small" disabled sx={{ p: 0.2 }}><KeyboardArrowLeftRounded fontSize="small" /></IconButton>
              <IconButton size="small" disabled sx={{ p: 0.2 }}><KeyboardArrowRightRounded fontSize="small" /></IconButton>
              <IconButton size="small" disabled sx={{ p: 0.2 }}><LastPageRounded fontSize="small" /></IconButton>
            </Box>
          </Box>

          <Box className="sn-ritm-filter-bar">
            <FilterListRounded fontSize="small" />
            <span>Request = {displayReqNumber}</span>
          </Box>

          <table className="sn-ritm-table">
            <thead>
              <tr>
                <th style={{ width: 36, textAlign: 'center' }}><input type="checkbox" /></th>
                <th style={{ width: 36, textAlign: 'center' }}>ℹ️</th>
                <th>Number</th>
                <th>Quantity</th>
                <th>Catalog</th>
                <th>Item</th>
                <th>Due date</th>
                <th>Price</th>
                <th>Assigned to</th>
                <th>Stage</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id}>
                  <td style={{ textAlign: 'center' }}><input type="checkbox" /></td>
                  <td style={{ textAlign: 'center' }}><InfoOutlined fontSize="small" sx={{ color: '#0284c7', cursor: 'pointer' }} /></td>
                  <td><span className="sn-ritm-link">{it.number}</span></td>
                  <td>{it.quantity}</td>
                  <td>{it.catalog}</td>
                  <td style={{ fontWeight: 600 }}>{it.item}</td>
                  <td>{it.dueDate}</td>
                  <td style={{ fontWeight: 600 }}>${it.price.toFixed(2)}</td>
                  <td>{it.assignedTo}</td>
                  <td>
                    <Box className="sn-stage-dots-container" title={`Stage: ${it.stage}`}>
                      <PlayArrowRounded className="sn-stage-arrow" fontSize="small" />
                      <span className={`sn-stage-dot ${it.stage !== 'approved' ? 'completed' : 'in-progress'}`} title="Request Approved" />
                      <span className={`sn-stage-dot ${it.stage === 'fulfillment' ? 'in-progress' : it.stage === 'delivery' || it.stage === 'completed' ? 'completed' : ''}`} title="Fulfillment" />
                      <span className={`sn-stage-dot ${it.stage === 'delivery' ? 'in-progress' : it.stage === 'completed' ? 'completed' : ''}`} title="Delivery" />
                      <span className={`sn-stage-dot ${it.stage === 'completed' ? 'completed' : ''}`} title="Closed Complete" />
                    </Box>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Box>
      )}

      {/* Tab 2 Content: Approvers */}
      {activeTab === 'approvers' && (
        <Box className="sn-ritm-container">
          <Box className="sn-ritm-toolbar">
            <Typography className="sn-ritm-toolbar-title">Assigned Approvers</Typography>
          </Box>
          <table className="sn-ritm-table">
            <thead>
              <tr>
                <th>Approver</th>
                <th>Role</th>
                <th>Decision</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: 600 }}>{resolvedApproverName}</td>
                <td>Manager / Service Owner</td>
                <td>
                  <Chip
                    size="small"
                    label={approvalState}
                    color={approvalState === 'Approved' ? 'success' : approvalState === 'Rejected' ? 'error' : 'warning'}
                    variant="outlined"
                    sx={{ height: 22, fontSize: 11 }}
                  />
                </td>
                <td>{openedDate}</td>
              </tr>
            </tbody>
          </table>
        </Box>
      )}

      {/* Tab 3 Content: Activity Stream */}
      {activeTab === 'stream' && (
        <Box className="sn-ritm-container" sx={{ p: 2 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 1, color: '#1e293b' }}>
            Activity & Audit Log
          </Typography>
          {history.length === 0 && workNotes.length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 1, fontSize: 13 }}>No activity recorded yet.</Typography>
          ) : (
            [...workNotes.map((w, i) => ({ id: `wn-${i}`, action: 'Internal Work Note', fromStatus: '', toStatus: '', actorId: w.author, comment: w.note, createdAt: w.time })), ...history].map((ev, i) => (
              <Box key={i} sx={{ py: 1, borderBottom: '1px solid #f1f5f9' }}>
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#1e3a8a' }}>{ev.action.replaceAll('_', ' ')}</Typography>
                <Typography sx={{ fontSize: 11, color: '#64748b' }}>
                  {ev.fromStatus ? `${ev.fromStatus} → ${ev.toStatus} · ` : ''}{ev.actorId} · {typeof ev.createdAt === 'string' && ev.createdAt.includes('T') ? new Date(ev.createdAt).toLocaleString() : ev.createdAt}
                </Typography>
                {ev.comment && <Typography sx={{ fontSize: 12, mt: 0.5, color: '#334155', bgcolor: '#f8fafc', p: 1, borderRadius: 1 }}>{ev.comment}</Typography>}
              </Box>
            ))
          )}
        </Box>
      )}

      {/* Form Context Menu */}
      <Menu
        anchorEl={formMenuAnchor}
        open={Boolean(formMenuAnchor)}
        onClose={() => setFormMenuAnchor(null)}
      >
        <MenuItem onClick={() => { setFormMenuAnchor(null); void handleUpdate(); }}>
          <ListItemIcon><SaveOutlined fontSize="small" /></ListItemIcon>
          <ListItemText primary="Save" secondary="Save record and stay on form" />
        </MenuItem>
        <MenuItem onClick={() => { setFormMenuAnchor(null); void onRefreshWorkspace(); }}>
          <ListItemIcon><RestartAltRounded fontSize="small" /></ListItemIcon>
          <ListItemText primary="Reload form" secondary="Reload latest state" />
        </MenuItem>
        <MenuItem onClick={handleCopyNumber}>
          <ListItemIcon><ContentCopyRounded fontSize="small" /></ListItemIcon>
          <ListItemText primary="Copy request number" secondary={displayReqNumber} />
        </MenuItem>
      </Menu>

      {/* More Options Menu */}
      <Menu
        anchorEl={moreMenuAnchor}
        open={Boolean(moreMenuAnchor)}
        onClose={() => setMoreMenuAnchor(null)}
      >
        <MenuItem onClick={() => { setMoreMenuAnchor(null); localStorage.setItem(`draft_${displayReqNumber}`, JSON.stringify(request)); setToast('Draft saved locally.'); }}>
          <ListItemIcon><SaveOutlined fontSize="small" /></ListItemIcon>
          <ListItemText primary="Save draft" secondary="Save to browser storage" />
        </MenuItem>
        <MenuItem onClick={() => { setMoreMenuAnchor(null); window.print(); }}>
          <ListItemIcon><PrintOutlined fontSize="small" /></ListItemIcon>
          <ListItemText primary="Print form" secondary="Print or save as PDF" />
        </MenuItem>
        <MenuItem onClick={() => {
          setMoreMenuAnchor(null)
          const blob = new Blob([JSON.stringify({ request, items }, null, 2)], { type: 'application/json' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url; a.download = `${displayReqNumber}.json`; a.click()
          URL.revokeObjectURL(url)
          setToast(`Exported ${displayReqNumber}.json`)
        }}>
          <ListItemIcon><FileDownloadOutlined fontSize="small" /></ListItemIcon>
          <ListItemText primary="Export as JSON" secondary="Download request JSON" />
        </MenuItem>
      </Menu>

      {/* Add Item Dialog */}
      <Dialog open={addItemModalOpen} onClose={() => setAddItemModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Add Item to Request</Typography>
          <IconButton size="small" onClick={() => setAddItemModalOpen(false)}><ClearRounded /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Select Item</InputLabel>
            <Select value={newItemName} label="Select Item" onChange={(e) => setNewItemName(e.target.value)}>
              <MenuItem value="Apple iPhone 5">Apple iPhone 5 ($799.99)</MenuItem>
              <MenuItem value="Laptop">Laptop Workstation ($839.99)</MenuItem>
              <MenuItem value="Monitor 27 inch">Monitor 27 inch ($349.99)</MenuItem>
              <MenuItem value="Docking Station">Thunderbolt Docking Station ($199.99)</MenuItem>
              <MenuItem value="Keyboard or mouse">Wireless Keyboard & Mouse ($89.99)</MenuItem>
              <MenuItem value="Cisco AnyConnect VPN">Cisco AnyConnect VPN ($0.00)</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Quantity"
            type="number"
            value={newItemQty}
            onChange={(e) => setNewItemQty(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setAddItemModalOpen(false); onAddItem() }}>Browse Catalog</Button>
          <Button onClick={() => setAddItemModalOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddNewItem}>Add Item</Button>
        </DialogActions>
      </Dialog>

      {/* Manage Attachments Dialog */}
      <Dialog open={attachmentsOpen} onClose={() => setAttachmentsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AttachFileRounded color="primary" />
            <Typography variant="h6">Attachments ({displayReqNumber})</Typography>
          </Box>
          <IconButton size="small" onClick={() => setAttachmentsOpen(false)}><ClearRounded /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box className="sn-attachment-dropzone">
            <CloudUploadRounded sx={{ fontSize: 36, color: '#94a3b8', mb: 1 }} />
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#334155', mb: 1 }}>Upload screenshots or specs</Typography>
            <Button variant="contained" component="label" size="small" startIcon={<CloudUploadRounded />}>
              Choose files
              <input type="file" multiple hidden onChange={handleFileUpload} />
            </Button>
          </Box>
          {attachments.map((att, idx) => (
            <Box key={idx} className="sn-attachment-item">
              <Box className="sn-attachment-item-info">
                <InsertDriveFileOutlined sx={{ color: '#0284c7' }} />
                <Box>
                  <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{att.name}</Typography>
                  <Typography sx={{ fontSize: 11, color: '#64748b' }}>{att.size} · Uploaded {att.date}</Typography>
                </Box>
              </Box>
              <IconButton size="small" color="error" onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== idx))}>
                <DeleteOutlineRounded fontSize="small" />
              </IconButton>
            </Box>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAttachmentsOpen(false)} variant="contained">Done</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

/**
 * Approval Queue List Component.
 * Displays a list of pending requests assigned to the current manager,
 * with quick one-click 'Approve' and 'Reject' actions.
 */
export function ApprovalQueue({ approvals, onApprove, onReject }: { approvals: Approval[]; onApprove: (id: string) => void; onReject: (id: string) => void }) {
  if (approvals.length === 0) return <Typography color="text.secondary" sx={{ py: 3 }}>There are no requests awaiting your approval.</Typography>
  return <Box className="approval-list">{approvals.map((approval) => <Box className="approval-item" key={approval.id}><Avatar className="approval-avatar">{approval.initials}</Avatar><Box className="approval-copy"><Typography className="approval-title">{approval.title}</Typography><Typography className="approval-detail">{approval.requestNumber} · Requested by {approval.employee} · {approval.requested}</Typography></Box><Button size="small" color="success" onClick={() => onApprove(approval.id)}>Approve</Button><Button size="small" color="error" onClick={() => onReject(approval.id)}>Reject</Button></Box>)}</Box>
}

/**
 * Dynamic Service Catalog Request Form Component.
 * - Dynamically renders form input fields based on the selected catalog service name.
 * - Fetches next request number preview from GET /api/requests/next-number.
 * - Dynamically injects conditional fields (e.g. access targets, device specifications).
 * - Enforces required field validation before enabling the 'Submit' button.
 */
export function ServiceRequestForm({ service, values, setValues, approvers, approversLoading, busy, onCancel, onSubmit }: { service: string; values: Record<string, string>; setValues: (values: Record<string, string>) => void; approvers: Approver[]; approversLoading: boolean; busy: boolean; onCancel: () => void; onSubmit: () => void }) {
  const { apiFetch } = useAuth()
  const [copied, setCopied] = useState(false)
  const currentReqNumber = values.requestNumber || 'REQ0010010'

  useEffect(() => {
    if (!values.requestNumber) {
      const fallback = 'REQ' + String(10001 + Math.floor(Math.random() * 9000)).padStart(7, '0')
      apiFetch('/api/requests/next-number')
        .then((res) => res.json())
        .then((data: { number?: string }) => {
          if (data?.number) setValues({ ...values, requestNumber: data.number })
          else setValues({ ...values, requestNumber: fallback })
        })
        .catch(() => {
          setValues({ ...values, requestNumber: fallback })
        })
    }
  }, [values.requestNumber, apiFetch])

  const form = serviceForms[service] ?? { intro: 'Select equipment needed. Required fields only.', fields: [
    { name: 'requestType', label: 'What do you need?', kind: 'text' as const, required: true },
    { name: 'neededBy', label: 'When do you need it?', kind: 'date' as const },
    { name: 'reason', label: 'Business reason and details', kind: 'textarea' as const, required: true },
  ] }
  const specifications = conditionalRequestFields(service, values)
  const visibleFields = [...form.fields, ...specifications]
  const canSubmit = visibleFields.filter((field) => field.required).every((field) => values[field.name]?.trim()) && Boolean(values.approverId) && !busy

  return (
    <Box className="sn-form-container">
      {/* ServiceNow Header */}
      <Box className="sn-form-header">
        <Box className="sn-header-left">
          <IconButton size="small" onClick={onCancel} title="Back" sx={{ color: '#475569', p: 0.5 }}>
            <ArrowBackRounded fontSize="small" />
          </IconButton>
          <Box>
            <Typography className="sn-title">Request · {currentReqNumber}</Typography>
            <Typography className="sn-subtitle">New record · {service}</Typography>
          </Box>
        </Box>
        <Box className="sn-header-right">
          <Button variant="outlined" size="small" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button
            variant="contained"
            size="small"
            className="sn-submit-btn"
            disabled={!canSubmit}
            onClick={onSubmit}
          >
            {busy ? <><CircularProgress size={14} sx={{ mr: 1 }} />Submitting…</> : 'Submit'}
          </Button>
        </Box>
      </Box>

      {/* Clean 2-Column Form Body (Required Fields Only) */}
      <Box className="sn-form-body">
        <Box className="sn-form-column">
          {/* Auto Generative ID Field */}
          <Box className="sn-field-row">
            <Typography className="sn-field-label">Number</Typography>
            <Box className="sn-field-input-wrap sn-number-wrap">
              <input
                className="sn-input-styled sn-number-input"
                readOnly
                value={currentReqNumber}
                title="Auto-generated Request Number"
              />
              <IconButton
                size="small"
                className="sn-search-icon-btn"
                title={copied ? 'Copied!' : 'Copy Request Number'}
                onClick={() => {
                  navigator.clipboard?.writeText(currentReqNumber)
                  setCopied(true)
                  window.setTimeout(() => setCopied(false), 3000)
                }}
              >
                {copied ? <CheckRounded fontSize="small" sx={{ color: '#16a34a' }} /> : <ContentCopyRounded fontSize="small" />}
              </IconButton>
            </Box>
          </Box>

          {form.fields.filter((_, idx) => idx % 2 === 0).map((field) => (
            <Box className="sn-field-row" key={field.name}>
              <Typography className="sn-field-label">
                {field.required && <span className="sn-required">* </span>}{field.label}
              </Typography>
              <Box className="sn-field-input-wrap">
                {field.kind === 'select' ? (
                  <select
                    className="sn-select-styled"
                    value={values[field.name] ?? ''}
                    onChange={(e) => setValues({ ...values, [field.name]: e.target.value })}
                  >
                    <option value="">-- Select --</option>
                    {field.options?.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : field.kind === 'textarea' ? (
                  <textarea
                    className="sn-textarea-styled"
                    rows={3}
                    value={values[field.name] ?? ''}
                    onChange={(e) => setValues({ ...values, [field.name]: e.target.value })}
                    placeholder={field.label}
                  />
                ) : (
                  <input
                    type={field.kind === 'date' ? 'date' : 'text'}
                    className="sn-input-styled"
                    value={values[field.name] ?? ''}
                    onChange={(e) => setValues({ ...values, [field.name]: e.target.value })}
                    placeholder={field.label}
                  />
                )}
              </Box>
            </Box>
          ))}
        </Box>

        <Box className="sn-form-column">
          {form.fields.filter((_, idx) => idx % 2 === 1).map((field) => (
            <Box className="sn-field-row" key={field.name}>
              <Typography className="sn-field-label">
                {field.required && <span className="sn-required">* </span>}{field.label}
              </Typography>
              <Box className="sn-field-input-wrap">
                {field.kind === 'select' ? (
                  <select
                    className="sn-select-styled"
                    value={values[field.name] ?? ''}
                    onChange={(e) => setValues({ ...values, [field.name]: e.target.value })}
                  >
                    <option value="">-- Select --</option>
                    {field.options?.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : field.kind === 'textarea' ? (
                  <textarea
                    className="sn-textarea-styled"
                    rows={3}
                    value={values[field.name] ?? ''}
                    onChange={(e) => setValues({ ...values, [field.name]: e.target.value })}
                    placeholder={field.label}
                  />
                ) : (
                  <input
                    type={field.kind === 'date' ? 'date' : 'text'}
                    className="sn-input-styled"
                    value={values[field.name] ?? ''}
                    onChange={(e) => setValues({ ...values, [field.name]: e.target.value })}
                    placeholder={field.label}
                  />
                )}
              </Box>
            </Box>
          ))}

          {/* Approver field */}
          <Box className="sn-field-row">
            <Typography className="sn-field-label">
              <span className="sn-required">* </span>Approver
            </Typography>
            <Box className="sn-field-input-wrap">
              <select
                className="sn-select-styled"
                value={values.approverId ?? ''}
                onChange={(e) => {
                  const app = approvers.find((a) => a.id === e.target.value)
                  setValues({ ...values, approverId: e.target.value, approverName: app?.fullName ?? '' })
                }}
              >
                <option value="">{approversLoading ? 'Loading approvers...' : '-- Select Manager or Admin --'}</option>
                {approvers.map((a) => (
                  <option key={a.id} value={a.id}>{a.fullName}</option>
                ))}
              </select>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Conditional access fields if any (e.g. Access and accounts test) */}
      {specifications.length > 0 && (
        <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #e2e8f0' }}>
          <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 1, color: '#334155' }}>Access & Role Specification</Typography>
          <Box className="sn-form-body">
            <Box className="sn-form-column">
              {specifications.map((field) => (
                <Box className="sn-field-row" key={field.name}>
                  <Typography className="sn-field-label">
                    {field.required && <span className="sn-required">* </span>}{field.label}
                  </Typography>
                  <Box className="sn-field-input-wrap">
                    <input
                      type={field.kind === 'date' ? 'date' : 'text'}
                      className="sn-input-styled"
                      value={values[field.name] ?? ''}
                      onChange={(e) => setValues({ ...values, [field.name]: e.target.value })}
                    />
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      )}

      <Box className="sn-form-footer">
        <Button variant="outlined" onClick={onCancel} disabled={busy}>Cancel</Button>
        <Button
          variant="contained"
          className="sn-submit-btn"
          disabled={!canSubmit}
          onClick={onSubmit}
        >
          {busy ? <><CircularProgress size={14} sx={{ mr: 1 }} />Submitting…</> : 'Submit request'}
        </Button>
      </Box>
    </Box>
  )
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
    <Box className="form-actions"><Button onClick={onCatalog}>Create another request</Button><Button variant="contained" onClick={onRequests}>Requests</Button></Box>
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
