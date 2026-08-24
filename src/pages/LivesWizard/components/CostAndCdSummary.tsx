import styled from 'styled-components'

import { formatINR, type CostEstimate } from '@/data/flexDeal'

export function CostAndCdSummary({
  estimate,
  showPayroll = true,
}: {
  estimate: CostEstimate
  showPayroll?: boolean
}) {
  const byCd = new Map<
    string,
    {
      name: string
      balance: number
      cost: number
      policies: CostEstimate['policies']
    }
  >()

  for (const policy of estimate.policies) {
    const cur = byCd.get(policy.cdAccountId) ?? {
      name: policy.cdAccountName,
      balance: policy.cdBalance,
      cost: 0,
      policies: [],
    }
    cur.cost += policy.endorsementCost
    cur.policies.push(policy)
    byCd.set(policy.cdAccountId, cur)
  }

  return (
    <Wrap>
      <Totals>
        {showPayroll ? (
          <>
            <TotalRow>
              <span>Total payroll deduction</span>
              <strong>{formatINR(estimate.totalPayrollDeduction)}</strong>
            </TotalRow>
            <TotalRow>
              <span>Monthly installment</span>
              <strong>{formatINR(estimate.monthlyInstallment)}</strong>
            </TotalRow>
          </>
        ) : null}
        <TotalRow>
          <span>Total endorsement cost</span>
          <strong>{formatINR(estimate.totalEndorsementCost)}</strong>
        </TotalRow>
        <TotalRow>
          <span>Total lives</span>
          <strong>{estimate.totalLivesAdded}</strong>
        </TotalRow>
      </Totals>

      {estimate.cdShortfall ? (
        <Warn>
          CD balance may be insufficient by{' '}
          <strong>{formatINR(estimate.cdShortfallAmount)}</strong>. You can
          still confirm — payroll approval will catch shortfalls downstream.
        </Warn>
      ) : null}

      {[...byCd.entries()].map(([id, group]) => (
        <CdBlock key={id}>
          <CdHeader>
            <div>
              <CdName>{group.name}</CdName>
              <CdMeta>
                Balance {formatINR(group.balance)} · Endorsement{' '}
                {formatINR(group.cost)}
                {group.cost > group.balance ? ' · Shortfall' : ''}
              </CdMeta>
            </div>
          </CdHeader>
          {group.policies.map((p) => (
            <PolicyRow key={p.policyId}>
              <div>
                <PolicyName>{p.policyName}</PolicyName>
                <PolicyMeta>
                  {p.insurerName} · {p.policyNumber} · {p.livesAdded} lives
                </PolicyMeta>
              </div>
              <PolicyCost>{formatINR(p.endorsementCost)}</PolicyCost>
            </PolicyRow>
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

const Warn = styled.div`
  padding: 12px 16px;
  border-radius: 8px;
  background: #fff6e5;
  border: 1px solid #f5d78e;
  font-size: 13px;
  line-height: 18px;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const CdBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.surface1};
  border: 1px solid ${({ theme }) => theme.colors.disableFill};
`

const CdHeader = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
`

const CdName = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.beyondGrey};
`

const CdMeta = styled.div`
  margin-top: 2px;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const PolicyRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 0;
  border-top: 1px solid ${({ theme }) => theme.colors.disableFill};
`

const PolicyName = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const PolicyMeta = styled.div`
  margin-top: 2px;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const PolicyCost = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.emerald};
  white-space: nowrap;
`
