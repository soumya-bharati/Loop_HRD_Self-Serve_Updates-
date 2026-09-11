import { useMemo } from 'react'
import styled from 'styled-components'

import { assets } from '@/assets/figma'
import {
  assignedPolicyCosts,
  groupPolicyCosts,
} from '@/data/assignedPolicyCosts'
import { formatINRExact } from '@/data/coverPlans'
import {
  isReadyToSubmit,
  type BulkMemberRow,
  type PolicyCostBreakdown,
} from '@/data/flexDeal'

const NEXT_STEPS = [
  'Data will be reviewed by Loop to ensure compliance.',
  'Subject to review, the data will be sent to the insurer',
  'Loop & insurer, can reject data that fails to meet policy conditions.',
]

export function EndorsementCostPanel({
  rows,
  policies: policiesProp,
  isDelete = false,
  onDone,
}: {
  rows: BulkMemberRow[]
  /** When provided, these are the covers from earlier steps. */
  policies?: PolicyCostBreakdown[]
  isDelete?: boolean
  onDone: () => void
}) {
  const acceptedRows = useMemo(
    () => rows.filter(isReadyToSubmit),
    [rows],
  )
  const policies = useMemo(() => {
    const fromWizard = (policiesProp ?? []).filter(
      (policy) => policy.livesAdded > 0,
    )
    if (fromWizard.length > 0) return fromWizard
    return assignedPolicyCosts(acceptedRows)
  }, [acceptedRows, policiesProp])
  const groups = useMemo(() => groupPolicyCosts(policies), [policies])
  const totals = useMemo(
    () => ({
      lives: acceptedRows.length,
      cost: policies.reduce((sum, policy) => sum + policy.endorsementCost, 0),
    }),
    [acceptedRows.length, policies],
  )
  const totalInsurerRefund = acceptedRows.reduce(
    (sum, row) => sum + (row.insurerRefund ?? 0),
    0,
  )
  const totalEmployeeRefund = acceptedRows.reduce(
    (sum, row) => sum + (row.payrollRefund ?? 0),
    0,
  )
  const refundFor = (cost: number) =>
    totals.cost > 0
      ? Math.round((totalInsurerRefund * cost) / totals.cost)
      : 0

  return (
    <Page>
      <Stage>
        <Logo src={assets.loopLogoYellow} alt="loop" />
        <RightLeaf src={assets.mlBulkSidebarLeaves} alt="" aria-hidden />
        <Hero>You’ve successfully submitted your data to Loop!</Hero>
        <Layout>
          <CostCard>
            <Caption>
              {isDelete
                ? 'Here is the estimated refund for deletion'
                : 'Here is the cost of addition'}
            </Caption>

            {groups.map((group) => (
              <InsurerCard key={group.key}>
                <InsurerHeader>
                  <Brand>
                    <LogoWrap>
                      <img src={logoFor(group.insurerLogo)} alt="" />
                    </LogoWrap>
                    <div>
                      <InsurerName>{group.insurerName}</InsurerName>
                      <AccountLine>
                        Account No:{' '}
                        <strong>
                          {group.policies[0]?.policyNumber.slice(-4) ?? '—'}
                        </strong>
                      </AccountLine>
                    </div>
                  </Brand>
                  <CdPill>
                    CD Balance:{' '}
                    <strong>{formatINRExact(group.cdBalance)}</strong>
                  </CdPill>
                </InsurerHeader>
                {group.policies.map((item) => (
                  <PolicyRow key={item.policyId}>
                    <PolicyCopy>
                      <PolicyName>{item.policyName}</PolicyName>
                      <PolicyMeta>
                        <span>Policy number: {item.policyNumber}</span>
                        <Dot aria-hidden />
                        <span>
                          {item.livesAdded}{' '}
                          {item.livesAdded === 1 ? 'Life' : 'Lives'}{' '}
                          {isDelete ? 'Removed' : 'Added'}
                        </span>
                      </PolicyMeta>
                    </PolicyCopy>
                    <PolicyCost>
                      {formatINRExact(
                        isDelete
                          ? refundFor(item.endorsementCost)
                          : item.endorsementCost,
                      )}
                    </PolicyCost>
                  </PolicyRow>
                ))}
              </InsurerCard>
            ))}

            <Divider aria-hidden />

            <TotalRow>
              <span>
                {isDelete ? 'Total Insurer Refund' : 'Total Endorsement Cost'}
              </span>
              <strong>
                {formatINRExact(
                  isDelete ? totalInsurerRefund : totals.cost,
                )}
              </strong>
            </TotalRow>

            {isDelete ? (
              <RefundRow>
                <span>Refund to employees</span>
                <strong>{formatINRExact(totalEmployeeRefund)}</strong>
              </RefundRow>
            ) : null}

            <Warning>
              <img src={assets.mlIconInfoWarning} alt="" width={20} height={20} />
              <p>
                {isDelete
                  ? 'Refunds are estimates and may change after the insurer processes the deletion endorsement.'
                  : 'Final amount includes GST, but it could change after the endorsement is processed.'}
              </p>
            </Warning>

            <GotIt type="button" onClick={onDone}>
              Got It
            </GotIt>
          </CostCard>

          <Aside>
            {isDelete ? null : (
              <AccessCard>
                <AccessCopy>
                  <h2>Loop App Access Enabled!</h2>
                  <p>
                    Employees added in this endorsement have immediate access to
                    the Loop App!
                  </p>
                </AccessCopy>
                <AccessArt>
                  <img
                    src={assets.mlIllustrationLoopGroupHappy}
                    alt=""
                    width={217}
                    height={200}
                  />
                </AccessArt>
              </AccessCard>
            )}
            <NextCard>
              <NextTitle>
                <img
                  src={assets.mlIconClipboardText}
                  alt=""
                  width={24}
                  height={24}
                />
                What’s Next?
              </NextTitle>
              <NextList>
                {NEXT_STEPS.map((step) => (
                  <NextItem key={step}>
                    <img src={assets.mlIconNextDot} alt="" width={16} height={16} />
                    <p>{step}</p>
                  </NextItem>
                ))}
              </NextList>
            </NextCard>
          </Aside>
        </Layout>
      </Stage>
    </Page>
  )
}

function logoFor(logo: PolicyCostBreakdown['insurerLogo']) {
  if (logo === 'icici') return assets.iciciLogo
  if (logo === 'digit') return assets.digitLogo
  if (logo === 'aditya-birla') return assets.mlLogoIciciPru
  return assets.mlLogoOriental
}

const Page = styled.div`
  display: flex;
  width: 100%;
  height: 100%;
  min-height: 0;
  padding: 6px;
  box-sizing: border-box;
  background: ${({ theme }) => theme.colors.surface1};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    height: auto;
    min-height: 100vh;
  }
`

const Stage = styled.div`
  position: relative;
  isolation: isolate;
  display: flex;
  flex: 1;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
  padding: 24px 114px 40px;
  overflow: auto;
  border-radius: 16px;
  background-color: ${({ theme }) => theme.colors.emerald};
  background-image: linear-gradient(180deg, #025f4c 0%, #00281f 100%);
  box-sizing: border-box;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 0;
    background: image-set(url(${assets.mlBulkSidebarNoise}) 2x) top left / 102px
      112px repeat;
    mix-blend-mode: overlay;
    opacity: 0.3;
    pointer-events: none;
  }

  &::after {
    content: '';
    position: absolute;
    left: -312px;
    bottom: -194px;
    z-index: 0;
    width: 442px;
    height: 442px;
    background: url(${assets.mlBulkSidebarLeaves}) no-repeat center / contain;
    transform: rotate(0.45deg);
    pointer-events: none;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    padding: 24px 32px 32px;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: 24px 16px 32px;
  }
`

const Logo = styled.img`
  position: relative;
  z-index: 1;
  display: block;
  width: 70px;
  height: 34px;
  object-fit: contain;
`

const RightLeaf = styled.img`
  position: absolute;
  right: -238px;
  bottom: -84px;
  z-index: 0;
  width: 442px;
  height: 442px;
  object-fit: contain;
  transform: rotate(0.45deg);
  pointer-events: none;
`

const Hero = styled.h1`
  position: relative;
  z-index: 1;
  margin: 43px 0 0;
  color: ${({ theme }) => theme.colors.textTertiary};
  font-size: 32px;
  font-weight: 500;
  line-height: 40px;
  text-align: center;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    margin-top: 24px;
    font-size: 24px;
    line-height: 32px;
    text-align: left;
  }
`

const Layout = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-start;
  gap: 28px;
  width: 100%;
  max-width: 1200px;
  margin: 28px auto 0;

  @media (max-width: ${({ theme }) => theme.breakpoints.xl}) {
    flex-direction: column;
    max-width: 840px;
  }
`

const CostCard = styled.section`
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.colors.planeGreenLight};
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.surface1};
  box-sizing: border-box;
`

const Caption = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 12px;
  font-weight: 400;
  line-height: 18px;
  letter-spacing: 0.2px;
`

const InsurerCard = styled.article`
  overflow: hidden;
  width: 100%;
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.surface1};
`

const InsurerHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px;
  background: #f4f8fa;

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    flex-direction: column;
    align-items: flex-start;
  }
`

const Brand = styled.div`
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 12px;
`

const LogoWrap = styled.div`
  width: 40px;
  height: 40px;
  flex: 0 0 40px;
  overflow: hidden;
  border-radius: 6px;

  img {
    display: block;
    width: 40px;
    height: 40px;
    object-fit: cover;
  }
`

const InsurerName = styled.p`
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const AccountLine = styled.p`
  margin: 2px 0 0;
  font-size: 12px;
  line-height: 18px;
  letter-spacing: 0.2px;
  color: #6e7a75;

  strong {
    font-weight: 400;
    color: #2b3632;
  }
`

const CdPill = styled.div`
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 7px;
  background: ${({ theme }) => theme.colors.surface1};
  font-size: 14px;
  line-height: 20px;
  letter-spacing: 0.2px;
  color: #6e7a75;

  strong {
    font-weight: 600;
    color: ${({ theme }) => theme.colors.textPrimary};
  }
`

const PolicyRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px;
  background: ${({ theme }) => theme.colors.surface1};
`

const PolicyCopy = styled.div`
  min-width: 0;
  flex: 1;
`

const PolicyName = styled.p`
  margin: 0;
  overflow: hidden;
  font-size: 14px;
  line-height: 20px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textPrimary};
  text-overflow: ellipsis;
  white-space: nowrap;
`

const PolicyMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 2px;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 12px;
  font-weight: 500;
  line-height: 18px;
  letter-spacing: 0.2px;
`

const Dot = styled.span`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.disableFill};
`

const PolicyCost = styled.p`
  margin: 0;
  flex: 1;
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textPrimary};
  text-align: right;
`

const Divider = styled.div`
  width: 100%;
  height: 1px;
  background: ${({ theme }) => theme.colors.defaultBorder};
`

const TotalRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 16px;
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 18px;
  font-weight: 500;
  line-height: 24px;

  strong {
    font-weight: 500;
    text-align: right;
  }
`

const RefundRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 16px;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 14px;
  line-height: 20px;

  strong {
    color: ${({ theme }) => theme.colors.emerald};
    font-weight: 600;
    text-align: right;
  }
`

const Warning = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  padding: 12px;
  border-radius: 8px;
  background: #f9fafb;
  box-sizing: border-box;

  img {
    display: block;
    width: 20px;
    height: 20px;
    flex-shrink: 0;
  }

  p {
    margin: 0;
    color: #6e7a75;
    font-size: 12px;
    line-height: 1.4;
  }
`

const GotIt = styled.button`
  display: flex;
  width: 215px;
  height: 48px;
  align-items: center;
  justify-content: center;
  padding: 14px 24px;
  border: 0;
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.fillGreen};
  color: ${({ theme }) => theme.colors.emerald};
  font: inherit;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  letter-spacing: 0.2px;
  cursor: pointer;
`

const Aside = styled.aside`
  display: flex;
  width: 332px;
  flex-shrink: 0;
  flex-direction: column;
  gap: 18px;

  @media (max-width: ${({ theme }) => theme.breakpoints.xl}) {
    width: 100%;
  }
`

const AccessCard = styled.section`
  position: relative;
  height: 316px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 16px;
  box-sizing: border-box;
`

const AccessCopy = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 24px 16px 0;

  h2 {
    margin: 0;
    color: ${({ theme }) => theme.colors.textTertiary};
    font-size: 18px;
    font-weight: 500;
    line-height: 24px;
  }

  p {
    margin: 0;
    color: ${({ theme }) => theme.colors.textTertiary};
    font-size: 12px;
    font-weight: 400;
    line-height: 18px;
    letter-spacing: 0.2px;
  }
`

const AccessArt = styled.div`
  position: absolute;
  top: 116px;
  left: 50%;
  width: 217px;
  height: 200px;
  overflow: hidden;
  transform: translateX(-50%);

  img {
    display: block;
    width: 217px;
    height: 200px;
  }
`

const NextCard = styled.section`
  display: flex;
  min-height: 234px;
  flex-direction: column;
  gap: 16px;
  padding: 24px 16px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 16px;
  box-sizing: border-box;
`

const NextTitle = styled.h2`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 0;
  color: ${({ theme }) => theme.colors.textTertiary};
  font-size: 16px;
  font-weight: 500;
  line-height: 24px;
  letter-spacing: 0.2px;

  img {
    display: block;
    width: 24px;
    height: 24px;
    flex-shrink: 0;
  }
`

const NextList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 17px;
`

const NextItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;

  img {
    display: block;
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }

  p {
    margin: 0;
    color: ${({ theme }) => theme.colors.textTertiary};
    font-size: 12px;
    font-weight: 400;
    line-height: 18px;
    letter-spacing: 0.2px;
  }
`
