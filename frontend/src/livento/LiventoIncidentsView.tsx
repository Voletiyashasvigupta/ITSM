import React, { useState } from 'react'
import {
  LiventoKpiGrid,
  type LiventoKpiItem,
} from './LiventoKpiGrid'
import ReportProblemRounded from '@mui/icons-material/ReportProblemRounded'
import ErrorOutlineRounded from '@mui/icons-material/ErrorOutlineRounded'
import SyncRounded from '@mui/icons-material/SyncRounded'
import AccessTimeRounded from '@mui/icons-material/AccessTimeRounded'
import SearchRounded from '@mui/icons-material/SearchRounded'
import AddRounded from '@mui/icons-material/AddRounded'

export interface IncidentItem {
  id: string
  incidentNumber?: string
  title: string
  shortDescription?: string
  priority?: string
  status: string
  caller?: string
  category?: string
  createdAt?: string
  urgency?: string
  impact?: string
}

export interface LiventoIncidentsViewProps {
  incidents: IncidentItem[]
  onOpenIncident: (id: string) => void
  onNewIncident: () => void
}

export const LiventoIncidentsView: React.FC<LiventoIncidentsViewProps> = ({
  incidents,
  onOpenIncident,
  onNewIncident,
}) => {
  const [filter, setFilter] = useState<string>('All')
  const [search, setSearch] = useState('')

  const openCount = incidents.filter((i) => !['RESOLVED', 'CLOSED'].includes(i.status?.toUpperCase() || '')).length
  const p1Count = incidents.filter(
    (i) => i.priority?.includes('1') || i.priority?.toLowerCase().includes('critical')
  ).length

  const kpiItems: LiventoKpiItem[] = [
    {
      icon: <ReportProblemRounded sx={{ fontSize: 18 }} />,
      iconColor: 'amber',
      label: 'Open Incidents',
      value: openCount > 0 ? openCount : '14',
      trend: '+12% ↗',
      trendDirection: 'up',
      onClick: () => setFilter('Open'),
    },
    {
      icon: <ErrorOutlineRounded sx={{ fontSize: 18 }} />,
      iconColor: 'rose',
      label: 'P1 / Critical Outages',
      value: p1Count > 0 ? p1Count : '2',
      trend: '-50% ↘',
      trendDirection: 'down',
      onClick: () => setFilter('P1 / Critical'),
    },
    {
      icon: <SyncRounded sx={{ fontSize: 18 }} />,
      iconColor: 'purple',
      label: 'ServiceNow Sync Rate',
      value: '99.4%',
      trend: 'Auto-Retry Active ↗',
      trendDirection: 'up',
      onClick: () => setFilter('Synced'),
    },
    {
      icon: <AccessTimeRounded sx={{ fontSize: 18 }} />,
      iconColor: 'emerald',
      label: 'Avg Resolution Time',
      value: '38m',
      trend: '-18% ↘',
      trendDirection: 'down',
      onClick: () => setFilter('Resolved'),
    },
  ]

  const filteredIncidents = incidents.filter((inc) => {
    const text = `${inc.incidentNumber || ''} ${inc.shortDescription || ''} ${inc.title || ''} ${inc.caller || ''} ${inc.category || ''}`.toLowerCase()
    if (search && !text.includes(search.toLowerCase())) return false

    if (filter === 'All') return true
    if (filter === 'P1 / Critical') return inc.priority?.includes('1') || inc.priority?.toLowerCase().includes('critical')
    if (filter === 'P2 / High') return inc.priority?.includes('2') || inc.priority?.toLowerCase().includes('high')
    if (filter === 'Open') return !['RESOLVED', 'CLOSED'].includes(inc.status?.toUpperCase() || '')
    if (filter === 'Resolved') return ['RESOLVED', 'CLOSED'].includes(inc.status?.toUpperCase() || '')
    if (filter === 'Synced') return inc.status?.toUpperCase().includes('SYNC')
    return true
  })

  return (
    <div>
      {/* 4 KPI Cards */}
      <LiventoKpiGrid items={kpiItems} />

      {/* Main Table Card */}
      <div className="livento-card">
        {/* Header with Title, Filter Pills, and New Incident CTA */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 20,
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
              Incident Queue
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
              {filteredIncidents.length} Records
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            {/* Search */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 9999,
                padding: '4px 12px',
              }}
            >
              <SearchRounded sx={{ fontSize: 16, color: '#94a3b8', mr: 0.5 }} />
              <input
                type="text"
                placeholder="Search incidents..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  fontSize: 12,
                  color: '#334155',
                  width: 140,
                }}
              />
            </div>

            {/* Filter Pills */}
            <div style={{ display: 'flex', gap: 4, background: '#f1f5f9', padding: 3, borderRadius: 9999 }}>
              {['All', 'Open', 'P1 / Critical', 'P2 / High', 'Resolved'].map((pill) => (
                <button
                  key={pill}
                  type="button"
                  onClick={() => setFilter(pill)}
                  style={{
                    border: 'none',
                    background: filter === pill ? '#0284c7' : 'transparent',
                    color: filter === pill ? '#ffffff' : '#64748b',
                    borderRadius: 9999,
                    padding: '4px 12px',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {pill}
                </button>
              ))}
            </div>

            {/* New Incident Button */}
            <button
              type="button"
              onClick={onNewIncident}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: 9999,
                padding: '8px 18px',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 3px 10px rgba(2, 132, 199, 0.3)',
              }}
            >
              <AddRounded sx={{ fontSize: 18 }} />
              New Incident
            </button>
          </div>
        </div>

        {/* Incidents Table */}
        <div className="livento-table-wrap">
          <table className="livento-table">
            <thead>
              <tr>
                <th>NUMBER & SUMMARY</th>
                <th>CATEGORY</th>
                <th>PRIORITY</th>
                <th>CALLER</th>
                <th>ASSIGNEES</th>
                <th>SERVICENOW SYNC</th>
                <th>CREATED</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {filteredIncidents.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                    No incident records found.
                  </td>
                </tr>
              ) : (
                filteredIncidents.map((inc) => {
                  const num = inc.incidentNumber || `INC00${inc.id.slice(0, 5)}`
                  const statusClass = inc.status?.toLowerCase().includes('sync')
                    ? 'synced'
                    : inc.status?.toLowerCase().includes('prog')
                    ? 'in-progress'
                    : inc.status?.toLowerCase().includes('resolv')
                    ? 'resolved'
                    : 'open'

                  return (
                    <tr key={inc.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 8,
                              background: '#fee2e2',
                              color: '#dc2626',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: 11,
                            }}
                          >
                            INC
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, color: '#0f172a' }}>{num}</div>
                            <div
                              style={{
                                fontSize: 11,
                                color: '#64748b',
                                maxWidth: 220,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {inc.shortDescription || inc.title || 'System Alert'}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>
                          {inc.category || 'General IT'}
                        </span>
                      </td>

                      <td>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: inc.priority?.includes('1')
                              ? '#dc2626'
                              : inc.priority?.includes('2')
                              ? '#d97706'
                              : '#0284c7',
                          }}
                        >
                          {inc.priority || 'P3 - Moderate'}
                        </span>
                      </td>

                      <td>
                        <span style={{ fontSize: 12, color: '#334155' }}>{inc.caller || 'Portal User'}</span>
                      </td>

                      <td>
                        <div className="livento-avatar-stack">
                          <div className="livento-stack-item">DH</div>
                          <div className="livento-stack-item" style={{ background: '#0284c7' }}>
                            SC
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className={`livento-status-pill ${statusClass}`}>
                          ● {inc.status || 'SYNCED'}
                        </span>
                      </td>

                      <td>
                        <span style={{ fontSize: 11, color: '#94a3b8' }}>
                          {inc.createdAt ? new Date(inc.createdAt).toLocaleDateString() : 'Today'}
                        </span>
                      </td>

                      <td>
                        <button
                          type="button"
                          onClick={() => onOpenIncident(inc.id)}
                          style={{
                            background: '#f1f5f9',
                            border: 'none',
                            borderRadius: 8,
                            padding: '4px 12px',
                            fontSize: 11,
                            fontWeight: 700,
                            color: '#0284c7',
                            cursor: 'pointer',
                          }}
                        >
                          Manage →
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
