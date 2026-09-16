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

export function AssignmentBreakup({
  rows,
  isDelete = false,
}: {
  rows: BulkMemberRow[]
  isDelete?: boolean
}) {
  const coverBreakup = useMemo(() => buildCoverBreakup(rows), [rows])
  const visibleCovers = coverBreakup.filter(
    (item) =>
      item.cover.id === 'cover-health' || item.cover.id === 'cover-term-life',
  )

  return (
    <Wrap>
      {visibleCovers.map((item) => {
        return (
          <CoverBlock key={item.cover.id}>
            <CoverHeading>
              <CoverIcon
                src={assets.mlIconTableOfContent}
                alt=""
                width={36}
                height={36}
              />
              <CoverTitle>
                <CoverName>
                  {coverHeading(item.cover.id, item.cover.name)}
                </CoverName>
                <CoverMeta>
                  : {item.lives} {item.lives === 1 ? 'Life' : 'Lives'} will be{' '}
                  {isDelete ? 'removed' : 'added'}
                </CoverMeta>
              </CoverTitle>
            </CoverHeading>

            <PlanGrid $cols={Math.min(item.plans.length, 3)}>
              {item.plans.map((plan) => {
                const mix = assignmentDescription(
                  rows,
                  item.cover.id,
                  plan.planId,
                )
                const showShield = item.cover.id === 'cover-health'
                return (
                  <PlanCard key={plan.planId} $narrow={!showShield && item.plans.length === 1}>
                    <PlanTop>
                      <div>
                        <PlanCount>
                          {plan.lives}{' '}
                          {plan.lives === 1 ? 'member' : 'members'}
                        </PlanCount>
                        <PlanAdded>
                          {isDelete ? 'Will be removed from' : 'Will be added in'}{' '}
                          <strong>
                            {plan.planLabel}
                            {plan.planLabel.toLowerCase().includes('plan')
                              ? ''
                              : ' Plan'}
                          </strong>
                        </PlanAdded>
                      </div>
                      {showShield ? (
                        <Shield
                          src={planShield(plan.planLabel)}
                          alt=""
                          width={42}
                          height={42}
                        />
                      ) : null}
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
  gap: 20px;
  width: 100%;
`

const CoverHeading = styled.h2`
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const CoverIcon = styled.img`
  display: block;
  width: 36px;
  height: 36px;
  flex: 0 0 36px;
`

const CoverTitle = styled.span`
  display: flex;
  align-items: center;
  gap: 2px;
  flex-wrap: wrap;
`

const CoverName = styled.span`
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
  letter-spacing: 0.2px;
`

const CoverMeta = styled.span`
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  letter-spacing: 0.2px;
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

const PlanCard = styled.article<{ $narrow?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
  max-width: ${({ $narrow }) => ($narrow ? '338px' : 'none')};
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.surface1};
  box-sizing: border-box;
`

const PlanTop = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
`

const PlanCount = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 16px;
  font-weight: 500;
  line-height: 24px;
  letter-spacing: 0.2px;
`

const PlanAdded = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 12px;
  font-weight: 400;
  line-height: 18px;
  letter-spacing: 0.2px;

  strong {
    color: ${({ theme }) => theme.colors.textPrimary};
    font-size: 12px;
    font-weight: 500;
    line-height: 18px;
    letter-spacing: 0.2px;
  }
`

const Shield = styled.img`
  width: 42px;
  height: 42px;
  flex: 0 0 42px;
  object-fit: contain;
`

const MixChip = styled.p`
  margin: 0;
  overflow: hidden;
  padding: 8px 12px;
  border-radius: 8px;
  background: #f3f4f6;
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 12px;
  font-weight: 500;
  line-height: 18px;
  letter-spacing: 0.2px;
  text-overflow: ellipsis;
  white-space: nowrap;
`
