import styled from 'styled-components'

import {
  formatINR,
  zeroReasonLabel,
  type RefundEstimate,
} from '@/data/flexDeal'

export function RefundSummary({ estimate }: { estimate: RefundEstimate }) {
  return (
    <Wrap>
      <Totals>
        <TotalRow>
          <span>Total lives being deleted</span>
          <strong>{estimate.totalLivesDeleted}</strong>
        </TotalRow>
        <TotalRow>
          <span>Total refund from insurer</span>
          <strong>{formatINR(estimate.totalInsurerRefund)}</strong>
        </TotalRow>
        <TotalRow>
          <span>Total refund to employee</span>
          <strong>{formatINR(estimate.totalEmployeeRefund)}</strong>
        </TotalRow>
      </Totals>

      {estimate.lines.map((line) => (
        <Line key={line.id}>
          <LineHead>
            <div>
              <LineTitle>
                {line.label}
                {line.staysActive ? ' · Stays active' : ''}
              </LineTitle>
              <LineMeta>
                {line.kind} · {line.lives} lives
                {line.staysActiveNote ? ` · ${line.staysActiveNote}` : ''}
              </LineMeta>
            </div>
            <Amounts>
              <span>Insurer {formatINR(line.insurerRefund)}</span>
              <span>Employee {formatINR(line.employeeRefund)}</span>
            </Amounts>
          </LineHead>
          {line.zeroReason ? (
            <Zero>No refund: {zeroReasonLabel(line.zeroReason)}</Zero>
          ) : null}
          {line.components?.map((c) => (
            <Component key={c.id}>
              <span>{c.label}</span>
              <span>
                {formatINR(c.insurerRefund)}
                {c.zeroReason ? ` · ${zeroReasonLabel(c.zeroReason)}` : ''}
              </span>
            </Component>
          ))}
        </Line>
      ))}

      {estimate.policiesByCd.map((group) => (
        <CdBlock key={group.cdAccountId}>
          <CdName>
            {group.cdAccountName} · Balance {formatINR(group.cdBalance)}
          </CdName>
          {group.policies.map((p) => (
            <CdRow key={p.policyName}>
              <span>
                {p.policyName} · {p.lives} lives
              </span>
              <strong>{formatINR(p.refund)}</strong>
            </CdRow>
          ))}
        </CdBlock>
      ))}
    </Wrap>
  )
}

const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
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

const Line = styled.div`
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.colors.disableFill};
  background: ${({ theme }) => theme.colors.surface1};
`

const LineHead = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
`

const LineTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const LineMeta = styled.div`
  margin-top: 2px;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const Amounts = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.emerald};
  white-space: nowrap;
`

const Zero = styled.div`
  margin-top: 8px;
  font-size: 12px;
  color: #b45309;
`

const Component = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed ${({ theme }) => theme.colors.disableFill};
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const CdBlock = styled.div`
  padding: 14px 16px;
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.surface0};
`

const CdName = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.beyondGrey};
  margin-bottom: 8px;
`

const CdRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
  padding: 4px 0;

  strong {
    color: ${({ theme }) => theme.colors.emerald};
  }
`
