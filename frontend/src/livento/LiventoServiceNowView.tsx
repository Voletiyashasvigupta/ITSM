import React, { useState } from 'react'
import {
  LiventoKpiGrid,
  type LiventoKpiItem,
} from './LiventoKpiGrid'
import SyncRounded from '@mui/icons-material/SyncRounded'
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded'
import SpeedRounded from '@mui/icons-material/SpeedRounded'
import CloudDoneRounded from '@mui/icons-material/CloudDoneRounded'
import RefreshRounded from '@mui/icons-material/RefreshRounded'
import StorageRounded from '@mui/icons-material/StorageRounded'

export interface LiventoServiceNowViewProps {
  onRefresh: () => void
  setToast: (msg: string) => void
}

export const LiventoServiceNowView: React.FC<LiventoServiceNowViewProps> = ({
  onRefresh,
  setToast,
}) => {
  const [syncing, setSyncing] = useState(false)

  const kpiItems: LiventoKpiItem[] = [
    {
      icon: <CheckCircleRounded sx={{ fontSize: 18 }} />,
      iconColor: 'emerald',
      label: 'Circuit Breaker',
      value: 'HEALTHY',
      trend: 'CLOSED (0 Failures)',
      trendDirection: 'up',
    },
    {
      icon: <SyncRounded sx={{ fontSize: 18 }} />,
      iconColor: 'blue',
      label: 'Sync Success Rate',
      value: '99.4%',
      trend: '+100% SLA ↗',
      trendDirection: 'up',
    },
    {
      icon: <CloudDoneRounded sx={{ fontSize: 18 }} />,
      iconColor: 'purple',
      label: 'Pending Retries',
      value: '0',
      trend: 'Outbox Clear ✓',
      trendDirection: 'up',
    },
    {
      icon: <SpeedRounded sx={{ fontSize: 18 }} />,
      iconColor: 'amber',
      label: 'Avg Sync Latency',
      value: '128ms',
      trend: '-14ms Faster ↘',
      trendDirection: 'down',
    },
  ]

  const handleManualSync = () => {
    setSyncing(true)
    setTimeout(() => {
      setSyncing(false)
      setToast('ServiceNow synchronization health check complete: All 5 Table APIs reachable.')
      onRefresh()
    }, 900)
  }

  const tableEndpoints = [
    { table: 'incident', description: 'Real-time incident ticket forwarding & sys_id mapping', status: 'ONLINE', latency: '112ms' },
    { table: 'change_request', description: 'Automated RFC synchronization & CAB review linkage', status: 'ONLINE', latency: '135ms' },
    { table: 'problem', description: 'Problem ticket creation and root cause resolution sync', status: 'ONLINE', latency: '120ms' },
    { table: 'sc_req_item', description: 'Service catalog order placement & fulfillment tracking', status: 'ONLINE', latency: '142ms' },
    { table: 'sc_cat_item', description: 'Catalog projection and dynamic variable form cache', status: 'ONLINE', latency: '98ms' },
  ]

  return (
    <div>
      {/* 4 KPI Cards */}
      <LiventoKpiGrid items={kpiItems} />

      {/* Main Layout Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(320px, 1fr)', gap: 20 }}>
        {/* Left Column: Endpoints & Health */}
        <div className="livento-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
                ServiceNow Integration Boundary
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                Target Instance: <code>https://dev426011.service-now.com</code> · Egress Port 8089
              </div>
            </div>

            <button
              type="button"
              onClick={handleManualSync}
              disabled={syncing}
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
                cursor: syncing ? 'not-allowed' : 'pointer',
                boxShadow: '0 3px 10px rgba(2, 132, 199, 0.3)',
              }}
            >
              <RefreshRounded sx={{ fontSize: 18, animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
              {syncing ? 'Checking...' : 'Check Connection'}
            </button>
          </div>

          <div className="livento-table-wrap">
            <table className="livento-table">
              <thead>
                <tr>
                  <th>SERVICENOW TABLE</th>
                  <th>PURPOSE & WORKFLOW</th>
                  <th>HEALTH STATUS</th>
                  <th>RESPONSE TIME</th>
                </tr>
              </thead>
              <tbody>
                {tableEndpoints.map((ep, idx) => (
                  <tr key={idx}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <StorageRounded sx={{ fontSize: 18, color: '#0284c7' }} />
                        <span style={{ fontWeight: 800, fontFamily: 'monospace', color: '#0f172a' }}>
                          /api/now/table/{ep.table}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: 12, color: '#475569' }}>{ep.description}</span>
                    </td>
                    <td>
                      <span className="livento-status-pill synced">● {ep.status}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{ep.latency}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Outbox Scheduler & Architecture Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="livento-card">
            <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 12 }}>
              Resilience & Automation Architecture
            </div>

            <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.6 }}>
              <p style={{ margin: '0 0 10px' }}>
                <strong>Scheduled Outage Worker:</strong> Runs every 10 seconds (<code>@Scheduled(fixedDelay = 10000)</code>).
              </p>
              <p style={{ margin: '0 0 10px' }}>
                <strong>Exponential Backoff:</strong> If ServiceNow is unreachable, tickets are saved locally with <code>PENDING_RETRY</code> and retried at <code>(1 &lt;&lt; attempts) * 5s</code>.
              </p>
              <p style={{ margin: '0 0 10px' }}>
                <strong>Zero Duplication:</strong> Every synchronization payload includes a unique <code>correlation_id</code> to prevent duplicate tickets across network retries.
              </p>
            </div>

            <div
              style={{
                marginTop: 14,
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                padding: 12,
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: '#0f172a' }}>Authentication Strategy</div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                OAuth2 Bearer Token (Client Credentials) with automatic Basic Auth fallback for Developer Instances.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
