/**
 * Unit Tests for Service Catalog & Approval Workflow Components.
 * Tests form validation logic, button states, and callback dispatching.
 */
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ApprovalQueue, ServiceRequestForm } from '../App'

/** Mock approver list for testing conditional form rendering */
const approver = [{ id: 'manager-1', fullName: 'Team Manager' }]

describe('ServiceRequestForm', () => {
  /**
   * Verifies that the submit button remains disabled until all conditionally required
   * access fields (target user, role details, effective date) are supplied by the user.
   */
  it('requires conditional fields before enabling submission', () => {
    const base = {
      accessType: 'New access',
      application: 'Core banking',
      accessLevel: 'Standard user',
      duration: 'Ongoing role requirement',
      reason: 'Job duties',
      approverId: 'manager-1',
    }
    const props = {
      service: 'Access and accounts',
      values: base,
      setValues: vi.fn(),
      approvers: approver,
      approversLoading: false,
      busy: false,
      onCancel: vi.fn(),
      onSubmit: vi.fn(),
    }
    const view = render(<ServiceRequestForm {...props} />)
    expect(screen.getByRole('button', { name: 'Submit request' })).toBeDisabled()

    // Provide missing conditional fields
    view.rerender(
      <ServiceRequestForm
        {...props}
        values={{ ...base, accessTarget: 'hari', accessRoleDetails: 'Read only', accessStart: '2026-11-20' }}
      />,
    )
    expect(screen.getByRole('button', { name: 'Submit request' })).toBeEnabled()

    fireEvent.click(screen.getByRole('button', { name: 'Submit request' }))
    expect(props.onSubmit).toHaveBeenCalledOnce()
  })
})

describe('ApprovalQueue', () => {
  /**
   * Verifies that clicking Approve or Reject triggers the respective callback with the approval ID.
   */
  it('sends the selected approval to the matching decision callback', () => {
    const onApprove = vi.fn()
    const onReject = vi.fn()
    render(
      <ApprovalQueue
        approvals={[
          {
            id: 'approval-1',
            requestId: 'request-1',
            requestNumber: 'NSR-20261114-ABCD1234',
            title: 'Request a device',
            employee: 'hari',
            initials: 'HA',
            requested: 'Today',
          },
        ]}
        onApprove={onApprove}
        onReject={onReject}
      />,
    )

    // Verify Approve dispatch
    fireEvent.click(screen.getByRole('button', { name: 'Approve' }))
    expect(onApprove).toHaveBeenCalledWith('approval-1')

    // Verify Reject dispatch
    fireEvent.click(screen.getByRole('button', { name: 'Reject' }))
    expect(onReject).toHaveBeenCalledWith('approval-1')
  })
})
