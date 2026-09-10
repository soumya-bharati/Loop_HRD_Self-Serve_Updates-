import { useMemo } from 'react'
import styled from 'styled-components'

import { assets } from '@/assets/figma'
import {
  buildCoverBreakup,
  coverAssignmentsForRow,
} from '@/data/coverPlans'
import type { BulkMemberRow } from '@/data/flexDeal'

function assignmentDescription(
  rows: BulkMemberRow[],
  coverId: string,
  planId: string,
) {
  const assigned = rows.filter((row) =>
    coverAssignmentsForRow(row, rows).some(
      (item) => item.coverId === coverId && item.planId === planId,
    ),
  )
  const employees = assigned.filter((row) => row.relationship === 'Self').length
  const dependents = assigned.length - employees
  const parts = [
    employees
      ? `${employees} ${employees === 1 ? 'employee' : 'employees'}`
      : '',
    dependents
      ? `${dependents} ${dependents === 1 ? 'dependant' : 'dependants'}`
      : '',
  ].filter(Boolean)
  return parts.join(' & ')
}

function planShield(label: string) {
  const key = label.toLowerCase()
  if (key.includes('bronze') || key.includes('gold')) {
    return assets.mlPlanShieldBronze
  }
  if (key.includes('silver') || key.includes('platinum')) {
    return assets.mlPlanShieldSilver
  }
  return assets.mlPlanShieldBasic
}

function coverHeading(coverId: string, name: string) {
  if (coverId === 'cover-term-life') return 'Term Life Insurance'
  return name
}

export function AssignmentBreakup({ rows }: { rows: BulkMemberRow[] }) {
  const coverBreakup = useMemo(() => buildCoverBreakup(rows), [rows])
  const visibleCovers = coverBreakup.filter(
    (item) =>
      item.cover.id === 'cover-health' || item.cover.id === 'cover-term-life',
  )

  return (
    <Wrap>
      {visibleCovers.map((item) => {
        const fullWidth =
          item.cover.id === 'cover-term-life' || item.plans.length === 1

        return (
          <CoverBlock key={item.cover.id}>
            <CoverHeading>
              <ClipboardBadge>
                <img
                  src={assets.mlIconClipboardText}
                  alt=""
                  width={18}
                  height={18}
                />
              </ClipboardBadge>
              {coverHeading(item.cover.id, item.cover.name)} will cover{' '}
              {item.lives} {item.lives === 1 ? 'Life' : 'Lives'}
            </CoverHeading>

            <PlanGrid $cols={fullWidth ? 1 : Math.min(item.plans.length, 3)}>
              {item.plans.map((plan) => {
                const mix = assignmentDescription(
                  rows,
                  item.cover.id,
                  plan.planId,
                )
                return (
                  <PlanCard key={plan.planId}>
                    <PlanTop>
                      <div>
                        <PlanCount>
                          {plan.lives}{' '}
                          {plan.lives === 1 ? 'member' : 'members'}
                        </PlanCount>
                        <PlanAdded>
                          Added in{' '}
                          <strong>
                            {plan.planLabel}
                            {plan.planLabel.toLowerCase().includes('plan')
                              ? ''
                              : ' Plan'}
                          </strong>
                        </PlanAdded>
                      </div>
                      <Shield
                        src={planShield(plan.planLabel)}
                        alt=""
                        width={40}
                        height={40}
                      />
                    </PlanTop>
                    {mix ? <MixChip>({mix})</MixChip> : null}
                  </PlanCard>
                )
              })}
            </PlanGrid>
          </CoverBlock>
        )
      })}
    </Wrap>
  )
}

const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
`

const CoverBlock = styled.section`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
`

const CoverHeading = styled.h2`
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 16px;
  font-weight: 500;
  line-height: 24px;
  letter-spacing: 0.2px;
`

const ClipboardBadge = styled.span`
  display: grid;
  width: 36px;
  height: 36px;
  flex: 0 0 36px;
  place-items: center;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.turquoise};

  img {
    display: block;
    width: 18px;
    height: 18px;
    object-fit: contain;
  }
`

const PlanGrid = styled.div<{ $cols: number }>`
  display: grid;
  grid-template-columns: repeat(${({ $cols }) => $cols}, minmax(0, 1fr));
  gap: 16px;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: repeat(
      ${({ $cols }) => Math.min($cols, 2)},
      minmax(0, 1fr)
    );
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-template-columns: 1fr;
  }
`

const PlanCard = styled.article`
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
  padding: 17px;
  border: 1px solid ${({ theme }) => theme.colors.disableFill};
  border-radius: 16px;
  background: ${({ theme }) => theme.colors.surface1};
  box-sizing: border-box;
`

const PlanTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`

const PlanCount = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 16px;
  font-weight: 600;
  line-height: 20px;
  letter-spacing: -0.4px;
`

const PlanAdded = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 12px;
  font-weight: 400;
  line-height: 18px;
  letter-spacing: 0.2px;

  strong {
    color: ${({ theme }) => theme.colors.textPrimary};
    font-size: 14px;
    font-weight: 500;
    line-height: 20px;
    letter-spacing: -0.3px;
  }
`

const Shield = styled.img`
  width: 40px;
  height: 40px;
  flex: 0 0 40px;
  object-fit: contain;
`

const MixChip = styled.p`
  margin: 0;
  overflow: hidden;
  padding: 9px 12px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.04);
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 12px;
  font-weight: 500;
  line-height: 18px;
  letter-spacing: 0.2px;
  text-overflow: ellipsis;
  white-space: nowrap;
`
