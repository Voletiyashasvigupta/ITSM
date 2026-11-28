import React, { useState } from 'react'
import {
  Badge,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Tooltip,
} from '@mui/material'
import SearchRounded from '@mui/icons-material/SearchRounded'
import NotificationsNoneRounded from '@mui/icons-material/NotificationsNoneRounded'
import AddRounded from '@mui/icons-material/AddRounded'
import KeyboardArrowDownRounded from '@mui/icons-material/KeyboardArrowDownRounded'
import LogoutRounded from '@mui/icons-material/LogoutRounded'
import LoginRounded from '@mui/icons-material/LoginRounded'
import ReportProblemRounded from '@mui/icons-material/ReportProblemRounded'
import ShoppingCartRounded from '@mui/icons-material/ShoppingCartRounded'
import SyncRounded from '@mui/icons-material/SyncRounded'
import LaptopMacRounded from '@mui/icons-material/LaptopMacRounded'
import type { PortalUser } from '../auth/AuthContext'

export type LiventoTab =
  | 'Dashboard'
  | 'Incidents'
  | 'Service Catalog'
  | 'Requests'
  | 'Changes'
  | 'Problems'
  | 'ServiceNow Sync'

export interface LiventoNavbarProps {
  activeTab: string
  onTabChange: (tab: string) => void
  user: PortalUser
  unreadCount: number
  onNotificationClick: (event: React.MouseEvent<HTMLElement>) => void
  onProfileClick: (event: React.MouseEvent<HTMLElement>) => void
  onNewAction: () => void
  searchQuery: string
  onSearchChange: (q: string) => void
  onSearchSubmit: () => void
  onLogout?: () => void
  onLoginClick?: () => void
}

export const LiventoNavbar: React.FC<LiventoNavbarProps> = ({
  activeTab,
  onTabChange,
  user,
  unreadCount,
  onNotificationClick,
  onProfileClick,
  onNewAction,
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  onLogout,
  onLoginClick,
}) => {
  const [actionAnchor, setActionAnchor] = useState<HTMLElement | null>(null)

  const tabs = [
    { key: 'Dashboard', label: 'Dashboard' },
    { key: 'Incidents', label: 'Incidents' },
    { key: 'Service Catalog', label: 'Service Catalog' },
    { key: 'Requests', label: 'Requests' },
    { key: 'Changes', label: 'Changes' },
    { key: 'Problems', label: 'Problems' },
    { key: 'ServiceNow Sync', label: 'ServiceNow Sync' },
  ]

  const initials = user?.fullName
    ? user.fullName
        .split(/\s+/)
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'US'

  const roleLabel =
    user?.role === 'MANAGER_ADMIN'
      ? 'Manager + Admin'
      : user?.role === 'MANAGER'
      ? 'Manager'
      : 'IT Agent'

  return (
    <header className="livento-header-card">
      {/* Brand Logo & Name */}
      <div
        className="livento-brand"
        onClick={() => onTabChange('Dashboard')}
        title="Go to Northstar Dashboard"
      >
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

      {/* Pill Tabs Navigation Bar */}
      <nav className="livento-pill-nav" aria-label="Main Navigation">
        {tabs.map((tab) => {
          const isActive =
            activeTab === tab.key ||
            (tab.key === 'Dashboard' && (activeTab === 'Overview' || activeTab === 'Admin dashboard'))
          return (
            <button
              key={tab.key}
              type="button"
              className={`livento-pill-btn ${isActive ? 'active' : ''}`}
              onClick={() => onTabChange(tab.key)}
            >
              {tab.label}
            </button>
          )
        })}
      </nav>

      {/* Header Right Tools */}
      <div className="livento-header-tools">
        {/* Quick Action Button with Dropdown Menu */}
        <Tooltip title="Create ticket, request, or asset order">
          <button
            type="button"
            className="livento-action-circle"
            onClick={(e) => setActionAnchor(e.currentTarget)}
          >
            <AddRounded sx={{ fontSize: 22 }} />
          </button>
        </Tooltip>

        <Menu
          anchorEl={actionAnchor}
          open={Boolean(actionAnchor)}
          onClose={() => setActionAnchor(null)}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          slotProps={{
            paper: {
              sx: {
                borderRadius: 3,
                boxShadow: '0 16px 36px rgba(15, 23, 42, 0.12), 0 0 0 1px #edf2f7',
                minWidth: 230,
                p: 0.75,
              },
            },
          }}
        >
          <MenuItem
            onClick={() => {
              setActionAnchor(null)
              onNewAction()
            }}
            sx={{ borderRadius: 2, py: 1 }}
          >
            <ListItemIcon>
              <ReportProblemRounded sx={{ fontSize: 18, color: '#d97706' }} />
            </ListItemIcon>
            <ListItemText
              primary="Create Incident"
              secondary="Report an outage or system bug"
              slotProps={{ primary: { sx: { fontSize: 13, fontWeight: 700 } }, secondary: { sx: { fontSize: 11 } } }}
            />
          </MenuItem>

          <MenuItem
            onClick={() => {
              setActionAnchor(null)
              onTabChange('Service Catalog')
            }}
            sx={{ borderRadius: 2, py: 1 }}
          >
            <ListItemIcon>
              <ShoppingCartRounded sx={{ fontSize: 18, color: '#0284c7' }} />
            </ListItemIcon>
            <ListItemText
              primary="New Service Request"
              secondary="Browse catalog & software"
              slotProps={{ primary: { sx: { fontSize: 13, fontWeight: 700 } }, secondary: { sx: { fontSize: 11 } } }}
            />
          </MenuItem>

          <MenuItem
            onClick={() => {
              setActionAnchor(null)
              onTabChange('Service Catalog')
            }}
            sx={{ borderRadius: 2, py: 1 }}
          >
            <ListItemIcon>
              <LaptopMacRounded sx={{ fontSize: 18, color: '#16a34a' }} />
            </ListItemIcon>
            <ListItemText
              primary="Order IT Asset"
              secondary="Hardware, monitors, laptops"
              slotProps={{ primary: { sx: { fontSize: 13, fontWeight: 700 } }, secondary: { sx: { fontSize: 11 } } }}
            />
          </MenuItem>

          <MenuItem
            onClick={() => {
              setActionAnchor(null)
              onTabChange('Service ServiceNow Sync')
            }}
            sx={{ borderRadius: 2, py: 1 }}
          >
            <ListItemIcon>
              <SyncRounded sx={{ fontSize: 18, color: '#9333ea' }} />
            </ListItemIcon>
            <ListItemText
              primary="ServiceNow Sync"
              secondary="Health check & audit trail"
              slotProps={{ primary: { sx: { fontSize: 13, fontWeight: 700 } }, secondary: { sx: { fontSize: 11 } } }}
            />
          </MenuItem>
        </Menu>

        {/* Search Input Box */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: '#ffffff',
            border: '1px solid #edf2f7',
            borderRadius: '9999px',
            padding: '4px 12px',
            height: '38px',
          }}
        >
          <SearchRounded
            sx={{ fontSize: 18, color: '#94a3b8', mr: 0.5, cursor: 'pointer' }}
            onClick={onSearchSubmit}
          />
          <input
            type="text"
            placeholder="Search tickets, catalog..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSearchSubmit()
            }}
            style={{
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: '12px',
              color: '#334155',
              width: '140px',
            }}
          />
        </div>

        {/* Notifications Button */}
        <Tooltip title="View Notifications">
          <button
            type="button"
            className="livento-icon-btn"
            onClick={onNotificationClick}
          >
            <Badge
              color="error"
              badgeContent={unreadCount}
              max={99}
              sx={{
                '& .MuiBadge-badge': {
                  fontSize: 10,
                  height: 16,
                  minWidth: 16,
                  padding: '0 4px',
                },
              }}
            >
              <NotificationsNoneRounded sx={{ fontSize: 20 }} />
            </Badge>
          </button>
        </Tooltip>

        {/* User Authenticated Capsule */}
        {user?.id ? (
          <>
            <Tooltip title="Account & Permissions">
              <div className="livento-profile-capsule" onClick={onProfileClick}>
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    fontWeight: 800,
                  }}
                >
                  {initials}
                </div>
                <div style={{ textAlign: 'left', lineHeight: 1.15 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>
                    {user.fullName || 'Admin User'}
                  </div>
                  <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500 }}>
                    {roleLabel}
                  </div>
                </div>
                <KeyboardArrowDownRounded sx={{ fontSize: 16, color: '#94a3b8', ml: 0.25 }} />
              </div>
            </Tooltip>

            {/* Explicit, Functional Logout Button on the Home Page */}
            {onLogout && (
              <Tooltip title="Sign out of Northstar Portal">
                <button
                  type="button"
                  className="livento-pill-btn"
                  onClick={onLogout}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '7px 14px',
                    borderRadius: 9999,
                    background: '#fff1f2',
                    border: '1px solid #fecdd3',
                    color: '#e11d48',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#ffe4e6'
                    e.currentTarget.style.borderColor = '#fda4af'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#fff1f2'
                    e.currentTarget.style.borderColor = '#fecdd3'
                  }}
                >
                  <LogoutRounded sx={{ fontSize: 15 }} />
                  <span>Logout</span>
                </button>
              </Tooltip>
            )}
          </>
        ) : (
          /* Explicit, Functional Login Button when unauthenticated */
          <Tooltip title="Sign in to your account">
            <button
              type="button"
              className="livento-pill-btn active"
              onClick={onLoginClick}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 16px',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <LoginRounded sx={{ fontSize: 16 }} />
              <span>Login</span>
            </button>
          </Tooltip>
        )}
      </div>
    </header>
  )
}
