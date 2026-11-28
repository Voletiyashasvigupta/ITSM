import { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from '@mui/material'
import {
  useAuth,
  type EmployeeDepartment,
  type OrganizationalGroup,
  type PortalRole,
} from './AuthContext'

/**
 * Summary record representing an employee user account in the portal.
 */
type UserSummary = {
  id: string
  employeeId?: string
  username: string
  fullName: string
  email: string
  role: PortalRole | null
  department: EmployeeDepartment | null
  orgGroup?: OrganizationalGroup | null
  managerId?: string | null
  managerName?: string | null
  active: boolean
  createdAt: string
}

type ManagerOption = {
  id: string
  employeeId?: string
  username: string
  fullName: string
  email: string
  role: PortalRole
  department?: EmployeeDepartment | null
  orgGroup?: OrganizationalGroup | null
}

/** Pre-defined department list with display labels. */
const departments: Array<{ value: EmployeeDepartment; label: string }> = [
  { value: 'IT', label: 'IT' },
  { value: 'SOFTWARE_ENGINEERING', label: 'Software Engineering' },
  { value: 'SALES', label: 'Sales' },
  { value: 'ADMINISTRATION', label: 'Administration' },
  { value: 'HUMAN_RESOURCES', label: 'Human Resources (HR)' },
  { value: 'FINANCE', label: 'Finance' },
  { value: 'FACILITIES', label: 'Facilities' },
  { value: 'OPERATIONS', label: 'Operations' },
  { value: 'CUSTOMER_SUPPORT', label: 'Customer Support' },
  { value: 'LEGAL', label: 'Legal' },
  { value: 'OTHER', label: 'Other' },
]

/** Supported organizational groups. */
const orgGroups: Array<{ value: OrganizationalGroup; label: string }> = [
  { value: 'GENERAL', label: 'General' },
  { value: 'CORPORATE', label: 'Corporate' },
  { value: 'COMPANY_INFRASTRUCTURE', label: 'Company Infrastructure' },
]

const createUserDefaults = () => ({
  fullName: '',
  username: '',
  employeeId: '',
  email: '',
  temporaryPassword: '',
  role: 'EMPLOYEE' as PortalRole,
  department: '' as EmployeeDepartment | '',
  orgGroup: 'GENERAL' as OrganizationalGroup,
  managerId: '',
})

/**
 * Administrative User Access Management Page.
 * Allows Manager and Administrator accounts to:
 * - List all registered user accounts with their organizational groups and personal managers.
 * - Assign portal access roles (`EMPLOYEE`, `MANAGER`, `MANAGER_ADMIN`), organizational groups,
 *   reporting managers, and departments (PUT /api/auth/admin/users/{id}/access).
 * - Provision new user accounts with temporary passwords.
 */
export default function UserAccessPage() {
  const { apiFetch } = useAuth()
  const [users, setUsers] = useState<UserSummary[]>([])
  const [managers, setManagers] = useState<ManagerOption[]>([])
  const [roles, setRoles] = useState<Record<string, PortalRole>>({})
  const [selectedDepartments, setSelectedDepartments] = useState<Record<string, EmployeeDepartment | ''>>({})
  const [selectedOrgGroups, setSelectedOrgGroups] = useState<Record<string, OrganizationalGroup | ''>>({})
  const [selectedManagers, setSelectedManagers] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [addUserOpen, setAddUserOpen] = useState(false)
  const [creatingUser, setCreatingUser] = useState(false)
  const [newUser, setNewUser] = useState(createUserDefaults)

  /**
   * Fetches registered accounts and eligible managers from the Auth Service.
   */
  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [usersRes, managersRes] = await Promise.all([
        apiFetch('/api/auth/admin/users'),
        apiFetch('/api/auth/managers'),
      ])
      if (!usersRes.ok) throw new Error(`Could not load accounts (${usersRes.status})`)
      const userData = (await usersRes.json()) as UserSummary[]
      setUsers(userData)

      if (managersRes.ok) {
        setManagers((await managersRes.json()) as ManagerOption[])
      }
      setError('')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load accounts')
    } finally {
      setLoading(false)
    }
  }, [apiFetch])

  useEffect(() => {
    void load()
  }, [load])

  /**
   * Saves updated role, department, organizational group, and personal manager assignments.
   */
  async function assign(userId: string) {
    const account = users.find((item) => item.id === userId)
    const role = roles[userId] ?? account?.role
    const department = selectedDepartments[userId] ?? account?.department ?? ''
    const orgGroup = selectedOrgGroups[userId] ?? account?.orgGroup ?? 'GENERAL'
    const managerId = selectedManagers[userId] !== undefined ? selectedManagers[userId] : (account?.managerId ?? '')
    if (!role || (role === 'EMPLOYEE' && !department)) return
    setSaving(userId)
    setError('')
    setSuccess('')
    try {
      const response = await apiFetch(`/api/auth/admin/users/${userId}/access`, {
        method: 'PUT',
        body: JSON.stringify({
          role,
          department: department || null,
          orgGroup: orgGroup || null,
          managerId: managerId || null,
        }),
      })
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { detail?: string; message?: string }
        throw new Error(body.detail || body.message || `Could not save access (${response.status})`)
      }
      await load()
      setSuccess('User access, organizational group, and manager hierarchy saved successfully.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save access')
    } finally {
      setSaving(null)
    }
  }

  const canCreateUser = Boolean(
    newUser.fullName.trim() &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newUser.email.trim()) &&
      newUser.temporaryPassword.length >= 12 &&
      (newUser.role !== 'EMPLOYEE' || newUser.department),
  )

  /**
   * Provisions a new user account with active status and an initial role/department/manager.
   */
  async function createUser() {
    if (!canCreateUser) return
    setCreatingUser(true)
    setError('')
    setSuccess('')
    try {
      const response = await apiFetch('/api/auth/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          ...newUser,
          fullName: newUser.fullName.trim(),
          username: newUser.username.trim().toLowerCase() || undefined,
          employeeId: newUser.employeeId.trim().toUpperCase() || undefined,
          email: newUser.email.trim(),
          department: newUser.department || null,
          orgGroup: newUser.orgGroup || null,
          managerId: newUser.managerId || null,
        }),
      })
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { detail?: string; message?: string }
        throw new Error(body.detail || body.message || `Could not add user (${response.status})`)
      }
      const created = (await response.json()) as UserSummary
      setNewUser(createUserDefaults())
      setAddUserOpen(false)
      await load()
      setSuccess(
        `${created.fullName} was added with active ${created.role === 'EMPLOYEE' ? 'Employee' : created.role === 'MANAGER' ? 'Manager' : 'Manager + Administrator'} access.`,
      )
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not add user')
    } finally {
      setCreatingUser(false)
    }
  }

  return (
    <>
      <Paper className="content-card" sx={{ p: 3 }}>
        <Box className="section-heading in-card" sx={{ mb: 2 }}>
          <Box>
            <Typography variant="h6">User access & organizational hierarchy</Typography>
            <Typography className="section-note">
              Assign portal access, organizational group (General, Corporate, Company Infrastructure), and personal reporting manager.
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              onClick={() => {
                setError('')
                setSuccess('')
                setAddUserOpen(true)
              }}
            >
              Add user
            </Button>
            <Button variant="outlined" onClick={() => void load()} disabled={loading}>
              Refresh
            </Button>
          </Box>
        </Box>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        {loading ? (
          <Typography color="text.secondary">Loading accounts…</Typography>
        ) : users.length === 0 ? (
          <Typography color="text.secondary">No accounts registered yet.</Typography>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Box sx={{ minWidth: 1250 }}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '1.2fr 1.1fr 0.7fr 1fr 1.1fr 1.1fr 1fr 0.6fr',
                  gap: 1.5,
                  py: 1,
                  px: 1,
                  color: 'text.secondary',
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                <span>Employee</span>
                <span>Email</span>
                <span>Status</span>
                <span>Org Group</span>
                <span>Reporting Manager</span>
                <span>Department / Team</span>
                <span>Portal Access</span>
                <span></span>
              </Box>
              {users.map((account) => {
                const nextRole = roles[account.id] ?? account.role
                const nextDepartment = selectedDepartments[account.id] ?? account.department ?? ''
                const nextOrgGroup = selectedOrgGroups[account.id] ?? account.orgGroup ?? 'GENERAL'
                const nextManagerId = selectedManagers[account.id] !== undefined ? selectedManagers[account.id] : (account.managerId ?? '')

                const unchanged =
                  account.active &&
                  nextRole === account.role &&
                  nextDepartment === (account.department ?? '') &&
                  nextOrgGroup === (account.orgGroup ?? 'GENERAL') &&
                  nextManagerId === (account.managerId ?? '')

                const saveDisabled =
                  saving === account.id || !nextRole || (nextRole === 'EMPLOYEE' && !nextDepartment) || unchanged

                return (
                  <Box
                    key={account.id}
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: '1.2fr 1.1fr 0.7fr 1fr 1.1fr 1.1fr 1fr 0.6fr',
                      gap: 1.5,
                      alignItems: 'center',
                      py: 1.4,
                      px: 1,
                      borderTop: '1px solid #eef0f5',
                    }}
                  >
                    <Box>
                      <Typography sx={{ fontSize: 13, fontWeight: 650 }}>{account.fullName}</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.25 }}>
                        <Typography sx={{ fontSize: 11, color: 'text.secondary', fontFamily: 'monospace' }}>
                          @{account.username || account.email.split('@')[0]}
                        </Typography>
                        <Chip
                          size="small"
                          label={account.employeeId || 'EMP-AUTO'}
                          sx={{ height: 18, fontSize: 10, fontWeight: 700, bgcolor: '#f1f5f9', color: '#0369a1', border: '1px solid #bae6fd' }}
                        />
                      </Box>
                    </Box>
                    <Typography sx={{ fontSize: 12 }} color="text.secondary">
                      {account.email}
                    </Typography>
                    <Chip
                      size="small"
                      label={account.active ? 'Active' : 'Pending'}
                      color={account.active ? 'success' : 'warning'}
                      variant="outlined"
                    />

                    {/* Organizational Group */}
                    <Select
                      size="small"
                      value={nextOrgGroup}
                      onChange={(event) => {
                        setSuccess('')
                        setSelectedOrgGroups((current) => ({
                          ...current,
                          [account.id]: event.target.value as OrganizationalGroup,
                        }))
                      }}
                      sx={{ minWidth: 135, fontSize: 12 }}
                    >
                      {orgGroups.map((g) => (
                        <MenuItem key={g.value} value={g.value}>
                          {g.label}
                        </MenuItem>
                      ))}
                    </Select>

                    {/* Reporting Manager Dropdown */}
                    <Select
                      size="small"
                      value={nextManagerId}
                      displayEmpty
                      onChange={(event) => {
                        setSuccess('')
                        setSelectedManagers((current) => ({
                          ...current,
                          [account.id]: event.target.value,
                        }))
                      }}
                      sx={{ minWidth: 155, fontSize: 12 }}
                    >
                      <MenuItem value="">
                        <em>(No manager assigned)</em>
                      </MenuItem>
                      {managers
                        .filter((m) => m.id !== account.id) // Cannot assign self as manager
                        .map((mgr) => (
                          <MenuItem key={mgr.id} value={mgr.id}>
                            {mgr.fullName} ({mgr.role === 'MANAGER_ADMIN' ? 'Admin' : 'Manager'})
                          </MenuItem>
                        ))}
                    </Select>

                    {/* Department */}
                    <Select
                      size="small"
                      value={nextDepartment}
                      displayEmpty
                      onChange={(event) => {
                        setSuccess('')
                        setSelectedDepartments((current) => ({
                          ...current,
                          [account.id]: event.target.value as EmployeeDepartment,
                        }))
                      }}
                      sx={{ minWidth: 155, fontSize: 12 }}
                    >
                      <MenuItem value="" disabled>
                        Select department
                      </MenuItem>
                      {departments.map((department) => (
                        <MenuItem key={department.value} value={department.value}>
                          {department.label}
                        </MenuItem>
                      ))}
                    </Select>

                    {/* Portal Access Role */}
                    <Select
                      size="small"
                      value={nextRole ?? ''}
                      displayEmpty
                      onChange={(event) => {
                        setSuccess('')
                        setRoles((current) => ({
                          ...current,
                          [account.id]: event.target.value as PortalRole,
                        }))
                      }}
                      sx={{ minWidth: 145, fontSize: 12 }}
                    >
                      <MenuItem value="" disabled>
                        Select access
                      </MenuItem>
                      <MenuItem value="EMPLOYEE">Employee</MenuItem>
                      <MenuItem value="MANAGER">Manager</MenuItem>
                      <MenuItem value="MANAGER_ADMIN">Manager + Admin</MenuItem>
                    </Select>

                    <Button
                      size="small"
                      variant="contained"
                      disabled={saveDisabled}
                      onClick={() => void assign(account.id)}
                    >
                      {saving === account.id ? 'Saving…' : 'Save'}
                    </Button>
                  </Box>
                )
              })}
            </Box>
          </Box>
        )}
      </Paper>

      {/* Add User Dialog */}
      <Dialog
        open={addUserOpen}
        onClose={() => {
          if (!creatingUser) setAddUserOpen(false)
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Add a user</DialogTitle>
        <DialogContent dividers>
          <Typography color="text.secondary" sx={{ fontSize: 12, mb: 2 }}>
            Create an active account and configure organizational group, personal manager, and portal access.
          </Typography>
          <TextField
            autoFocus
            fullWidth
            required
            label="Full name"
            value={newUser.fullName}
            onChange={(event) => setNewUser((current) => ({ ...current, fullName: event.target.value }))}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Corporate Username"
            placeholder="e.g. alex.rivera (optional, defaults to email prefix)"
            value={newUser.username}
            onChange={(event) => setNewUser((current) => ({ ...current, username: event.target.value }))}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Employee ID (Optional)"
            placeholder="e.g. EMP-10001 (auto-assigned if omitted)"
            value={newUser.employeeId}
            onChange={(event) => setNewUser((current) => ({ ...current, employeeId: event.target.value }))}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            required
            type="email"
            label="Work email"
            value={newUser.email}
            onChange={(event) => setNewUser((current) => ({ ...current, email: event.target.value }))}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            required
            type="password"
            label="Temporary password"
            value={newUser.temporaryPassword}
            onChange={(event) => setNewUser((current) => ({ ...current, temporaryPassword: event.target.value }))}
            slotProps={{ htmlInput: { minLength: 12, maxLength: 72 } }}
            helperText="Use at least 12 characters. Share it securely; the user can change it in Settings."
            sx={{ mb: 2 }}
          />

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="new-user-org-group-label">Organizational Group</InputLabel>
            <Select
              labelId="new-user-org-group-label"
              label="Organizational Group"
              value={newUser.orgGroup}
              onChange={(event) => setNewUser((current) => ({ ...current, orgGroup: event.target.value as OrganizationalGroup }))}
            >
              {orgGroups.map((g) => (
                <MenuItem key={g.value} value={g.value}>
                  {g.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="new-user-manager-label">Reporting Personal Manager</InputLabel>
            <Select
              labelId="new-user-manager-label"
              label="Reporting Personal Manager"
              value={newUser.managerId}
              onChange={(event) => setNewUser((current) => ({ ...current, managerId: event.target.value }))}
            >
              <MenuItem value="">
                <em>(No manager assigned - will route to Admin Queue)</em>
              </MenuItem>
              {managers.map((mgr) => (
                <MenuItem key={mgr.id} value={mgr.id}>
                  {mgr.fullName} ({mgr.role === 'MANAGER_ADMIN' ? 'Admin' : 'Manager'}) - {mgr.employeeId}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth required sx={{ mb: 2 }}>
            <InputLabel id="new-user-access-label">Portal access</InputLabel>
            <Select
              labelId="new-user-access-label"
              label="Portal access"
              value={newUser.role}
              onChange={(event) => setNewUser((current) => ({ ...current, role: event.target.value as PortalRole }))}
            >
              <MenuItem value="EMPLOYEE">Employee</MenuItem>
              <MenuItem value="MANAGER">Manager</MenuItem>
              <MenuItem value="MANAGER_ADMIN">Manager + Administrator</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth required={newUser.role === 'EMPLOYEE'}>
            <InputLabel id="new-user-department-label">
              Department / team{newUser.role === 'EMPLOYEE' ? ' *' : ''}
            </InputLabel>
            <Select
              labelId="new-user-department-label"
              label={`Department / team${newUser.role === 'EMPLOYEE' ? ' *' : ''}`}
              value={newUser.department}
              onChange={(event) =>
                setNewUser((current) => ({ ...current, department: event.target.value as EmployeeDepartment }))
              }
            >
              <MenuItem value="">
                <em>{newUser.role === 'EMPLOYEE' ? 'Select a department' : 'No department'}</em>
              </MenuItem>
              {departments.map((department) => (
                <MenuItem key={department.value} value={department.value}>
                  {department.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={() => setAddUserOpen(false)} disabled={creatingUser}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => void createUser()}
            disabled={!canCreateUser || creatingUser}
          >
            {creatingUser ? 'Creating…' : 'Create user'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
