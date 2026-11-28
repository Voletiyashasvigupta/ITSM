import { useState } from 'react'
import { Alert, Box, Button, Paper, Tab, Tabs, TextField, Typography } from '@mui/material'
import { useAuth } from './AuthContext'

/**
 * Authentication and Registration Screen.
 * Renders the portal sign-in and account creation forms.
 * - Sign In Mode: Submits credentials to `login(email, password)` (POST /api/auth/login).
 * - Register Mode: Submits full name, email, and password to `register(fullName, email, password)` (POST /api/auth/register).
 *   Newly registered accounts default to inactive status until assigned a department and role in User Access.
 */
export default function AuthScreen() {
  const { login, register } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [employeeId, setEmployeeId] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  /**
   * Handles form submission for both Sign In and Registration workflows.
   */
  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    setNotice('')
    setBusy(true)
    try {
      if (mode === 'login') {
        // Authenticate with Auth Service using corporate username or employee ID
        await login(username, password)
      } else {
        // Create pending account with work email, corporate username, and employee ID
        await register(fullName, email, password, username, employeeId)
        setNotice('Account created. A Manager or Administrator must assign your access before you can sign in.')
        setMode('login')
        setPassword('')
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not complete your request')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 2, background: 'linear-gradient(135deg, #eef3f5 0%, #e2ecee 100%)' }}>
      <Paper component="form" onSubmit={submit} elevation={0} sx={{ width: 'min(100%, 430px)', p: { xs: 3, sm: 4 }, border: '1px solid #dfe8eb', borderRadius: 4 }}>
        {/* Brand Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              display: 'grid',
              placeItems: 'center',
              background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 50%, #0369a1 100%)',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.35)',
              p: '5px',
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L20.66 7V17L12 22L3.34 17V7L12 2Z" stroke="#ffffff" strokeWidth="2" strokeLinejoin="round" />
              <path d="M12 12L12 22M12 12L20.66 7M12 12L3.34 7" stroke="#bae6fd" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="12" cy="12" r="2.5" fill="#ffffff" />
              <circle cx="12" cy="4" r="1.5" fill="#bae6fd" />
              <circle cx="19" cy="16" r="1.5" fill="#bae6fd" />
              <circle cx="5" cy="16" r="1.5" fill="#bae6fd" />
            </svg>
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: 19, color: '#16324f' }}>ITSM</Typography>
            <Typography variant="caption" color="text.secondary">INTERNAL SERVICE HUB</Typography>
          </Box>
        </Box>

        <Typography variant="h5" sx={{ fontWeight: 750, mb: 0.5 }}>
          {mode === 'login' ? 'Welcome back' : 'Create your account'}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
          {mode === 'login' ? 'Sign in with your enterprise username.' : 'Register with your work email. Access is assigned by an administrator.'}
        </Typography>

        {/* Tab switch between Sign In and Register */}
        <Tabs value={mode} onChange={(_, value: 'login' | 'register') => { setMode(value); setError(''); setNotice('') }} sx={{ mb: 2 }}>
          <Tab value="login" label="Sign in" />
          <Tab value="register" label="Register" />
        </Tabs>

        {notice && <Alert severity="success" sx={{ mb: 2 }}>{notice}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {mode === 'login' ? (
          <TextField
            required
            fullWidth
            label="Corporate Username or Employee ID"
            autoComplete="username"
            placeholder="e.g. admin, alex.rivera, or EMP-00001"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            sx={{ mb: 2 }}
          />
        ) : (
          <>
            <TextField
              required
              fullWidth
              label="Full name"
              autoComplete="name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              required
              fullWidth
              label="Work email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Corporate Username (Optional)"
              autoComplete="username"
              placeholder="e.g. alex.rivera"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              helperText="Defaults to your email prefix if left blank."
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Employee ID (Optional)"
              placeholder="e.g. EMP-10001"
              value={employeeId}
              onChange={(event) => setEmployeeId(event.target.value)}
              helperText="Corporate badge identifier. Auto-assigned if omitted."
              sx={{ mb: 2 }}
            />
          </>
        )}

        <TextField
          required
          fullWidth
          label="Password"
          type="password"
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          slotProps={{ htmlInput: { minLength: mode === 'register' ? 12 : undefined, maxLength: 72 } }}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          helperText={mode === 'register' ? 'Use at least 12 characters.' : undefined}
          sx={{ mb: 2.5 }}
        />

        <Button type="submit" fullWidth variant="contained" size="large" disabled={busy}>
          {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
        </Button>

        {/* Local development convenience shortcut */}
        {mode === 'login' && (
          <Box sx={{ mt: 2, p: 1.5, bgcolor: '#f8fafc', borderRadius: 2, border: '1px dashed #cbd5e1', textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: '#475569', display: 'block', mb: 0.75, fontWeight: 600 }}>
              Quick Admin & Manager Login:
            </Typography>
            <Button
              size="small"
              variant="outlined"
              fullWidth
              onClick={() => {
                setUsername('admin')
                setPassword('NorthstarLocal2026!')
              }}
            >
              Fill Admin Credentials (admin)
            </Button>
          </Box>
        )}

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 2 }}>
          Portal accounts are separate from ServiceNow credentials.
        </Typography>
      </Paper>
    </Box>
  )
}
