import { useState } from 'react'
import { Alert, Button, Paper, TextField, Typography } from '@mui/material'
import { useAuth } from './AuthContext'

export default function PasswordSettings() {
  const { apiFetch } = useAuth()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function save(event: React.FormEvent) {
    event.preventDefault()
    setMessage('')
    setError('')
    const response = await apiFetch('/api/auth/me/password', {
      method: 'POST', body: JSON.stringify({ currentPassword, newPassword }),
    })
    if (!response.ok) {
      try { const body = await response.json(); setError(body.detail || body.message || `Could not change password (${response.status})`) }
      catch { setError(`Could not change password (${response.status})`) }
      return
    }
    setCurrentPassword('')
    setNewPassword('')
    setMessage('Password changed.')
  }

  return <Paper component="form" onSubmit={save} className="content-card" sx={{ p: 3, maxWidth: 560 }}>
    <Typography variant="h6" sx={{ mb: 0.5 }}>Change password</Typography>
    <Typography className="section-note" sx={{ mb: 2 }}>Use at least 12 characters for your new password.</Typography>
    {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
    <TextField required fullWidth type="password" label="Current password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} sx={{ mb: 2 }} />
    <TextField required fullWidth type="password" label="New password" autoComplete="new-password" slotProps={{ htmlInput: { minLength: 12, maxLength: 72 } }} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} sx={{ mb: 2 }} />
    <Button type="submit" variant="contained">Update password</Button>
  </Paper>
}
