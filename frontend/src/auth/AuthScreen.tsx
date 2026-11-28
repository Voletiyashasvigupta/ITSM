import React, { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from '@mui/material'
import PersonOutlineRounded from '@mui/icons-material/PersonOutlineRounded'
import LockOutlined from '@mui/icons-material/LockOutlined'
import EmailOutlined from '@mui/icons-material/EmailOutlined'
import BadgeOutlined from '@mui/icons-material/BadgeOutlined'
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined'
import VisibilityOffOutlined from '@mui/icons-material/VisibilityOffOutlined'
import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded'
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded'
import SyncRounded from '@mui/icons-material/SyncRounded'
import ShieldRounded from '@mui/icons-material/ShieldRounded'
import ShoppingCartRounded from '@mui/icons-material/ShoppingCartRounded'
import BoltRounded from '@mui/icons-material/BoltRounded'
import { useAuth } from './AuthContext'

/**
 * Livento-Themed Authentication & Registration Screen.
 * Fully conforms to the Livento modern design system:
 * - Brand logo, Manrope typography, and DM Sans body.
 * - Rounded pill navigation for Sign In vs Register toggle.
 * - High-contrast Livento primary buttons and glassmorphism cards.
 * - Quick-fill chips for Admin, Manager, and Employee credentials.
 * - Live enterprise feature highlights and ServiceNow status.
 */
export default function AuthScreen() {
  const { login, register } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('admin')
  const [employeeId, setEmployeeId] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('NorthstarLocal2026!')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    setNotice('')
    setBusy(true)
    try {
      if (mode === 'login') {
        await login(username, password)
      } else {
        await register(fullName, email, password, username, employeeId)
        setNotice('Account successfully created! You can now sign in with your enterprise credentials.')
        setMode('login')
        setPassword('')
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not complete your request. Please check your credentials.')
    } finally {
      setBusy(false)
    }
  }

  const fillQuickCredentials = (user: string, pass: string) => {
    setUsername(user)
    setPassword(pass)
    setError('')
    setNotice(`Loaded demo credentials for @${user}`)
  }

  return (
    <div className="livento-wrapper" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Livento Header Card */}
      <header className="livento-header-card" style={{ marginBottom: 30 }}>
        {/* Brand Logo & Name */}
        <div className="livento-brand">
          <div className="livento-brand-logo">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L20.66 7V17L12 22L3.34 17V7L12 2Z" stroke="#ffffff" strokeWidth="2.2" strokeLinejoin="round" />
              <path d="M12 12L12 22M12 12L20.66 7M12 12L3.34 7" stroke="#bae6fd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="12" cy="12" r="2.5" fill="#ffffff" />
            </svg>
          </div>
          <div>
            <div className="livento-brand-title">Northstar</div>
          </div>
        </div>

        {/* Center Pill Nav */}
        <nav className="livento-pill-nav" aria-label="Portal Navigation">
          <button
            type="button"
            className={`livento-pill-btn ${mode === 'login' ? 'active' : ''}`}
            onClick={() => { setMode('login'); setError(''); setNotice('') }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`livento-pill-btn ${mode === 'register' ? 'active' : ''}`}
            onClick={() => { setMode('register'); setError(''); setNotice('') }}
          >
            Register Account
          </button>
        </nav>

        {/* Right Status Pill */}
        <div className="livento-header-tools">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              borderRadius: 9999,
              padding: '6px 14px',
              fontSize: 12,
              fontWeight: 700,
              color: '#047857',
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#10b981',
                boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.25)',
              }}
            />
            ServiceNow Sync Online
          </div>
        </div>
      </header>

      {/* Main Content: Two-Column Responsive Hero + Form Layout */}
      <main
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: 32,
          maxWidth: 1200,
          margin: '0 auto',
          width: '100%',
          alignItems: 'center',
        }}
      >
        {/* Left Informational Showcase Card */}
        <div className="livento-card" style={{ padding: '36px 32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#e0f2fe', color: '#0284c7', padding: '4px 12px', borderRadius: 9999, fontSize: 11, fontWeight: 700, marginBottom: 16 }}>
            <BoltRounded sx={{ fontSize: 16 }} />
            ENTERPRISE ITSM PLATFORM
          </div>

          <Typography
            variant="h4"
            sx={{
              fontFamily: 'Manrope, sans-serif',
              fontWeight: 800,
              color: '#0f172a',
              letterSpacing: '-0.8px',
              lineHeight: 1.2,
              mb: 1.5,
            }}
          >
            Unified Service Management & Real-Time Sync
          </Typography>

          <Typography
            sx={{
              color: '#64748b',
              fontSize: 14,
              lineHeight: 1.6,
              mb: 3.5,
            }}
          >
            Northstar connects employee self-service directly to ServiceNow enterprise workflows, catalog items, and incident response with zero data loss.
          </Typography>

          {/* Feature Grid matching Livento KPI styling */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 28 }}>
            <div style={{ background: '#f8fafc', border: '1px solid #edf2f7', borderRadius: 14, padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#0284c7', fontWeight: 700, fontSize: 13, marginBottom: 4 }}>
                <SyncRounded sx={{ fontSize: 18 }} />
                Bi-Directional Sync
              </div>
              <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.4 }}>
                Continuous auto-sync with <code>incident</code>, <code>sc_request</code>, and <code>sc_req_item</code>.
              </div>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #edf2f7', borderRadius: 14, padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#16a34a', fontWeight: 700, fontSize: 13, marginBottom: 4 }}>
                <ShieldRounded sx={{ fontSize: 18 }} />
                IAM & Governance
              </div>
              <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.4 }}>
                Departmental groups, manager approval hierarchy, and ITIL roles.
              </div>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #edf2f7', borderRadius: 14, padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#d97706', fontWeight: 700, fontSize: 13, marginBottom: 4 }}>
                <ShoppingCartRounded sx={{ fontSize: 18 }} />
                Service Catalog & ITAM
              </div>
              <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.4 }}>
                Asset purchasing, hardware provisioning, and automated approval workflows.
              </div>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #edf2f7', borderRadius: 14, padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#9333ea', fontWeight: 700, fontSize: 13, marginBottom: 4 }}>
                <CheckCircleRounded sx={{ fontSize: 18 }} />
                Outage Resilience
              </div>
              <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.4 }}>
                Persistent queue with exponential backoff and correlation ID idempotency.
              </div>
            </div>
          </div>

          {/* Connection Footer Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #edf2f7', paddingTop: 16, fontSize: 11, color: '#94a3b8' }}>
            <span>Target: <strong>dev426011.service-now.com</strong></span>
            <span style={{ color: '#0284c7', fontWeight: 700 }}>REST API v2 · SSL TLS 1.3</span>
          </div>
        </div>

        {/* Right Authentication Form Card */}
        <div className="livento-card" style={{ padding: '36px 32px' }}>
          {/* Header with Title and Mode Switcher */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <div>
              <Typography
                variant="h5"
                sx={{
                  fontFamily: 'Manrope, sans-serif',
                  fontWeight: 800,
                  color: '#0f172a',
                  letterSpacing: '-0.5px',
                  mb: 0.5,
                }}
              >
                {mode === 'login' ? 'Enterprise Sign In' : 'Create Account'}
              </Typography>
              <Typography sx={{ color: '#64748b', fontSize: 13 }}>
                {mode === 'login'
                  ? 'Sign in with your corporate username or employee ID.'
                  : 'Register your work email for immediate provisioning.'}
              </Typography>
            </div>

            {/* Pill Switcher */}
            <div className="livento-pill-nav" style={{ padding: 3 }}>
              <button
                type="button"
                className={`livento-pill-btn ${mode === 'login' ? 'active' : ''}`}
                style={{ padding: '5px 12px', fontSize: 12 }}
                onClick={() => { setMode('login'); setError(''); setNotice('') }}
              >
                Sign In
              </button>
              <button
                type="button"
                className={`livento-pill-btn ${mode === 'register' ? 'active' : ''}`}
                style={{ padding: '5px 12px', fontSize: 12 }}
                onClick={() => { setMode('register'); setError(''); setNotice('') }}
              >
                Register
              </button>
            </div>
          </div>

          {/* Feedback Notices */}
          {notice && (
            <Alert
              severity="success"
              onClose={() => setNotice('')}
              sx={{
                mb: 2.5,
                borderRadius: 3,
                fontSize: 12,
                fontWeight: 600,
                alignItems: 'center',
              }}
            >
              {notice}
            </Alert>
          )}

          {error && (
            <Alert
              severity="error"
              onClose={() => setError('')}
              sx={{
                mb: 2.5,
                borderRadius: 3,
                fontSize: 12,
                fontWeight: 600,
                alignItems: 'center',
              }}
            >
              {error}
            </Alert>
          )}

          {/* Form */}
          <Box component="form" onSubmit={submit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {mode === 'login' ? (
              <>
                <div>
                  <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#334155', mb: 0.75 }}>
                    Corporate Username or Employee ID
                  </Typography>
                  <TextField
                    required
                    fullWidth
                    size="medium"
                    placeholder="e.g. admin, sarah.jenkins, or EMP-00001"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonOutlineRounded sx={{ fontSize: 20, color: '#94a3b8' }} />
                          </InputAdornment>
                        ),
                        sx: {
                          borderRadius: 2.5,
                          bgcolor: '#f8fafc',
                          fontSize: 13,
                          '& fieldset': { borderColor: '#e2e8f0' },
                          '&:hover fieldset': { borderColor: '#cbd5e1' },
                          '&.Mui-focused fieldset': { borderColor: '#0284c7' },
                        },
                      },
                    }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>
                      Password
                    </Typography>
                    <span style={{ fontSize: 11, color: '#0284c7', fontWeight: 600, cursor: 'pointer' }} onClick={() => fillQuickCredentials('admin', 'NorthstarLocal2026!')}>
                      Reset to Default
                    </span>
                  </div>
                  <TextField
                    required
                    fullWidth
                    size="medium"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your enterprise password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockOutlined sx={{ fontSize: 20, color: '#94a3b8' }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton size="small" onClick={() => setShowPassword(!showPassword)}>
                              {showPassword ? <VisibilityOffOutlined sx={{ fontSize: 18 }} /> : <VisibilityOutlined sx={{ fontSize: 18 }} />}
                            </IconButton>
                          </InputAdornment>
                        ),
                        sx: {
                          borderRadius: 2.5,
                          bgcolor: '#f8fafc',
                          fontSize: 13,
                          '& fieldset': { borderColor: '#e2e8f0' },
                          '&:hover fieldset': { borderColor: '#cbd5e1' },
                          '&.Mui-focused fieldset': { borderColor: '#0284c7' },
                        },
                      },
                    }}
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#334155', mb: 0.75 }}>
                    Full Legal Name
                  </Typography>
                  <TextField
                    required
                    fullWidth
                    placeholder="e.g. Rachel Green"
                    autoComplete="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonOutlineRounded sx={{ fontSize: 20, color: '#94a3b8' }} />
                          </InputAdornment>
                        ),
                        sx: { borderRadius: 2.5, bgcolor: '#f8fafc', fontSize: 13 },
                      },
                    }}
                  />
                </div>

                <div>
                  <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#334155', mb: 0.75 }}>
                    Corporate Work Email
                  </Typography>
                  <TextField
                    required
                    fullWidth
                    type="email"
                    placeholder="e.g. rachel.green@northstarbank.internal"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <EmailOutlined sx={{ fontSize: 20, color: '#94a3b8' }} />
                          </InputAdornment>
                        ),
                        sx: { borderRadius: 2.5, bgcolor: '#f8fafc', fontSize: 13 },
                      },
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#334155', mb: 0.75 }}>
                      Username (Optional)
                    </Typography>
                    <TextField
                      fullWidth
                      placeholder="rachel.green"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <BadgeOutlined sx={{ fontSize: 18, color: '#94a3b8' }} />
                            </InputAdornment>
                          ),
                          sx: { borderRadius: 2.5, bgcolor: '#f8fafc', fontSize: 12 },
                        },
                      }}
                    />
                  </div>

                  <div>
                    <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#334155', mb: 0.75 }}>
                      Employee ID (Optional)
                    </Typography>
                    <TextField
                      fullWidth
                      placeholder="EMP-20005"
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value)}
                      slotProps={{
                        input: {
                          sx: { borderRadius: 2.5, bgcolor: '#f8fafc', fontSize: 12 },
                        },
                      }}
                    />
                  </div>
                </div>

                <div>
                  <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#334155', mb: 0.75 }}>
                    Password (Min 12 Characters)
                  </Typography>
                  <TextField
                    required
                    fullWidth
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a secure enterprise password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockOutlined sx={{ fontSize: 20, color: '#94a3b8' }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <IconButton size="small" onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? <VisibilityOffOutlined sx={{ fontSize: 18 }} /> : <VisibilityOutlined sx={{ fontSize: 18 }} />}
                          </IconButton>
                        ),
                        sx: { borderRadius: 2.5, bgcolor: '#f8fafc', fontSize: 13 },
                      },
                    }}
                  />
                </div>
              </>
            )}

            {/* Submit Button Styled as Livento High-Contrast Button */}
            <Button
              type="submit"
              disabled={busy}
              sx={{
                mt: 1,
                py: 1.5,
                borderRadius: 9999,
                background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 50%, #0369a1 100%)',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)',
                color: '#ffffff',
                fontFamily: 'DM Sans, sans-serif',
                fontWeight: 700,
                fontSize: 14,
                textTransform: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
                '&:hover': {
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  boxShadow: '0 6px 18px rgba(2, 132, 199, 0.45)',
                },
                '&:disabled': {
                  background: '#94a3b8',
                  color: '#f8fafc',
                },
              }}
            >
              {busy ? (
                <>
                  <CircularProgress size={18} sx={{ color: '#ffffff' }} />
                  <span>Connecting to Enterprise Directory…</span>
                </>
              ) : mode === 'login' ? (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowForwardRounded sx={{ fontSize: 18 }} />
                </>
              ) : (
                <>
                  <span>Create Account & Sync IAM</span>
                  <CheckCircleRounded sx={{ fontSize: 18 }} />
                </>
              )}
            </Button>
          </Box>

          {/* Quick Demo Credentials Fill Chips */}
          {mode === 'login' && (
            <div
              style={{
                marginTop: 24,
                padding: '16px 18px',
                background: '#f8fafc',
                borderRadius: 16,
                border: '1px solid #edf2f7',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#475569', letterSpacing: '0.4px', textTransform: 'uppercase' }}>
                  Quick Fill Test Credentials
                </span>
                <span style={{ fontSize: 10, color: '#94a3b8' }}>Click to auto-populate</span>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <Chip
                  label="👑 admin (Admin + ITIL)"
                  onClick={() => fillQuickCredentials('admin', 'NorthstarLocal2026!')}
                  clickable
                  size="small"
                  sx={{
                    fontWeight: 700,
                    fontSize: 11,
                    bgcolor: username === 'admin' ? '#e0f2fe' : '#ffffff',
                    color: username === 'admin' ? '#0284c7' : '#334155',
                    border: '1px solid',
                    borderColor: username === 'admin' ? '#7dd3fc' : '#e2e8f0',
                  }}
                />
                <Chip
                  label="👔 sarah.jenkins (Manager)"
                  onClick={() => fillQuickCredentials('sarah.jenkins', 'NorthstarLocal2026!')}
                  clickable
                  size="small"
                  sx={{
                    fontWeight: 700,
                    fontSize: 11,
                    bgcolor: username === 'sarah.jenkins' ? '#e0f2fe' : '#ffffff',
                    color: username === 'sarah.jenkins' ? '#0284c7' : '#334155',
                    border: '1px solid',
                    borderColor: username === 'sarah.jenkins' ? '#7dd3fc' : '#e2e8f0',
                  }}
                />
                <Chip
                  label="💻 alex.rivera (Employee)"
                  onClick={() => fillQuickCredentials('alex.rivera', 'NorthstarLocal2026!')}
                  clickable
                  size="small"
                  sx={{
                    fontWeight: 700,
                    fontSize: 11,
                    bgcolor: username === 'alex.rivera' ? '#e0f2fe' : '#ffffff',
                    color: username === 'alex.rivera' ? '#0284c7' : '#334155',
                    border: '1px solid',
                    borderColor: username === 'alex.rivera' ? '#7dd3fc' : '#e2e8f0',
                  }}
                />
              </div>
            </div>
          )}

          {/* Footer Security Note */}
          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>
              Secured with Spring Boot IAM · Connected to ServiceNow instance dev426011
            </span>
          </div>
        </div>
      </main>
    </div>
  )
}
