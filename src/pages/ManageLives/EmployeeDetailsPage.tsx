import { useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'

import { assets } from '@/assets/figma'
import {
  flexDeal,
  formatINR,
  getBenefitById,
  getPlanById,
} from '@/data/flexDeal'
import { launchWizardPath } from '@/pages/ManageLives/launchWizard'
import { usePendingChanges } from '@/pages/ManageLives/PendingChangesContext'
import {
  formatINR as formatPendingINR,
  nextPendingId,
  refundImpact,
} from '@/pages/ManageLives/pendingChanges'
import {
  dealNameForEmployee,
  entityIdForEmployee,
  entityNameForEmployee,
  findEmployee,
} from '@/pages/ManageLives/searchEmployees'
import { useProtoConfig } from '@/proto/ProtoConfigContext'

type DetailTab =
  | 'ecards'
  | 'plans'
  | 'claims'
  | 'dependant-ecards'

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

function formatDisplayDate(iso: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso)
  if (!match) return iso || '—'
  const [, year, month, day] = match
  const mon = MONTHS[Number(month) - 1] ?? month
  return `${day}-${mon}-${year}`
}

function formatPhone(mobile: string) {
  const digits = mobile.replace(/\D/g, '')
  if (digits.length === 10) return `+91-${digits}`
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+91-${digits.slice(2)}`
  }
  return mobile || '—'
}

function insurerLogoSrc(logo?: string) {
  if (logo === 'icici') return assets.iciciLogo
  if (logo === 'digit') return assets.digitLogo
  return assets.loopLogo
}

export function EmployeeDetailsPage() {
  const { employeeId = '' } = useParams()
  const navigate = useNavigate()
  const { entities } = useProtoConfig()
  const { addChange, lifecycleFor } = usePendingChanges()
  const employee = findEmployee(employeeId)
  const [tab, setTab] = useState<DetailTab>('plans')
  const [notice, setNotice] = useState<string | null>(null)
  const [removeDependantId, setRemoveDependantId] = useState<string | null>(null)
  const [leaveOpen, setLeaveOpen] = useState(false)
  const [leaveDate, setLeaveDate] = useState('')

  const openClaims = employee?.hasClaimOnGmc ? 1 : 0

  const maritalStatus = useMemo(() => {
    if (!employee) return '—'
    return employee.dependants.some((d) => d.relationship === 'Spouse')
      ? 'Married'
      : 'Single'
  }, [employee])

  if (!employee) {
    return <Navigate to="/employees" replace />
  }

  const entityId = entityIdForEmployee(employee)
  const entity = entities.find((item) => item.id === entityId)?.id ?? entityId
  const status =
    lifecycleFor(employee.id) !== 'active'
      ? lifecycleFor(employee.id)
      : lifecycleFor(employee.employeeId)
  const location =
    employee.dealAttributes?.['attr-location'] ??
    entityNameForEmployee(employee)
  const initial = (employee.firstName?.[0] ?? '?').toUpperCase()

  const wizard = (
    action: 'add' | 'edit' | 'delete',
    method: 'single' | 'single-dependant',
    extra?: { dependant?: string; leaving?: string },
  ) =>
    launchWizardPath({
      action,
      method,
      entity,
      deal: employee.dealId,
      employee: employee.id,
      dependant: extra?.dependant,
      leaving: extra?.leaving,
    })

  const confirmRemoveDependant = () => {
    const dependant = employee.dependants.find(
      (item) => item.id === removeDependantId,
    )
    if (!dependant) return
    addChange({
      id: nextPendingId(),
      employeeId: employee.employeeId,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      entityId: entity,
      entityName: entityNameForEmployee(employee),
      dealId: employee.dealId,
      dealName: dealNameForEmployee(employee),
      action: 'remove_dependant',
      description: `Remove ${dependant.relationship} ${dependant.firstName} ${dependant.lastName}`,
      costImpact: refundImpact(900),
      createdAt: new Date().toISOString(),
      payload: { dependantId: dependant.id },
    })
    setRemoveDependantId(null)
    setNotice('Dependant removal added to Pending Changes.')
  }

  const confirmLeave = () => {
    if (!leaveDate) return
    addChange({
      id: nextPendingId(),
      employeeId: employee.employeeId,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      entityId: entity,
      entityName: entityNameForEmployee(employee),
      dealId: employee.dealId,
      dealName: dealNameForEmployee(employee),
      action: 'employee_exit',
      description: `Mark as leaving on ${leaveDate}`,
      effectiveDate: leaveDate,
      costImpact: refundImpact(employee.hasClaimOnGmc ? 0 : 1800),
      createdAt: new Date().toISOString(),
      payload: { employeeId: employee.id, leavingDate: leaveDate },
    })
    setLeaveOpen(false)
    setNotice('Exit added to Pending Changes. The employee stays on the roster.')
  }

  const planCards = employee.plans.length
    ? employee.plans
    : flexDeal.plans.filter((plan) =>
        employee.coverages.some(
          (c) => c.planId === plan.id || c.id === plan.id,
        ),
      )

  const benefitIdsFromPlans = new Set(
    planCards.flatMap((plan) => getPlanById(plan.id)?.benefitIds ?? []),
  )

  const standaloneBenefits = employee.coverages.filter(
    (c) =>
      c.kind === 'benefit' &&
      c.status !== 'draft' &&
      !benefitIdsFromPlans.has(c.id),
  )

  const coveredLives = 1 + employee.dependants.length

  return (
    <Page>
      <TopBar>
        <Back to="/employees">
          <img src={assets.mlArrowBack} alt="" width={20} height={20} />
          Back
        </Back>
        <TopActions>
          <OutlineBtn
            type="button"
            onClick={() => navigate(wizard('edit', 'single'))}
          >
            <img src={assets.edIconEdit} alt="" width={20} height={20} />
            Edit Details
          </OutlineBtn>
          <OutlineBtn
            type="button"
            onClick={() => navigate(wizard('add', 'single-dependant'))}
          >
            <img src={assets.edIconAddDependant} alt="" width={20} height={20} />
            Add New Dependant
          </OutlineBtn>
          <OutlineBtn type="button" onClick={() => setLeaveOpen(true)}>
            <img src={assets.edIconDelete} alt="" width={20} height={20} />
            Delete Employee
          </OutlineBtn>
        </TopActions>
      </TopBar>

      {notice ? <Notice>{notice}</Notice> : null}

      <ProfileCard>
        <ProfileTop>
          <Identity>
            <Avatar aria-hidden>{initial}</Avatar>
            <div>
              <Name>
                {employee.firstName} {employee.lastName}
              </Name>
              <EmpId>Employee ID: {employee.employeeId}</EmpId>
            </div>
          </Identity>
          <HealthcareBadge>
            <BadgeIconWrap>
              <img
                src={assets.edIconMobileBadge}
                alt=""
                width={32}
                height={32}
              />
              <BadgeCheck>✓</BadgeCheck>
            </BadgeIconWrap>
            <span>Unlimited Healthcare Access!</span>
          </HealthcareBadge>
        </ProfileTop>

        <InfoGrid>
          <InfoItem>
            <InfoLabel>Gender</InfoLabel>
            <InfoValue>{employee.gender}</InfoValue>
          </InfoItem>
          <InfoItem>
            <InfoLabel>DOB</InfoLabel>
            <InfoValue>{formatDisplayDate(employee.dateOfBirth)}</InfoValue>
          </InfoItem>
          <InfoItem>
            <InfoLabel>Marital Status</InfoLabel>
            <InfoValue>{maritalStatus}</InfoValue>
          </InfoItem>
          <InfoItem>
            <InfoLabel>Contact Number</InfoLabel>
            <InfoValue>{formatPhone(employee.mobile)}</InfoValue>
          </InfoItem>
          <InfoItem $wide>
            <InfoLabel>Email</InfoLabel>
            <InfoValue>{employee.email || '—'}</InfoValue>
          </InfoItem>
        </InfoGrid>

        <InfoRowBottom>
          <InfoGrid $compact>
            <InfoItem>
              <InfoLabel>Employee Type</InfoLabel>
              <InfoValue>Permanent</InfoValue>
            </InfoItem>
            <InfoItem>
              <InfoLabel>Department</InfoLabel>
              <InfoValue>{employee.department}</InfoValue>
            </InfoItem>
            <InfoItem>
              <InfoLabel>Location</InfoLabel>
              <InfoValue>{location}</InfoValue>
            </InfoItem>
            <InfoItem>
              <InfoLabel>Status</InfoLabel>
              <StatusValue $tone={status}>{status}</StatusValue>
            </InfoItem>
          </InfoGrid>
          <EcardActions>
            <EmeraldOutline
              type="button"
              onClick={() =>
                setNotice('Prototype: family e-card download would start here.')
              }
            >
              <img src={assets.edIconDownload} alt="" width={24} height={24} />
              Download Family Ecard
            </EmeraldOutline>
            <EmeraldOutline
              type="button"
              onClick={() =>
                setNotice('Prototype: share family e-card link would open here.')
              }
            >
              <img src={assets.edIconShare} alt="" width={24} height={24} />
              Share Family Ecard
            </EmeraldOutline>
          </EcardActions>
        </InfoRowBottom>
      </ProfileCard>

      <Tabs role="tablist" aria-label="Employee sections">
        {(
          [
            ['ecards', 'Employee E-Cards & Policies'],
            ['plans', 'Employee Plans & Benefits'],
            [
              'claims',
              openClaims > 0 ? (
                <>
                  Claims <ClaimsOpen>({openClaims} Open)</ClaimsOpen>
                </>
              ) : (
                'Claims'
              ),
            ],
            ['dependant-ecards', 'Dependant E-Cards & Policies'],
          ] as const
        ).map(([id, label]) => (
          <Tab
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            $active={tab === id}
            onClick={() => setTab(id)}
          >
            {label}
          </Tab>
        ))}
      </Tabs>

      <TabPanel>
        {tab === 'plans' ? (
          <PlansStack>
            <SectionCard>
              <SectionHead>Active Plans</SectionHead>
              <SectionBody>
                <TimelineGroup>
                  <GroupTitle>
                    <TimelineDot />
                    <img
                      src={assets.edIconDocCopy}
                      alt=""
                      width={24}
                      height={24}
                    />
                    <span>Health Insurance Plans</span>
                  </GroupTitle>

                  {planCards.map((plan) => {
                    const planMeta = getPlanById(plan.id)
                    const linked =
                      planMeta?.benefitIds
                        .map((id) => getBenefitById(id))
                        .filter(Boolean) ?? []
                    const premium =
                      plan.id === 'plan-parental' ? 52000 : 45000
                    return (
                      <PlanCard key={plan.id}>
                        <PlanHeader>
                          <PlanIdentity>
                            <PlanLogo>
                              <img
                                src={assets.edPlanShield}
                                alt=""
                                width={40}
                                height={40}
                              />
                            </PlanLogo>
                            <div>
                              <PlanName>{plan.name}</PlanName>
                              <PlanMeta>Plan ID: {plan.id}</PlanMeta>
                            </div>
                          </PlanIdentity>
                          <PremiumBox>
                            <span>Premium:</span>
                            <strong>{formatINR(premium)}</strong>
                          </PremiumBox>
                        </PlanHeader>

                        {linked.length > 0 ? (
                          <>
                            <LinkedLabel>Linked Benefits:</LinkedLabel>
                            {linked.map((benefit) =>
                              benefit ? (
                                <BenefitBlock key={benefit.id}>
                                  <BenefitTop>
                                    <InsurerLogo
                                      src={insurerLogoSrc(benefit.insurerLogo)}
                                      alt=""
                                    />
                                    <div>
                                      <BenefitName>{benefit.name}</BenefitName>
                                      <BenefitMeta>
                                        By {benefit.insurerName}
                                        <Dot />
                                        Insurance{' '}
                                        {(
                                          benefit.category ?? 'gmc'
                                        ).toUpperCase()}
                                        <Dot />
                                        Per Family : E+S+2C
                                      </BenefitMeta>
                                    </div>
                                  </BenefitTop>
                                  <AttrRow>
                                    <Attr>
                                      <img
                                        src={assets.edIconDocCopy}
                                        alt=""
                                        width={20}
                                        height={20}
                                      />
                                      Tier Name <strong>Standard</strong>
                                    </Attr>
                                    <Attr>
                                      <img
                                        src={assets.edIconPerson}
                                        alt=""
                                        width={20}
                                        height={20}
                                      />
                                      Covers{' '}
                                      <strong>{coveredLives} Members</strong>
                                    </Attr>
                                    <Attr>
                                      <img
                                        src={assets.edIconCalendar}
                                        alt=""
                                        width={20}
                                        height={20}
                                      />
                                      Valid Until <strong>20 Jan 2027</strong>
                                    </Attr>
                                    <Attr>
                                      <img
                                        src={assets.edIconMoneys}
                                        alt=""
                                        width={20}
                                        height={20}
                                      />
                                      Sum Insured <strong>₹5,00,000</strong>
                                    </Attr>
                                  </AttrRow>
                                </BenefitBlock>
                              ) : null,
                            )}
                          </>
                        ) : null}
                      </PlanCard>
                    )
                  })}
                </TimelineGroup>
              </SectionBody>
            </SectionCard>

            <SectionCard>
              <SectionHead>Active Benefits</SectionHead>
              <SectionBody>
                {(standaloneBenefits.length
                  ? standaloneBenefits
                  : employee.coverages.filter((c) => c.kind === 'benefit')
                ).map((coverage) => {
                  const benefit = getBenefitById(coverage.id)
                  const premium =
                    coverage.category === 'opd'
                      ? 3000
                      : coverage.category === 'gpa'
                        ? 4000
                        : 12000
                  return (
                    <StandaloneBenefit key={coverage.id}>
                      <TimelineDot $inline />
                      <BenefitCardInner>
                        <PlanHeader>
                          <PlanIdentity>
                            <InsurerLogo
                              src={insurerLogoSrc(benefit?.insurerLogo)}
                              alt=""
                            />
                            <div>
                              <BenefitName>{coverage.label}</BenefitName>
                              <BenefitMeta>
                                By {benefit?.insurerName ?? 'Loop'}
                                <Dot />
                                Per Life
                              </BenefitMeta>
                            </div>
                          </PlanIdentity>
                          <PremiumBox>
                            <span>Premium:</span>
                            <strong>{formatINR(premium)}</strong>
                          </PremiumBox>
                        </PlanHeader>
                        <AttrRow>
                          <Attr>
                            <img
                              src={assets.edIconDocCopy}
                              alt=""
                              width={20}
                              height={20}
                            />
                            Tier Name <strong>Advanced</strong>
                          </Attr>
                          <Attr>
                            <img
                              src={assets.edIconPerson}
                              alt=""
                              width={20}
                              height={20}
                            />
                            Covers{' '}
                            <strong>
                              {employee.firstName} {employee.lastName} (self)
                            </strong>
                          </Attr>
                          <Attr>
                            <img
                              src={assets.edIconCalendar}
                              alt=""
                              width={20}
                              height={20}
                            />
                            Valid Until <strong>20 Jan 2027</strong>
                          </Attr>
                        </AttrRow>
                      </BenefitCardInner>
                    </StandaloneBenefit>
                  )
                })}
              </SectionBody>
            </SectionCard>
          </PlansStack>
        ) : null}

        {tab === 'ecards' ? (
          <PlaceholderCard>
            <PlaceholderTitle>Employee E-Cards & Policies</PlaceholderTitle>
            <PlaceholderCopy>
              Prototype: e-cards and policy documents for this employee would
              appear here.
            </PlaceholderCopy>
            <CoverageList>
              {employee.coverages.map((c) => (
                <li key={`${c.kind}-${c.id}`}>
                  {c.label}
                  {c.status ? ` · ${c.status}` : ''}
                </li>
              ))}
            </CoverageList>
          </PlaceholderCard>
        ) : null}

        {tab === 'claims' ? (
          <PlaceholderCard>
            <PlaceholderTitle>Claims</PlaceholderTitle>
            <PlaceholderCopy>
              {openClaims > 0
                ? `${openClaims} open claim on GMC in this prototype.`
                : 'No open claims for this employee.'}
            </PlaceholderCopy>
          </PlaceholderCard>
        ) : null}

        {tab === 'dependant-ecards' ? (
          <PlaceholderCard>
            <DepHeader>
              <PlaceholderTitle>Dependants</PlaceholderTitle>
              <EmeraldOutline
                type="button"
                onClick={() => navigate(wizard('add', 'single-dependant'))}
              >
                <img
                  src={assets.edIconAddDependant}
                  alt=""
                  width={20}
                  height={20}
                />
                Add New Dependant
              </EmeraldOutline>
            </DepHeader>
            {employee.dependants.length === 0 ? (
              <PlaceholderCopy>No dependants on file.</PlaceholderCopy>
            ) : (
              <DepList>
                {employee.dependants.map((dependant) => (
                  <DepRow key={dependant.id}>
                    <div>
                      <strong>
                        {dependant.firstName} {dependant.lastName}
                      </strong>
                      <span>
                        {dependant.relationship} · DOB{' '}
                        {formatDisplayDate(dependant.dateOfBirth)}
                      </span>
                      <span>
                        {dependant.benefitIds?.length
                          ? `Covered: ${dependant.benefitIds.length} benefit(s)`
                          : 'Not covered'}
                      </span>
                    </div>
                    <DepActions>
                      <Ghost
                        type="button"
                        onClick={() =>
                          navigate(
                            wizard('edit', 'single-dependant', {
                              dependant: dependant.id,
                            }),
                          )
                        }
                      >
                        Edit
                      </Ghost>
                      <Ghost
                        type="button"
                        onClick={() => setRemoveDependantId(dependant.id)}
                      >
                        Remove
                      </Ghost>
                    </DepActions>
                  </DepRow>
                ))}
              </DepList>
            )}
          </PlaceholderCard>
        ) : null}
      </TabPanel>

      {removeDependantId ? (
        <Overlay>
          <Dialog>
            <h2>Remove this dependant?</h2>
            <p>
              The removal is mocked into Pending Changes with a refund estimate
              of {formatPendingINR(900)}.
            </p>
            <ButtonRow>
              <OutlineBtn
                type="button"
                onClick={() => setRemoveDependantId(null)}
              >
                Cancel
              </OutlineBtn>
              <Danger type="button" onClick={confirmRemoveDependant}>
                Add to Pending Changes
              </Danger>
            </ButtonRow>
          </Dialog>
        </Overlay>
      ) : null}

      {leaveOpen ? (
        <Overlay>
          <Dialog>
            <h2>Delete employee</h2>
            <p>
              Choose a date of leaving. Continue in the off-board flow for full
              coverage and refund review, or queue a mocked exit here.
            </p>
            <DateInput
              type="date"
              value={leaveDate}
              onChange={(event) => setLeaveDate(event.target.value)}
            />
            <ButtonRow>
              <OutlineBtn type="button" onClick={() => setLeaveOpen(false)}>
                Cancel
              </OutlineBtn>
              <Primary
                type="button"
                onClick={() =>
                  navigate(
                    wizard('delete', 'single', {
                      leaving: leaveDate || undefined,
                    }),
                  )
                }
              >
                Continue in off-board flow
              </Primary>
              <Danger
                type="button"
                disabled={!leaveDate}
                onClick={confirmLeave}
              >
                Queue mocked exit
              </Danger>
            </ButtonRow>
          </Dialog>
        </Overlay>
      ) : null}
    </Page>
  )
}

const Page = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 36px ${({ theme }) => theme.layout.contentPadX} 64px;
  width: 100%;
  box-sizing: border-box;
  background: ${({ theme }) => theme.colors.surface0};
  min-height: 100%;

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    padding: 24px ${({ theme }) => theme.layout.contentPadXTablet} 48px;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: 20px ${({ theme }) => theme.layout.contentPadXMobile} 40px;
  }
`

const TopBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
`

const Back = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: ${({ theme }) => theme.colors.textPrimary};
  text-decoration: none;
  font-size: 14px;
  font-weight: 400;
  letter-spacing: 0.2px;
`

const TopActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
`

const OutlineBtn = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  height: 48px;
  padding: 14px;
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.colors.defaultBorder};
  background: ${({ theme }) => theme.colors.surface1};
  color: ${({ theme }) => theme.colors.textPrimary};
  font: inherit;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.2px;
  cursor: pointer;

  &:hover {
    border-color: ${({ theme }) => theme.colors.emerald};
  }
`

const EmeraldOutline = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  height: 36px;
  padding: 0 12px;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.colors.emerald};
  background: ${({ theme }) => theme.colors.surface1};
  color: ${({ theme }) => theme.colors.emerald};
  font: inherit;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.2px;
  cursor: pointer;
  white-space: nowrap;
`

const Notice = styled.p`
  margin: 0;
  padding: 12px 16px;
  border-radius: 10px;
  background: ${({ theme }) => theme.colors.planeGreenLight};
  color: ${({ theme }) => theme.colors.emerald};
  font-size: 13px;
`

const ProfileCard = styled.section`
  display: flex;
  flex-direction: column;
  gap: 36px;
  padding: 24px;
  border-radius: 16px;
  background: ${({ theme }) => theme.colors.surface1};
  border: 1px solid rgba(0, 0, 0, 0.08);
`

const ProfileTop = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
`

const Identity = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 16px;
`

const Avatar = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: #a586ef;
  color: white;
  font-size: 20px;
  font-weight: 500;
  flex-shrink: 0;
`

const Name = styled.h1`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  line-height: 24px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const EmpId = styled.p`
  margin: 4px 0 0;
  font-size: 14px;
  line-height: 20px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const HealthcareBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 8px 32px 8px 8px;
  border-radius: 40px;
  background: ${({ theme }) => theme.colors.surface0};
  border: 1px solid ${({ theme }) => theme.colors.defaultBorder};
  color: ${({ theme }) => theme.colors.emerald};
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.2px;
`

const BadgeIconWrap = styled.div`
  position: relative;
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
`

const BadgeCheck = styled.span`
  position: absolute;
  right: 0;
  bottom: 0;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.turquoise};
  color: white;
  font-size: 10px;
  display: grid;
  place-items: center;
`

const InfoGrid = styled.div<{ $compact?: boolean }>`
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 16px 24px;
  width: ${({ $compact }) => ($compact ? 'auto' : '100%')};
  flex: ${({ $compact }) => ($compact ? '1' : 'initial')};

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-template-columns: 1fr;
  }
`

const InfoItem = styled.div<{ $wide?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
  padding-right: 16px;
  border-right: 1px solid ${({ theme }) => theme.colors.defaultBorder};

  &:last-child {
    border-right: 0;
    padding-right: 0;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-column: ${({ $wide }) => ($wide ? '1 / -1' : 'auto')};
    border-right: 0;
    padding-right: 0;
  }
`

const InfoLabel = styled.span`
  font-size: 12px;
  font-weight: 500;
  line-height: 18px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const InfoValue = styled.span`
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textPrimary};
  overflow: hidden;
  text-overflow: ellipsis;
`

const StatusValue = styled(InfoValue)<{ $tone: string }>`
  text-transform: capitalize;
  color: ${({ theme, $tone }) =>
    $tone === 'inactive'
      ? theme.colors.textError
      : $tone === 'leaving'
        ? '#B45309'
        : theme.colors.emerald};
`

const InfoRowBottom = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  flex-wrap: wrap;
`

const EcardActions = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
`

const Tabs = styled.div`
  display: flex;
  align-items: stretch;
  gap: 0;
  background: ${({ theme }) => theme.colors.surface1};
  border-bottom: 1px solid ${({ theme }) => theme.colors.defaultBorder};
  overflow-x: auto;
`

const Tab = styled.button<{ $active: boolean }>`
  flex: 1 1 0;
  min-width: 180px;
  height: 48px;
  padding: 14px 12px 0;
  border: 0;
  border-bottom: 2px solid
    ${({ theme, $active }) =>
      $active ? theme.colors.emerald : theme.colors.defaultBorder};
  background: ${({ theme }) => theme.colors.surface1};
  color: ${({ theme, $active }) =>
    $active ? theme.colors.emerald : theme.colors.textSecondary};
  font: inherit;
  font-size: 14px;
  font-weight: ${({ $active }) => ($active ? 600 : 500)};
  letter-spacing: 0.2px;
  cursor: pointer;
  white-space: nowrap;
`

const ClaimsOpen = styled.span`
  color: ${({ theme }) => theme.colors.textError};
  font-weight: 600;
`

const TabPanel = styled.div`
  background: ${({ theme }) => theme.colors.surface1};
  border-radius: 0 0 16px 16px;
  padding: 28px 56px;
  box-sizing: border-box;

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    padding: 24px 24px;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: 16px;
  }
`

const PlansStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 44px;
`

const SectionCard = styled.section`
  border-radius: 20px;
  overflow: hidden;
  background: ${({ theme }) => theme.colors.surface0};
`

const SectionHead = styled.div`
  padding: 12px 16px;
  background: ${({ theme }) => theme.colors.planeGreenLight};
  color: ${({ theme }) => theme.colors.emerald};
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.2px;
`

const SectionBody = styled.div`
  padding: 16px 24px 24px;
`

const TimelineGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
  padding-left: 8px;
`

const GroupTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 16px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
  position: relative;
`

const TimelineDot = styled.span<{ $inline?: boolean }>`
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.emerald};
  flex-shrink: 0;
  ${({ $inline }) =>
    $inline
      ? `
    margin-top: 28px;
  `
      : ''}
`

const PlanCard = styled.div`
  margin-left: 24px;
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: ${({ theme }) => theme.colors.surface1};
  overflow: hidden;
`

const PlanHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px;
  flex-wrap: wrap;
`

const PlanIdentity = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
`

const PlanLogo = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 9px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  overflow: hidden;
  display: grid;
  place-items: center;
  flex-shrink: 0;

  img {
    width: 40px;
    height: 40px;
    object-fit: cover;
  }
`

const PlanName = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const PlanMeta = styled.div`
  margin-top: 2px;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const PremiumBox = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border-radius: 6px;
  border: 1px dashed rgba(0, 0, 0, 0.4);
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};

  strong {
    font-size: 14px;
    font-weight: 500;
    color: ${({ theme }) => theme.colors.textPrimary};
  }
`

const LinkedLabel = styled.div`
  padding: 0 16px 8px;
  font-size: 12px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const BenefitBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border-top: 1px dashed rgba(0, 0, 0, 0.12);
`

const BenefitTop = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`

const InsurerLogo = styled.img`
  width: 48px;
  height: 48px;
  border-radius: 8px;
  object-fit: contain;
  background: ${({ theme }) => theme.colors.surface0};
  flex-shrink: 0;
`

const BenefitName = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const BenefitMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 2px;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const Dot = styled.span`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.defaultBorder};
  flex-shrink: 0;
`

const AttrRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px 24px;
  padding: 12px;
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.surface0};
`

const Attr = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};

  strong {
    color: ${({ theme }) => theme.colors.textPrimary};
    font-weight: 500;
  }
`

const StandaloneBenefit = styled.div`
  display: flex;
  gap: 16px;
  align-items: flex-start;
  margin-bottom: 16px;

  &:last-child {
    margin-bottom: 0;
  }
`

const BenefitCardInner = styled.div`
  flex: 1;
  min-width: 0;
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: ${({ theme }) => theme.colors.surface1};
  overflow: hidden;
`

const PlaceholderCard = styled.section`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const PlaceholderTitle = styled.h2`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const PlaceholderCopy = styled.p`
  margin: 0;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const CoverageList = styled.ul`
  margin: 0;
  padding-left: 18px;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const DepHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
`

const DepList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`

const DepRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 12px;
  border-radius: 10px;
  background: ${({ theme }) => theme.colors.surface0};

  div {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 13px;
  }
`

const DepActions = styled.div`
  display: flex;
  gap: 8px;
  align-items: flex-start;
`

const Ghost = styled.button`
  border: 0;
  background: transparent;
  color: ${({ theme }) => theme.colors.emerald};
  font: inherit;
  cursor: pointer;
`

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 40;
  display: grid;
  place-items: center;
  background: rgba(17, 24, 39, 0.45);
  padding: 16px;
`

const Dialog = styled.div`
  width: min(480px, 100%);
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 24px;
  border-radius: 16px;
  background: ${({ theme }) => theme.colors.surface1};

  h2 {
    margin: 0;
    font-size: 18px;
  }

  p {
    margin: 0;
    font-size: 14px;
    color: ${({ theme }) => theme.colors.textSecondary};
  }
`

const ButtonRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`

const Primary = styled.button`
  height: 40px;
  padding: 0 16px;
  border: 0;
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.fillGreen};
  color: ${({ theme }) => theme.colors.emerald};
  font: inherit;
  font-weight: 600;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const Danger = styled(Primary)`
  background: ${({ theme }) => theme.colors.fillRed};
  color: ${({ theme }) => theme.colors.textTertiary};
`

const DateInput = styled.input`
  height: 44px;
  padding: 0 12px;
  border: 1px solid ${({ theme }) => theme.colors.defaultBorder};
  border-radius: 8px;
  font: inherit;
`
