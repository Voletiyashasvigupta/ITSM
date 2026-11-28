import React, { useState } from 'react'
import { LiventoNavbar } from './LiventoNavbar'
import { LiventoDashboard } from './LiventoDashboard'
import { LiventoIncidentsView } from './LiventoIncidentsView'
import { LiventoCatalogView } from './LiventoCatalogView'
import { LiventoRequestsView } from './LiventoRequestsView'
import { LiventoServiceNowView } from './LiventoServiceNowView'
import { LiventoKpiGrid, type LiventoKpiItem } from './LiventoKpiGrid'
import PublishedWithChangesRounded from '@mui/icons-material/PublishedWithChangesRounded'
import CalendarTodayOutlined from '@mui/icons-material/CalendarTodayOutlined'
import TaskAltRounded from '@mui/icons-material/TaskAltRounded'
import ReportProblemRounded from '@mui/icons-material/ReportProblemRounded'
import SearchRounded from '@mui/icons-material/SearchRounded'
import HourglassEmptyRounded from '@mui/icons-material/HourglassEmptyRounded'
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded'
import type { PortalUser } from '../auth/AuthContext'

export interface LiventoAppShellProps {
  user: PortalUser
  active: string
  setActive: (page: string) => void
  incidentsList: any[]
  requestsList: any[]
  openIncidentsCount: number
  p1IncidentsCount: number
  requestsCount: number
  pendingApprovalsCount: number
  problemsCount: number
  changesCount: number
  catalogItems?: any[]
  onOpenIncident: (id: string) => void
  onOpenRequest: (req: any) => void
  onNewIncident: () => void
  onNewRequest: () => void
  onSelectService: (serviceName: string) => void
  unreadCount: number
  onNotificationClick: (event: React.MouseEvent<HTMLElement>) => void
  onProfileClick: (event: React.MouseEvent<HTMLElement>) => void
  onRefresh: () => void
  setToast: (msg: string) => void
  onLogout?: () => void
  onLoginClick?: () => void
  children?: React.ReactNode
}

export const LiventoAppShell: React.FC<LiventoAppShellProps> = ({
  user,
  active,
  setActive,
  incidentsList,
  requestsList,
  openIncidentsCount,
  p1IncidentsCount,
  requestsCount,
  pendingApprovalsCount,
  problemsCount,
  changesCount,
  catalogItems = [],
  onOpenIncident,
  onOpenRequest,
  onNewIncident,
  onNewRequest,
  onSelectService,
  unreadCount,
  onNotificationClick,
  onProfileClick,
  onRefresh,
  setToast,
  onLogout,
  onLoginClick,
  children,
}) => {
  const [searchQuery, setSearchQuery] = useState('')

  // Map active to standard Livento tabs
  const getActiveTab = () => {
    if (active === 'Overview' || active === 'Admin dashboard' || active === 'Dashboard') {
      return 'Dashboard'
    }
    if (active === 'Incidents' || active === 'Incident Detail') {
      return 'Incidents'
    }
    if (active === 'Service catalog') {
      return 'Service Catalog'
    }
    if (active === 'Requests' || active === 'Request Detail' || active === 'Request receipt') {
      return 'Requests'
    }
    if (active === 'Changes') {
      return 'Changes'
    }
    if (active === 'Problems') {
      return 'Problems'
    }
    if (active === 'ServiceNow Sync') {
      return 'ServiceNow Sync'
    }
    return active
  }

  const handleTabChange = (tab: string) => {
    setActive(tab)
  }

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      setActive('Service Catalog')
    }
  }

  // Changes KPI Items
  const changesKpis: LiventoKpiItem[] = [
    {
      icon: <PublishedWithChangesRounded sx={{ fontSize: 18 }} />,
      iconColor: 'blue',
      label: 'Total Change Requests',
      value: changesCount > 0 ? changesCount : '12',
      trend: '+3 RFCs ↗',
      trendDirection: 'up',
      onClick: () => setToast('Displaying all enterprise change requests (RFCs).'),
    },
    {
      icon: <HourglassEmptyRounded sx={{ fontSize: 18 }} />,
      iconColor: 'amber',
      label: 'Pending CAB Approval',
      value: '2',
      trend: 'Meeting 2 PM',
      trendDirection: 'neutral',
      onClick: () => setToast('Displaying RFCs awaiting Change Advisory Board review.'),
    },
    {
      icon: <CalendarTodayOutlined sx={{ fontSize: 18 }} />,
      iconColor: 'purple',
      label: 'Scheduled Windows',
      value: '4 Active',
      trend: 'Change Freeze: Off',
      trendDirection: 'up',
      onClick: () => setToast('Displaying approved maintenance deployment windows.'),
    },
    {
      icon: <CheckCircleRounded sx={{ fontSize: 18 }} />,
      iconColor: 'emerald',
      label: 'Change Success Rate',
      value: '98.9%',
      trend: '0 Rollbacks ✓',
      trendDirection: 'up',
      onClick: () => setToast('Change deployment SLA metric: 98.9% success without rollback.'),
    },
  ]

  // Problems KPI Items
  const problemsKpis: LiventoKpiItem[] = [
    {
      icon: <ReportProblemRounded sx={{ fontSize: 18 }} />,
      iconColor: 'rose',
      label: 'Active Problems',
      value: problemsCount > 0 ? problemsCount : '6',
      trend: '-2 Resolved ↘',
      trendDirection: 'down',
      onClick: () => setToast('Displaying active ITIL problem investigation tickets.'),
    },
    {
      icon: <SearchRounded sx={{ fontSize: 18 }} />,
      iconColor: 'amber',
      label: 'Known Errors (KEDB)',
      value: '4',
      trend: 'Workarounds Active',
      trendDirection: 'neutral',
      onClick: () => setToast('Known Error Database: 4 active workarounds published to staff.'),
    },
    {
      icon: <HourglassEmptyRounded sx={{ fontSize: 18 }} />,
      iconColor: 'blue',
      label: 'RCA Underway',
      value: '2',
      trend: 'Sev-1 Postmortem',
      trendDirection: 'neutral',
      onClick: () => setToast('Root Cause Analysis: 2 Sev-1 incident postmortems in progress.'),
    },
    {
      icon: <TaskAltRounded sx={{ fontSize: 18 }} />,
      iconColor: 'emerald',
      label: 'Resolved & Closed',
      value: '18',
      trend: '+100% Verified ↗',
      trendDirection: 'up',
      onClick: () => setToast('Displaying resolved problem investigations.'),
    },
  ]

  // Approvals KPI Items
  const approvalsKpis: LiventoKpiItem[] = [
    {
      icon: <TaskAltRounded sx={{ fontSize: 18 }} />,
      iconColor: 'amber',
      label: 'Pending Approvals',
      value: pendingApprovalsCount > 0 ? pendingApprovalsCount : '3',
      trend: 'Awaiting Decision',
      trendDirection: 'neutral',
      onClick: () => setActive('Approvals'),
    },
    {
      icon: <CheckCircleRounded sx={{ fontSize: 18 }} />,
      iconColor: 'emerald',
      label: 'Approved This Week',
      value: '14',
      trend: '+12% ↗',
      trendDirection: 'up',
      onClick: () => setToast('14 service requests approved this week across all departments.'),
    },
    {
      icon: <HourglassEmptyRounded sx={{ fontSize: 18 }} />,
      iconColor: 'blue',
      label: 'Avg Decision Time',
      value: '1.8h',
      trend: '-22% Faster ↘',
      trendDirection: 'down',
      onClick: () => setToast('Manager decision SLA: Average turnaround is 1.8 hours.'),
    },
    {
      icon: <TaskAltRounded sx={{ fontSize: 18 }} />,
      iconColor: 'purple',
      label: 'Delegated Approvers',
      value: 'Active',
      trend: 'Hierarchy Enforced',
      trendDirection: 'up',
      onClick: () => setToast('Delegated approval matrix is active and aligned to ServiceNow groups.'),
    },
  ]

  const renderServiceContent = () => {
    // Sub-views with Livento KPI cards above them
    if (active === 'Changes') {
      return (
        <div>
          <LiventoKpiGrid items={changesKpis} />
          <div className="livento-card">{children}</div>
        </div>
      )
    }

    if (active === 'Problems') {
      return (
        <div>
          <LiventoKpiGrid items={problemsKpis} />
          <div className="livento-card">{children}</div>
        </div>
      )
    }

    if (active === 'Approvals') {
      return (
        <div>
          <LiventoKpiGrid items={approvalsKpis} />
          <div className="livento-card">{children}</div>
        </div>
      )
    }

    if (
      children &&
      (active === 'Incident Detail' ||
        active === 'Request Detail' ||
        active === 'Settings' ||
        active === 'User access')
    ) {
      return <div className="livento-card">{children}</div>
    }

    const currentTab = getActiveTab()

    switch (currentTab) {
      case 'Dashboard':
        return (
          <LiventoDashboard
            openIncidentsCount={openIncidentsCount}
            p1IncidentsCount={p1IncidentsCount}
            requestsCount={requestsCount}
            pendingApprovalsCount={pendingApprovalsCount}
            problemsCount={problemsCount}
            changesCount={changesCount}
            incidentsList={incidentsList}
            requestsList={requestsList}
            onOpenIncident={onOpenIncident}
            onOpenRequest={onOpenRequest}
            onNavigate={setActive}
          />
        )

      case 'Incidents':
        return (
          <LiventoIncidentsView
            incidents={incidentsList}
            onOpenIncident={onOpenIncident}
            onNewIncident={onNewIncident}
          />
        )

      case 'Service Catalog':
        return (
          <LiventoCatalogView
            catalogItems={catalogItems}
            onSelectService={onSelectService}
          />
        )

      case 'Requests':
        return (
          <LiventoRequestsView
            requests={requestsList}
            onOpenRequest={onOpenRequest}
            onNewRequest={onNewRequest}
          />
        )

      case 'ServiceNow Sync':
        return (
          <LiventoServiceNowView
            onRefresh={onRefresh}
            setToast={setToast}
          />
        )

      default:
        return children || null
    }
  }

  return (
    <div className="livento-wrapper">
      {/* Top Livento Header with Pill Tabs */}
      <LiventoNavbar
        activeTab={getActiveTab()}
        onTabChange={handleTabChange}
        user={user}
        unreadCount={unreadCount}
        onNotificationClick={onNotificationClick}
        onProfileClick={onProfileClick}
        onNewAction={onNewIncident}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={handleSearchSubmit}
        onLogout={onLogout}
        onLoginClick={onLoginClick}
      />

      {/* Main Content Area */}
      <main>{renderServiceContent()}</main>
    </div>
  )
}

export default LiventoAppShell
