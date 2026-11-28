import React, { useState } from 'react'
import {
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material'
import {
  LiventoKpiGrid,
  type LiventoKpiItem,
} from './LiventoKpiGrid'
import ReportProblemRounded from '@mui/icons-material/ReportProblemRounded'
import ReceiptLongRounded from '@mui/icons-material/ReceiptLongRounded'
import SyncRounded from '@mui/icons-material/SyncRounded'
import TaskAltRounded from '@mui/icons-material/TaskAltRounded'
import PhoneRounded from '@mui/icons-material/PhoneRounded'
import SearchRounded from '@mui/icons-material/SearchRounded'
import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded'
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded'
import StorageRounded from '@mui/icons-material/StorageRounded'

export interface LiventoDashboardProps {
  openIncidentsCount: number
  p1IncidentsCount: number
  requestsCount: number
  pendingApprovalsCount: number
  problemsCount: number
  changesCount: number
  incidentsList: Array<{
    id: string
    incidentNumber?: string
    title: string
    shortDescription?: string
    priority?: string
    status: string
    caller?: string
    category?: string
    createdAt?: string
  }>
  requestsList: Array<{
    id: string
    requestNumber: string
    serviceName: string
    status: string
    createdAt: string
    requesterName?: string
  }>
  onOpenIncident: (id: string) => void
  onOpenRequest: (request: any) => void
  onNavigate: (view: string) => void
}

export const LiventoDashboard: React.FC<LiventoDashboardProps> = ({
  openIncidentsCount,
  p1IncidentsCount: _p1,
  requestsCount,
  pendingApprovalsCount,
  problemsCount: _pr,
  changesCount: _ch,
  incidentsList,
  requestsList,
  onOpenIncident,
  onOpenRequest,
  onNavigate,
}) => {
  const [calTab, setCalTab] = useState<'All' | 'Assigned' | 'My Schedule'>('All')
  const [tableSearch, setTableSearch] = useState('')
  const [selectedMonth, setSelectedMonth] = useState('Monthly')
  const [monthOffset, setMonthOffset] = useState(1) // 0: May, 1: June, 2: July, 3: August 2026
  const [selectedDay, setSelectedDay] = useState(2)
  const [contactModalUser, setContactModalUser] = useState<any | null>(null)
  const [onCallRosterOpen, setOnCallRosterOpen] = useState(false)

  const monthNames = ['May 2026', 'June 2026', 'July 2026', 'August 2026']

  // Top 4 KPI metric cards matching Livento
  const kpiItems: LiventoKpiItem[] = [
    {
      icon: <ReportProblemRounded sx={{ fontSize: 18 }} />,
      iconColor: 'amber',
      label: 'Active Incidents',
      value: openIncidentsCount > 0 ? openIncidentsCount : '12',
      trend: '+12% ↗',
      trendDirection: 'up',
      onClick: () => onNavigate('Incidents'),
    },
    {
      icon: <ReceiptLongRounded sx={{ fontSize: 18 }} />,
      iconColor: 'blue',
      label: 'Total Requests',
      value: requestsCount > 0 ? requestsCount : '42',
      trend: '+18% ↗',
      trendDirection: 'up',
      onClick: () => onNavigate('Requests'),
    },
    {
      icon: <SyncRounded sx={{ fontSize: 18 }} />,
      iconColor: 'purple',
      label: 'ServiceNow Synced',
      value: '99.2%',
      trend: '100% SLA ↗',
      trendDirection: 'up',
      onClick: () => onNavigate('ServiceNow Sync'),
    },
    {
      icon: <TaskAltRounded sx={{ fontSize: 18 }} />,
      iconColor: 'emerald',
      label: 'Resolved Today',
      value: '38',
      trend: '+12% ↗',
      trendDirection: 'up',
      onClick: () => onNavigate('Incidents'),
    },
  ]

  // Filtered queue items
  const combinedQueue = [
    ...incidentsList.map((inc) => ({
      type: 'incident' as const,
      id: inc.id,
      ticketNumber: inc.incidentNumber || `INC00${inc.id.slice(0, 5)}`,
      title: inc.shortDescription || inc.title || 'System Alert',
      category: inc.category || 'Database',
      priority: inc.priority || 'P2 - High',
      caller: inc.caller || 'System Operator',
      status: inc.status || 'SYNCED',
      assignees: ['DH', 'SC', 'AK'],
    })),
    ...requestsList.map((req) => ({
      type: 'request' as const,
      id: req.id,
      ticketNumber: req.requestNumber || `REQ00${req.id.slice(0, 5)}`,
      title: req.serviceName || 'Service Provisioning',
      category: 'Service Catalog',
      priority: 'P3 - Moderate',
      caller: req.requesterName || 'Employee',
      status: req.status || 'IN_PROGRESS',
      assignees: ['AH', 'JD'],
    })),
  ].filter((item) => {
    if (!tableSearch) return true
    const term = tableSearch.toLowerCase()
    return (
      item.ticketNumber.toLowerCase().includes(term) ||
      item.title.toLowerCase().includes(term) ||
      item.category.toLowerCase().includes(term) ||
      item.caller.toLowerCase().includes(term)
    )
  })

  // On-call team members
  const onCallTeam = [
    { name: 'Jessica Chen', location: 'IT Infrastructure, NY', avatar: 'JC', role: 'DevOps Lead' },
    { name: 'John Doe', location: 'Database Admin, CA', avatar: 'JD', role: 'DBA Specialist' },
    { name: 'Hailee S.', location: 'Security Operations, NY', avatar: 'HS', role: 'SecOps Eng' },
    { name: 'Evan Chris', location: 'Platform Reliability, TX', avatar: 'EC', role: 'SRE Lead' },
    { name: 'Emily Paris', location: 'Service Desk Support, CA', avatar: 'EP', role: 'Support Agent' },
  ]

  return (
    <div>
      {/* KPI Cards Row */}
      <LiventoKpiGrid items={kpiItems} />

      {/* Middle Grid: Performance Chart + Featured / Deals + Reminders / Calendar */}
      <div className="livento-main-grid">
        {/* Left Section (2/3 width) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Performance Wave Chart Card */}
          <div className="livento-card">
            <div className="livento-chart-header">
              <div>
                <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
                  Performance
                </div>
                <div className="livento-chart-legend" style={{ marginTop: 6 }}>
                  <span>
                    <span className="livento-legend-dot" style={{ background: '#0284c7' }} />
                    Resolved SLA
                  </span>
                  <span>
                    <span className="livento-legend-dot" style={{ background: '#38bdf8' }} />
                    Inflow Volume
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="livento-chart-target-badge">
                  <div className="livento-chart-target-value">98.4% SLA Compliance</div>
                  <div className="livento-chart-target-label">Target: 95.0%</div>
                </div>

                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: 9999,
                    padding: '6px 14px',
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#475569',
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <option value="Monthly">Monthly ⌵</option>
                  <option value="Weekly">Weekly ⌵</option>
                  <option value="Quarterly">Quarterly ⌵</option>
                </select>
              </div>
            </div>

            {/* Smooth Dual-Line SVG Wave Chart */}
            <div style={{ width: '100%', height: 210, position: 'relative', marginTop: 10 }}>
              <svg width="100%" height="100%" viewBox="0 0 650 180" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chartGradBlue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0284c7" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="chartGradCyan" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Subtle horizontal grid lines */}
                <line x1="0" y1="30" x2="650" y2="30" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="0" y1="80" x2="650" y2="80" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="0" y1="130" x2="650" y2="130" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />

                {/* Area fills */}
                <path
                  d="M 20 120 C 80 140, 140 70, 200 95 C 270 125, 340 50, 420 55 C 500 60, 560 110, 630 85 L 630 170 L 20 170 Z"
                  fill="url(#chartGradCyan)"
                />
                <path
                  d="M 20 90 C 70 60, 140 120, 210 100 C 280 80, 350 40, 430 45 C 510 50, 570 90, 630 60 L 630 170 L 20 170 Z"
                  fill="url(#chartGradBlue)"
                />

                {/* Cyan Wave Line (Inflow Volume) */}
                <path
                  d="M 20 120 C 80 140, 140 70, 200 95 C 270 125, 340 50, 420 55 C 500 60, 560 110, 630 85"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />

                {/* Deep Blue Wave Line (Resolved SLA) */}
                <path
                  d="M 20 90 C 70 60, 140 120, 210 100 C 280 80, 350 40, 430 45 C 510 50, 570 90, 630 60"
                  fill="none"
                  stroke="#0284c7"
                  strokeWidth="3"
                  strokeLinecap="round"
                />

                {/* Active Tooltip Anchor Dot on Jun */}
                <circle cx="430" cy="45" r="5" fill="#0284c7" stroke="#ffffff" strokeWidth="3" />
                <circle cx="430" cy="55" r="4" fill="#38bdf8" stroke="#ffffff" strokeWidth="2.5" />
              </svg>

              {/* Month Labels along X-Axis */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '4px 16px 0',
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#94a3b8',
                }}
              >
                <span>Jan</span>
                <span>Feb</span>
                <span>Mar</span>
                <span>Apr</span>
                <span>May</span>
                <span
                  style={{
                    color: '#0284c7',
                    fontWeight: 700,
                    background: '#e0f2fe',
                    padding: '1px 8px',
                    borderRadius: 9999,
                  }}
                >
                  Jun
                </span>
                <span>Jul</span>
                <span>Aug</span>
              </div>
            </div>
          </div>

          {/* Row of Featured Service + SLA Pipeline Progress Bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {/* The Somerset Equivalent: High Availability Service Card */}
            <div className="livento-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
                    Core Banking Gateway
                  </div>
                  <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, marginTop: 2 }}>
                    High Availability · P1 Service
                  </div>
                </div>

                <div
                  style={{
                    background: '#f1f5f9',
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                  onClick={() => onNavigate('ServiceNow Sync')}
                >
                  <ArrowForwardRounded sx={{ fontSize: 16, color: '#475569' }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 20, margin: '14px 0 16px' }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>175</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>Synced</div>
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>12</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>In-Flight</div>
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>2.4K</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>Requests</div>
                </div>
              </div>

              {/* Visual preview box with badge */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                  borderRadius: 16,
                  height: 90,
                  display: 'flex',
                  alignItems: 'flex-end',
                  padding: 12,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 10,
                    left: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    color: '#38bdf8',
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  <StorageRounded sx={{ fontSize: 16 }} />
                  <span>ServiceNow Live Node Dev426011</span>
                </div>
                <div
                  style={{
                    background: 'rgba(2, 132, 199, 0.85)',
                    color: '#ffffff',
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: 9999,
                    backdropFilter: 'blur(4px)',
                  }}
                >
                  ✓ Circuit Breaker: HEALTHY
                </div>
              </div>
            </div>

            {/* Deals Equivalent: SLA & Outbox Pipeline Bar */}
            <div className="livento-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
                  SLA & Outbox Pipeline
                </div>
                <ArrowForwardRounded
                  sx={{ fontSize: 18, color: '#94a3b8', cursor: 'pointer' }}
                  onClick={() => onNavigate('Incidents')}
                />
              </div>

              <div style={{ marginTop: 12, fontSize: 12, color: '#64748b' }}>
                Automated incident dispatch and retry synchronization progress.
              </div>

              {/* Progress bar matching Deals card */}
              <div className="livento-pipeline-bar">
                <div className="livento-pipeline-fill" style={{ width: '48%' }} />
                <div className="livento-pipeline-striped" />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>42</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>Closed Within SLA</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>132</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>Active In Queue</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section: Reminders & Calendar (1/3 width) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Reminders Card */}
          <div className="livento-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
                Operational Summary & Reminders
              </div>
              <div title="View All Changes" style={{ display: 'inline-flex' }}>
                <ArrowForwardRounded
                  sx={{ fontSize: 16, color: '#94a3b8', cursor: 'pointer' }}
                  onClick={() => onNavigate('Changes')}
                />
              </div>
            </div>

            {/* Follow-Ups Item */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 14,
                cursor: 'pointer',
                padding: '6px 8px',
                borderRadius: 12,
                transition: 'background 0.18s ease',
              }}
              onClick={() => onNavigate('Incidents')}
              title="Filter Active Follow-Ups"
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Follow-Ups</div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>15 tickets need operator reply</div>
                <div className="livento-avatar-stack" style={{ marginTop: 6 }}>
                  <div className="livento-stack-item">DH</div>
                  <div className="livento-stack-item" style={{ background: '#0369a1' }}>
                    AK
                  </div>
                  <div className="livento-stack-item" style={{ background: '#0284c7' }}>
                    SC
                  </div>
                  <div className="livento-stack-more">+11</div>
                </div>
              </div>

              {/* Progress Ring */}
              <div className="livento-ring-wrap">
                <svg width="38" height="38" viewBox="0 0 38 38">
                  <circle cx="19" cy="19" r="14" fill="none" stroke="#f1f5f9" strokeWidth="3.5" />
                  <circle
                    cx="19"
                    cy="19"
                    r="14"
                    fill="none"
                    stroke="#0284c7"
                    strokeWidth="3.5"
                    strokeDasharray="88"
                    strokeDashoffset="22"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>

            {/* Approvals Item */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 14,
                cursor: 'pointer',
                padding: '6px 8px',
                borderRadius: 12,
                transition: 'background 0.18s ease',
              }}
              onClick={() => onNavigate('Approvals')}
              title="Open Approvals Queue"
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Pending Approvals</div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                  {pendingApprovalsCount > 0 ? `${pendingApprovalsCount} Manager reviews` : '3 Manager reviews pending'}
                </div>
              </div>

              <div className="livento-ring-wrap">
                <svg width="38" height="38" viewBox="0 0 38 38">
                  <circle cx="19" cy="19" r="14" fill="none" stroke="#f1f5f9" strokeWidth="3.5" />
                  <circle
                    cx="19"
                    cy="19"
                    r="14"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="3.5"
                    strokeDasharray="88"
                    strokeDashoffset="44"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>

            {/* Expiring Maintenance Item */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                padding: '6px 8px',
                borderRadius: 12,
                transition: 'background 0.18s ease',
              }}
              onClick={() => onNavigate('Changes')}
              title="Open Maintenance Windows"
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Maintenance Windows</div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>2 change windows active today</div>
              </div>
              <CheckCircleRounded sx={{ fontSize: 24, color: '#10b981' }} />
            </div>
          </div>

          {/* June 2026 Interactive Calendar Card */}
          <div className="livento-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
                {monthNames[monthOffset]}
              </div>
              <div style={{ display: 'flex', gap: 6, color: '#64748b', fontSize: 14 }}>
                <span
                  style={{
                    cursor: monthOffset > 0 ? 'pointer' : 'default',
                    opacity: monthOffset > 0 ? 1 : 0.4,
                    padding: '2px 8px',
                    borderRadius: 6,
                    background: '#f1f5f9',
                    userSelect: 'none',
                  }}
                  onClick={() => setMonthOffset((m) => Math.max(0, m - 1))}
                  title="Previous Month"
                >
                  &lt;
                </span>
                <span
                  style={{
                    cursor: monthOffset < monthNames.length - 1 ? 'pointer' : 'default',
                    opacity: monthOffset < monthNames.length - 1 ? 1 : 0.4,
                    padding: '2px 8px',
                    borderRadius: 6,
                    background: '#f1f5f9',
                    userSelect: 'none',
                  }}
                  onClick={() => setMonthOffset((m) => Math.min(monthNames.length - 1, m + 1))}
                  title="Next Month"
                >
                  &gt;
                </span>
              </div>
            </div>

            {/* Calendar Days Grid */}
            <div className="livento-cal-grid" style={{ marginTop: 12 }}>
              <div className="livento-cal-header-day">Mon</div>
              <div className="livento-cal-header-day">Tue</div>
              <div className="livento-cal-header-day">Wed</div>
              <div className="livento-cal-header-day">Thu</div>
              <div className="livento-cal-header-day">Fri</div>
              <div className="livento-cal-header-day">Sat</div>
              <div className="livento-cal-header-day">Sun</div>

              {/* Muted leading days */}
              <div className="livento-cal-day muted">26</div>
              <div className="livento-cal-day muted">27</div>
              <div className="livento-cal-day muted">28</div>
              <div className="livento-cal-day muted">29</div>
              <div className="livento-cal-day muted">30</div>

              {/* Clickable Days 1 to 21 */}
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21].map((day) => (
                <div
                  key={day}
                  className={`livento-cal-day ${selectedDay === day ? 'active' : ''}`}
                  onClick={() => setSelectedDay(day)}
                  style={{ cursor: 'pointer' }}
                  title={`View schedule for ${monthNames[monthOffset]} ${day}`}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Schedule Category Pills */}
            <div style={{ display: 'flex', gap: 6, margin: '14px 0 12px' }}>
              {(['All', 'Assigned', 'My Schedule'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setCalTab(tab)}
                  style={{
                    border: 'none',
                    background: calTab === tab ? '#0284c7' : '#f1f5f9',
                    color: calTab === tab ? '#ffffff' : '#64748b',
                    borderRadius: 9999,
                    padding: '4px 12px',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Scheduled Tasks List (Dynamic based on selectedDay & calTab) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #edf2f7',
                  borderRadius: 12,
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                }}
                onClick={() => onNavigate('Changes')}
              >
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>
                    {calTab === 'My Schedule'
                      ? 'On-Call Shift & Triage'
                      : calTab === 'Assigned'
                      ? 'RFC-2026-44: Database Failover Test'
                      : `ServiceNow Sync Check · Day ${selectedDay}`}
                  </div>
                  <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>
                    02:00 PM – 03:30 PM · Infrastructure Window
                  </div>
                </div>
                <div
                  style={{
                    background: '#e0f2fe',
                    color: '#0284c7',
                    borderRadius: 9999,
                    padding: '2px 8px',
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                >
                  Active
                </div>
              </div>

              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #edf2f7',
                  borderRadius: 12,
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                }}
                onClick={() => onNavigate('Approvals')}
              >
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>
                    Manager CAB Approval Meeting
                  </div>
                  <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>
                    04:00 PM – 05:00 PM · Architecture Board
                  </div>
                </div>
                <div
                  style={{
                    background: '#fef3c7',
                    color: '#d97706',
                    borderRadius: 9999,
                    padding: '2px 8px',
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                >
                  Pending
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Main Data Table (Left) + On-Call Contacts (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(300px, 1fr)', gap: 20 }}>
        {/* Main Data Table */}
        <div className="livento-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
                Operational Ticket Queue
              </div>
              <span
                style={{
                  background: '#e0f2fe',
                  color: '#0284c7',
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 9999,
                }}
              >
                {combinedQueue.length} Active
              </span>
            </div>

            {/* Table Search */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 9999,
                padding: '4px 10px',
              }}
            >
              <SearchRounded sx={{ fontSize: 16, color: '#94a3b8', mr: 0.5 }} />
              <input
                type="text"
                placeholder="Search..."
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                style={{
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  fontSize: 11,
                  color: '#334155',
                  width: 100,
                }}
              />
            </div>
          </div>

          <div className="livento-table-wrap">
            <table className="livento-table">
              <thead>
                <tr>
                  <th>TICKET & TITLE</th>
                  <th>TYPE</th>
                  <th>PRIORITY</th>
                  <th>REQUESTER</th>
                  <th>ASSIGNEES</th>
                  <th>SERVICENOW</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {combinedQueue.slice(0, 6).map((item, idx) => {
                  const statusClass = item.status.toLowerCase().includes('sync')
                    ? 'synced'
                    : item.status.toLowerCase().includes('prog')
                    ? 'in-progress'
                    : item.status.toLowerCase().includes('resolv')
                    ? 'resolved'
                    : 'open'

                  return (
                    <tr
                      key={idx}
                      onClick={() => {
                        if (item.type === 'incident') onOpenIncident(item.id)
                        else onOpenRequest({ backendId: item.id })
                      }}
                      style={{ cursor: 'pointer', transition: 'background 0.15s ease' }}
                    >
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 8,
                              background: item.type === 'incident' ? '#fee2e2' : '#e0f2fe',
                              color: item.type === 'incident' ? '#dc2626' : '#0284c7',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: 11,
                            }}
                          >
                            {item.type === 'incident' ? 'INC' : 'REQ'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: '#0f172a' }}>{item.ticketNumber}</div>
                            <div
                              style={{
                                fontSize: 11,
                                color: '#64748b',
                                maxWidth: 180,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {item.title}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>{item.category}</span>
                      </td>

                      <td>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: item.priority.includes('1')
                              ? '#dc2626'
                              : item.priority.includes('2')
                              ? '#d97706'
                              : '#0284c7',
                          }}
                        >
                          {item.priority}
                        </span>
                      </td>

                      <td>
                        <span style={{ fontSize: 12, color: '#334155' }}>{item.caller}</span>
                      </td>

                      <td>
                        <div className="livento-avatar-stack">
                          {item.assignees.map((as, i) => (
                            <div key={i} className="livento-stack-item">
                              {as}
                            </div>
                          ))}
                        </div>
                      </td>

                      <td>
                        <span className={`livento-status-pill ${statusClass}`}>● {item.status}</span>
                      </td>

                      <td>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (item.type === 'incident') onOpenIncident(item.id)
                            else onOpenRequest({ backendId: item.id })
                          }}
                          style={{
                            background: '#f1f5f9',
                            border: 'none',
                            borderRadius: 8,
                            padding: '4px 10px',
                            fontSize: 11,
                            fontWeight: 700,
                            color: '#0284c7',
                            cursor: 'pointer',
                          }}
                        >
                          View →
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* On-Call Support Contacts Card ("Leads Contact" style) */}
        <div className="livento-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
              On-Call Support Team
            </div>
            <div title="View Complete On-Call Roster" style={{ display: 'inline-flex' }}>
              <ArrowForwardRounded
                sx={{ fontSize: 16, color: '#94a3b8', cursor: 'pointer' }}
                onClick={() => setOnCallRosterOpen(true)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {onCallTeam.map((member, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
                  onClick={() => setContactModalUser(member)}
                >
                  <div
                    style={{
                      width: 34,
                      height: 34,
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
                    {member.avatar}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{member.name}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{member.location}</div>
                  </div>
                </div>

                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: '50%',
                    background: '#f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#0284c7',
                  }}
                  title={`Contact ${member.name}`}
                  onClick={() => setContactModalUser(member)}
                >
                  <PhoneRounded sx={{ fontSize: 15 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Contact Operator Modal Dialog */}
      <Dialog
        open={Boolean(contactModalUser)}
        onClose={() => setContactModalUser(null)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: 3,
              p: 1,
            },
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: 17, pb: 1 }}>
          On-Call Incident Escalation
        </DialogTitle>
        <DialogContent>
          {contactModalUser && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 14,
                    fontWeight: 800,
                  }}
                >
                  {contactModalUser.avatar}
                </div>
                <div>
                  <Typography sx={{ fontWeight: 800, fontSize: 15, color: '#0f172a' }}>
                    {contactModalUser.name}
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: '#0284c7', fontWeight: 600 }}>
                    {contactModalUser.role} · {contactModalUser.location}
                  </Typography>
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: 12, border: '1px solid #edf2f7' }}>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Paging Channel:</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginTop: 2 }}>
                  +1 (212) 555-0199 (Ext 401)
                </div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                  Shift Group: Northstar - Service Desk & Infrastructure
                </div>
              </div>

              <Typography sx={{ fontSize: 12, color: '#64748b' }}>
                Paging this operator will record an automated work note in ServiceNow incident triage logs.
              </Typography>
            </div>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setContactModalUser(null)}>Close</Button>
          <Button
            variant="contained"
            startIcon={<PhoneRounded />}
            onClick={() => {
              alert(`Paging dispatched to ${contactModalUser?.name} via Northstar Voice Gateway.`)
              setContactModalUser(null)
            }}
            sx={{ borderRadius: 9999, px: 2.5 }}
          >
            Dispatch Call
          </Button>
        </DialogActions>
      </Dialog>

      {/* On-Call Team Roster Modal */}
      <Dialog
        open={onCallRosterOpen}
        onClose={() => setOnCallRosterOpen(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: 3,
              p: 1,
            },
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: 18, pb: 1 }}>
          Complete On-Call Operations Roster
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: '#64748b', fontSize: 13, mb: 2 }}>
            Tier-1 and Tier-2 incident engineers currently assigned to the active operational rotation:
          </Typography>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {onCallTeam.map((member, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: '#f8fafc',
                  border: '1px solid #edf2f7',
                  borderRadius: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: '#0284c7',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      fontWeight: 800,
                    }}
                  >
                    {member.avatar}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{member.name}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>{member.role} · {member.location}</div>
                  </div>
                </div>
                <Chip label="On-Shift" size="small" color="success" sx={{ fontSize: 10, height: 22, fontWeight: 700 }} />
              </div>
            ))}
          </div>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setOnCallRosterOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}
