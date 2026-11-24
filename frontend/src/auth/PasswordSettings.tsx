import { useState } from 'react'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material'
import {
  AdminPanelSettingsRounded,
  PersonOutlineRounded,
  NotificationsNoneRounded,
  SecurityRounded,
  TuneRounded,
  StorageRounded,
  SaveRounded,
  LockOutlined,
  DownloadRounded,
  RestartAltRounded,
  ArrowForwardRounded,
  CheckCircleOutlineRounded,
} from '@mui/icons-material'
import { useAuth } from './AuthContext'

export type SettingsProps = {
  onNavigate?: (page: string) => void
  setToast?: (msg: string) => void
}

export default function PasswordSettings({ onNavigate, setToast }: SettingsProps) {
  const { user, apiFetch, isImpersonating } = useAuth()
  const isManagerAdmin = user?.role === 'MANAGER_ADMIN'

  // Active Tab
  const [activeTab, setActiveTab] = useState(0)

  // Password state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordMessage, setPasswordMessage] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordBusy, setPasswordBusy] = useState(false)

  // General Preferences (persisted in localStorage)
  const [generalPrefs, setGeneralPrefs] = useState(() => {
    try {
      const saved = localStorage.getItem('itsm_user_preferences')
      if (saved) return JSON.parse(saved)
    } catch {}
    return {
      landingPage: isManagerAdmin ? 'Admin dashboard' : 'Overview',
      refreshRate: '5',
      density: 'Default',
      timezone: 'America/New_York',
      dateFormat: 'MM/DD/YYYY',
    }
  })
  const [generalSavedNotice, setGeneralSavedNotice] = useState('')

  // Notifications Preferences (persisted in localStorage)
  const [notifPrefs, setNotifPrefs] = useState(() => {
    try {
      const saved = localStorage.getItem('itsm_notification_preferences')
      if (saved) return JSON.parse(saved)
    } catch {}
    return {
      emailRequestUpdates: true,
      emailIncidentComments: true,
      emailApprovals: true,
      emailP1Alerts: true,
      inAppToasts: true,
      inAppAudio: false,
      dailyDigest: true,
    }
  })
  const [notifSavedNotice, setNotifSavedNotice] = useState('')

  // ITSM Admin System Policies (persisted in localStorage)
  const [itsmPolicies, setItsmPolicies] = useState(() => {
    try {
      const saved = localStorage.getItem('itsm_system_config')
      if (saved) return JSON.parse(saved)
    } catch {}
    return {
      incidentPrefix: 'INC',
      requestPrefix: 'REQ',
      defaultPriority: 'P3 - Moderate',
      autoApproveThreshold: '100',
      autoEscalateAging: true,
      strictApproverValidation: true,
      p1ResponseMinutes: '15',
      p1ResolutionHours: '4',
      p2ResponseMinutes: '60',
      p2ResolutionHours: '8',
    }
  })
  const [policySavedNotice, setPolicySavedNotice] = useState('')

  // Save General Preferences
  function saveGeneralPrefs(e: React.FormEvent) {
    e.preventDefault()
    try {
      localStorage.setItem('itsm_user_preferences', JSON.stringify(generalPrefs))
      setGeneralSavedNotice('Workspace preferences saved successfully.')
      setToast?.('Preferences updated.')
      setTimeout(() => setGeneralSavedNotice(''), 3000)
    } catch {
      setGeneralSavedNotice('Failed to save preferences to browser storage.')
    }
  }

  // Save Notification Preferences
  function saveNotifPrefs(e: React.FormEvent) {
    e.preventDefault()
    try {
      localStorage.setItem('itsm_notification_preferences', JSON.stringify(notifPrefs))
      setNotifSavedNotice('Notification rules saved successfully.')
      setToast?.('Notification rules updated.')
      setTimeout(() => setNotifSavedNotice(''), 3000)
    } catch {
      setNotifSavedNotice('Failed to save notification settings.')
    }
  }

  // Save ITSM Policies
  function saveItsmPolicies(e: React.FormEvent) {
    e.preventDefault()
    try {
      localStorage.setItem('itsm_system_config', JSON.stringify(itsmPolicies))
      setPolicySavedNotice('ITSM system policies updated and applied.')
      setToast?.('ITSM system policies updated.')
      setTimeout(() => setPolicySavedNotice(''), 3000)
    } catch {
      setPolicySavedNotice('Failed to save ITSM policies.')
    }
  }

  // Password update
  async function savePassword(event: React.FormEvent) {
    event.preventDefault()
    setPasswordMessage('')
    setPasswordError('')

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation password do not match.')
      return
    }

    if (newPassword.length < 12) {
      setPasswordError('Password must contain at least 12 characters.')
      return
    }

    setPasswordBusy(true)
    try {
      const response = await apiFetch('/api/auth/me/password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      if (!response.ok) {
        try {
          const body = await response.json()
          setPasswordError(body.detail || body.message || `Could not change password (${response.status})`)
        } catch {
          setPasswordError(`Could not change password (${response.status})`)
        }
        return
      }
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordMessage('Password changed successfully.')
      setToast?.('Password updated successfully.')
    } catch (cause) {
      setPasswordError(cause instanceof Error ? cause.message : 'Could not change password')
    } finally {
      setPasswordBusy(false)
    }
  }

  // Export audit logs
  function handleExportAudit() {
    const auditData = {
      exportedAt: new Date().toISOString(),
      user: {
        id: user?.id,
        email: user?.email,
        fullName: user?.fullName,
        role: user?.role,
        department: user?.department,
      },
      system: {
        itsmPolicies,
        sessionType: 'JWT Bearer',
        isImpersonating,
      },
    }
    const blob = new Blob([JSON.stringify(auditData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `itsm-audit-log-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setToast?.('Audit log downloaded.')
  }

  // Reset dashboard layout
  function handleResetDashboard() {
    try {
      localStorage.removeItem('sn_shared_admin_dashboard')
      setToast?.('Admin dashboard layout reset to factory defaults.')
      alert('Shared Admin Dashboard layout has been reset to defaults. It will re-initialize on next visit.')
    } catch {
      setToast?.('Could not reset dashboard layout.')
    }
  }

  const initials = user?.fullName
    ? user.fullName
        .split(/\s+/)
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'U'

  return (
    <Box sx={{ maxWidth: 1040, pb: 8 }}>
      {/* Privilege & User Identity Header Banner */}
      <Paper
        className="content-card"
        sx={{
          p: 3,
          mb: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
          background: isManagerAdmin
            ? 'linear-gradient(135deg, #ffffff 0%, #f0f7ff 100%)'
            : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderLeft: isManagerAdmin ? '5px solid #0284c7' : '5px solid #64748b',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            sx={{
              width: 52,
              height: 52,
              bgcolor: isManagerAdmin ? '#0284c7' : '#475569',
              fontWeight: 700,
              fontSize: 20,
              boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
            }}
          >
            {initials}
          </Avatar>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap' }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#16324f' }}>
                {user?.fullName || 'User Profile'}
              </Typography>
              <Chip
                icon={isManagerAdmin ? <AdminPanelSettingsRounded sx={{ fontSize: 16 }} /> : <PersonOutlineRounded sx={{ fontSize: 16 }} />}
                label={isManagerAdmin ? 'Manager + Administrator' : 'Employee'}
                size="small"
                color={isManagerAdmin ? 'primary' : 'default'}
                sx={{ fontWeight: 700, fontSize: 11 }}
              />
              {isImpersonating && (
                <Chip label="Test Session Active" size="small" color="warning" sx={{ fontWeight: 600, fontSize: 11 }} />
              )}
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {user?.email} · {user?.department?.replaceAll('_', ' ') || 'General Organization'}
            </Typography>
            <Typography variant="caption" sx={{ color: isManagerAdmin ? '#0284c7' : '#64748b', fontWeight: 600 }}>
              {isManagerAdmin
                ? '★ Full Privilege Access: ITSM policies, user access administration, and approvals enabled'
                : 'Standard Privilege Access: Personal workspace preferences and security settings'}
            </Typography>
          </Box>
        </Box>

        {isManagerAdmin && onNavigate && (
          <Button
            variant="outlined"
            size="small"
            endIcon={<ArrowForwardRounded />}
            onClick={() => onNavigate('User access')}
            sx={{ textTransform: 'none', fontWeight: 600, borderColor: '#cbd5e1' }}
          >
            Manage User Access
          </Button>
        )}
      </Paper>

      {/* Tabs Navigation */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: 14,
              minHeight: 48,
            },
          }}
        >
          <Tab icon={<TuneRounded sx={{ fontSize: 18 }} />} iconPosition="start" label="Workspace Preferences" />
          <Tab icon={<NotificationsNoneRounded sx={{ fontSize: 18 }} />} iconPosition="start" label="Notifications & Alerts" />
          <Tab icon={<SecurityRounded sx={{ fontSize: 18 }} />} iconPosition="start" label="Security & Password" />
          <Tab
            icon={isManagerAdmin ? <AdminPanelSettingsRounded sx={{ fontSize: 18 }} /> : <LockOutlined sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <span>ITSM Policies</span>
                <Chip label="Admin" size="small" color={isManagerAdmin ? 'primary' : 'default'} sx={{ height: 18, fontSize: 10, fontWeight: 700 }} />
              </Box>
            }
          />
          <Tab
            icon={isManagerAdmin ? <StorageRounded sx={{ fontSize: 18 }} /> : <LockOutlined sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <span>Data & Governance</span>
                <Chip label="Admin" size="small" color={isManagerAdmin ? 'primary' : 'default'} sx={{ height: 18, fontSize: 10, fontWeight: 700 }} />
              </Box>
            }
          />
        </Tabs>
      </Box>

      {/* TAB 0: Workspace Preferences (Available to Everyone) */}
      {activeTab === 0 && (
        <Box component="form" onSubmit={saveGeneralPrefs}>
          <Paper className="content-card" sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
              Workspace Preferences
            </Typography>
            <Typography className="section-note" sx={{ mb: 3 }}>
              Configure your default view, auto-refresh frequency, and personal display formatting.
            </Typography>

            {generalSavedNotice && (
              <Alert severity="success" sx={{ mb: 3 }}>
                {generalSavedNotice}
              </Alert>
            )}

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="landing-page-label">Default Landing Page</InputLabel>
                <Select
                  labelId="landing-page-label"
                  label="Default Landing Page"
                  value={generalPrefs.landingPage}
                  onChange={(e) => setGeneralPrefs({ ...generalPrefs, landingPage: e.target.value })}
                >
                  {isManagerAdmin && <MenuItem value="Admin dashboard">Shared Admin Dashboard</MenuItem>}
                  <MenuItem value="Overview">Overview Hub</MenuItem>
                  <MenuItem value="Service catalog">Service Catalog</MenuItem>
                  <MenuItem value="My requests">My Requests</MenuItem>
                  <MenuItem value="Incidents">Incidents</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth size="small">
                <InputLabel id="refresh-rate-label">Live Data Sync Frequency</InputLabel>
                <Select
                  labelId="refresh-rate-label"
                  label="Live Data Sync Frequency"
                  value={generalPrefs.refreshRate}
                  onChange={(e) => setGeneralPrefs({ ...generalPrefs, refreshRate: e.target.value })}
                >
                  <MenuItem value="5">Every 5 seconds (Real-time)</MenuItem>
                  <MenuItem value="15">Every 15 seconds</MenuItem>
                  <MenuItem value="30">Every 30 seconds</MenuItem>
                  <MenuItem value="60">Every 60 seconds</MenuItem>
                  <MenuItem value="manual">Manual refresh only</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth size="small">
                <InputLabel id="density-label">Interface Density</InputLabel>
                <Select
                  labelId="density-label"
                  label="Interface Density"
                  value={generalPrefs.density}
                  onChange={(e) => setGeneralPrefs({ ...generalPrefs, density: e.target.value })}
                >
                  <MenuItem value="Comfortable">Comfortable (Spacious tables & cards)</MenuItem>
                  <MenuItem value="Default">Default (Balanced ServiceNow layout)</MenuItem>
                  <MenuItem value="Compact">Compact (High-density data rows)</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth size="small">
                <InputLabel id="timezone-label">Display Timezone</InputLabel>
                <Select
                  labelId="timezone-label"
                  label="Display Timezone"
                  value={generalPrefs.timezone}
                  onChange={(e) => setGeneralPrefs({ ...generalPrefs, timezone: e.target.value })}
                >
                  <MenuItem value="America/New_York">Eastern Time (US & Canada) [UTC-5]</MenuItem>
                  <MenuItem value="America/Chicago">Central Time [UTC-6]</MenuItem>
                  <MenuItem value="America/Los_Angeles">Pacific Time [UTC-8]</MenuItem>
                  <MenuItem value="Europe/London">London / GMT [UTC+0]</MenuItem>
                  <MenuItem value="Asia/Kolkata">India Standard Time (IST) [UTC+5:30]</MenuItem>
                  <MenuItem value="UTC">Coordinated Universal Time (UTC)</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth size="small">
                <InputLabel id="dateformat-label">Date Format</InputLabel>
                <Select
                  labelId="dateformat-label"
                  label="Date Format"
                  value={generalPrefs.dateFormat}
                  onChange={(e) => setGeneralPrefs({ ...generalPrefs, dateFormat: e.target.value })}
                >
                  <MenuItem value="MM/DD/YYYY">MM/DD/YYYY (e.g. 11/24/2026)</MenuItem>
                  <MenuItem value="DD/MM/YYYY">DD/MM/YYYY (e.g. 24/11/2026)</MenuItem>
                  <MenuItem value="YYYY-MM-DD">YYYY-MM-DD (ISO standard)</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button type="submit" variant="contained" startIcon={<SaveRounded />}>
                Save Preferences
              </Button>
            </Box>
          </Paper>

          {/* Account Profile Card */}
          <Paper className="content-card" sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
              Account Identity
            </Typography>
            <Typography className="section-note" sx={{ mb: 2.5 }}>
              Your verified employee credentials and organizational mapping.
            </Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
              <TextField label="Full Name" size="small" value={user?.fullName || ''} disabled fullWidth />
              <TextField label="Work Email" size="small" value={user?.email || ''} disabled fullWidth />
              <TextField
                label="Department"
                size="small"
                value={user?.department?.replaceAll('_', ' ') || 'None assigned'}
                disabled
                fullWidth
              />
              <TextField label="Account ID" size="small" value={user?.id || ''} disabled fullWidth />
            </Box>
          </Paper>
        </Box>
      )}

      {/* TAB 1: Notifications & Alerts (Available to Everyone) */}
      {activeTab === 1 && (
        <Box component="form" onSubmit={saveNotifPrefs}>
          <Paper className="content-card" sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
              Email Notifications
            </Typography>
            <Typography className="section-note" sx={{ mb: 2 }}>
              Select which portal events trigger automated email dispatches to {user?.email}.
            </Typography>

            {notifSavedNotice && (
              <Alert severity="success" sx={{ mb: 2.5 }}>
                {notifSavedNotice}
              </Alert>
            )}

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={notifPrefs.emailRequestUpdates}
                    onChange={(e) => setNotifPrefs({ ...notifPrefs, emailRequestUpdates: e.target.checked })}
                    color="primary"
                  />
                }
                label="Notify me when service requests change status (Approved, Rejected, Completed)"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={notifPrefs.emailIncidentComments}
                    onChange={(e) => setNotifPrefs({ ...notifPrefs, emailIncidentComments: e.target.checked })}
                    color="primary"
                  />
                }
                label="Notify me when a technician updates or adds work notes to my reported incidents"
              />

              {isManagerAdmin && (
                <>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0284c7' }}>
                    Manager & Administrator Alerts
                  </Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notifPrefs.emailApprovals}
                        onChange={(e) => setNotifPrefs({ ...notifPrefs, emailApprovals: e.target.checked })}
                        color="primary"
                      />
                    }
                    label="Urgent notifications when team requests require your manager approval"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notifPrefs.emailP1Alerts}
                        onChange={(e) => setNotifPrefs({ ...notifPrefs, emailP1Alerts: e.target.checked })}
                        color="error"
                      />
                    }
                    label="P1 Critical Incident escalation alerts (broadcast to incident commanders)"
                  />
                </>
              )}
            </Box>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
              In-App & Desktop Feedback
            </Typography>
            <Typography className="section-note" sx={{ mb: 2 }}>
              Control real-time notifications inside the browser portal.
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={notifPrefs.inAppToasts}
                    onChange={(e) => setNotifPrefs({ ...notifPrefs, inAppToasts: e.target.checked })}
                    color="primary"
                  />
                }
                label="Show pop-up toast alerts when data updates occur in active views"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={notifPrefs.inAppAudio}
                    onChange={(e) => setNotifPrefs({ ...notifPrefs, inAppAudio: e.target.checked })}
                    color="primary"
                  />
                }
                label="Audio chime for critical updates and incoming high-priority tickets"
              />
              {isManagerAdmin && (
                <FormControlLabel
                  control={
                    <Switch
                      checked={notifPrefs.dailyDigest}
                      onChange={(e) => setNotifPrefs({ ...notifPrefs, dailyDigest: e.target.checked })}
                      color="primary"
                    />
                  }
                  label="Daily morning operational digest of pending approvals and unresolved SLA breaches"
                />
              )}
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
              <Button type="submit" variant="contained" startIcon={<SaveRounded />}>
                Save Notification Rules
              </Button>
            </Box>
          </Paper>
        </Box>
      )}

      {/* TAB 2: Security & Credentials (Available to Everyone) */}
      {activeTab === 2 && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '3fr 2fr' }, gap: 3 }}>
          <Paper component="form" onSubmit={savePassword} className="content-card" sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
              Change Password
            </Typography>
            <Typography className="section-note" sx={{ mb: 2.5 }}>
              Enter your current password and choose a secure replacement containing at least 12 characters.
            </Typography>

            {passwordMessage && (
              <Alert severity="success" sx={{ mb: 2.5 }}>
                {passwordMessage}
              </Alert>
            )}
            {passwordError && (
              <Alert severity="error" sx={{ mb: 2.5 }}>
                {passwordError}
              </Alert>
            )}

            <TextField
              required
              fullWidth
              type="password"
              label="Current Password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              required
              fullWidth
              type="password"
              label="New Password"
              autoComplete="new-password"
              slotProps={{ htmlInput: { minLength: 12, maxLength: 72 } }}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              helperText="Must be at least 12 characters in length"
              sx={{ mb: 2 }}
            />
            <TextField
              required
              fullWidth
              type="password"
              label="Confirm New Password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              sx={{ mb: 3 }}
            />

            <Button type="submit" variant="contained" disabled={passwordBusy}>
              {passwordBusy ? 'Updating Password…' : 'Update Password'}
            </Button>
          </Paper>

          <Paper className="content-card" sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
              Security & Session
            </Typography>
            <Typography className="section-note" sx={{ mb: 2.5 }}>
              Authentication enforcement protocols.
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  AUTHENTICATION PROTOCOL
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Signed JWT Bearer (RS256)
                </Typography>
              </Box>

              <Divider />

              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  INACTIVITY TIMEOUT
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  60 minutes of idle time
                </Typography>
              </Box>

              <Divider />

              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  SINGLE SIGN-ON / 2FA
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                  <CheckCircleOutlineRounded color="success" sx={{ fontSize: 18 }} />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Corporate IdP MFA Enforced
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Paper>
        </Box>
      )}

      {/* TAB 3: ITSM System Policies (Restricted to MANAGER_ADMIN) */}
      {activeTab === 3 && (
        <Box>
          {!isManagerAdmin ? (
            <Paper className="content-card" sx={{ p: 4, textAlign: 'center' }}>
              <LockOutlined sx={{ fontSize: 48, color: '#94a3b8', mb: 1.5 }} />
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#16324f' }}>
                Administrator Privileges Required
              </Typography>
              <Typography color="text.secondary" sx={{ maxWidth: 480, mx: 'auto', mt: 1, mb: 3 }}>
                You are currently signed in with standard Employee privileges. Ticket numbering sequences, SLA triggers, and
                approval routing policies are restricted to Manager + Administrator accounts.
              </Typography>
              <Alert severity="info" sx={{ maxWidth: 480, mx: 'auto' }}>
                If your responsibilities require operational governance, please contact your systems administrator to request role promotion.
              </Alert>
            </Paper>
          ) : (
            <Box component="form" onSubmit={saveItsmPolicies}>
              <Paper className="content-card" sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    ITSM Ticket Formatting & Sequences
                  </Typography>
                  <Chip label="Admin Policy" size="small" color="primary" sx={{ height: 20, fontSize: 10, fontWeight: 700 }} />
                </Box>
                <Typography className="section-note" sx={{ mb: 2.5 }}>
                  Control ServiceNow ticket numbering conventions and default assignment rules.
                </Typography>

                {policySavedNotice && (
                  <Alert severity="success" sx={{ mb: 2.5 }}>
                    {policySavedNotice}
                  </Alert>
                )}

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5 }}>
                  <TextField
                    label="Incident Prefix"
                    size="small"
                    value={itsmPolicies.incidentPrefix}
                    onChange={(e) => setItsmPolicies({ ...itsmPolicies, incidentPrefix: e.target.value })}
                    helperText={`Generated identifier sample: ${itsmPolicies.incidentPrefix || 'INC'}0010045`}
                  />
                  <TextField
                    label="Service Request Prefix"
                    size="small"
                    value={itsmPolicies.requestPrefix}
                    onChange={(e) => setItsmPolicies({ ...itsmPolicies, requestPrefix: e.target.value })}
                    helperText={`Generated identifier sample: ${itsmPolicies.requestPrefix || 'REQ'}0010012`}
                  />
                  <FormControl fullWidth size="small">
                    <InputLabel id="default-priority-label">Default Incident Priority</InputLabel>
                    <Select
                      labelId="default-priority-label"
                      label="Default Incident Priority"
                      value={itsmPolicies.defaultPriority}
                      onChange={(e) => setItsmPolicies({ ...itsmPolicies, defaultPriority: e.target.value })}
                    >
                      <MenuItem value="P1 - Critical">P1 - Critical</MenuItem>
                      <MenuItem value="P2 - High">P2 - High</MenuItem>
                      <MenuItem value="P3 - Moderate">P3 - Moderate</MenuItem>
                      <MenuItem value="P4 - Low">P4 - Low</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField
                    label="Auto-Approve Threshold ($)"
                    size="small"
                    type="number"
                    value={itsmPolicies.autoApproveThreshold}
                    onChange={(e) => setItsmPolicies({ ...itsmPolicies, autoApproveThreshold: e.target.value })}
                    helperText="Catalog orders below this amount bypass manual approval"
                  />
                </Box>

                <Divider sx={{ my: 3 }} />

                <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                  Service Level Agreement (SLA) Targets
                </Typography>
                <Typography className="section-note" sx={{ mb: 2.5 }}>
                  Response and resolution thresholds for operational incident triage.
                </Typography>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                  <TextField
                    label="P1 Response Time Target"
                    size="small"
                    value={`${itsmPolicies.p1ResponseMinutes} minutes`}
                    disabled
                  />
                  <TextField
                    label="P1 Resolution Time Target"
                    size="small"
                    value={`${itsmPolicies.p1ResolutionHours} hours`}
                    disabled
                  />
                  <TextField
                    label="P2 Response Time Target"
                    size="small"
                    value={`${itsmPolicies.p2ResponseMinutes} minutes`}
                    disabled
                  />
                  <TextField
                    label="P2 Resolution Time Target"
                    size="small"
                    value={`${itsmPolicies.p2ResolutionHours} hours`}
                    disabled
                  />
                </Box>

                <Box sx={{ mt: 2.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={itsmPolicies.autoEscalateAging}
                        onChange={(e) => setItsmPolicies({ ...itsmPolicies, autoEscalateAging: e.target.checked })}
                        color="primary"
                      />
                    }
                    label="Automatically escalate aging incidents unresolved for longer than 24 hours"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={itsmPolicies.strictApproverValidation}
                        onChange={(e) => setItsmPolicies({ ...itsmPolicies, strictApproverValidation: e.target.checked })}
                        color="primary"
                      />
                    }
                    label="Require strict designated manager approval for hardware allocation and privilege access"
                  />
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                  <Button type="submit" variant="contained" startIcon={<SaveRounded />}>
                    Save ITSM Policies
                  </Button>
                </Box>
              </Paper>
            </Box>
          )}
        </Box>
      )}

      {/* TAB 4: Data & Governance (Restricted to MANAGER_ADMIN) */}
      {activeTab === 4 && (
        <Box>
          {!isManagerAdmin ? (
            <Paper className="content-card" sx={{ p: 4, textAlign: 'center' }}>
              <LockOutlined sx={{ fontSize: 48, color: '#94a3b8', mb: 1.5 }} />
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#16324f' }}>
                Access Denied
              </Typography>
              <Typography color="text.secondary" sx={{ maxWidth: 480, mx: 'auto', mt: 1 }}>
                System governance, audit log exports, and user role provisioning are reserved for administrators.
              </Typography>
            </Paper>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* User Governance */}
              <Paper className="content-card" sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                  User Access & Role Administration
                </Typography>
                <Typography className="section-note" sx={{ mb: 2 }}>
                  Assign departmental scopes, promote users to Manager + Administrator, and provision temporary test accounts.
                </Typography>
                <Button
                  variant="contained"
                  endIcon={<ArrowForwardRounded />}
                  onClick={() => onNavigate?.('User access')}
                >
                  Go to User Access Management
                </Button>
              </Paper>

              {/* Audit & Compliance */}
              <Paper className="content-card" sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                  Audit & Compliance Log Export
                </Typography>
                <Typography className="section-note" sx={{ mb: 2 }}>
                  Export diagnostic telemetry, session data, and configuration parameters for compliance review.
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<DownloadRounded />}
                  onClick={handleExportAudit}
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                >
                  Export Audit Log (.JSON)
                </Button>
              </Paper>

              {/* Maintenance & Reset */}
              <Paper className="content-card" sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                  Dashboard Reset & Local Cache Purge
                </Typography>
                <Typography className="section-note" sx={{ mb: 2 }}>
                  Reset custom widget arrangements on the Shared Admin Dashboard back to default factory ordering.
                </Typography>
                <Button
                  variant="outlined"
                  color="warning"
                  startIcon={<RestartAltRounded />}
                  onClick={handleResetDashboard}
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                >
                  Reset Shared Admin Dashboard Layout
                </Button>
              </Paper>
            </Box>
          )}
        </Box>
      )}
    </Box>
  )
}
