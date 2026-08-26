import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import { sampleEmployees } from '@/data/employees'
import { formatINR, selectablePolicies } from '@/data/flexDeal'
import { useLivesWizard } from '@/pages/LivesWizard/WizardContext'

export function SuccessStep() {
  const navigate = useNavigate()
  const {
    action,
    method,
    costEstimate,
    refundEstimate,
    enrolment,
    employee,
    dependants,
    resolvedAssignment,
    bulkDeleteRows,
    editProofFileName,
    simulateEditSaveFailure,
    selectedEmployeeId,
    dateOfLeaving,
    correctionBatch,
  } = useLivesWizard()
  const selectedEmployee = sampleEmployees.find(
    (item) => item.id === selectedEmployeeId,
  )

  const policies = selectablePolicies.filter((p) =>
    resolvedAssignment.policyIds.includes(p.id),
  )

  if (action === 'edit' && simulateEditSaveFailure === false && !editProofFileName) {
    // after failed save simulation, proof cleared — show failure if somehow landed here incorrectly
  }

  let title = 'Employee added successfully'
  let subtitle = `${employee.firstName || 'Employee'} has been added${
    dependants.length
      ? ` with ${dependants.length} dependant${dependants.length > 1 ? 's' : ''}`
      : ''
  }.`

  if (action === 'delete') {
    title =
      method === 'bulk'
        ? 'Bulk delete submitted'
        : 'Employee off-boarded successfully'
    subtitle =
      method === 'bulk'
        ? `${bulkDeleteRows.filter((r) => r.status === 'pass').length} employees removed. Rejected rows available in the error sheet.`
        : `${selectedEmployee?.firstName ?? 'Employee'} was off-boarded with ${
            selectedEmployee?.dependants.length ?? 0
          } dependant${
            selectedEmployee?.dependants.length === 1 ? '' : 's'
          }, effective ${dateOfLeaving || 'the selected leaving date'}.`
  } else if (action === 'edit') {
    title = 'Corrections submitted'
    subtitle = `${Math.max(correctionBatch.length, 1)} member${
      correctionBatch.length === 1 ? '' : 's'
    } updated. Plan and benefit assignments remain unchanged.`
  } else if (method === 'bulk') {
    title = 'Bulk lives added successfully'
    subtitle = `${costEstimate.totalLivesAdded} lives verified and submitted for endorsement.`
  } else if (method === 'single-dependant') {
    title = 'Dependant added successfully'
    subtitle = `${dependants.length || 1} dependant added with selected benefits.`
  }

  const scheduled =
    enrolment.runEnrolment !== false && enrolment.mode === 'schedule'

  return (
    <Wrap>
      <Hero>
        <CheckCircle aria-hidden>✓</CheckCircle>
        <Title>{title}</Title>
        <Subtitle>{subtitle}</Subtitle>
        {scheduled ? (
          <Subtitle>
            Invitations scheduled for due date {enrolment.dueDate}. They will
            appear under Manage Invites.
          </Subtitle>
        ) : enrolment.runEnrolment !== false &&
          enrolment.mode === 'now' &&
          action === 'add' ? (
          <Subtitle>Invitations will be sent now.</Subtitle>
        ) : null}
      </Hero>

      {action === 'delete' && refundEstimate ? (
        <Totals>
          <TotalRow>
            <span>Lives deleted</span>
            <strong>{refundEstimate.totalLivesDeleted}</strong>
          </TotalRow>
          <TotalRow>
            <span>Insurer refund</span>
            <strong>{formatINR(refundEstimate.totalInsurerRefund)}</strong>
          </TotalRow>
          <TotalRow>
            <span>Employee refund</span>
            <strong>{formatINR(refundEstimate.totalEmployeeRefund)}</strong>
          </TotalRow>
        </Totals>
      ) : null}

      {action === 'delete' &&
      refundEstimate?.lines.some((line) => line.staysActive) ? (
        <ErrorSheet>
          Retained benefits:{' '}
          {refundEstimate.lines
            .filter((line) => line.staysActive)
            .map((line) => line.label)
            .join(', ')}
          . These remain active until their configured end date.
        </ErrorSheet>
      ) : null}

      {action === 'delete' && method === 'bulk' ? (
        <ErrorSheet>
          Error sheet (rejected rows):{' '}
          {bulkDeleteRows
            .filter((r) => r.status === 'fail')
            .map((r) => r.employeeId)
            .join(', ') || 'none'}
        </ErrorSheet>
      ) : null}

      {action === 'add' && method !== 'bulk' ? (
        <PolicyGrid>
          {policies.map((policy) => (
            <PolicyCard key={policy.id}>
              <PolicyName>{policy.name}</PolicyName>
              <PolicyMeta>
                {policy.insurerName} · Policy No: {policy.policyNumber}
              </PolicyMeta>
            </PolicyCard>
          ))}
        </PolicyGrid>
      ) : null}

      {action === 'add' ? (
        <Totals>
          <TotalRow>
            <span>Lives added</span>
            <strong>{costEstimate.totalLivesAdded}</strong>
          </TotalRow>
          <TotalRow>
            <span>Estimated endorsement cost</span>
            <strong>{formatINR(costEstimate.totalEndorsementCost)}</strong>
          </TotalRow>
          <TotalRow>
            <span>Payroll deduction</span>
            <strong>{formatINR(costEstimate.totalPayrollDeduction)}</strong>
          </TotalRow>
        </Totals>
      ) : null}

      <Actions>
        <Secondary type="button" onClick={() => navigate('/endorsements')}>
          Back to Endorsements
        </Secondary>
        <Primary type="button" onClick={() => navigate('/endorsements')}>
          Done
        </Primary>
      </Actions>
    </Wrap>
  )
}

const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  flex: 1;
  max-width: 800px;
  margin: 0 auto;
  padding: 48px 24px;
`

const Hero = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  text-align: center;
`

const CheckCircle = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.fillGreen};
  color: ${({ theme }) => theme.colors.emerald};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: 700;
`

const Title = styled.h1`
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.beyondGrey};
`

const Subtitle = styled.p`
  margin: 0;
  font-size: 14px;
  line-height: 20px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const PolicyGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
`

const PolicyCard = styled.div`
  padding: 16px;
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.surface1};
  border: 1px solid ${({ theme }) => theme.colors.disableFill};
`

const PolicyName = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const PolicyMeta = styled.div`
  margin-top: 4px;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const Totals = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px 20px;
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.planeGreenLight};
`

const TotalRow = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textPrimary};

  strong {
    color: ${({ theme }) => theme.colors.emerald};
  }
`

const ErrorSheet = styled.div`
  padding: 12px 16px;
  border-radius: 8px;
  background: #fdecec;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const Actions = styled.div`
  display: flex;
  justify-content: center;
  gap: 12px;
`

const Secondary = styled.button`
  border: 1px solid ${({ theme }) => theme.colors.defaultBorder};
  background: ${({ theme }) => theme.colors.surface1};
  border-radius: ${({ theme }) => theme.radii.sm};
  padding: 12px 20px;
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
`

const Primary = styled.button`
  border: none;
  background: ${({ theme }) => theme.colors.fillGreen};
  color: ${({ theme }) => theme.colors.emerald};
  border-radius: ${({ theme }) => theme.radii.sm};
  padding: 12px 24px;
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
`
