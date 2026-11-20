import { useCallback, useEffect, useState } from 'react'
import { Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, InputLabel, MenuItem, Paper, Select, TextField, Typography } from '@mui/material'
import { useAuth, type EmployeeDepartment, type PortalRole } from './AuthContext'

type UserSummary = { id: string; fullName: string; email: string; role: PortalRole | null; department: EmployeeDepartment | null; active: boolean; createdAt: string }
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
const createUserDefaults = () => ({ fullName: '', email: '', temporaryPassword: '', role: 'EMPLOYEE' as PortalRole, department: '' as EmployeeDepartment | '' })

export default function UserAccessPage() {
  const { apiFetch } = useAuth()
  const [users, setUsers] = useState<UserSummary[]>([])
  const [roles, setRoles] = useState<Record<string, PortalRole>>({})
  const [selectedDepartments, setSelectedDepartments] = useState<Record<string, EmployeeDepartment | ''>>({})
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [addUserOpen, setAddUserOpen] = useState(false)
  const [creatingUser, setCreatingUser] = useState(false)
  const [newUser, setNewUser] = useState(createUserDefaults)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const response = await apiFetch('/api/auth/admin/users')
      if (!response.ok) throw new Error(`Could not load accounts (${response.status})`)
      setUsers(await response.json() as UserSummary[])
      setError('')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load accounts')
    } finally {
      setLoading(false)
    }
  }, [apiFetch])

  useEffect(() => { void load() }, [load])

  async function assign(userId: string) {
    const account = users.find((item) => item.id === userId)
    const role = roles[userId] ?? account?.role
    const department = selectedDepartments[userId] ?? account?.department ?? ''
    if (!role || (role === 'EMPLOYEE' && !department)) return
    setSaving(userId)
    setError('')
    setSuccess('')
    try {
      const response = await apiFetch(`/api/auth/admin/users/${userId}/access`, {
        method: 'PUT', body: JSON.stringify({ role, department: department || null }),
      })
      if (!response.ok) throw new Error(`Could not save access (${response.status})`)
      await load()
      setSuccess('User access saved successfully.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save access')
    } finally {
      setSaving(null)
    }
  }

  const canCreateUser = Boolean(newUser.fullName.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newUser.email.trim()) && newUser.temporaryPassword.length >= 12
    && (newUser.role !== 'EMPLOYEE' || newUser.department))

  async function createUser() {
    if (!canCreateUser) return
    setCreatingUser(true)
    setError('')
    setSuccess('')
    try {
      const response = await apiFetch('/api/auth/admin/users', {
        method: 'POST',
        body: JSON.stringify({ ...newUser, fullName: newUser.fullName.trim(), email: newUser.email.trim(), department: newUser.department || null }),
      })
      if (!response.ok) {
        const body = await response.json().catch(() => ({})) as { detail?: string; message?: string }
        throw new Error(body.detail || body.message || `Could not add user (${response.status})`)
      }
      const created = await response.json() as UserSummary
      setNewUser(createUserDefaults())
      setAddUserOpen(false)
      await load()
      setSuccess(`${created.fullName} was added with active ${created.role === 'EMPLOYEE' ? 'Employee' : 'Manager + Administrator'} access.`)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not add user')
    } finally {
      setCreatingUser(false)
    }
  }

  return <>
  <Paper className="content-card" sx={{ p: 3 }}>
    <Box className="section-heading in-card" sx={{ mb: 2 }}>
      <Box><Typography variant="h6">User access</Typography><Typography className="section-note">Assign portal access and the employee’s department or team.</Typography></Box>
      <Box sx={{ display: 'flex', gap: 1 }}><Button variant="contained" onClick={() => { setError(''); setSuccess(''); setAddUserOpen(true) }}>Add user</Button><Button variant="outlined" onClick={() => void load()} disabled={loading}>Refresh</Button></Box>
    </Box>
    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
    {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
    {loading ? <Typography color="text.secondary">Loading accounts…</Typography> : users.length === 0 ? <Typography color="text.secondary">No accounts registered yet.</Typography> : <Box sx={{ overflowX: 'auto' }}>
      <Box sx={{ minWidth: 1050 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1.05fr 1.4fr .9fr 1.3fr 1.65fr .65fr', gap: 1.5, py: 1, px: 1, color: 'text.secondary', fontSize: 12, fontWeight: 700 }}><span>Employee</span><span>Email</span><span>Status</span><span>Department / team</span><span>Portal access</span><span></span></Box>
        {users.map((account) => {
          const nextRole = roles[account.id] ?? account.role
          const nextDepartment = selectedDepartments[account.id] ?? account.department ?? ''
          const unchanged = account.active && nextRole === account.role && nextDepartment === (account.department ?? '')
          const saveDisabled = saving === account.id || !nextRole || (nextRole === 'EMPLOYEE' && !nextDepartment) || unchanged
          return <Box key={account.id} sx={{ display: 'grid', gridTemplateColumns: '1.05fr 1.4fr .9fr 1.3fr 1.65fr .65fr', gap: 1.5, alignItems: 'center', py: 1.4, px: 1, borderTop: '1px solid #eef0f5' }}>
          <Typography sx={{ fontSize: 13, fontWeight: 650 }}>{account.fullName}</Typography>
          <Typography sx={{ fontSize: 12 }} color="text.secondary">{account.email}</Typography>
          <Chip size="small" label={account.active ? 'Active' : 'Pending access'} color={account.active ? 'success' : 'warning'} variant="outlined" />
          <Select size="small" value={nextDepartment} displayEmpty onChange={(event) => { setSuccess(''); setSelectedDepartments((current) => ({ ...current, [account.id]: event.target.value as EmployeeDepartment })) }} sx={{ minWidth: 175, fontSize: 12 }}>
            <MenuItem value="" disabled>Select department</MenuItem>
            {departments.map((department) => <MenuItem key={department.value} value={department.value}>{department.label}</MenuItem>)}
          </Select>
          <Select size="small" value={nextRole ?? ''} displayEmpty onChange={(event) => { setSuccess(''); setRoles((current) => ({ ...current, [account.id]: event.target.value as PortalRole })) }} sx={{ minWidth: 190, fontSize: 12 }}>
              <MenuItem value="" disabled>Select access</MenuItem>
              <MenuItem value="EMPLOYEE">Employee</MenuItem>
              <MenuItem value="MANAGER_ADMIN">Manager + Administrator</MenuItem>
          </Select>
          <Button size="small" variant="contained" disabled={saveDisabled} onClick={() => void assign(account.id)}>{saving === account.id ? 'Saving…' : 'Save'}</Button>
        </Box>
        })}
      </Box>
    </Box>}
  </Paper>
  <Dialog open={addUserOpen} onClose={() => { if (!creatingUser) setAddUserOpen(false) }} fullWidth maxWidth="sm">
    <DialogTitle>Add a user</DialogTitle>
    <DialogContent dividers>
      <Typography color="text.secondary" sx={{ fontSize: 12, mb: 2 }}>Create an active account and assign its portal access and department now.</Typography>
      <TextField autoFocus fullWidth required label="Full name" value={newUser.fullName} onChange={(event) => setNewUser((current) => ({ ...current, fullName: event.target.value }))} sx={{ mb: 2 }} />
      <TextField fullWidth required type="email" label="Work email" value={newUser.email} onChange={(event) => setNewUser((current) => ({ ...current, email: event.target.value }))} sx={{ mb: 2 }} />
      <TextField fullWidth required type="password" label="Temporary password" value={newUser.temporaryPassword} onChange={(event) => setNewUser((current) => ({ ...current, temporaryPassword: event.target.value }))} slotProps={{ htmlInput: { minLength: 12, maxLength: 72 } }} helperText="Use at least 12 characters. Share it securely; the user can change it in Settings." sx={{ mb: 2 }} />
      <FormControl fullWidth required sx={{ mb: 2 }}>
        <InputLabel id="new-user-access-label">Portal access</InputLabel><Select labelId="new-user-access-label" label="Portal access" value={newUser.role} onChange={(event) => setNewUser((current) => ({ ...current, role: event.target.value as PortalRole }))}>
          <MenuItem value="EMPLOYEE">Employee</MenuItem><MenuItem value="MANAGER_ADMIN">Manager + Administrator</MenuItem>
        </Select>
      </FormControl>
      <FormControl fullWidth required={newUser.role === 'EMPLOYEE'}>
        <InputLabel id="new-user-department-label">Department / team{newUser.role === 'EMPLOYEE' ? ' *' : ''}</InputLabel><Select labelId="new-user-department-label" label={`Department / team${newUser.role === 'EMPLOYEE' ? ' *' : ''}`} value={newUser.department} onChange={(event) => setNewUser((current) => ({ ...current, department: event.target.value as EmployeeDepartment }))}>
          <MenuItem value=""><em>{newUser.role === 'EMPLOYEE' ? 'Select a department' : 'No department'}</em></MenuItem>
          {departments.map((department) => <MenuItem key={department.value} value={department.value}>{department.label}</MenuItem>)}
        </Select>
      </FormControl>
    </DialogContent>
    <DialogActions><Button color="inherit" onClick={() => setAddUserOpen(false)} disabled={creatingUser}>Cancel</Button><Button variant="contained" onClick={() => void createUser()} disabled={!canCreateUser || creatingUser}>{creatingUser ? 'Creating…' : 'Create user'}</Button></DialogActions>
  </Dialog>
  </>
}
