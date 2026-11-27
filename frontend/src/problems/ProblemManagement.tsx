import { useState, useMemo } from 'react'
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
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
} from '@mui/material'
import {
  ReportProblemRounded,
  AddRounded,
  SearchRounded,
  CloseRounded,
  ArrowBackRounded,
  ContentCopyRounded,
  CheckRounded,
  AssignmentIndRounded,
  PsychologyRounded,
  EngineeringRounded,
  DeleteOutlineRounded,
  RefreshRounded,
  ArrowForwardRounded,
} from '@mui/icons-material'

export interface ProblemRecord {
  id: number
  problemNumber?: string
  title: string
  description?: string
  category?: string
  priority?: string
  status: string
  assignedTo?: string
  assignedAnalyst?: string
  assignedEngineer?: string
  investigationNotes?: string
  rootCause?: string
  workaround?: string
  knownError?: string
  technicalNotes?: string
  resolution?: string
  createdBy?: string
  createdAt?: string
  updatedAt?: string
}

interface ProblemManagementProps {
  problems: ProblemRecord[]
  loading: boolean
  isManagerAdmin: boolean
  currentUserEmail?: string
  onRefresh: () => void
  apiFetch: (url: string, options?: RequestInit) => Promise<Response>
  setToast: (msg: string) => void
  initialSelectedProblem?: ProblemRecord | null
}

const CATEGORIES = ['Network', 'Software', 'Hardware', 'Database', 'Security', 'Infrastructure', 'Inquiry / Help']
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
const STATUSES = ['OPEN', 'ASSIGNED', 'INVESTIGATION', 'ROOT_CAUSE_IDENTIFIED', 'SOLUTION_IN_PROGRESS', 'RESOLVED', 'CLOSED']

function getPriorityColor(priority?: string) {
  const p = (priority || '').toUpperCase()
  if (p.includes('CRIT') || p.includes('1')) return { bg: '#fee2e2', text: '#b91c1c', border: '#fca5a5' }
  if (p.includes('HIGH') || p.includes('2')) return { bg: '#ffedd5', text: '#c2410c', border: '#fdba74' }
  if (p.includes('MED') || p.includes('3')) return { bg: '#fef3c7', text: '#b45309', border: '#fcd34d' }
  return { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' }
}

function getStatusColor(status?: string) {
  const s = (status || '').toUpperCase()
  if (s === 'RESOLVED' || s === 'CLOSED') return { bg: '#ecfdf5', text: '#047857', border: '#a7f3d0' }
  if (s === 'INVESTIGATION' || s === 'ROOT_CAUSE_IDENTIFIED') return { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' }
  if (s === 'SOLUTION_IN_PROGRESS') return { bg: '#faf5ff', text: '#7e22ce', border: '#e9d5ff' }
  if (s === 'ASSIGNED') return { bg: '#fff7ed', text: '#c2410c', border: '#fed7aa' }
  return { bg: '#f8fafc', text: '#334155', border: '#e2e8f0' }
}

export default function ProblemManagement({
  problems,
  loading,
  isManagerAdmin,
  currentUserEmail,
  onRefresh,
  apiFetch,
  setToast,
  initialSelectedProblem,
}: ProblemManagementProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [createOpen, setCreateOpen] = useState(false)
  const [detailProblem, setDetailProblem] = useState<ProblemRecord | null>(initialSelectedProblem || null)
  const [detailTab, setDetailTab] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  // Create Form State
  const [newTitle, setNewTitle] = useState('')
  const [newCategory, setNewCategory] = useState('Network')
  const [newPriority, setNewPriority] = useState('MEDIUM')
  const [newDescription, setNewDescription] = useState('')
  const [copied, setCopied] = useState(false)
  const currentProblemNumber = 'PRB' + String(10001 + problems.length).padStart(7, '0')

  // Edit / Action State for Selected Problem
  const [assignAnalyst, setAssignAnalyst] = useState('')
  const [assignEngineer, setAssignEngineer] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [editPriority, setEditPriority] = useState('')
  const [investigationNotes, setInvestigationNotes] = useState('')
  const [rootCause, setRootCause] = useState('')
  const [workaround, setWorkaround] = useState('')
  const [knownError, setKnownError] = useState('')
  const [technicalNotes, setTechnicalNotes] = useState('')
  const [resolution, setResolution] = useState('')
  const [newStatus, setNewStatus] = useState('')

  // Sync edit state when detailProblem changes
  const openDetail = (p: ProblemRecord) => {
    setDetailProblem(p)
    setAssignAnalyst(p.assignedAnalyst || '')
    setAssignEngineer(p.assignedEngineer || '')
    setEditCategory(p.category || 'Network')
    setEditPriority(p.priority || 'MEDIUM')
    setInvestigationNotes(p.investigationNotes || '')
    setRootCause(p.rootCause || '')
    setWorkaround(p.workaround || '')
    setKnownError(p.knownError || '')
    setTechnicalNotes(p.technicalNotes || '')
    setResolution(p.resolution || '')
    setNewStatus(p.status || 'OPEN')
    setDetailTab(0)
  }

  // Filtered problems
  const filteredProblems = useMemo(() => {
    return problems.filter((p) => {
      if (statusFilter !== 'ALL' && p.status?.toUpperCase() !== statusFilter) {
        return false
      }
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return (
        (p.problemNumber || '').toLowerCase().includes(q) ||
        (p.title || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q) ||
        (p.priority || '').toLowerCase().includes(q) ||
        (p.rootCause || '').toLowerCase().includes(q) ||
        (p.assignedAnalyst || '').toLowerCase().includes(q) ||
        (p.assignedEngineer || '').toLowerCase().includes(q)
      )
    })
  }, [problems, search, statusFilter])

  // Summary counts
  const stats = useMemo(() => {
    const total = problems.length
    const open = problems.filter((p) => p.status === 'OPEN' || p.status === 'ASSIGNED').length
    const investigation = problems.filter((p) => p.status === 'INVESTIGATION' || p.status === 'ROOT_CAUSE_IDENTIFIED' || p.status === 'SOLUTION_IN_PROGRESS').length
    const resolved = problems.filter((p) => p.status === 'RESOLVED' || p.status === 'CLOSED').length
    return { total, open, investigation, resolved }
  }, [problems])

  // Create problem handler
  const handleCreate = async () => {
    if (!newTitle.trim()) {
      setToast('Please enter a problem title.')
      return
    }
    setSubmitting(true)
    try {
      const res = await apiFetch('/api/problems', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          category: newCategory,
          priority: newPriority,
          description: newDescription.trim(),
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || 'Failed to create problem.')
      }
      const created = await res.json()
      setToast(`Problem ${created.problemNumber || 'created'} successfully!`)
      setCreateOpen(false)
      setNewTitle('')
      setNewDescription('')
      onRefresh()
    } catch (e: any) {
      setToast(e.message || 'Error creating problem.')
    } finally {
      setSubmitting(false)
    }
  }

  // Update assignment & categorization (Manager/Admin)
  const handleSaveManagement = async () => {
    if (!detailProblem) return
    setSubmitting(true)
    try {
      const res = await apiFetch(`/api/problems/${detailProblem.id}/management`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: editCategory,
          priority: editPriority,
          assignedAnalyst: assignAnalyst.trim(),
          assignedEngineer: assignEngineer.trim(),
        }),
      })
      if (!res.ok) throw new Error('Failed to update problem management assignments.')
      const updated = await res.json()
      setDetailProblem(updated)
      setToast(`Updated assignment for ${updated.problemNumber || 'problem'}.`)
      onRefresh()
    } catch (e: any) {
      setToast(e.message || 'Error updating management assignment.')
    } finally {
      setSubmitting(false)
    }
  }

  // Update investigation (Analyst or Manager/Admin)
  const handleSaveInvestigation = async () => {
    if (!detailProblem) return
    setSubmitting(true)
    try {
      const res = await apiFetch(`/api/problems/${detailProblem.id}/investigation`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          investigationNotes,
          rootCause,
          workaround,
          knownError,
          status: 'INVESTIGATION',
        }),
      })
      if (!res.ok) throw new Error('Failed to update investigation notes.')
      const updated = await res.json()
      setDetailProblem(updated)
      setToast('Investigation notes updated successfully.')
      onRefresh()
    } catch (e: any) {
      setToast(e.message || 'Error updating investigation.')
    } finally {
      setSubmitting(false)
    }
  }

  // Update technical work / resolution (Engineer or Manager/Admin)
  const handleSaveTechnical = async () => {
    if (!detailProblem) return
    setSubmitting(true)
    try {
      const res = await apiFetch(`/api/problems/${detailProblem.id}/technical-work`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          technicalNotes,
          resolution,
          status: resolution.trim() ? 'RESOLVED' : 'SOLUTION_IN_PROGRESS',
        }),
      })
      if (!res.ok) throw new Error('Failed to update technical resolution.')
      const updated = await res.json()
      setDetailProblem(updated)
      setToast('Technical resolution updated successfully.')
      onRefresh()
    } catch (e: any) {
      setToast(e.message || 'Error updating technical resolution.')
    } finally {
      setSubmitting(false)
    }
  }

  // Update Status directly (Manager/Admin)
  const handleSaveStatus = async () => {
    if (!detailProblem || !newStatus) return
    setSubmitting(true)
    try {
      const res = await apiFetch(`/api/problems/${detailProblem.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error('Failed to update status.')
      const updated = await res.json()
      setDetailProblem(updated)
      setToast(`Status updated to ${updated.status}.`)
      onRefresh()
    } catch (e: any) {
      setToast(e.message || 'Error updating status.')
    } finally {
      setSubmitting(false)
    }
  }

  // Delete problem (Admin)
  const handleDelete = async () => {
    if (!detailProblem || !window.confirm(`Are you sure you want to delete problem ${detailProblem.problemNumber || detailProblem.id}?`)) return
    setSubmitting(true)
    try {
      const res = await apiFetch(`/api/problems/${detailProblem.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete problem.')
      setToast(`Problem ${detailProblem.problemNumber || detailProblem.id} deleted.`)
      setDetailProblem(null)
      onRefresh()
    } catch (e: any) {
      setToast(e.message || 'Error deleting problem.')
    } finally {
      setSubmitting(false)
    }
  }

  if (createOpen) {
    return (
      <Box className="sn-form-container">
        {/* ServiceNow Header */}
        <Box className="sn-form-header">
          <Box className="sn-header-left">
            <IconButton size="small" onClick={() => setCreateOpen(false)} title="Back" sx={{ color: '#475569', p: 0.5 }}>
              <ArrowBackRounded fontSize="small" />
            </IconButton>
            <Box>
              <Typography className="sn-title">Problem · {currentProblemNumber}</Typography>
              <Typography className="sn-subtitle">New record · Problem Management</Typography>
            </Box>
          </Box>
          <Box className="sn-header-right">
            <Button variant="outlined" size="small" onClick={() => setCreateOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button
              variant="contained"
              size="small"
              className="sn-submit-btn"
              disabled={submitting || !newTitle.trim()}
              onClick={handleCreate}
            >
              {submitting ? <><CircularProgress size={14} sx={{ mr: 1 }} />Submitting…</> : 'Submit problem'}
            </Button>
          </Box>
        </Box>

        {/* Clean 2-Column Form Body */}
        <Box className="sn-form-body">
          <Box className="sn-form-column">
            {/* Auto Generated ID Field */}
            <Box className="sn-field-row">
              <Typography className="sn-field-label">Number</Typography>
              <Box className="sn-field-input-wrap sn-number-wrap">
                <input
                  className="sn-input-styled sn-number-input"
                  readOnly
                  value={currentProblemNumber}
                  title="Auto-generated Problem Number"
                />
                <IconButton
                  size="small"
                  className="sn-search-icon-btn"
                  title={copied ? 'Copied!' : 'Copy Problem Number'}
                  onClick={() => {
                    navigator.clipboard?.writeText(currentProblemNumber)
                    setCopied(true)
                    window.setTimeout(() => setCopied(false), 3000)
                  }}
                >
                  {copied ? <CheckRounded fontSize="small" sx={{ color: '#16a34a' }} /> : <ContentCopyRounded fontSize="small" />}
                </IconButton>
              </Box>
            </Box>

            <Box className="sn-field-row">
              <Typography className="sn-field-label">
                <span className="sn-required">* </span>Title
              </Typography>
              <Box className="sn-field-input-wrap">
                <input
                  type="text"
                  className="sn-input-styled"
                  placeholder="e.g. Core Network Gateway High Latency"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </Box>
            </Box>

            <Box className="sn-field-row">
              <Typography className="sn-field-label">Category</Typography>
              <Box className="sn-field-input-wrap">
                <select
                  className="sn-select-styled"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </Box>
            </Box>

            <Box className="sn-field-row">
              <Typography className="sn-field-label">Priority</Typography>
              <Box className="sn-field-input-wrap">
                <select
                  className="sn-select-styled"
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value)}
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </Box>
            </Box>
          </Box>

          <Box className="sn-form-column">
            <Box className="sn-field-row">
              <Typography className="sn-field-label">Reported by</Typography>
              <Box className="sn-field-input-wrap">
                <input
                  type="text"
                  className="sn-input-styled"
                  readOnly
                  value={currentUserEmail || 'admin@northstar.local'}
                />
              </Box>
            </Box>

            <Box className="sn-field-row">
              <Typography className="sn-field-label">State</Typography>
              <Box className="sn-field-input-wrap">
                <input
                  type="text"
                  className="sn-input-styled"
                  readOnly
                  value="OPEN (New)"
                />
              </Box>
            </Box>

            <Box className="sn-field-row">
              <Typography className="sn-field-label">Impact</Typography>
              <Box className="sn-field-input-wrap">
                <select
                  className="sn-select-styled"
                  value={newPriority === 'CRITICAL' ? '1 - High' : newPriority === 'HIGH' ? '2 - Medium' : '3 - Low'}
                  disabled
                >
                  <option>{newPriority === 'CRITICAL' ? '1 - High' : newPriority === 'HIGH' ? '2 - Medium' : '3 - Low'}</option>
                </select>
              </Box>
            </Box>

            <Box className="sn-field-row">
              <Typography className="sn-field-label">Urgency</Typography>
              <Box className="sn-field-input-wrap">
                <select
                  className="sn-select-styled"
                  value={newPriority === 'CRITICAL' ? '1 - High' : newPriority === 'HIGH' ? '2 - Medium' : '3 - Low'}
                  disabled
                >
                  <option>{newPriority === 'CRITICAL' ? '1 - High' : newPriority === 'HIGH' ? '2 - Medium' : '3 - Low'}</option>
                </select>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Full width Description and Notes */}
        <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #e2e8f0' }}>
          <Box className="sn-field-row" sx={{ gridTemplateColumns: '140px 1fr', alignItems: 'flex-start' }}>
            <Typography className="sn-field-label" sx={{ pt: 1 }}>Description & Symptoms</Typography>
            <Box className="sn-field-input-wrap">
              <textarea
                className="sn-textarea-styled"
                rows={4}
                placeholder="Provide context, affected services, error logs, and impact observations..."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
              />
            </Box>
          </Box>
        </Box>
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {/* Top Header Card */}
      <Paper className="content-card" sx={{ p: 3, border: '1px solid #e2e8f0', borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
              <Box sx={{ p: 1, bgcolor: '#f0fdf4', borderRadius: 1.5, color: '#16a34a', display: 'flex' }}>
                <ReportProblemRounded sx={{ fontSize: 28 }} />
              </Box>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a' }}>
                  Problem Management
                </Typography>
                <Typography sx={{ fontSize: 13, color: '#64748b' }}>
                  Investigate root causes, document workarounds, eliminate recurring incidents, and track known errors.
                </Typography>
              </Box>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<RefreshRounded />}
              onClick={onRefresh}
              disabled={loading}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<AddRounded />}
              onClick={() => setCreateOpen(true)}
              sx={{
                bgcolor: '#0f766e',
                '&:hover': { bgcolor: '#115e59' },
                textTransform: 'none',
                fontWeight: 600,
                boxShadow: 'none',
              }}
            >
              New problem
            </Button>
          </Box>
        </Box>

        {/* Metric Badges */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' }, gap: 1.5, mt: 3 }}>
          <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 1.5, border: '1px solid #e2e8f0' }}>
            <Typography sx={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
              Total Problems
            </Typography>
            <Typography sx={{ fontSize: 24, fontWeight: 700, color: '#0f172a', mt: 0.5 }}>
              {stats.total}
            </Typography>
          </Box>
          <Box sx={{ p: 2, bgcolor: '#fff7ed', borderRadius: 1.5, border: '1px solid #fed7aa' }}>
            <Typography sx={{ fontSize: 11, fontWeight: 600, color: '#c2410c', textTransform: 'uppercase' }}>
              Open & Assigned
            </Typography>
            <Typography sx={{ fontSize: 24, fontWeight: 700, color: '#9a3412', mt: 0.5 }}>
              {stats.open}
            </Typography>
          </Box>
          <Box sx={{ p: 2, bgcolor: '#eff6ff', borderRadius: 1.5, border: '1px solid #bfdbfe' }}>
            <Typography sx={{ fontSize: 11, fontWeight: 600, color: '#1d4ed8', textTransform: 'uppercase' }}>
              Under Investigation
            </Typography>
            <Typography sx={{ fontSize: 24, fontWeight: 700, color: '#1e40af', mt: 0.5 }}>
              {stats.investigation}
            </Typography>
          </Box>
          <Box sx={{ p: 2, bgcolor: '#ecfdf5', borderRadius: 1.5, border: '1px solid #a7f3d0' }}>
            <Typography sx={{ fontSize: 11, fontWeight: 600, color: '#047857', textTransform: 'uppercase' }}>
              Resolved & Closed
            </Typography>
            <Typography sx={{ fontSize: 24, fontWeight: 700, color: '#065f46', mt: 0.5 }}>
              {stats.resolved}
            </Typography>
          </Box>
        </Box>

        {/* Search & Filters */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 1.5, mt: 3, alignItems: 'center' }}>
          <Box sx={{ flex: 1, width: '100%', position: 'relative' }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search problems by number, title, category, root cause, assignee..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: <SearchRounded sx={{ color: '#94a3b8', mr: 1, fontSize: 20 }} />,
                },
              }}
              sx={{ bgcolor: '#ffffff' }}
            />
          </Box>
          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', width: { xs: '100%', md: 'auto' } }}>
            {['ALL', 'OPEN', 'INVESTIGATION', 'ROOT_CAUSE_IDENTIFIED', 'RESOLVED', 'CLOSED'].map((st) => (
              <Chip
                key={st}
                label={st === 'ALL' ? 'All Status' : st.replace(/_/g, ' ')}
                clickable
                onClick={() => setStatusFilter(st)}
                size="small"
                variant={statusFilter === st ? 'filled' : 'outlined'}
                color={statusFilter === st ? 'primary' : 'default'}
                sx={{ fontSize: 12, fontWeight: 600 }}
              />
            ))}
          </Box>
        </Box>
      </Paper>

      {/* Problems List */}
      <Paper className="content-card" sx={{ p: 2.5, border: '1px solid #e2e8f0', borderRadius: 2 }}>
        {filteredProblems.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <ReportProblemRounded sx={{ fontSize: 48, color: '#cbd5e1', mb: 1 }} />
            <Typography sx={{ fontSize: 16, fontWeight: 600, color: '#475569' }}>
              No problems found
            </Typography>
            <Typography sx={{ fontSize: 13, color: '#94a3b8', mt: 0.5 }}>
              {search || statusFilter !== 'ALL'
                ? 'Try adjusting your search query or status filter.'
                : 'Click "New problem" to register a high-impact issue.'}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {filteredProblems.map((p) => {
              const pStyle = getPriorityColor(p.priority)
              const sStyle = getStatusColor(p.status)
              return (
                <Box
                  key={p.id}
                  onClick={() => openDetail(p)}
                  sx={{
                    p: 2,
                    border: '1px solid #e2e8f0',
                    borderRadius: 1.5,
                    bgcolor: '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    justifyContent: 'space-between',
                    gap: 1.5,
                    '&:hover': {
                      borderColor: '#0f766e',
                      bgcolor: '#f8fafc',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, flex: 1 }}>
                    <Box
                      sx={{
                        p: 1.25,
                        borderRadius: 1.5,
                        bgcolor: sStyle.bg,
                        color: sStyle.text,
                        border: `1px solid ${sStyle.border}`,
                        display: 'flex',
                      }}
                    >
                      <ReportProblemRounded sx={{ fontSize: 24 }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.5 }}>
                        <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#0f766e' }}>
                          {p.problemNumber || `PRB${p.id}`}
                        </Typography>
                        <Chip
                          size="small"
                          label={p.priority || 'MEDIUM'}
                          sx={{
                            height: 20,
                            fontSize: 10,
                            fontWeight: 700,
                            bgcolor: pStyle.bg,
                            color: pStyle.text,
                            border: `1px solid ${pStyle.border}`,
                          }}
                        />
                        <Chip
                          size="small"
                          label={p.category || 'General'}
                          variant="outlined"
                          sx={{ height: 20, fontSize: 11, borderColor: '#cbd5e1' }}
                        />
                        {p.rootCause && (
                          <Chip
                            size="small"
                            icon={<PsychologyRounded sx={{ fontSize: '14px !important' }} />}
                            label="Root Cause Documented"
                            sx={{ height: 20, fontSize: 10, bgcolor: '#eff6ff', color: '#1d4ed8' }}
                          />
                        )}
                        {p.workaround && (
                          <Chip
                            size="small"
                            label="Workaround Available"
                            sx={{ height: 20, fontSize: 10, bgcolor: '#fef3c7', color: '#b45309' }}
                          />
                        )}
                      </Box>
                      <Typography sx={{ fontSize: 15, fontWeight: 600, color: '#0f172a' }}>
                        {p.title}
                      </Typography>
                      {p.description && (
                        <Typography
                          sx={{
                            fontSize: 12,
                            color: '#64748b',
                            mt: 0.5,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {p.description}
                        </Typography>
                      )}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1, flexWrap: 'wrap' }}>
                        <Typography sx={{ fontSize: 11, color: '#94a3b8' }}>
                          Reported by: <span style={{ color: '#475569', fontWeight: 600 }}>{p.createdBy || 'System'}</span>
                        </Typography>
                        {p.assignedAnalyst && (
                          <Typography sx={{ fontSize: 11, color: '#94a3b8' }}>
                            Analyst: <span style={{ color: '#0369a1', fontWeight: 600 }}>{p.assignedAnalyst}</span>
                          </Typography>
                        )}
                        {p.assignedEngineer && (
                          <Typography sx={{ fontSize: 11, color: '#94a3b8' }}>
                            Engineer: <span style={{ color: '#7c3aed', fontWeight: 600 }}>{p.assignedEngineer}</span>
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Chip
                      size="small"
                      label={(p.status || 'OPEN').replace(/_/g, ' ')}
                      sx={{
                        fontWeight: 700,
                        fontSize: 11,
                        bgcolor: sStyle.bg,
                        color: sStyle.text,
                        border: `1px solid ${sStyle.border}`,
                      }}
                    />
                    <ArrowForwardRounded sx={{ color: '#94a3b8', fontSize: 18 }} />
                  </Box>
                </Box>
              )
            })}
          </Box>
        )}
      </Paper>

      {/* PROBLEM DETAIL DIALOG */}
      {detailProblem && (
        <Dialog
          open={Boolean(detailProblem)}
          onClose={() => setDetailProblem(null)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle sx={{ p: 2.5, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#0f766e' }}>
                    {detailProblem.problemNumber || `PRB${detailProblem.id}`}
                  </Typography>
                  <Chip
                    size="small"
                    label={detailProblem.priority}
                    sx={{
                      height: 20,
                      fontSize: 10,
                      fontWeight: 700,
                      bgcolor: getPriorityColor(detailProblem.priority).bg,
                      color: getPriorityColor(detailProblem.priority).text,
                    }}
                  />
                  <Chip
                    size="small"
                    label={(detailProblem.status || 'OPEN').replace(/_/g, ' ')}
                    sx={{
                      height: 20,
                      fontSize: 10,
                      fontWeight: 700,
                      bgcolor: getStatusColor(detailProblem.status).bg,
                      color: getStatusColor(detailProblem.status).text,
                    }}
                  />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a' }}>
                  {detailProblem.title}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {isManagerAdmin && (
                  <IconButton
                    size="small"
                    color="error"
                    title="Delete Problem"
                    onClick={handleDelete}
                  >
                    <DeleteOutlineRounded fontSize="small" />
                  </IconButton>
                )}
                <IconButton size="small" onClick={() => setDetailProblem(null)}>
                  <CloseRounded />
                </IconButton>
              </Box>
            </Box>

            <Tabs
              value={detailTab}
              onChange={(_, v) => setDetailTab(v)}
              sx={{ minHeight: 38, mt: 1.5, '& .MuiTab-root': { minHeight: 38, py: 0.5, fontSize: 13, textTransform: 'none' } }}
            >
              <Tab label="Overview & Assignment" icon={<AssignmentIndRounded sx={{ fontSize: 16 }} />} iconPosition="start" />
              <Tab label="Investigation & Root Cause" icon={<PsychologyRounded sx={{ fontSize: 16 }} />} iconPosition="start" />
              <Tab label="Resolution & Technical Work" icon={<EngineeringRounded sx={{ fontSize: 16 }} />} iconPosition="start" />
            </Tabs>
          </DialogTitle>

          <DialogContent sx={{ p: 3 }}>
            {/* TAB 0: OVERVIEW & ASSIGNMENT */}
            {detailTab === 0 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <Box>
                  <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', mb: 0.5 }}>
                    Description
                  </Typography>
                  <Typography sx={{ fontSize: 14, color: '#334155', bgcolor: '#f8fafc', p: 1.5, borderRadius: 1.5, border: '1px solid #e2e8f0', whiteSpace: 'pre-wrap' }}>
                    {detailProblem.description || 'No description provided.'}
                  </Typography>
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <Box>
                    <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#64748b', mb: 0.5 }}>Created By</Typography>
                    <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{detailProblem.createdBy || 'Unknown'}</Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#64748b', mb: 0.5 }}>Created At</Typography>
                    <Typography sx={{ fontSize: 13, color: '#0f172a' }}>
                      {detailProblem.createdAt ? new Date(detailProblem.createdAt).toLocaleString() : 'Just now'}
                    </Typography>
                  </Box>
                </Box>

                <Divider />

                <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                  Management & Team Assignment
                </Typography>

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <Box>
                    <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#475569', mb: 0.5 }}>Assigned Analyst</Typography>
                    <TextField
                      size="small"
                      fullWidth
                      placeholder="e.g. analyst@northstar.local"
                      value={assignAnalyst}
                      onChange={(e) => setAssignAnalyst(e.target.value)}
                    />
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#475569', mb: 0.5 }}>Assigned Engineer</Typography>
                    <TextField
                      size="small"
                      fullWidth
                      placeholder="e.g. engineer@northstar.local"
                      value={assignEngineer}
                      onChange={(e) => setAssignEngineer(e.target.value)}
                    />
                  </Box>
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <Box>
                    <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#475569', mb: 0.5 }}>Category</Typography>
                    <Select
                      size="small"
                      fullWidth
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                    >
                      {CATEGORIES.map((c) => (
                        <MenuItem key={c} value={c}>{c}</MenuItem>
                      ))}
                    </Select>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#475569', mb: 0.5 }}>Priority</Typography>
                    <Select
                      size="small"
                      fullWidth
                      value={editPriority}
                      onChange={(e) => setEditPriority(e.target.value)}
                    >
                      {PRIORITIES.map((p) => (
                        <MenuItem key={p} value={p}>{p}</MenuItem>
                      ))}
                    </Select>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={handleSaveManagement}
                    disabled={submitting}
                    sx={{ bgcolor: '#0f766e', '&:hover': { bgcolor: '#115e59' }, textTransform: 'none' }}
                  >
                    Save Assignment & Category
                  </Button>
                </Box>

                <Divider />

                {/* Status Transition Control */}
                <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 1.5, border: '1px solid #e2e8f0' }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#0f172a', mb: 1 }}>
                    Lifecycle Status Transition
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                    <Select
                      size="small"
                      sx={{ minWidth: 200 }}
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                    >
                      {STATUSES.map((s) => (
                        <MenuItem key={s} value={s}>{s.replace(/_/g, ' ')}</MenuItem>
                      ))}
                    </Select>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={handleSaveStatus}
                      disabled={submitting || newStatus === detailProblem.status}
                      sx={{ textTransform: 'none', fontWeight: 600 }}
                    >
                      Apply Status
                    </Button>
                  </Box>
                </Box>
              </Box>
            )}

            {/* TAB 1: INVESTIGATION & ROOT CAUSE */}
            {detailTab === 1 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Alert severity="info" sx={{ fontSize: 12 }}>
                  Document the confirmed root cause and temporary workaround so the service desk can handle linked incidents effectively.
                </Alert>

                <TextField
                  label="Root Cause"
                  multiline
                  rows={3}
                  fullWidth
                  size="small"
                  placeholder="Explain the underlying technical root cause..."
                  value={rootCause}
                  onChange={(e) => setRootCause(e.target.value)}
                />

                <TextField
                  label="Temporary Workaround"
                  multiline
                  rows={3}
                  fullWidth
                  size="small"
                  placeholder="Provide interim steps for users or support to bypass the defect..."
                  value={workaround}
                  onChange={(e) => setWorkaround(e.target.value)}
                />

                <TextField
                  label="Known Error Record"
                  multiline
                  rows={2}
                  fullWidth
                  size="small"
                  placeholder="Known error references, vendor defect ticket IDs, CVEs..."
                  value={knownError}
                  onChange={(e) => setKnownError(e.target.value)}
                />

                <TextField
                  label="Analyst Investigation Notes"
                  multiline
                  rows={3}
                  fullWidth
                  size="small"
                  placeholder="Internal notes on logs analyzed, telemetry, reproduction steps..."
                  value={investigationNotes}
                  onChange={(e) => setInvestigationNotes(e.target.value)}
                />

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={handleSaveInvestigation}
                    disabled={submitting}
                    sx={{ bgcolor: '#0284c7', '&:hover': { bgcolor: '#0369a1' }, textTransform: 'none', fontWeight: 600 }}
                  >
                    Save Investigation
                  </Button>
                </Box>
              </Box>
            )}

            {/* TAB 2: RESOLUTION & TECHNICAL WORK */}
            {detailTab === 2 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Alert severity="success" sx={{ fontSize: 12 }}>
                  Document the permanent technical solution, code patches, configuration changes, and verification tests.
                </Alert>

                <TextField
                  label="Permanent Resolution Details"
                  multiline
                  rows={4}
                  fullWidth
                  size="small"
                  placeholder="Detail the permanent fix applied, pull requests, patch releases..."
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                />

                <TextField
                  label="Engineer Technical Notes"
                  multiline
                  rows={3}
                  fullWidth
                  size="small"
                  placeholder="Technical diagnostics, deployment versions, rollback procedures..."
                  value={technicalNotes}
                  onChange={(e) => setTechnicalNotes(e.target.value)}
                />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                  <Typography sx={{ fontSize: 12, color: '#64748b' }}>
                    Saving resolution will automatically mark status as <span style={{ fontWeight: 700, color: '#16a34a' }}>RESOLVED</span>.
                  </Typography>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={handleSaveTechnical}
                    disabled={submitting}
                    sx={{ bgcolor: '#16a34a', '&:hover': { bgcolor: '#15803d' }, textTransform: 'none', fontWeight: 600 }}
                  >
                    Save Resolution
                  </Button>
                </Box>
              </Box>
            )}
          </DialogContent>
        </Dialog>
      )}
    </Box>
  )
}
