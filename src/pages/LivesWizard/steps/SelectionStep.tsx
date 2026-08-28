import { useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import { assets } from '@/assets/figma'
import {
  activeDeals,
  estimatePolicyEndorsementCost,
  estimatePurchaseOptionCost,
  formatINR,
  getEmployeeCoverEligibility,
  selectablePolicies,
} from '@/data/flexDeal'
import { FlowStepper, WizardChrome } from '@/pages/LivesWizard/WizardChrome'
import { useLivesWizard } from '@/pages/LivesWizard/WizardContext'
import { SINGLE_ADD_STEPS } from '@/pages/LivesWizard/singleAddSteps'

function openNativeSelect(select: HTMLSelectElement | null) {
  if (!select || select.disabled) return
  select.focus()
  const picker = (
    select as HTMLSelectElement & { showPicker?: () => void }
  ).showPicker
  if (typeof picker === 'function') {
    try {
      picker.call(select)
      return
    } catch {
      // Fall through — some browsers require a direct user gesture.
    }
  }
  select.click()
}

function buildCoverageOptions(policy: (typeof selectablePolicies)[number]) {
  const structures = policy.familyStructures ?? []
  const tiers = policy.tiers ?? []

  if (structures.length > 0 && tiers.length > 0) {
    return structures.flatMap((structure) =>
      tiers.map((tier) => {
        const cost = estimatePolicyEndorsementCost(
          policy.id,
          structure.id,
          tier.id,
        )
        return {
          id: `${structure.id}::${tier.id}`,
          label: `${structure.label} · ${tier.label} · ${formatINR(cost)}`,
          structureId: structure.id,
          tierId: tier.id,
          cost,
        }
      }),
    )
  }

  if (tiers.length > 0) {
    return tiers.map((tier) => {
      const cost = estimatePolicyEndorsementCost(policy.id, undefined, tier.id)
      return {
        id: `::${tier.id}`,
        label: `${tier.label} · ${formatINR(cost)}`,
        structureId: '',
        tierId: tier.id,
        cost,
      }
    })
  }

  return structures.map((structure) => {
    const cost = estimatePolicyEndorsementCost(policy.id, structure.id)
    return {
      id: `${structure.id}::`,
      label: `${structure.label} · ${formatINR(cost)}`,
      structureId: structure.id,
      tierId: '',
      cost,
    }
  })
}

export function SelectionStep() {
  const navigate = useNavigate()
  const {
    method,
    employee,
    selectedPolicyIds,
    togglePolicy,
    selectedPolicyTiers,
    setPolicyTier,
    selectedPolicyFamilyStructures,
    setPolicyFamilyStructure,
    purchaseGroupChoices,
    togglePurchaseGroupOption,
    setPurchaseGroupChoice,
    activeDealId,
    pruneIneligibleSelections,
    setStep,
  } = useLivesWizard()

  const isSingleAdd = method === 'single'
  const planSelectRefs = useRef<Record<string, HTMLSelectElement | null>>({})
  const pendingPlanOpenId = useRef<string | null>(null)

  const eligibility = useMemo(
    () => getEmployeeCoverEligibility(employee),
    [employee],
  )

  useEffect(() => {
    if (!isSingleAdd) return
    pruneIneligibleSelections(eligibility)
  }, [eligibility, isSingleAdd, pruneIneligibleSelections])

  useEffect(() => {
    const id = pendingPlanOpenId.current
    if (!id) return
    pendingPlanOpenId.current = null
    openNativeSelect(planSelectRefs.current[id] ?? null)
  }, [selectedPolicyIds, purchaseGroupChoices])

  const policiesReady = selectedPolicyIds.every((policyId) => {
    const policy = selectablePolicies.find((p) => p.id === policyId)
    if (!policy) return true
    const tierOk =
      !policy.tiers?.length || Boolean(selectedPolicyTiers[policyId])
    const familyOk =
      !policy.familyStructures?.length ||
      Boolean(selectedPolicyFamilyStructures[policyId])
    return tierOk && familyOk
  })

  const dealReady = Object.entries(purchaseGroupChoices).every(
    ([groupId, optionIds]) => {
      if (optionIds.length === 0) return true
      const group = activeDeals
        .flatMap((d) => d.purchaseGroups)
        .find((g) => g.id === groupId)
      if (!group) return true
      if (group.selectMode === 'single') return optionIds.length === 1
      return optionIds.length > 0
    },
  )

  const hasDealSelection = Object.values(purchaseGroupChoices).some(
    (v) => v.length > 0,
  )
  const canProceed =
    (selectedPolicyIds.length > 0 || hasDealSelection) &&
    policiesReady &&
    dealReady

  return (
    <WizardChrome
      title="Add single employee"
      onBack={() =>
        isSingleAdd ? setStep('employee-details') : navigate('/endorsements')
      }
      onExit={() => navigate('/endorsements')}
      secondaryLabel="Back"
      onSecondary={() =>
        isSingleAdd ? setStep('employee-details') : navigate('/endorsements')
      }
      primaryLabel="Proceed"
      primaryDisabled={!canProceed}
      onPrimary={() =>
        setStep(isSingleAdd ? 'dependant-details' : 'employee-details')
      }
    >
      <FlowStepper
        steps={
          isSingleAdd
            ? [...SINGLE_ADD_STEPS]
            : ['Select Benefit', 'Employee Details', 'Review Addition Cost']
        }
        activeIndex={isSingleAdd ? 1 : 0}
        bare
      />

      <SectionTitle>Available Coverage Plans</SectionTitle>
      <PolicyList>
        {selectablePolicies.map((policy) => {
          const selected = selectedPolicyIds.includes(policy.id)
          const status = eligibility.policies[policy.id] ?? { eligible: true }
          const disabled = isSingleAdd && !status.eligible
          const tierId = selectedPolicyTiers[policy.id] ?? ''
          const familyId = selectedPolicyFamilyStructures[policy.id] ?? ''
          const coverageOptions = buildCoverageOptions(policy)
          const hasControls = coverageOptions.length > 0
          const combinedValue =
            familyId || tierId ? `${familyId}::${tierId}` : ''
          const selectedCoverage = coverageOptions.find(
            (item) => item.id === combinedValue,
          )

          return (
            <PolicyCard key={policy.id} $disabled={disabled}>
              <CardHeader>
                <Checkbox
                  type="checkbox"
                  checked={selected}
                  disabled={disabled}
                  aria-label={`Select ${policy.name}`}
                  onChange={() => {
                    if (disabled) return
                    const willSelect = !selected
                    togglePolicy(policy.id)
                    if (willSelect && hasControls) {
                      pendingPlanOpenId.current = policy.id
                    }
                  }}
                />
                <LogoBox>
                  <LogoImg
                    src={assets.policyCardLoopIcon}
                    alt=""
                    width={34}
                    height={16}
                  />
                </LogoBox>
                <PolicyCopy>
                  <PolicyName>{policy.name}</PolicyName>
                  <MetaRow>
                    <span>{policy.insurerName}</span>
                    {policy.policyLabel ? (
                      <>
                        <MetaDot aria-hidden />
                        <span>{policy.policyLabel}</span>
                      </>
                    ) : null}
                    <MetaDot aria-hidden />
                    <span>
                      Policy No: <PolicyNo>{policy.policyNumber}</PolicyNo>
                    </span>
                  </MetaRow>
                  {disabled && status.reason ? (
                    <DisabledReason>{status.reason}</DisabledReason>
                  ) : null}
                </PolicyCopy>
              </CardHeader>

              {hasControls && selected ? (
                <>
                  <Divider aria-hidden />
                  <ControlField>
                    <TierLabel>
                      Select Plan
                      <Required>*</Required>
                    </TierLabel>
                    <SelectWrap>
                      <Select
                        ref={(node) => {
                          planSelectRefs.current[policy.id] = node
                        }}
                        value={combinedValue}
                        disabled={disabled}
                        onChange={(e) => {
                          const next = e.target.value
                          if (!next) return
                          const option = coverageOptions.find(
                            (item) => item.id === next,
                          )
                          if (!option) return
                          if (!selected) togglePolicy(policy.id)
                          if (option.structureId) {
                            setPolicyFamilyStructure(
                              policy.id,
                              option.structureId,
                            )
                          }
                          if (option.tierId) {
                            setPolicyTier(policy.id, option.tierId)
                          }
                        }}
                        onFocus={() => {
                          if (!selected && !disabled) togglePolicy(policy.id)
                        }}
                      >
                        <option value="">Select plan</option>
                        {coverageOptions.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.label}
                          </option>
                        ))}
                      </Select>
                      <SelectChevron
                        src={assets.chevronDown}
                        alt=""
                        width={24}
                        height={24}
                        aria-hidden
                      />
                    </SelectWrap>
                    {selectedCoverage ? (
                      <CostHint>
                        Est. endorsement cost{' '}
                        <strong>{formatINR(selectedCoverage.cost)}</strong>
                      </CostHint>
                    ) : null}
                  </ControlField>
                </>
              ) : null}
            </PolicyCard>
          )
        })}
      </PolicyList>

      {activeDeals.map((deal) => {
        const dealDisabled = Boolean(activeDealId && activeDealId !== deal.id)
        return (
          <DealBlock key={deal.id} $disabled={dealDisabled}>
            <SectionTitle>
              Available Add-ons
              {dealDisabled ? ' (disabled — another deal selected)' : ''}
            </SectionTitle>
            <PolicyList>
              {deal.purchaseGroups.map((group) => {
                const chosen = purchaseGroupChoices[group.id] ?? []
                const selected = chosen.length > 0
                const eligibleOptions = group.options.filter((opt) => {
                  const status = eligibility.options[opt.id] ?? {
                    eligible: true,
                  }
                  return !(isSingleAdd && !status.eligible)
                })

                if (group.selectMode === 'single') {
                  const optionDisabled =
                    dealDisabled || eligibleOptions.length === 0
                  const selectedOpt = group.options.find(
                    (o) => o.id === chosen[0],
                  )
                  return (
                    <PolicyCard key={group.id} $disabled={optionDisabled}>
                      <CardHeader>
                        <Checkbox
                          type="checkbox"
                          checked={selected}
                          disabled={optionDisabled}
                          aria-label={`Select ${group.name}`}
                          onChange={() => {
                            if (optionDisabled) return
                            if (selected) {
                              setPurchaseGroupChoice(deal.id, group.id, null)
                              return
                            }
                            const first = eligibleOptions[0]
                            if (first) {
                              setPurchaseGroupChoice(
                                deal.id,
                                group.id,
                                first.id,
                              )
                              pendingPlanOpenId.current = group.id
                            }
                          }}
                        />
                        <LogoBox>
                          <LogoImg
                            src={assets.policyCardLoopIcon}
                            alt=""
                            width={34}
                            height={16}
                          />
                        </LogoBox>
                        <PolicyCopy>
                          <PolicyName>{group.name}</PolicyName>
                          <MetaRow>
                            <span>Choose a plan tier for this cover</span>
                          </MetaRow>
                        </PolicyCopy>
                      </CardHeader>
                      {selected ? (
                        <>
                          <Divider aria-hidden />
                          <ControlField>
                            <TierLabel>
                              Select Plan
                              <Required>*</Required>
                            </TierLabel>
                            <SelectWrap>
                              <Select
                                ref={(node) => {
                                  planSelectRefs.current[group.id] = node
                                }}
                                value={chosen[0] ?? ''}
                                disabled={optionDisabled}
                                onChange={(e) => {
                                  const next = e.target.value
                                  setPurchaseGroupChoice(
                                    deal.id,
                                    group.id,
                                    next || null,
                                  )
                                }}
                              >
                                <option value="">Select plan</option>
                                {group.options.map((opt) => {
                                  const status = eligibility.options[opt.id] ?? {
                                    eligible: true,
                                  }
                                  const ineligible =
                                    isSingleAdd && !status.eligible
                                  const cost = estimatePurchaseOptionCost(opt)
                                  return (
                                    <option
                                      key={opt.id}
                                      value={opt.id}
                                      disabled={ineligible}
                                    >
                                      {opt.label} · {formatINR(cost)}
                                      {ineligible && status.reason
                                        ? ` — ${status.reason}`
                                        : ''}
                                    </option>
                                  )
                                })}
                              </Select>
                              <SelectChevron
                                src={assets.chevronDown}
                                alt=""
                                width={24}
                                height={24}
                                aria-hidden
                              />
                            </SelectWrap>
                            {selectedOpt ? (
                              <CostHint>
                                Est. endorsement cost{' '}
                                <strong>
                                  {formatINR(
                                    estimatePurchaseOptionCost(selectedOpt),
                                  )}
                                </strong>
                              </CostHint>
                            ) : null}
                          </ControlField>
                        </>
                      ) : null}
                    </PolicyCard>
                  )
                }

                return group.options.map((opt) => {
                  const checked = chosen.includes(opt.id)
                  const status = eligibility.options[opt.id] ?? {
                    eligible: true,
                  }
                  const optionDisabled =
                    dealDisabled || (isSingleAdd && !status.eligible)
                  const cost = estimatePurchaseOptionCost(opt)
                  return (
                    <PolicyCard key={opt.id} $disabled={optionDisabled}>
                      <CardHeader>
                        <Checkbox
                          type="checkbox"
                          checked={checked}
                          disabled={optionDisabled}
                          aria-label={`Select ${opt.label}`}
                          onChange={() => {
                            if (optionDisabled) return
                            togglePurchaseGroupOption(
                              deal.id,
                              group.id,
                              opt.id,
                              group.selectMode,
                            )
                          }}
                        />
                        <LogoBox>
                          <LogoImg
                            src={assets.policyCardLoopIcon}
                            alt=""
                            width={34}
                            height={16}
                          />
                        </LogoBox>
                        <PolicyCopy>
                          <PolicyName>{opt.label}</PolicyName>
                          <MetaRow>
                            <span>{group.name} · Add-on</span>
                            <MetaDot aria-hidden />
                            <span>{formatINR(cost)}</span>
                          </MetaRow>
                          {optionDisabled && status.reason ? (
                            <DisabledReason>{status.reason}</DisabledReason>
                          ) : null}
                        </PolicyCopy>
                      </CardHeader>
                    </PolicyCard>
                  )
                })
              })}
            </PolicyList>
          </DealBlock>
        )
      })}
    </WizardChrome>
  )
}

const SectionTitle = styled.h2`
  margin: 8px 0 0;
  font-size: 16px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.beyondGrey};
`

const PolicyList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const PolicyCard = styled.div<{ $disabled: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
  padding: 24px;
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.surface1};
  border: 1px solid ${({ theme }) => theme.colors.defaultBorder};
  box-sizing: border-box;
  opacity: ${({ $disabled }) => ($disabled ? 0.65 : 1)};

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    gap: 16px;
    padding: 16px;
  }
`

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
  min-width: 0;

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    align-items: flex-start;
    gap: 10px;
  }
`

const Checkbox = styled.input`
  width: 24px;
  height: 24px;
  margin: 0;
  flex-shrink: 0;
  accent-color: ${({ theme }) => theme.colors.emerald};
  cursor: pointer;

  &:disabled {
    cursor: not-allowed;
  }
`

const LogoBox = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  border-radius: 8px;
  overflow: hidden;
  background: linear-gradient(180deg, #35793c 0%, #01362a 100%);
  box-sizing: border-box;
`

const LogoImg = styled.img`
  width: 34px;
  height: 16px;
  object-fit: contain;
  display: block;
`

const PolicyCopy = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
`

const PolicyName = styled.div`
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const MetaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 400;
  line-height: 18px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const PolicyNo = styled.span`
  font-weight: 500;
`

const MetaDot = styled.span`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.defaultBorder};
  flex-shrink: 0;
`

const DisabledReason = styled.span`
  font-size: 12px;
  line-height: 16px;
  color: ${({ theme }) => theme.colors.textError};
`

const Divider = styled.div`
  width: 100%;
  height: 1px;
  background: ${({ theme }) => theme.colors.defaultBorder};
  flex-shrink: 0;
`

const ControlField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  max-width: 560px;
`

const TierLabel = styled.label`
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const Required = styled.span`
  color: ${({ theme }) => theme.colors.textError};
`

const SelectWrap = styled.div`
  position: relative;
  width: 100%;
`

const Select = styled.select`
  width: 100%;
  height: 48px;
  padding: 12px 48px 12px 20px;
  border: 1px solid ${({ theme }) => theme.colors.defaultBorder};
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme }) => theme.colors.surface1};
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textPrimary};
  appearance: none;
  cursor: pointer;
  box-sizing: border-box;

  &:disabled {
    background: ${({ theme }) => theme.colors.disableFill};
    color: ${({ theme }) => theme.colors.textSecondary};
    cursor: not-allowed;
  }
`

const SelectChevron = styled.img`
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 24px;
  pointer-events: none;
`

const CostHint = styled.p`
  margin: 0;
  font-size: 12px;
  line-height: 16px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textSecondary};

  strong {
    font-weight: 600;
    color: ${({ theme }) => theme.colors.emerald};
  }
`

const DealBlock = styled.div<{ $disabled: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 12px;
  opacity: ${({ $disabled }) => ($disabled ? 0.45 : 1)};
  pointer-events: ${({ $disabled }) => ($disabled ? 'none' : 'auto')};
`
