import { useState } from 'react'
import { Alert, Box, Button, Paper, Tab, Tabs, TextField, Typography } from '@mui/material'
import { useAuth } from './AuthContext'

export default function AuthScreen() {
  const { login, register } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    setNotice('')
    setBusy(true)
    try {
      if (mode === 'login') await login(email, password)
      else {
        await register(fullName, email, password)
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

  return <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 2, background: 'linear-gradient(135deg, #eef3f5 0%, #e2ecee 100%)' }}>
    <Paper component="form" onSubmit={submit} elevation={0} sx={{ width: 'min(100%, 430px)', p: { xs: 3, sm: 4 }, border: '1px solid #dfe8eb', borderRadius: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <Box sx={{ width: 40, height: 40, borderRadius: 2, display: 'grid', placeItems: 'center', color: 'white', bgcolor: 'primary.main', fontWeight: 800, fontSize: 22 }}>N</Box>
        <Box><Typography sx={{ fontWeight: 800, fontSize: 19, color: '#16324f' }}>Northstar Bank</Typography><Typography variant="caption" color="text.secondary">INTERNAL SERVICE HUB</Typography></Box>
      </Box>
      <Typography variant="h5" sx={{ fontWeight: 750, mb: 0.5 }}>{mode === 'login' ? 'Welcome back' : 'Create your account'}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>{mode === 'login' ? 'Sign in with your portal account.' : 'Register with your work email. Access is assigned by an administrator.'}</Typography>
      <Tabs value={mode} onChange={(_, value: 'login' | 'register') => { setMode(value); setError(''); setNotice('') }} sx={{ mb: 2 }}>
        <Tab value="login" label="Sign in" />
        <Tab value="register" label="Register" />
      </Tabs>
      {notice && <Alert severity="success" sx={{ mb: 2 }}>{notice}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {mode === 'register' && <TextField required fullWidth label="Full name" autoComplete="name" value={fullName} onChange={(event) => setFullName(event.target.value)} sx={{ mb: 2 }} />}
      <TextField required fullWidth label="Work email" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} sx={{ mb: 2 }} />
      <TextField required fullWidth label="Password" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} slotProps={{ htmlInput: { minLength: mode === 'register' ? 12 : undefined, maxLength: 72 } }} value={password} onChange={(event) => setPassword(event.target.value)} helperText={mode === 'register' ? 'Use at least 12 characters.' : undefined} sx={{ mb: 2.5 }} />
      <Button type="submit" fullWidth variant="contained" size="large" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}</Button>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 2 }}>Portal accounts are separate from ServiceNow credentials.</Typography>
    </Paper>
  </Box>
}
