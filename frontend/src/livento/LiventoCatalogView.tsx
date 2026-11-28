import React, { useState } from 'react'
import {
  LiventoKpiGrid,
  type LiventoKpiItem,
} from './LiventoKpiGrid'
import ShoppingCartRounded from '@mui/icons-material/ShoppingCartRounded'
import LaptopMacRounded from '@mui/icons-material/LaptopMacRounded'
import ManageAccountsRounded from '@mui/icons-material/ManageAccountsRounded'
import SearchRounded from '@mui/icons-material/SearchRounded'
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded'
import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded'
import StarRounded from '@mui/icons-material/StarRounded'

export interface CatalogItem {
  id?: string
  name: string
  description: string
  category?: string
  icon?: string
}

export interface LiventoCatalogViewProps {
  catalogItems: CatalogItem[]
  onSelectService: (serviceName: string) => void
}

export const LiventoCatalogView: React.FC<LiventoCatalogViewProps> = ({
  catalogItems,
  onSelectService,
}) => {
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')

  // 4 KPI cards matching Livento
  const kpiItems: LiventoKpiItem[] = [
    {
      icon: <ShoppingCartRounded sx={{ fontSize: 18 }} />,
      iconColor: 'blue',
      label: 'Catalog Services',
      value: catalogItems.length > 0 ? catalogItems.length : '18',
      trend: '+4 New ↗',
      trendDirection: 'up',
      onClick: () => setFilter('All'),
    },
    {
      icon: <LaptopMacRounded sx={{ fontSize: 18 }} />,
      iconColor: 'amber',
      label: 'Most Requested',
      value: 'MacBook Pro M3',
      trend: '42 Orders ↗',
      trendDirection: 'up',
      onClick: () => onSelectService('Developer Workstation & Laptop'),
    },
    {
      icon: <ManageAccountsRounded sx={{ fontSize: 18 }} />,
      iconColor: 'purple',
      label: 'Avg SLA Delivery',
      value: '2.4h',
      trend: '-15% Faster ↘',
      trendDirection: 'down',
      onClick: () => setFilter('Hardware'),
    },
    {
      icon: <CheckCircleRounded sx={{ fontSize: 18 }} />,
      iconColor: 'emerald',
      label: 'ServiceNow Sync',
      value: '100%',
      trend: 'Live sc_cat_item ↗',
      trendDirection: 'up',
      onClick: () => setFilter('Access & Security'),
    },
  ]

  const defaultItems: CatalogItem[] = [
    {
      name: 'Developer Workstation & Laptop',
      description: 'Request high-performance MacBook Pro M3 or ThinkPad P1 workstation with pre-loaded IDEs.',
      category: 'Hardware',
    },
    {
      name: 'Cloud & Database Access Grant',
      description: 'Request IAM credentials for AWS, Google Cloud, and MySQL read-replica instances.',
      category: 'Access & Security',
    },
    {
      name: 'Enterprise Software License',
      description: 'License provisioning for Tableau, IntelliJ Ultimate, Figma, and Slack Enterprise Grid.',
      category: 'Software',
    },
    {
      name: 'VPN & Remote Access Gateway',
      description: 'Zero-trust network access (ZTNA) and hardware security token enrollment.',
      category: 'Access & Security',
    },
    {
      name: 'Asset purchase',
      description: 'Procure hardware assets, computer equipment, monitors, or specialized peripherals.',
      category: 'Hardware',
    },
    {
      name: 'Office & Facilities Workspace',
      description: 'Desk allocation, ergonomic accessories, building access pass, and visitor parking.',
      category: 'Workplace',
    },
  ]

  const itemsToRender = catalogItems.length > 0 ? catalogItems : defaultItems

  const filteredItems = itemsToRender.filter((item) => {
    const text = `${item.name} ${item.description} ${item.category || ''}`.toLowerCase()
    if (search && !text.includes(search.toLowerCase())) return false
    if (filter === 'All') return true
    if (filter === 'Hardware' && item.category !== 'Hardware') return false
    if (filter === 'Software' && item.category !== 'Software') return false
    if (filter === 'Access' && !item.category?.includes('Access')) return false
    return true
  })

  return (
    <div>
      {/* 4 KPI Cards */}
      <LiventoKpiGrid items={kpiItems} />

      {/* Catalog Main Card */}
      <div className="livento-card">
        {/* Header with Title and Search/Filters */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 24,
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div>
            <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
              Service Catalog
            </div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
              Choose a standard service to automatically provision resources via ServiceNow.
            </div>
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
                placeholder="Search services..."
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

            {/* Category Pills */}
            <div style={{ display: 'flex', gap: 4, background: '#f1f5f9', padding: 3, borderRadius: 9999 }}>
              {['All', 'Hardware', 'Software', 'Access'].map((pill) => (
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
                    transition: 'all 0.15s ease',
                  }}
                >
                  {pill}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Grid of Catalog Cards matching "The Somerset" layout */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 20,
          }}
        >
          {filteredItems.map((service, idx) => (
            <div
              key={idx}
              style={{
                background: '#ffffff',
                border: '1px solid #edf2f7',
                borderRadius: 18,
                padding: 20,
                boxShadow: '0 4px 16px rgba(15, 23, 42, 0.03)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)'
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(15, 23, 42, 0.07)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(15, 23, 42, 0.03)'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span
                      style={{
                        background: '#e0f2fe',
                        color: '#0284c7',
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 9999,
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                      }}
                    >
                      {service.category || 'General IT'}
                    </span>
                    <div
                      style={{
                        fontFamily: 'Manrope, sans-serif',
                        fontSize: 16,
                        fontWeight: 800,
                        color: '#0f172a',
                        marginTop: 8,
                      }}
                    >
                      {service.name}
                    </div>
                  </div>

                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: '#f8fafc',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#0284c7',
                    }}
                  >
                    <ArrowForwardRounded sx={{ fontSize: 16 }} />
                  </div>
                </div>

                <div
                  style={{
                    fontSize: 12,
                    color: '#64748b',
                    margin: '10px 0 16px',
                    lineHeight: 1.5,
                    minHeight: 36,
                  }}
                >
                  {service.description}
                </div>

                {/* Sub-metrics matching "The Somerset" card */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    padding: '10px 0',
                    borderTop: '1px solid #f1f5f9',
                    borderBottom: '1px solid #f1f5f9',
                    marginBottom: 16,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>2-4h</div>
                    <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>SLA Delivery</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>100%</div>
                    <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>ServiceNow Sync</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <StarRounded sx={{ fontSize: 16, color: '#f59e0b' }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>4.9</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={() => onSelectService(service.name)}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 10,
                  padding: '9px 16px',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 3px 10px rgba(2, 132, 199, 0.25)',
                }}
              >
                Request Service →
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
