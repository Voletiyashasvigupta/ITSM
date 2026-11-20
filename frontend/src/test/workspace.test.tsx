import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ApprovalQueue, ServiceRequestForm } from '../App'

const approver = [{ id: 'manager-1', fullName: 'Team Manager' }]

describe('ServiceRequestForm', () => {
  it('requires conditional fields before enabling submission', () => {
    const base = { accessType: 'New access', application: 'Core banking', accessLevel: 'Standard user', duration: 'Ongoing role requirement', reason: 'Job duties', approverId: 'manager-1' }
    const props = { service: 'Access and accounts', values: base, setValues: vi.fn(), approvers: approver, approversLoading: false, busy: false, onCancel: vi.fn(), onSubmit: vi.fn() }
    const view = render(<ServiceRequestForm {...props} />)
    expect(screen.getByRole('button', { name: 'Submit request' })).toBeDisabled()
    view.rerender(<ServiceRequestForm {...props} values={{ ...base, accessTarget: 'hari', accessRoleDetails: 'Read only', accessStart: '2026-11-20' }} />)
    expect(screen.getByRole('button', { name: 'Submit request' })).toBeEnabled()
    fireEvent.click(screen.getByRole('button', { name: 'Submit request' }))
    expect(props.onSubmit).toHaveBeenCalledOnce()
  })
})

describe('ApprovalQueue', () => {
  it('sends the selected approval to the matching decision callback', () => {
    const onApprove = vi.fn()
    const onReject = vi.fn()
    render(<ApprovalQueue approvals={[{ id: 'approval-1', requestId: 'request-1', requestNumber: 'NSR-20261114-ABCD1234', title: 'Request a device', employee: 'hari', initials: 'HA', requested: 'Today' }]} onApprove={onApprove} onReject={onReject} />)
    fireEvent.click(screen.getByRole('button', { name: 'Approve' }))
    expect(onApprove).toHaveBeenCalledWith('approval-1')
    fireEvent.click(screen.getByRole('button', { name: 'Reject' }))
    expect(onReject).toHaveBeenCalledWith('approval-1')
  })
})
