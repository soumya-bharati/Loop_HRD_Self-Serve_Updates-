import { coverCatalog } from '@/data/coverPlans'
import {
  cdAccounts,
  getBenefitById,
  getCdAccount,
  getPlanById,
  isReadyToSubmit,
  selectablePolicies,
  type BulkMemberRow,
  type PolicyCostBreakdown,
} from '@/data/flexDeal'
import { dealCatalog } from '@/domain/flex/dealCatalog'

function benefitUnitCost(benefitId: string) {
  const fromDeal = dealCatalog
    .flatMap((deal) => deal.benefits)
    .find((benefit) => benefit.id === benefitId)
  if (fromDeal) return fromDeal.unitCost
  const cover = coverCatalog.find((item) => item.id === benefitId)
  if (cover) return cover.plans[0]?.unitCost ?? 0
  const policy = selectablePolicies.find((item) => item.id === benefitId)
  return policy?.baseUnitCost ?? 850
}

function resolvePolicy(id: string): Omit<
  PolicyCostBreakdown,
  'livesAdded' | 'endorsementCost'
> | null {
  const cover = coverCatalog.find((item) => item.id === id)
  if (cover) {
    const cd = getCdAccount(cover.cdAccountId)
    return {
      policyId: cover.id,
      policyName: cover.name,
      insurerName: cover.insurerName,
      insurerLogo: cover.insurerLogo,
      policyNumber: cover.policyNumber,
      cdAccountId: cover.cdAccountId,
      cdAccountName: cd?.name ?? 'CD',
      cdBalance: cd?.balance ?? 0,
    }
  }

  const policy = selectablePolicies.find((item) => item.id === id)
  if (policy) {
    const cd = getCdAccount(policy.cdAccountId)
    return {
      policyId: policy.id,
      policyName: policy.name,
      insurerName: policy.insurerName,
      insurerLogo: policy.logo,
      policyNumber: policy.policyNumber,
      cdAccountId: policy.cdAccountId,
      cdAccountName: cd?.name ?? 'CD',
      cdBalance: cd?.balance ?? 0,
    }
  }

  const legacy = getBenefitById(id)
  if (legacy) {
    const cdAccountId = cdAccountsFor(legacy.id) ?? 'cd-main'
    const cd = getCdAccount(cdAccountId)
    return {
      policyId: legacy.id,
      policyName: legacy.policyName || legacy.name,
      insurerName: legacy.insurerName,
      insurerLogo: legacy.insurerLogo,
      policyNumber: legacy.policyNumber,
      cdAccountId,
      cdAccountName: cd?.name ?? 'CD',
      cdBalance: cd?.balance ?? 0,
    }
  }

  for (const deal of dealCatalog) {
    const benefit = deal.benefits.find((item) => item.id === id)
    if (!benefit) continue
    const cdAccountId = benefit.cdAccountId ?? 'cd-main'
    const cd = getCdAccount(cdAccountId)
    return {
      policyId: benefit.id,
      policyName: benefit.policyName || benefit.name,
      insurerName: benefit.insurerName,
      insurerLogo: benefit.insurerLogo,
      policyNumber: benefit.policyNumber,
      cdAccountId,
      cdAccountName: cd?.name ?? 'CD',
      cdBalance: cd?.balance ?? 0,
    }
  }

  return null
}

function cdAccountsFor(policyId: string) {
  return cdAccounts.find((account) => account.policyIds.includes(policyId))?.id
}

function idsForRow(row: BulkMemberRow) {
  if (row.benefitIds.length > 0) return row.benefitIds
  const plan = row.assignedPlanId ? getPlanById(row.assignedPlanId) : null
  return plan?.benefitIds ?? []
}

/** Lives and cost per policy from the covers actually assigned on each life. */
export function assignedPolicyCosts(
  rows: BulkMemberRow[],
): PolicyCostBreakdown[] {
  const byPolicy = new Map<
    string,
    PolicyCostBreakdown & { lives: number; cost: number }
  >()

  for (const row of rows.filter(isReadyToSubmit)) {
    for (const id of idsForRow(row)) {
      const resolved = resolvePolicy(id)
      if (!resolved) continue
      const existing = byPolicy.get(resolved.policyId)
      const unit = benefitUnitCost(id)
      if (existing) {
        existing.lives += 1
        existing.cost += unit
        existing.livesAdded = existing.lives
        existing.endorsementCost = existing.cost
        continue
      }
      byPolicy.set(resolved.policyId, {
        ...resolved,
        lives: 1,
        cost: unit,
        livesAdded: 1,
        endorsementCost: unit,
      })
    }
  }

  return [...byPolicy.values()].map(
    ({ lives: _lives, cost: _cost, ...policy }) => policy,
  )
}

export interface PolicyCostGroup {
  key: string
  insurerName: string
  insurerLogo: PolicyCostBreakdown['insurerLogo']
  cdBalance: number
  policies: PolicyCostBreakdown[]
}

export function groupPolicyCosts(
  policies: PolicyCostBreakdown[],
): PolicyCostGroup[] {
  const groups = new Map<string, PolicyCostGroup>()
  for (const policy of policies) {
    if (policy.livesAdded <= 0) continue
    const key = `${policy.insurerName}::${policy.cdAccountId}`
    const existing = groups.get(key)
    if (existing) {
      existing.policies.push(policy)
      continue
    }
    groups.set(key, {
      key,
      insurerName: policy.insurerName,
      insurerLogo: policy.insurerLogo,
      cdBalance: policy.cdBalance,
      policies: [policy],
    })
  }
  return [...groups.values()]
}
