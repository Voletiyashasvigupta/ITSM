/**
 * Application Entry Point.
 * Initializes the React 19 root, mounts the MUI ThemeProvider with custom palette
 * and component tokens, configures React Router, and wraps the application tree
 * with the global AuthProvider.
 */
import React from 'react'
import ReactDOM from 'react-dom/client'
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'
import App from './App'
import { AuthProvider } from './auth/AuthContext'
import { BrowserRouter } from 'react-router-dom'
import './style.css'

/**
 * Global MUI Theme Configuration.
 * Defines Northstar ITSM brand colors, typography, border radius tokens,
 * and component style overrides (flat buttons, untextured paper).
 */
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#0f6672', dark: '#124b5b' },
    background: { default: '#f3f6f7', paper: '#ffffff' },
    text: { primary: '#172033', secondary: '#64708a' },
    success: { main: '#16876d' },
    warning: { main: '#b56b12' },
  },
  typography: {
    fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: { styleOverrides: { root: { borderRadius: 9, boxShadow: 'none' } } },
    MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
  },
})

// Mount application to DOM element `#root`
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>,
)
