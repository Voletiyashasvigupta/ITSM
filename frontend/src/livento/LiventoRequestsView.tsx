import React, { useState } from 'react'
import {
  LiventoKpiGrid,
  type LiventoKpiItem,
} from './LiventoKpiGrid'
import ReceiptLongRounded from '@mui/icons-material/ReceiptLongRounded'
import HourglassEmptyRounded from '@mui/icons-material/HourglassEmptyRounded'
import SyncRounded from '@mui/icons-material/SyncRounded'
import TaskAltRounded from '@mui/icons-material/TaskAltRounded'
import SearchRounded from '@mui/icons-material/SearchRounded'
import AddRounded from '@mui/icons-material/AddRounded'

export interface RequestItem {
  id: string
  requestNumber: string
  serviceName: string
  status: string
  createdAt: string
  requesterName?: string
  priority?: string
  department?: string
}

export interface LiventoRequestsViewProps {
  requests: RequestItem[]
  onOpenRequest: (request: RequestItem) => void
  onNewRequest: () => void
}

export const LiventoRequestsView: React.FC<LiventoRequestsViewProps> = ({
  requests,
  onOpenRequest,
  onNewRequest,
}) => {
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')

  const activeCount = requests.filter(
    (r) => !['COMPLETED', 'RESOLVED', 'REJECTED'].includes(r.status?.toUpperCase() || '')
  ).length
  const completedCount = requests.filter((r) =>
    ['COMPLETED', 'RESOLVED'].includes(r.status?.toUpperCase() || '')
  ).length

  const kpiItems: LiventoKpiItem[] = [
    {
      icon: <ReceiptLongRounded sx={{ fontSize: 18 }} />,
      iconColor: 'blue',
      label: 'Active Requests',
      value: activeCount > 0 ? activeCount : '28',
      trend: '+14% ↗',
      trendDirection: 'up',
      onClick: () => setFilter('Active'),
    },
    {
      icon: <HourglassEmptyRounded sx={{ fontSize: 18 }} />,
      iconColor: 'amber',
      label: 'In Progress',
      value: activeCount > 0 ? activeCount : '19',
      trend: 'Under Review',
      trendDirection: 'neutral',
      onClick: () => setFilter('Active'),
    },
    {
      icon: <SyncRounded sx={{ fontSize: 18 }} />,
      iconColor: 'purple',
      label: 'ServiceNow Synced',
      value: '99.1%',
      trend: 'Auto REQ/RITM ↗',
      trendDirection: 'up',
      onClick: () => setFilter('All'),
    },
    {
      icon: <TaskAltRounded sx={{ fontSize: 18 }} />,
      iconColor: 'emerald',
      label: 'Completed',
      value: completedCount > 0 ? completedCount : '54',
      trend: '+22% ↗',
      trendDirection: 'up',
      onClick: () => setFilter('Completed'),
    },
  ]

  const filteredRequests = requests.filter((req) => {
    const text = `${req.requestNumber} ${req.serviceName} ${req.requesterName || ''}`.toLowerCase()
    if (search && !text.includes(search.toLowerCase())) return false
    if (filter === 'All') return true
    if (filter === 'Active') return !['COMPLETED', 'RESOLVED', 'REJECTED'].includes(req.status?.toUpperCase() || '')
    if (filter === 'Completed') return ['COMPLETED', 'RESOLVED'].includes(req.status?.toUpperCase() || '')
    return true
  })

  return (
    <div>
      {/* 4 KPI Cards */}
      <LiventoKpiGrid items={kpiItems} />

      {/* Main Table Card */}
      <div className="livento-card">
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
              Service Requests Queue
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
              {filteredRequests.length} Requests
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
                placeholder="Search requests..."
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
              {['All', 'Active', 'Completed'].map((pill) => (
                <button
                  key={pill}
                  type="button"
                  onClick={() => setFilter(pill)}
                  style={{
                    border: 'none',
                    background: filter === pill ? '#0284c7' : 'transparent',
                    color: filter === pill ? '#ffffff' : '#64748b',
                    borderRadius: 9999,
                    padding: '4px 14px',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {pill}
                </button>
              ))}
            </div>

            {/* New Request Button */}
            <button
              type="button"
              onClick={onNewRequest}
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
              New Request
            </button>
          </div>
        </div>

        {/* Requests Table */}
        <div className="livento-table-wrap">
          <table className="livento-table">
            <thead>
              <tr>
                <th>REQUEST NUMBER & SERVICE</th>
                <th>REQUESTER</th>
                <th>ASSIGNEES</th>
                <th>STATUS</th>
                <th>SERVICENOW SYNC</th>
                <th>SUBMITTED</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                    No service requests found.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => {
                  const statusClass = req.status.toLowerCase().includes('sync')
                    ? 'synced'
                    : req.status.toLowerCase().includes('comp') || req.status.toLowerCase().includes('resolv')
                    ? 'resolved'
                    : req.status.toLowerCase().includes('prog')
                    ? 'in-progress'
                    : 'open'

                  return (
                    <tr key={req.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 8,
                              background: '#e0f2fe',
                              color: '#0284c7',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: 11,
                            }}
                          >
                            REQ
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, color: '#0f172a' }}>{req.requestNumber}</div>
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
                              {req.serviceName}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span style={{ fontSize: 12, color: '#334155' }}>
                          {req.requesterName || 'Employee User'}
                        </span>
                      </td>

                      <td>
                        <div className="livento-avatar-stack">
                          <div className="livento-stack-item">AH</div>
                          <div className="livento-stack-item" style={{ background: '#0284c7' }}>
                            JD
                          </div>
                        </div>
                      </td>

                      <td>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: req.status.includes('COMP') ? '#16a34a' : '#0284c7',
                          }}
                        >
                          {req.status}
                        </span>
                      </td>

                      <td>
                        <span className={`livento-status-pill ${statusClass}`}>● SYNCED (sc_req_item)</span>
                      </td>

                      <td>
                        <span style={{ fontSize: 11, color: '#94a3b8' }}>
                          {req.createdAt ? new Date(req.createdAt).toLocaleDateString() : 'Today'}
                        </span>
                      </td>

                      <td>
                        <button
                          type="button"
                          onClick={() => onOpenRequest(req)}
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
                          Details →
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
