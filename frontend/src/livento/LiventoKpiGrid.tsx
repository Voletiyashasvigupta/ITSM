import React from 'react'

export interface LiventoKpiItem {
  icon: React.ReactNode
  iconColor: 'amber' | 'blue' | 'purple' | 'emerald' | 'rose'
  label: string
  value: string | number
  trend?: string
  trendDirection?: 'up' | 'down' | 'neutral'
  onClick?: () => void
}

export interface LiventoKpiGridProps {
  items: LiventoKpiItem[]
}

export const LiventoKpiGrid: React.FC<LiventoKpiGridProps> = ({ items }) => {
  return (
    <div className="livento-kpi-grid">
      {items.map((item, idx) => {
        const trendDir = item.trendDirection || 'up'
        return (
          <div
            key={idx}
            className="livento-kpi-card"
            onClick={item.onClick}
            style={{
              cursor: item.onClick ? 'pointer' : 'default',
              transition: 'transform 0.18s ease, box-shadow 0.18s ease',
            }}
            title={item.onClick ? `Filter / View ${item.label}` : undefined}
          >
            <div className="livento-kpi-top">
              <div className="livento-kpi-header-left">
                <div className={`livento-kpi-icon-wrap livento-kpi-icon-${item.iconColor}`}>
                  {item.icon}
                </div>
                <div className="livento-kpi-label">{item.label}</div>
              </div>
            </div>

            <div className="livento-kpi-bottom">
              <div className="livento-kpi-value">{item.value}</div>
              {item.trend && (
                <div className={`livento-trend-pill ${trendDir}`}>
                  {item.trend}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
