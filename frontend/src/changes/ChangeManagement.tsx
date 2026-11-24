import { useState, useMemo, useEffect, useCallback } from 'react'
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
  Tab,
  Tabs,
  Alert,
  CircularProgress,
  Stack,
  FormControl,
  InputLabel,
} from '@mui/material'
import {
  PublishedWithChangesRounded,
  AddRounded,
  SearchRounded,
  CloseRounded,
  RefreshRounded,
  ArrowForwardRounded,
  CheckCircleOutlineRounded,
  CancelOutlined,
  ScheduleRounded,
  PlayArrowRounded,
  FactCheckRounded,
  AssignmentTurnedInRounded,
  HistoryRounded,
  RateReviewRounded,
  SecurityRounded,
} from '@mui/icons-material'

export interface ChangeRequestRecord {
  id: number
  changeNumber: string
  shortDescription: string
  detailedDescription: string
  requestedBy: string
  requesterEmail: string
  department: string
  changeType: 'STANDARD' | 'NORMAL' | 'EMERGENCY' | string
  category: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | string
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | string
  impact?: string
  affectedCi?: string
  businessJustification?: string
  implementationPlan?: string
  rollbackPlan?: string
  testPlan?: string
  plannedStartDate?: string
  plannedEndDate?: string
  status: string
  riskDescription?: string
  businessImpact?: string
  technicalImpact?: string
  serviceDowntimeExpected?: boolean
  riskMitigationPlan?: string
  assignedAnalyst?: string
  technicalTeam?: string
  implementationTeam?: string
  changeManager?: string
  assignedAt?: string
  reviewer?: string
  reviewComments?: string
  reviewedAt?: string
  approvedBy?: string
  approvalComments?: string
  approvedAt?: string
  emergencyJustification?: string
  maintenanceWindow?: string
  scheduledBy?: string
  scheduledAt?: string
  implementationProgress?: number
  implementationNotes?: string
  implementationStartedAt?: string
  implementationEndedAt?: string
  implementationOutcome?: string
  testResults?: string
  testerName?: string
  testingDate?: string
  validationComments?: string
  validationStatus?: string
  rollbackRequired?: boolean
  rollbackReason?: string
  rollbackNotes?: string
  rollbackStartedAt?: string
  rollbackCompletedAt?: string
  rollbackStatus?: string
  closureNotes?: string
  closedBy?: string
  closedDate?: string
  finalOutcome?: string
  postImplementationReview?: string
  cancellationReason?: string
  cancelledBy?: string
  cancelledAt?: string
  createdAt?: string
  updatedAt?: string
}

export interface ChangeHistoryRecord {
  id: number
  changeId: number
  previousStatus?: string
  newStatus?: string
  actionPerformed?: string
  performedBy?: string
  comments?: string
  eventTime?: string
}

export interface ChangeSummary {
  totalChanges: number
  byStatus: Record<string, number>
  byType?: Record<string, number>
  byRisk?: Record<string, number>
}

interface ChangeManagementProps {
  isManagerAdmin: boolean
  currentUserEmail?: string
  currentUserName?: string
  apiFetch: (input: string, init?: RequestInit) => Promise<Response>
  setToast: (msg: string) => void
}

const initialForm = {
  shortDescription: '',
  detailedDescription: '',
  requestedBy: '',
  requesterEmail: '',
  department: 'IT',
  changeType: 'NORMAL',
  category: 'APPLICATION',
  priority: 'MEDIUM',
  riskLevel: 'MEDIUM',
  impact: '',
  affectedCi: '',
  businessJustification: '',
  implementationPlan: '',
  rollbackPlan: '',
  testPlan: '',
}

const statusColor = (s: string) => {
  switch (s?.toUpperCase()) {
    case 'APPROVED':
    case 'VALIDATED':
    case 'CLOSED':
      return 'success'
    case 'REJECTED':
    case 'CANCELLED':
      return 'error'
    case 'IN_PROGRESS':
    case 'SCHEDULED':
      return 'info'
    case 'PENDING_APPROVAL':
    case 'UNDER_REVIEW':
    case 'ASSESSMENT':
    case 'ROLLBACK_IN_PROGRESS':
      return 'warning'
    default:
      return 'default'
  }
}

const riskColor = (r: string) => {
  switch (r?.toUpperCase()) {
    case 'CRITICAL':
    case 'HIGH':
      return '#ef4444'
    case 'MEDIUM':
      return '#f59e0b'
    case 'LOW':
      return '#10b981'
    default:
      return '#64748b'
  }
}

const STATUS_FILTERS = [
  'ALL',
  'DRAFT',
  'SUBMITTED',
  'ASSESSMENT',
  'UNDER_REVIEW',
  'PENDING_APPROVAL',
  'APPROVED',
  'SCHEDULED',
  'IN_PROGRESS',
  'IMPLEMENTED',
  'PENDING_VALIDATION',
  'VALIDATED',
  'ROLLBACK_IN_PROGRESS',
  'ROLLED_BACK',
  'CLOSED',
  'REJECTED',
  'CANCELLED',
]

export default function ChangeManagement({
  isManagerAdmin,
  currentUserEmail,
  currentUserName,
  apiFetch,
  setToast,
}: ChangeManagementProps) {
  const [changes, setChanges] = useState<ChangeRequestRecord[]>([])
  const [summary, setSummary] = useState<ChangeSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [form, setForm] = useState(initialForm)
  const [submitting, setSubmitting] = useState(false)
  const [selectedChange, setSelectedChange] = useState<ChangeRequestRecord | null>(null)
  const [history, setHistory] = useState<ChangeHistoryRecord[]>([])
  const [activeTab, setActiveTab] = useState<'details' | 'plans' | 'lifecycle' | 'history'>('details')
  const [actionComments, setActionComments] = useState('')

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [listRes, summaryRes] = await Promise.all([
        apiFetch('/api/changes?page=0&size=100&sort=createdAt,desc'),
        apiFetch('/api/changes/dashboard/summary'),
      ])

      if (listRes.ok) {
        const data = await listRes.json()
        setChanges(data.content || data || [])
      }
      if (summaryRes.ok) {
        const stats = await summaryRes.json()
        setSummary(stats)
      }
    } catch {
      setToast('Unable to reach Change Service. Verify service is running.')
    } finally {
      setLoading(false)
    }
  }, [apiFetch, setToast])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const openDetail = async (item: ChangeRequestRecord) => {
    setSelectedChange(item)
    setActiveTab('details')
    setActionComments('')
    try {
      const [detRes, histRes] = await Promise.all([
        apiFetch(`/api/changes/${item.id}`),
        apiFetch(`/api/changes/${item.id}/history`),
      ])
      if (detRes.ok) {
        const det = await detRes.json()
        setSelectedChange(det)
      }
      if (histRes.ok) {
        const h = await histRes.json()
        setHistory(h || [])
      }
    } catch {
      setHistory([])
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const payload = {
        ...form,
        requestedBy: form.requestedBy || currentUserName || 'Portal User',
        requesterEmail: form.requesterEmail || currentUserEmail || 'user@northstar.local',
      }
      const res = await apiFetch('/api/changes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || 'Failed to create change request')
      }
      setToast('Change request created successfully.')
      setCreateModalOpen(false)
      setForm(initialForm)
      await loadData()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error creating change'
      setToast(message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleLifecycleAction = async (endpoint: string, body: Record<string, unknown> = {}) => {
    if (!selectedChange) return
    setSubmitting(true)
    try {
      const res = await apiFetch(`/api/changes/${selectedChange.id}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || `Action failed: ${endpoint}`)
      }
      const updated = await res.json()
      setSelectedChange(updated)
      setActionComments('')
      setToast(`Change updated: ${endpoint.replace('-', ' ')}`)
      await loadData()
      // Refresh history
      const histRes = await apiFetch(`/api/changes/${selectedChange.id}/history`)
      if (histRes.ok) {
        setHistory(await histRes.json())
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Action failed'
      setToast(message)
    } finally {
      setSubmitting(false)
    }
  }

  const filteredChanges = useMemo(() => {
    return changes.filter((c) => {
      const matchesSearch =
        !searchQuery ||
        `${c.changeNumber} ${c.shortDescription} ${c.requestedBy} ${c.affectedCi || ''}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase())

      const matchesStatus = statusFilter === 'ALL' || c.status?.toUpperCase() === statusFilter
      const matchesType = typeFilter === 'ALL' || c.changeType?.toUpperCase() === typeFilter

      return matchesSearch && matchesStatus && matchesType
    })
  }, [changes, searchQuery, statusFilter, typeFilter])

  const stats = summary?.byStatus || {}
  const totalCount = summary?.totalChanges ?? changes.length
  const pendingApprovalCount = stats.PENDING_APPROVAL || 0
  const inProgressCount = stats.IN_PROGRESS || 0
  const closedCount = stats.CLOSED || 0

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1400, margin: '0 auto' }}>
      {/* Header Banner */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 3,
          background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <PublishedWithChangesRounded sx={{ fontSize: 32, color: '#93c5fd' }} />
            <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.5px' }}>
              Change Management
            </Typography>
            {isManagerAdmin && (
              <Chip
                size="small"
                label="CAB Manager Access"
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 700 }}
              />
            )}
          </Box>
          <Typography variant="body2" sx={{ color: '#dbeafe', maxWidth: 650 }}>
            Standard, Normal, and Emergency change request lifecycle. Control planning, risk assessment,
            approvals, CAB scheduling, implementation, and post-change review.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="outlined"
            onClick={loadData}
            startIcon={<RefreshRounded />}
            sx={{
              color: 'white',
              borderColor: 'rgba(255,255,255,0.4)',
              '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' },
            }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              setForm({
                ...initialForm,
                requestedBy: currentUserName || '',
                requesterEmail: currentUserEmail || '',
              })
              setCreateModalOpen(true)
            }}
            startIcon={<AddRounded />}
            sx={{
              bgcolor: 'white',
              color: '#1e3a8a',
              fontWeight: 700,
              '&:hover': { bgcolor: '#f8fafc' },
            }}
          >
            New Change Request
          </Button>
        </Box>
      </Paper>

      {/* Metrics Row */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' },
          gap: 2,
          mb: 3,
        }}
      >
        {[
          { label: 'Total Changes', value: totalCount, sub: 'All registered requests', color: '#3b82f6' },
          { label: 'Pending Approval', value: pendingApprovalCount, sub: 'Awaiting CAB / Manager approval', color: '#f59e0b' },
          { label: 'In Progress', value: inProgressCount, sub: 'Currently executing', color: '#06b6d4' },
          { label: 'Closed / Completed', value: closedCount, sub: 'Validated and closed', color: '#10b981' },
        ].map((stat, i) => (
          <Paper
            key={i}
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 3,
              border: '1px solid #e2e8f0',
              bgcolor: '#ffffff',
              borderLeft: `4px solid ${stat.color}`,
            }}
          >
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
              {stat.label}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#1e293b', my: 0.5 }}>
              {stat.value}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {stat.sub}
            </Typography>
          </Paper>
        ))}
      </Box>

      {/* Main Table Paper */}
      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
        {/* Filters and Search */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', mb: 2.5 }}>
          <TextField
            size="small"
            placeholder="Search change #, title, requester or CI..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            slotProps={{
              input: {
                startAdornment: <SearchRounded sx={{ mr: 1, color: '#94a3b8' }} />,
              },
            }}
            sx={{ flex: { xs: '1 1 100%', sm: '1 1 300px' } }}
          />

          <FormControl size="small" sx={{ minWidth: 170 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {STATUS_FILTERS.map((s) => (
                <MenuItem key={s} value={s}>
                  {s === 'ALL' ? 'All Statuses' : s.replace(/_/g, ' ')}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Change Type</InputLabel>
            <Select
              value={typeFilter}
              label="Change Type"
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <MenuItem value="ALL">All Types</MenuItem>
              <MenuItem value="STANDARD">Standard</MenuItem>
              <MenuItem value="NORMAL">Normal</MenuItem>
              <MenuItem value="EMERGENCY">Emergency</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Content Table / Empty State */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress size={32} />
          </Box>
        ) : filteredChanges.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <PublishedWithChangesRounded sx={{ fontSize: 52, color: '#cbd5e1', mb: 1.5 }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#475569' }}>
              No change requests found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {searchQuery || statusFilter !== 'ALL' || typeFilter !== 'ALL'
                ? 'Try adjusting your filters or search terms.'
                : 'Create your first change request to begin the lifecycle.'}
            </Typography>
            <Button
              variant="contained"
              onClick={() => setCreateModalOpen(true)}
              startIcon={<AddRounded />}
            >
              Create Change Request
            </Button>
          </Box>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
              <Box component="thead">
                <Box component="tr" sx={{ borderBottom: '2px solid #f1f5f9', textAlign: 'left' }}>
                  <Box component="th" sx={{ py: 1.5, px: 2, fontSize: 12, fontWeight: 700, color: '#64748b' }}>
                    CHANGE
                  </Box>
                  <Box component="th" sx={{ py: 1.5, px: 2, fontSize: 12, fontWeight: 700, color: '#64748b' }}>
                    REQUESTED BY
                  </Box>
                  <Box component="th" sx={{ py: 1.5, px: 2, fontSize: 12, fontWeight: 700, color: '#64748b' }}>
                    TYPE
                  </Box>
                  <Box component="th" sx={{ py: 1.5, px: 2, fontSize: 12, fontWeight: 700, color: '#64748b' }}>
                    RISK
                  </Box>
                  <Box component="th" sx={{ py: 1.5, px: 2, fontSize: 12, fontWeight: 700, color: '#64748b' }}>
                    PRIORITY
                  </Box>
                  <Box component="th" sx={{ py: 1.5, px: 2, fontSize: 12, fontWeight: 700, color: '#64748b' }}>
                    STATUS
                  </Box>
                  <Box component="th" sx={{ py: 1.5, px: 2, width: 40 }} />
                </Box>
              </Box>
              <Box component="tbody">
                {filteredChanges.map((change) => (
                  <Box
                    component="tr"
                    key={change.id}
                    onClick={() => void openDetail(change)}
                    sx={{
                      cursor: 'pointer',
                      borderBottom: '1px solid #f1f5f9',
                      transition: 'background 0.15s ease',
                      '&:hover': { bgcolor: '#f8fafc' },
                    }}
                  >
                    <Box sx={{ py: 2, px: 2 }}>
                      <Typography sx={{ fontWeight: 700, color: '#1e3a8a', fontSize: 13 }}>
                        {change.changeNumber}
                      </Typography>
                      <Typography
                        sx={{
                          fontWeight: 600,
                          fontSize: 14,
                          color: '#1e293b',
                          maxWidth: 340,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {change.shortDescription}
                      </Typography>
                      {change.affectedCi && (
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                          CI: {change.affectedCi}
                        </Typography>
                      )}
                    </Box>
                    <Box sx={{ py: 2, px: 2 }}>
                      <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>
                        {change.requestedBy}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b' }}>
                        {change.department}
                      </Typography>
                    </Box>
                    <Box sx={{ py: 2, px: 2 }}>
                      <Chip
                        size="small"
                        label={change.changeType}
                        variant="outlined"
                        sx={{
                          fontWeight: 700,
                          fontSize: 11,
                          borderColor:
                            change.changeType === 'EMERGENCY'
                              ? '#f87171'
                              : change.changeType === 'STANDARD'
                              ? '#38bdf8'
                              : '#94a3b8',
                          color:
                            change.changeType === 'EMERGENCY'
                              ? '#b91c1c'
                              : change.changeType === 'STANDARD'
                              ? '#0369a1'
                              : '#475569',
                        }}
                      />
                    </Box>
                    <Box sx={{ py: 2, px: 2 }}>
                      <Chip
                        size="small"
                        label={change.riskLevel}
                        sx={{
                          fontWeight: 700,
                          fontSize: 11,
                          bgcolor: `${riskColor(change.riskLevel)}15`,
                          color: riskColor(change.riskLevel),
                        }}
                      />
                    </Box>
                    <Box sx={{ py: 2, px: 2 }}>
                      <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>
                        {change.priority}
                      </Typography>
                    </Box>
                    <Box sx={{ py: 2, px: 2 }}>
                      <Chip
                        size="small"
                        color={statusColor(change.status)}
                        label={change.status?.replace(/_/g, ' ')}
                        sx={{ fontWeight: 700, fontSize: 11 }}
                      />
                    </Box>
                    <Box sx={{ py: 2, px: 2, color: '#94a3b8' }}>
                      <ArrowForwardRounded sx={{ fontSize: 18 }} />
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        )}
      </Paper>

      {/* CREATE CHANGE REQUEST DIALOG */}
      <Dialog
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <Box component="form" onSubmit={handleCreate}>
          <DialogTitle sx={{ fontWeight: 800, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PublishedWithChangesRounded sx={{ color: '#2563eb' }} />
              Create Change Request
            </Box>
            <IconButton size="small" onClick={() => setCreateModalOpen(false)}>
              <CloseRounded />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <Box sx={{ gridColumn: '1 / -1' }}>
                <TextField
                  required
                  fullWidth
                  label="Short Description"
                  placeholder="e.g. Upgrade PostgreSQL production cluster to v16.2"
                  value={form.shortDescription}
                  onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
                />
              </Box>

              <Box sx={{ gridColumn: '1 / -1' }}>
                <TextField
                  required
                  fullWidth
                  multiline
                  minRows={2}
                  label="Detailed Description"
                  placeholder="Comprehensive details of what is being changed and why..."
                  value={form.detailedDescription}
                  onChange={(e) => setForm({ ...form, detailedDescription: e.target.value })}
                />
              </Box>

              <Box>
                <TextField
                  select
                  fullWidth
                  label="Change Type"
                  value={form.changeType}
                  onChange={(e) => setForm({ ...form, changeType: e.target.value })}
                >
                  <MenuItem value="STANDARD">Standard (Pre-authorized, low risk)</MenuItem>
                  <MenuItem value="NORMAL">Normal (CAB approval required)</MenuItem>
                  <MenuItem value="EMERGENCY">Emergency (Urgent fix/downtime prevention)</MenuItem>
                </TextField>
              </Box>

              <Box>
                <TextField
                  select
                  fullWidth
                  label="Category"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  {['SOFTWARE', 'HARDWARE', 'NETWORK', 'DATABASE', 'SECURITY', 'INFRASTRUCTURE', 'APPLICATION', 'OTHER'].map(
                    (cat) => (
                      <MenuItem key={cat} value={cat}>
                        {cat}
                      </MenuItem>
                    )
                  )}
                </TextField>
              </Box>

              <Box>
                <TextField
                  select
                  fullWidth
                  label="Risk Level"
                  value={form.riskLevel}
                  onChange={(e) => setForm({ ...form, riskLevel: e.target.value })}
                >
                  {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((r) => (
                    <MenuItem key={r} value={r}>
                      {r}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>

              <Box>
                <TextField
                  select
                  fullWidth
                  label="Priority"
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                >
                  {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((p) => (
                    <MenuItem key={p} value={p}>
                      {p}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>

              <Box>
                <TextField
                  fullWidth
                  label="Affected CI / Asset"
                  placeholder="e.g. DB-CLUSTER-PROD-01"
                  value={form.affectedCi}
                  onChange={(e) => setForm({ ...form, affectedCi: e.target.value })}
                />
              </Box>

              <Box>
                <TextField
                  fullWidth
                  label="Department"
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                />
              </Box>

              <Box>
                <TextField
                  required
                  fullWidth
                  label="Requested By"
                  value={form.requestedBy}
                  onChange={(e) => setForm({ ...form, requestedBy: e.target.value })}
                />
              </Box>

              <Box>
                <TextField
                  required
                  fullWidth
                  label="Requester Email"
                  type="email"
                  value={form.requesterEmail}
                  onChange={(e) => setForm({ ...form, requesterEmail: e.target.value })}
                />
              </Box>

              <Box sx={{ gridColumn: '1 / -1' }}>
                <TextField
                  fullWidth
                  multiline
                  minRows={2}
                  label="Business Justification"
                  placeholder="Why is this change necessary for business objectives or regulatory compliance?"
                  value={form.businessJustification}
                  onChange={(e) => setForm({ ...form, businessJustification: e.target.value })}
                />
              </Box>

              <Box sx={{ gridColumn: '1 / -1' }}>
                <TextField
                  fullWidth
                  multiline
                  minRows={2}
                  label="Implementation Plan"
                  placeholder="Step-by-step technical procedures to execute during the window..."
                  value={form.implementationPlan}
                  onChange={(e) => setForm({ ...form, implementationPlan: e.target.value })}
                />
              </Box>

              <Box>
                <TextField
                  fullWidth
                  multiline
                  minRows={2}
                  label="Rollback / Backout Plan"
                  placeholder="How will this change be safely reverted if problems occur?"
                  value={form.rollbackPlan}
                  onChange={(e) => setForm({ ...form, rollbackPlan: e.target.value })}
                />
              </Box>

              <Box>
                <TextField
                  fullWidth
                  multiline
                  minRows={2}
                  label="Test Plan"
                  placeholder="Testing criteria and validation checks following implementation..."
                  value={form.testPlan}
                  onChange={(e) => setForm({ ...form, testPlan: e.target.value })}
                />
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setCreateModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={submitting}>
              {submitting ? 'Creating...' : 'Submit Change Draft'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* DETAIL & LIFECYCLE DIALOG */}
      <Dialog
        open={Boolean(selectedChange)}
        onClose={() => setSelectedChange(null)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#1e3a8a' }}>
                  {selectedChange?.changeNumber}
                </Typography>
                <Chip
                  size="small"
                  color={statusColor(selectedChange?.status || '')}
                  label={selectedChange?.status?.replace(/_/g, ' ')}
                  sx={{ fontWeight: 700 }}
                />
                <Chip
                  size="small"
                  label={`${selectedChange?.changeType} · ${selectedChange?.riskLevel} RISK`}
                  variant="outlined"
                  sx={{ fontWeight: 600 }}
                />
              </Box>
              <Typography variant="body1" sx={{ fontWeight: 600, color: '#334155' }}>
                {selectedChange?.shortDescription}
              </Typography>
            </Box>
            <IconButton size="small" onClick={() => setSelectedChange(null)}>
              <CloseRounded />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 0 }}>
          {selectedChange && (
            <Box>
              <Tabs
                value={activeTab}
                onChange={(_, v) => setActiveTab(v)}
                sx={{ borderBottom: '1px solid #e2e8f0', px: 3 }}
              >
                <Tab value="details" label="Overview" />
                <Tab value="plans" label="Plans & Impact" />
                <Tab value="lifecycle" label="Lifecycle Actions" />
                <Tab value="history" label={`Audit History (${history.length})`} />
              </Tabs>

              <Box sx={{ p: 3 }}>
                {activeTab === 'details' && (
                  <Stack spacing={2.5}>
                    <Typography variant="body2" sx={{ color: '#334155', lineHeight: 1.6 }}>
                      {selectedChange.detailedDescription}
                    </Typography>

                    <Divider />

                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' },
                        gap: 2,
                      }}
                    >
                      {[
                        ['Requested By', selectedChange.requestedBy],
                        ['Requester Email', selectedChange.requesterEmail],
                        ['Department', selectedChange.department],
                        ['Affected CI', selectedChange.affectedCi || '—'],
                        ['Category', selectedChange.category],
                        ['Priority', selectedChange.priority],
                        ['Risk Level', selectedChange.riskLevel],
                        ['Assigned Analyst', selectedChange.assignedAnalyst || 'Unassigned'],
                        ['Technical Team', selectedChange.technicalTeam || 'Unassigned'],
                        ['Change Manager', selectedChange.changeManager || 'Unassigned'],
                        ['Maintenance Window', selectedChange.maintenanceWindow || 'Not scheduled'],
                        ['Approved By', selectedChange.approvedBy || 'Pending'],
                      ].map(([k, v]) => (
                        <Box key={k}>
                          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                            {k}
                          </Typography>
                          <Typography sx={{ fontWeight: 650, color: '#1e293b', fontSize: 13.5 }}>
                            {v}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Stack>
                )}

                {activeTab === 'plans' && (
                  <Stack spacing={2.5}>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e3a8a', mb: 0.5 }}>
                        Business Justification
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#475569' }}>
                        {selectedChange.businessJustification || 'No justification provided.'}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e3a8a', mb: 0.5 }}>
                        Implementation Plan
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#475569' }}>
                        {selectedChange.implementationPlan || 'No implementation plan provided.'}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e3a8a', mb: 0.5 }}>
                        Rollback / Backout Plan
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#475569' }}>
                        {selectedChange.rollbackPlan || 'No rollback plan provided.'}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e3a8a', mb: 0.5 }}>
                        Test & Validation Plan
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#475569' }}>
                        {selectedChange.testPlan || 'No test plan provided.'}
                      </Typography>
                    </Box>
                  </Stack>
                )}

                {activeTab === 'lifecycle' && (
                  <Stack spacing={2.5}>
                    <Alert severity="info" sx={{ mb: 1 }}>
                      Current status: <b>{selectedChange.status}</b>. Follow the ITSM Change transition graph below.
                    </Alert>

                    <TextField
                      fullWidth
                      size="small"
                      label="Action Notes / Comments"
                      placeholder="Add reviewer notes, justification, or decision rationale..."
                      value={actionComments}
                      onChange={(e) => setActionComments(e.target.value)}
                    />

                    <Divider />

                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e293b' }}>
                      Available Transitions for {selectedChange.status}
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                      {/* DRAFT -> SUBMITTED */}
                      {selectedChange.status === 'DRAFT' && (
                        <Button
                          variant="contained"
                          startIcon={<ArrowForwardRounded />}
                          disabled={submitting}
                          onClick={() =>
                            handleLifecycleAction('submit', {
                              performedBy: currentUserName || selectedChange.requestedBy,
                            })
                          }
                        >
                          Submit Change
                        </Button>
                      )}

                      {/* SUBMITTED -> ASSESSMENT */}
                      {selectedChange.status === 'SUBMITTED' && (
                        <Button
                          variant="contained"
                          startIcon={<SecurityRounded />}
                          disabled={submitting}
                          onClick={() =>
                            handleLifecycleAction('start-assessment', {
                              performedBy: currentUserName || 'Change Analyst',
                            })
                          }
                        >
                          Start Risk Assessment
                        </Button>
                      )}

                      {/* ASSESSMENT -> UNDER_REVIEW */}
                      {selectedChange.status === 'ASSESSMENT' && (
                        <Button
                          variant="contained"
                          startIcon={<RateReviewRounded />}
                          disabled={submitting}
                          onClick={() =>
                            handleLifecycleAction('assess', {
                              performedBy: currentUserName || 'Change Analyst',
                              riskLevel: selectedChange.riskLevel,
                              riskDescription: actionComments || 'Risk assessment verified',
                            })
                          }
                        >
                          Complete Assessment
                        </Button>
                      )}

                      {/* UNDER_REVIEW -> PENDING_APPROVAL */}
                      {selectedChange.status === 'UNDER_REVIEW' && (
                        <Button
                          variant="contained"
                          startIcon={<RateReviewRounded />}
                          disabled={submitting}
                          onClick={() =>
                            handleLifecycleAction('review', {
                              reviewer: currentUserName || 'Change Manager',
                              decision: 'APPROVED',
                              comments: actionComments || 'Reviewed and ready for CAB approval',
                            })
                          }
                        >
                          Send for Approval
                        </Button>
                      )}

                      {/* PENDING_APPROVAL -> APPROVED / REJECTED */}
                      {['PENDING_APPROVAL', 'UNDER_REVIEW'].includes(selectedChange.status) && (
                        <>
                          <Button
                            variant="contained"
                            color="success"
                            startIcon={<CheckCircleOutlineRounded />}
                            disabled={submitting}
                            onClick={() =>
                              handleLifecycleAction('approve', {
                                approvedBy: currentUserName || 'Change Manager',
                                comments: actionComments || 'Change approved by CAB',
                                emergencyJustification:
                                  selectedChange.changeType === 'EMERGENCY'
                                    ? actionComments || 'Emergency fix pre-authorized'
                                    : undefined,
                              })
                            }
                          >
                            Approve Change
                          </Button>
                          <Button
                            variant="outlined"
                            color="error"
                            startIcon={<CancelOutlined />}
                            disabled={submitting}
                            onClick={() =>
                              handleLifecycleAction('reject', {
                                rejectedBy: currentUserName || 'Change Manager',
                                comments: actionComments || 'Change rejected',
                              })
                            }
                          >
                            Reject Change
                          </Button>
                        </>
                      )}

                      {/* APPROVED -> SCHEDULED */}
                      {selectedChange.status === 'APPROVED' && (
                        <Button
                          variant="contained"
                          color="info"
                          startIcon={<ScheduleRounded />}
                          disabled={submitting}
                          onClick={() =>
                            handleLifecycleAction('schedule', {
                              scheduledBy: currentUserName || 'Change Coordinator',
                              maintenanceWindow: 'Saturday 02:00 - 04:00 UTC',
                              plannedStartDate: new Date().toISOString(),
                              plannedEndDate: new Date(Date.now() + 7200000).toISOString(),
                            })
                          }
                        >
                          Schedule Change
                        </Button>
                      )}

                      {/* SCHEDULED -> IN_PROGRESS */}
                      {selectedChange.status === 'SCHEDULED' && (
                        <Button
                          variant="contained"
                          color="warning"
                          startIcon={<PlayArrowRounded />}
                          disabled={submitting}
                          onClick={() =>
                            handleLifecycleAction('start-implementation', {
                              performedBy: currentUserName || 'Implementation Engineer',
                            })
                          }
                        >
                          Start Implementation
                        </Button>
                      )}

                      {/* IN_PROGRESS -> IMPLEMENTED */}
                      {selectedChange.status === 'IN_PROGRESS' && (
                        <>
                          <Button
                            variant="contained"
                            color="success"
                            startIcon={<AssignmentTurnedInRounded />}
                            disabled={submitting}
                            onClick={() =>
                              handleLifecycleAction('complete-implementation', {
                                outcome: 'SUCCESS',
                                performedBy: currentUserName || 'Implementation Engineer',
                                notes: actionComments || 'Implementation completed successfully',
                              })
                            }
                          >
                            Complete Implementation
                          </Button>
                          <Button
                            variant="outlined"
                            color="error"
                            disabled={submitting}
                            onClick={() =>
                              handleLifecycleAction('rollback', {
                                reason: actionComments || 'Implementation failure triggered rollback',
                                performedBy: currentUserName || 'Implementation Engineer',
                              })
                            }
                          >
                            Trigger Rollback
                          </Button>
                        </>
                      )}

                      {/* IMPLEMENTED / PENDING_VALIDATION -> VALIDATED */}
                      {['IMPLEMENTED', 'PENDING_VALIDATION'].includes(selectedChange.status) && (
                        <Button
                          variant="contained"
                          color="success"
                          startIcon={<FactCheckRounded />}
                          disabled={submitting}
                          onClick={() =>
                            handleLifecycleAction('test-results', {
                              testerName: currentUserName || 'QA / Tester',
                              validationStatus: 'VALIDATED',
                              testResults: actionComments || 'All test cases passed smoothly',
                            })
                          }
                        >
                          Validate Test Results
                        </Button>
                      )}

                      {/* VALIDATED -> CLOSED */}
                      {['VALIDATED', 'ROLLED_BACK'].includes(selectedChange.status) && (
                        <Button
                          variant="contained"
                          color="primary"
                          startIcon={<CheckCircleOutlineRounded />}
                          disabled={submitting}
                          onClick={() =>
                            handleLifecycleAction('close', {
                              closedBy: currentUserName || 'Change Manager',
                              closureNotes: actionComments || 'Change successfully completed and validated.',
                              finalOutcome: 'SUCCESS',
                            })
                          }
                        >
                          Close Change Request
                        </Button>
                      )}

                      {/* ROLLBACK_IN_PROGRESS -> ROLLED_BACK */}
                      {selectedChange.status === 'ROLLBACK_IN_PROGRESS' && (
                        <Button
                          variant="contained"
                          color="error"
                          disabled={submitting}
                          onClick={() =>
                            handleLifecycleAction('rollback/complete', {
                              status: 'ROLLED_BACK',
                              performedBy: currentUserName || 'Implementation Engineer',
                              notes: actionComments || 'Rollback execution completed successfully.',
                            })
                          }
                        >
                          Complete Rollback
                        </Button>
                      )}

                      {/* Cancel option if eligible */}
                      {!['IN_PROGRESS', 'IMPLEMENTED', 'VALIDATED', 'CLOSED'].includes(
                        selectedChange.status
                      ) && (
                        <Button
                          variant="text"
                          color="error"
                          disabled={submitting}
                          onClick={() =>
                            handleLifecycleAction('cancel', {
                              cancelledBy: currentUserName || 'User',
                              cancellationReason: actionComments || 'Change cancelled by user/manager',
                            })
                          }
                        >
                          Cancel Request
                        </Button>
                      )}
                    </Box>
                  </Stack>
                )}

                {activeTab === 'history' && (
                  <Stack spacing={2}>
                    {history.length === 0 ? (
                      <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                        No audit history recorded yet.
                      </Typography>
                    ) : (
                      history.map((h) => (
                        <Box
                          key={h.id}
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            bgcolor: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 1.5,
                          }}
                        >
                          <HistoryRounded sx={{ color: '#64748b', mt: 0.25 }} />
                          <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography sx={{ fontWeight: 700, fontSize: 13, color: '#1e293b' }}>
                                {h.actionPerformed || h.newStatus}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                {h.eventTime ? new Date(h.eventTime).toLocaleString() : ''}
                              </Typography>
                            </Box>
                            <Typography variant="caption" sx={{ color: '#64748b' }}>
                              Actor: {h.performedBy || 'System'} · Previous: {h.previousStatus || '—'} → New: {h.newStatus}
                            </Typography>
                            {h.comments && (
                              <Typography variant="body2" sx={{ mt: 0.5, color: '#334155' }}>
                                {h.comments}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      ))
                    )}
                  </Stack>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setSelectedChange(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
