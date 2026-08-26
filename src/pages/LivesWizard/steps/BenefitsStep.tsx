import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import { assets } from '@/assets/figma'
import {
  estimatePolicyEndorsementCost,
  formatINR,
  getDependantCoverEligibility,
  getEmployeeCoverEligibility,
  selectablePolicies,
} from '@/data/flexDeal'
import {
  evaluateDependantCoverEligibility,
  evaluateEmployeeEligibility,
  isRelationshipAllowedForBenefit,
  resolveAssignment,
  type AssignmentResult,
} from '@/domain/flex'
import {
  flattenMembers,
  type AddEmployeeMember,
} from '@/pages/LivesWizard/addEmployees'
import { FlowStepper, WizardChrome } from '@/pages/LivesWizard/WizardChrome'
import {
  useLivesWizard,
  type BenefitsAssignMode,
} from '@/pages/LivesWizard/WizardContext'
import { SINGLE_ADD_STEPS, addEmployeesPageTitle } from '@/pages/LivesWizard/singleAddSteps'

type CoverItem = {
  id: string
  label: string
  meta: string
  kind: 'policy' | 'addon'
  eligibleLifeIds: string[]
  eligibleCount: number
  totalCount: number
  recommended: boolean
  locked: boolean
}

function familyLifeIds(member: AddEmployeeMember) {
  return [member.id, ...member.dependants.map((d) => d.id)]
}

function memberForLife(members: AddEmployeeMember[], lifeId: string) {
  return members.find(
    (m) => m.id === lifeId || m.dependants.some((d) => d.id === lifeId),
  )
}

export function BenefitsStep() {
  const navigate = useNavigate()
  const {
    addEmployees,
    activeDeal,
    intakeMode,
    selectedPolicyIds,
    selectedPolicyTiers,
    setPolicyTier,
    selectedPolicyFamilyStructures,
    setPolicyFamilyStructure,
    setPurchaseGroupChoice,
    toggleCoverForEligibleLives,
    benefitsAssignMode,
    setBenefitsAssignMode,
    setStep,
  } = useLivesWizard()

  const lives = useMemo(() => flattenMembers(addEmployees), [addEmployees])
  const totalLives = lives.length
  const assignments = useMemo(() => {
    if (!activeDeal) return new Map<string, AssignmentResult>()
    return new Map<string, AssignmentResult>(
      addEmployees.map((member) => [
        member.id,
        resolveAssignment({
          deal: activeDeal,
          employee: {
            dateOfBirth: member.employee.dateOfBirth,
            department:
              member.employee.customAttributes['attr-department'],
            attributes: member.employee.customAttributes,
          },
        }),
      ]),
    )
  }, [activeDeal, addEmployees])
  const [selectedLifeId, setSelectedLifeId] = useState(
    () => lives[0]?.id ?? '',
  )

  useEffect(() => {
    if (lives.some((life) => life.id === selectedLifeId)) return
    setSelectedLifeId(lives[0]?.id ?? '')
  }, [lives, selectedLifeId])

  const selectedMember = memberForLife(addEmployees, selectedLifeId)
  const scopeIds = useMemo(() => {
    if (!selectedMember) return [] as string[]
    if (benefitsAssignMode === 'individual') return [selectedLifeId]
    return familyLifeIds(selectedMember)
  }, [benefitsAssignMode, selectedLifeId, selectedMember])

  const covers = useMemo(() => {
    const items: CoverItem[] = []

    for (const policy of activeDeal ? [] : selectablePolicies) {
      const eligibleLifeIds: string[] = []
      for (const life of lives) {
        if (life.kind === 'employee') {
          const member = addEmployees.find((m) => m.id === life.memberId)
          if (!member) continue
          const eligibility = getEmployeeCoverEligibility(member.employee)
          if (eligibility.policies[policy.id]?.eligible !== false) {
            eligibleLifeIds.push(life.id)
          }
        } else {
          const status = getDependantCoverEligibility(
            life.relationship || '',
            life.dateOfBirth,
            policy.id,
          )
          if (status.eligible) eligibleLifeIds.push(life.id)
        }
      }
      const eligibleCount = eligibleLifeIds.length
      items.push({
        id: policy.id,
        label: policy.name,
        meta: `${policy.insurerName} · Policy No: ${policy.policyNumber}`,
        kind: 'policy',
        eligibleLifeIds,
        eligibleCount,
        totalCount: totalLives,
        recommended: eligibleCount > 0 && eligibleCount >= totalLives * 0.5,
        locked: false,
      })
    }

    if (activeDeal) {
      for (const benefit of activeDeal.benefits) {
          const eligibleLifeIds: string[] = []
          for (const life of lives) {
            if (life.kind === 'employee') {
              const member = addEmployees.find((m) => m.id === life.memberId)
              if (!member) continue
              const eligibility = evaluateEmployeeEligibility(activeDeal, {
                dateOfBirth: member.employee.dateOfBirth,
                department:
                  member.employee.customAttributes['attr-department'],
                attributes: member.employee.customAttributes,
              })
              if (eligibility.benefits[benefit.id]?.eligible !== false) {
                eligibleLifeIds.push(life.id)
              }
            } else if (
              isRelationshipAllowedForBenefit(
                activeDeal,
                life.relationship || '',
                benefit.id,
              )
            ) {
              const status = evaluateDependantCoverEligibility(
                activeDeal,
                life.relationship || '',
                life.dateOfBirth,
                benefit.id,
              )
              if (status.eligible) eligibleLifeIds.push(life.id)
            }
          }
          const eligibleCount = eligibleLifeIds.length
          const assigned = addEmployees.some((member) =>
            assignments.get(member.id)?.benefitIds.includes(benefit.id),
          )
          items.push({
            id: benefit.id,
            label: benefit.name,
            meta: `${benefit.policyName} · ${benefit.category.toUpperCase()}`,
            kind: 'addon',
            eligibleLifeIds,
            eligibleCount,
            totalCount: totalLives,
            recommended: assigned,
            locked: assigned,
          })
      }
    }

    return items
  }, [activeDeal, addEmployees, assignments, lives, totalLives])

  const scopedCovers = useMemo(() => {
    const scopeSet = new Set(scopeIds)
    return covers
      .map((cover) => {
        const scopedEligibleIds = cover.eligibleLifeIds.filter((id) =>
          scopeSet.has(id),
        )
        const scopedCount = scopedEligibleIds.length
        return {
          ...cover,
          eligibleLifeIds: scopedEligibleIds,
          eligibleCount: scopedCount,
          totalCount: Math.max(scopeIds.length, 1),
          recommended:
            scopedCount > 0 && scopedCount >= scopeIds.length * 0.5,
        }
      })
      .filter((cover) => cover.eligibleCount > 0)
  }, [covers, scopeIds])

  const recommended = scopedCovers.filter((c) => c.recommended)
  const other = scopedCovers.filter((c) => !c.recommended)

  const selectedCoverIds = useMemo(() => {
    const ids = new Set<string>()
    if (benefitsAssignMode === 'individual') {
      const life = lives.find((l) => l.id === selectedLifeId)
      for (const id of life?.selectedBenefitIds ?? []) ids.add(id)
      return ids
    }
    for (const cover of scopedCovers) {
      const eligible = lives.filter((l) =>
        cover.eligibleLifeIds.includes(l.id),
      )
      if (
        eligible.length > 0 &&
        eligible.every((l) => l.selectedBenefitIds.includes(cover.id))
      ) {
        ids.add(cover.id)
      }
    }
    return ids
  }, [benefitsAssignMode, lives, scopedCovers, selectedLifeId])

  const didPrefill = useRef(false)
  useEffect(() => {
    if (didPrefill.current) return
    const anyAssigned = lives.some((l) => l.selectedBenefitIds.length > 0)
    if (anyAssigned || selectedPolicyIds.length > 0) {
      didPrefill.current = true
      return
    }
    const globalRecommended = covers.filter(
      (c) => c.recommended && c.eligibleCount > 0,
    )
    if (globalRecommended.length === 0) return
    didPrefill.current = true
    for (const cover of globalRecommended) {
      toggleCoverForEligibleLives(cover.id, true, cover.eligibleLifeIds)
      const policy = selectablePolicies.find((p) => p.id === cover.id)
      if (policy?.familyStructures?.[0]) {
        setPolicyFamilyStructure(cover.id, policy.familyStructures[0].id)
      }
      if (policy?.tiers?.[0]) {
        setPolicyTier(cover.id, policy.tiers[0].id)
      }
    }
    if (activeDeal) {
      for (const assignment of assignments.values()) {
        for (const [groupId, optionIds] of Object.entries(
          assignment.purchaseGroupSelections,
        )) {
          setPurchaseGroupChoice(
            activeDeal.id,
            groupId,
            optionIds[0] ?? null,
          )
        }
      }
    }
  }, [
    covers,
    lives,
    selectedPolicyIds.length,
    setPolicyFamilyStructure,
    setPolicyTier,
    toggleCoverForEligibleLives,
    activeDeal,
    assignments,
    setPurchaseGroupChoice,
  ])

  const employeesHaveCover = addEmployees.every(
    (m) => m.selectedBenefitIds.length > 0,
  )
  const policiesReady = selectablePolicies.every((policy) => {
    const anyoneHas = lives.some((l) => l.selectedBenefitIds.includes(policy.id))
    if (!anyoneHas) return true
    const tierOk =
      !policy.tiers?.length || Boolean(selectedPolicyTiers[policy.id])
    const familyOk =
      !policy.familyStructures?.length ||
      Boolean(selectedPolicyFamilyStructures[policy.id])
    return tierOk && familyOk
  })
  const canProceed = employeesHaveCover && policiesReady

  const applyMode = (mode: BenefitsAssignMode) => {
    if (mode === 'common') {
      for (const member of addEmployees) {
        const familyIds = new Set(familyLifeIds(member))
        for (const cover of covers) {
          const depIds = cover.eligibleLifeIds.filter(
            (id) => familyIds.has(id) && id !== member.id,
          )
          if (depIds.length === 0) continue
          const empHas =
            cover.eligibleLifeIds.includes(member.id) &&
            member.selectedBenefitIds.includes(cover.id)
          toggleCoverForEligibleLives(cover.id, empHas, depIds)
        }
      }
    }
    setBenefitsAssignMode(mode)
  }

  const toggleCover = (cover: CoverItem) => {
    if (cover.locked && selectedCoverIds.has(cover.id)) return
    const enabled = !selectedCoverIds.has(cover.id)
    if (cover.kind === 'addon') {
      const deal = activeDeal
      const group = deal?.purchaseGroups.find((g) =>
        g.options.some(
          (o) => (o.benefitId ?? o.planId ?? o.id) === cover.id,
        ),
      )
      const opt = group?.options.find(
        (o) => (o.benefitId ?? o.planId ?? o.id) === cover.id,
      )
      if (deal && group && opt) {
        setPurchaseGroupChoice(deal.id, group.id, enabled ? opt.id : null)
      }
    }
    toggleCoverForEligibleLives(cover.id, enabled, cover.eligibleLifeIds)
  }

  const selectedLife = lives.find((l) => l.id === selectedLifeId)
  const hasDependants = addEmployees.some((m) => m.dependants.length > 0)

  const renderCoverCard = (cover: CoverItem) => {
    const selected = selectedCoverIds.has(cover.id)
    const policy = selectablePolicies.find((p) => p.id === cover.id)
    const structures = policy?.familyStructures ?? []
    const tiers = policy?.tiers ?? []
    const familyId = selectedPolicyFamilyStructures[cover.id] ?? ''
    const tierId = selectedPolicyTiers[cover.id] ?? ''

    return (
    <CoverCard
        key={cover.id}
        $selected={selected}
        $recommended={cover.recommended}
      >
        <CoverHeader
          type="button"
          onClick={() => {
            if (cover.eligibleCount === 0) return
            if (cover.locked && selected) return
            toggleCover(cover)
          }}
        >
          <Checkbox
            type="checkbox"
            checked={selected}
            readOnly
            tabIndex={-1}
            aria-hidden
          />
          <LogoBox>
            <LogoImg
              src={assets.policyCardLoopIcon}
              alt=""
              width={34}
              height={16}
            />
          </LogoBox>
          <CoverCopy>
            <NameRow>
              <CoverName>{cover.label}</CoverName>
              {cover.locked ? (
                <RecommendedBadge>Assigned</RecommendedBadge>
              ) : cover.recommended ? (
                <RecommendedBadge>Recommended</RecommendedBadge>
              ) : null}
            </NameRow>
            <CoverMeta>{cover.meta}</CoverMeta>
            {(intakeMode === 'excel' ||
              totalLives > 1 ||
              benefitsAssignMode === 'individual') && (
              <CountBadge>
                {cover.eligibleCount} of {cover.totalCount} eligible
                {benefitsAssignMode === 'individual' && selectedLife
                  ? ` · ${selectedLife.name}`
                  : ''}
              </CountBadge>
            )}
          </CoverCopy>
        </CoverHeader>

        {selected && policy && (structures.length > 0 || tiers.length > 0) ? (
          <PlanPanel>
            {structures.length > 1 ? (
              <ControlField>
                <FieldLabel>Family structure*</FieldLabel>
                <PillRow>
                  {structures.map((structure) => (
                    <Pill
                      key={structure.id}
                      type="button"
                      $selected={familyId === structure.id}
                      onClick={() =>
                        setPolicyFamilyStructure(cover.id, structure.id)
                      }
                    >
                      {structure.label}
                    </Pill>
                  ))}
                </PillRow>
              </ControlField>
            ) : null}
            {tiers.length > 0 ? (
              <ControlField>
                <FieldLabel>Sum insured*</FieldLabel>
                <TierList>
                  {tiers.map((tier) => {
                    const cost = estimatePolicyEndorsementCost(
                      cover.id,
                      familyId || structures[0]?.id,
                      tier.id,
                    )
                    return (
                      <TierRow
                        key={tier.id}
                        type="button"
                        $selected={tierId === tier.id}
                        onClick={() => {
                          if (structures.length === 1 && !familyId) {
                            setPolicyFamilyStructure(cover.id, structures[0].id)
                          }
                          setPolicyTier(cover.id, tier.id)
                        }}
                      >
                        <span>{tier.label}</span>
                        <TierCost>{formatINR(cost)}</TierCost>
                      </TierRow>
                    )
                  })}
                </TierList>
              </ControlField>
            ) : null}
          </PlanPanel>
        ) : null}

        {selected && cover.kind === 'addon' ? (
          <PlanPanel>
            <CostHint>
              Est. per life assigned to eligible people
            </CostHint>
          </PlanPanel>
        ) : null}
      </CoverCard>
    )
  }

  return (
    <WizardChrome
      title={addEmployeesPageTitle(activeDeal?.name)}
      onBack={() => setStep('user-details')}
      onExit={() => navigate('/endorsements')}
      secondaryLabel="Back"
      onSecondary={() => setStep('user-details')}
      primaryLabel="Proceed"
      primaryDisabled={!canProceed}
      onPrimary={() => setStep('family')}
      footerLeft={
        <FooterHint>
          {canProceed
            ? `${lives.filter((l) => l.selectedBenefitIds.length > 0).length} of ${totalLives} lives assigned`
            : 'Each employee needs at least one benefit'}
        </FooterHint>
      }
    >
      <FlowStepper steps={[...SINGLE_ADD_STEPS]} activeIndex={1} bare />

      <Intro>
        {benefitsAssignMode === 'common'
          ? 'Benefits chosen below apply to the selected employee and all eligible dependants in that family.'
          : 'Select a person, then choose benefits for them only. Switch to shared if everyone in the family should get the same covers.'}
      </Intro>

      <ModeToggle>
        <ModeButton
          type="button"
          $active={benefitsAssignMode === 'common'}
          onClick={() => applyMode('common')}
        >
          Same for employee & dependants
        </ModeButton>
        <ModeButton
          type="button"
          $active={benefitsAssignMode === 'individual'}
          onClick={() => applyMode('individual')}
        >
          Set individually
        </ModeButton>
      </ModeToggle>

      <PeopleList>
        {addEmployees.map((member, index) => {
          const empName =
            `${member.employee.firstName} ${member.employee.lastName}`.trim() ||
            `Employee ${index + 1}`
          const familySelected =
            benefitsAssignMode === 'common' && selectedMember?.id === member.id
          const empSelected =
            benefitsAssignMode === 'individual' && selectedLifeId === member.id

          return (
            <FamilyGroup key={member.id}>
              <PersonCard
                type="button"
                $selected={familySelected || empSelected}
                $kind="employee"
                onClick={() => setSelectedLifeId(member.id)}
              >
                <PersonKind>Employee</PersonKind>
                <PersonName>{empName}</PersonName>
                <PersonMeta>
                  {member.employee.employeeId || 'No employee ID'} · Self
                </PersonMeta>
                <PersonMeta>
                  {member.selectedBenefitIds.length} benefit
                  {member.selectedBenefitIds.length === 1 ? '' : 's'}
                </PersonMeta>
              </PersonCard>
              {member.dependants.map((dep, dIndex) => {
                const depName =
                  `${dep.firstName} ${dep.lastName}`.trim() ||
                  `Dependant ${dIndex + 1}`
                const depSelected =
                  benefitsAssignMode === 'individual' &&
                  selectedLifeId === dep.id
                return (
                  <PersonCard
                    key={dep.id}
                    type="button"
                    $selected={familySelected || depSelected}
                    $kind="dependant"
                    onClick={() => setSelectedLifeId(dep.id)}
                  >
                    <PersonKind>Dependant</PersonKind>
                    <PersonName>{depName}</PersonName>
                    <PersonMeta>{dep.relationship || 'Relationship'}</PersonMeta>
                    <PersonMeta>
                      {dep.selectedBenefitIds.length} benefit
                      {dep.selectedBenefitIds.length === 1 ? '' : 's'}
                    </PersonMeta>
                  </PersonCard>
                )
              })}
            </FamilyGroup>
          )
        })}
      </PeopleList>

      {hasDependants && benefitsAssignMode === 'common' && selectedMember ? (
        <ScopeHint>
          Editing family of{' '}
          <strong>
            {`${selectedMember.employee.firstName} ${selectedMember.employee.lastName}`.trim() ||
              'this employee'}
          </strong>
          . Eligible dependants receive the same covers.
        </ScopeHint>
      ) : null}
      {benefitsAssignMode === 'individual' && selectedLife ? (
        <ScopeHint>
          Editing covers for <strong>{selectedLife.name}</strong>
          {selectedLife.kind === 'dependant'
            ? ` · ${selectedLife.relationship}`
            : ''}
          .
        </ScopeHint>
      ) : null}

      <SectionTitle>Assigned by company</SectionTitle>
      <CoverList>
        {recommended.length > 0 ? (
          recommended.map(renderCoverCard)
        ) : (
          <Empty>
            No strongly recommended covers for this selection — pick from other
            benefits.
          </Empty>
        )}
      </CoverList>

      <SectionTitle>Other available benefits</SectionTitle>
      <CoverList>
        {other.length > 0 ? (
          other.map(renderCoverCard)
        ) : (
          <Empty>No additional covers available.</Empty>
        )}
      </CoverList>
    </WizardChrome>
  )
}

const Intro = styled.p`
  margin: 0;
  font-size: 14px;
  line-height: 20px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const ModeToggle = styled.div`
  display: inline-flex;
  gap: 0;
  padding: 4px;
  border-radius: 10px;
  background: ${({ theme }) => theme.colors.disableFill};
  width: fit-content;
`

const ModeButton = styled.button<{ $active: boolean }>`
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  background: ${({ theme, $active }) =>
    $active ? theme.colors.surface1 : 'transparent'};
  color: ${({ theme, $active }) =>
    $active ? theme.colors.emerald : theme.colors.textSecondary};
  box-shadow: ${({ $active, theme }) => ($active ? theme.shadows.smooth : 'none')};
`

const PeopleList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const FamilyGroup = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
`

const PersonCard = styled.button<{
  $selected: boolean
  $kind: 'employee' | 'dependant'
}>`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  padding: 14px 16px;
  border-radius: 12px;
  text-align: left;
  cursor: pointer;
  font-family: ${({ theme }) => theme.fontFamily};
  background: ${({ theme, $kind }) =>
    $kind === 'dependant' ? theme.colors.surface0 : theme.colors.surface1};
  border: 1px solid
    ${({ theme, $selected }) =>
      $selected ? theme.colors.emerald : theme.colors.defaultBorder};
  box-shadow: ${({ $selected }) =>
    $selected ? '0 0 0 1px rgba(2, 95, 76, 0.12)' : 'none'};
`

const PersonKind = styled.span`
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.emerald};
`

const PersonName = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const PersonMeta = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const ScopeHint = styled.p`
  margin: 0;
  font-size: 13px;
  line-height: 18px;
  color: ${({ theme }) => theme.colors.textSecondary};

  strong {
    color: ${({ theme }) => theme.colors.textPrimary};
    font-weight: 600;
  }
`

const SectionTitle = styled.h2`
  margin: 8px 0 0;
  font-size: 16px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.beyondGrey};
`

const CoverList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const CoverCard = styled.div<{ $selected: boolean; $recommended: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 0;
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.surface1};
  border: 1px solid
    ${({ theme, $selected, $recommended }) =>
      $selected
        ? theme.colors.emerald
        : $recommended
          ? theme.colors.emerald
          : theme.colors.defaultBorder};
  box-shadow: ${({ $recommended, $selected }) =>
    $recommended && !$selected
      ? '0 0 0 1px rgba(2, 95, 76, 0.08)'
      : 'none'};
  overflow: hidden;
`

const CoverHeader = styled.button`
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
  padding: 20px 24px;
  border: none;
  background: transparent;
  text-align: left;
  cursor: pointer;
  font-family: ${({ theme }) => theme.fontFamily};
`

const Checkbox = styled.input`
  width: 20px;
  height: 20px;
  accent-color: ${({ theme }) => theme.colors.emerald};
  pointer-events: none;
`

const LogoBox = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  background: linear-gradient(180deg, #35793c 0%, #01362a 100%);
  flex-shrink: 0;
`

const LogoImg = styled.img`
  width: 34px;
  height: 16px;
  object-fit: contain;
`

const CoverCopy = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  flex: 1;
`

const NameRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`

const CoverName = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const RecommendedBadge = styled.span`
  display: inline-flex;
  align-items: center;
  height: 22px;
  padding: 0 8px;
  border-radius: 4px;
  background: ${({ theme }) => theme.colors.planeGreenLight};
  color: ${({ theme }) => theme.colors.emerald};
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
`

const CoverMeta = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const CountBadge = styled.span`
  align-self: flex-start;
  margin-top: 4px;
  padding: 2px 8px;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.planeGreenLight};
  color: ${({ theme }) => theme.colors.emerald};
  font-size: 11px;
  font-weight: 500;
`

const PlanPanel = styled.div`
  padding: 0 24px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  border-top: 1px solid ${({ theme }) => theme.colors.defaultBorder};
  padding-top: 16px;
`

const ControlField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 560px;
`

const FieldLabel = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const PillRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`

const Pill = styled.button<{ $selected: boolean }>`
  height: 36px;
  padding: 0 14px;
  border-radius: 30px;
  border: 1px solid
    ${({ theme, $selected }) =>
      $selected ? theme.colors.emerald : theme.colors.defaultBorder};
  background: ${({ theme, $selected }) =>
    $selected ? theme.colors.planeGreenLight : theme.colors.surface1};
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: 12px;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const TierList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const TierRow = styled.button<{ $selected: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 44px;
  padding: 0 14px;
  border-radius: 8px;
  border: 1px solid
    ${({ theme, $selected }) =>
      $selected ? theme.colors.emerald : theme.colors.defaultBorder};
  background: ${({ theme, $selected }) =>
    $selected ? theme.colors.planeGreenLight : theme.colors.surface1};
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: 14px;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const TierCost = styled.span`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const CostHint = styled.p`
  margin: 0;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};

  strong {
    color: ${({ theme }) => theme.colors.emerald};
  }
`

const Empty = styled.p`
  margin: 0;
  padding: 16px;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  background: ${({ theme }) => theme.colors.surface1};
  border-radius: 10px;
`

const FooterHint = styled.span`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
`
