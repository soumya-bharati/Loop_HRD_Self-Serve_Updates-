import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import {
  organisationEntities,
  type OrganisationEntity,
} from '@/data/flexDeal'
import { listActiveDeals, type FlexDealConfig } from '@/domain/flex'
import {
  DEFAULT_PROTO_VERSION_ID,
  PROTO_VERSIONS,
  resolveProtoVersion,
  type ProtoVersion,
  type ProtoVersionId,
} from '@/proto/versions'

const STORAGE_KEY = 'loop-proto-config'

export type ProtoCardinality = 'single' | 'multiple'
export type ProtoValidationFlow = 'with-errors' | 'clean'
export type ProtoProgressCollapse = 'hidden' | 'shown'

const DEFAULT_VALIDATION_FLOW: ProtoValidationFlow = 'with-errors'
const DEFAULT_PROGRESS_COLLAPSE: ProtoProgressCollapse = 'hidden'

interface StoredProtoConfig {
  entityIds: string[]
  dealIds: string[]
  versionId?: string
  validationFlow?: ProtoValidationFlow
  progressCollapse?: ProtoProgressCollapse
  entitiesCatalog?: OrganisationEntity[]
  dealsCatalog?: FlexDealConfig[]
}

interface ProtoConfigValue {
  /** Every entity/deal currently available in the prototype. */
  allEntities: OrganisationEntity[]
  allDeals: FlexDealConfig[]
  /** What the prototype should behave as if the company actually has. */
  entities: OrganisationEntity[]
  deals: FlexDealConfig[]
  entityMode: ProtoCardinality
  dealMode: ProtoCardinality
  setEntityMode: (mode: ProtoCardinality) => void
  setDealMode: (mode: ProtoCardinality) => void
  toggleEntity: (id: string) => void
  toggleDeal: (id: string) => void
  selectOnlyEntity: (id: string) => void
  selectOnlyDeal: (id: string) => void
  addEntity: (name: string) => void
  updateEntity: (id: string, name: string) => void
  removeEntity: (id: string) => void
  addDeal: (name: string, periodLabel?: string) => void
  updateDeal: (id: string, patch: { name: string; periodLabel: string }) => void
  removeDeal: (id: string) => void
  /** Active prototype iteration — drives Manage Lives layouts. */
  versionId: ProtoVersionId
  version: ProtoVersion
  versions: ProtoVersion[]
  setVersionId: (id: ProtoVersionId) => void
  /** Whether bulk add/delete demos include validation recovery steps. */
  validationFlow: ProtoValidationFlow
  setValidationFlow: (flow: ProtoValidationFlow) => void
  includeValidationErrors: boolean
  /** Whether the bulk progress sidebar exposes a collapse control. */
  progressCollapse: ProtoProgressCollapse
  setProgressCollapse: (mode: ProtoProgressCollapse) => void
  allowProgressCollapse: boolean
  reset: () => void
}

const ProtoConfigContext = createContext<ProtoConfigValue | null>(null)

const seedEntities = (): OrganisationEntity[] =>
  organisationEntities.map((entity) => ({ ...entity }))

const seedDeals = (): FlexDealConfig[] =>
  listActiveDeals().map((deal) => structuredClone(deal))

function slugId(prefix: string, name: string) {
  const slug =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'item'
  return `${prefix}-${slug}-${Date.now().toString(36)}`
}

function isEntity(value: unknown): value is OrganisationEntity {
  if (!value || typeof value !== 'object') return false
  const item = value as OrganisationEntity
  return typeof item.id === 'string' && typeof item.name === 'string'
}

function isDeal(value: unknown): value is FlexDealConfig {
  if (!value || typeof value !== 'object') return false
  const item = value as FlexDealConfig
  return (
    typeof item.id === 'string' &&
    typeof item.name === 'string' &&
    Array.isArray(item.plans) &&
    Array.isArray(item.benefits)
  )
}

function resolveValidationFlow(value: unknown): ProtoValidationFlow {
  return value === 'clean' ? 'clean' : DEFAULT_VALIDATION_FLOW
}

function resolveProgressCollapse(value: unknown): ProtoProgressCollapse {
  return value === 'shown' ? 'shown' : DEFAULT_PROGRESS_COLLAPSE
}

function readStored(): StoredProtoConfig | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<StoredProtoConfig>
    if (!Array.isArray(parsed.entityIds) || !Array.isArray(parsed.dealIds)) {
      return null
    }
    return {
      entityIds: parsed.entityIds,
      dealIds: parsed.dealIds,
      versionId:
        typeof parsed.versionId === 'string' ? parsed.versionId : undefined,
      validationFlow: resolveValidationFlow(parsed.validationFlow),
      progressCollapse: resolveProgressCollapse(parsed.progressCollapse),
      entitiesCatalog: Array.isArray(parsed.entitiesCatalog)
        ? parsed.entitiesCatalog.filter(isEntity)
        : undefined,
      dealsCatalog: Array.isArray(parsed.dealsCatalog)
        ? parsed.dealsCatalog.filter(isDeal)
        : undefined,
    }
  } catch {
    return null
  }
}

/** Keeps pool order and guarantees at least one selection. */
function sanitise(ids: string[], pool: { id: string }[]) {
  const wanted = new Set(ids)
  const kept = pool.filter((item) => wanted.has(item.id)).map((item) => item.id)
  if (kept.length > 0) return kept
  const first = pool[0]?.id
  return first ? [first] : []
}

export function ProtoConfigProvider({ children }: { children: ReactNode }) {
  const [allEntities, setAllEntities] = useState<OrganisationEntity[]>(() => {
    const stored = readStored()
    return stored?.entitiesCatalog && stored.entitiesCatalog.length > 0
      ? stored.entitiesCatalog
      : seedEntities()
  })
  const [allDeals, setAllDeals] = useState<FlexDealConfig[]>(() => {
    const stored = readStored()
    return stored?.dealsCatalog && stored.dealsCatalog.length > 0
      ? stored.dealsCatalog
      : seedDeals()
  })

  const [entityIds, setEntityIds] = useState<string[]>(() => {
    const stored = readStored()
    const pool =
      stored?.entitiesCatalog && stored.entitiesCatalog.length > 0
        ? stored.entitiesCatalog
        : seedEntities()
    return sanitise(stored?.entityIds ?? pool.map((entity) => entity.id), pool)
  })
  const [dealIds, setDealIds] = useState<string[]>(() => {
    const stored = readStored()
    const pool =
      stored?.dealsCatalog && stored.dealsCatalog.length > 0
        ? stored.dealsCatalog
        : seedDeals()
    return sanitise(stored?.dealIds ?? pool.map((deal) => deal.id), pool)
  })
  const [versionId, setVersionIdState] = useState<ProtoVersionId>(() => {
    const stored = readStored()
    return resolveProtoVersion(stored?.versionId).id
  })
  const [validationFlow, setValidationFlowState] =
    useState<ProtoValidationFlow>(() => {
      const stored = readStored()
      return resolveValidationFlow(stored?.validationFlow)
    })
  const [progressCollapse, setProgressCollapseState] =
    useState<ProtoProgressCollapse>(() => {
      const stored = readStored()
      return resolveProgressCollapse(stored?.progressCollapse)
    })

  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          entityIds,
          dealIds,
          versionId,
          validationFlow,
          progressCollapse,
          entitiesCatalog: allEntities,
          dealsCatalog: allDeals,
        }),
      )
    } catch {
      // Prototype-only preference — safe to lose when storage is unavailable.
    }
  }, [
    entityIds,
    dealIds,
    versionId,
    validationFlow,
    progressCollapse,
    allEntities,
    allDeals,
  ])

  const entities = useMemo(
    () => allEntities.filter((entity) => entityIds.includes(entity.id)),
    [allEntities, entityIds],
  )
  const deals = useMemo(
    () => allDeals.filter((deal) => dealIds.includes(deal.id)),
    [allDeals, dealIds],
  )
  const version = useMemo(() => resolveProtoVersion(versionId), [versionId])

  const setVersionId = useCallback((id: ProtoVersionId) => {
    setVersionIdState(resolveProtoVersion(id).id)
  }, [])

  const setValidationFlow = useCallback((flow: ProtoValidationFlow) => {
    setValidationFlowState(resolveValidationFlow(flow))
  }, [])

  const setProgressCollapse = useCallback((mode: ProtoProgressCollapse) => {
    setProgressCollapseState(resolveProgressCollapse(mode))
  }, [])

  const setEntityMode = useCallback(
    (mode: ProtoCardinality) => {
      setEntityIds((current) =>
        mode === 'single'
          ? sanitise(current.slice(0, 1), allEntities)
          : allEntities.map((entity) => entity.id),
      )
    },
    [allEntities],
  )

  const setDealMode = useCallback(
    (mode: ProtoCardinality) => {
      setDealIds((current) =>
        mode === 'single'
          ? sanitise(current.slice(0, 1), allDeals)
          : allDeals.map((deal) => deal.id),
      )
    },
    [allDeals],
  )

  const toggleEntity = useCallback(
    (id: string) => {
      setEntityIds((current) => {
        if (current.length === 1 && current[0] === id) return current
        const next = current.includes(id)
          ? current.filter((entityId) => entityId !== id)
          : [...current, id]
        return sanitise(next, allEntities)
      })
    },
    [allEntities],
  )

  const toggleDeal = useCallback(
    (id: string) => {
      setDealIds((current) => {
        if (current.length === 1 && current[0] === id) return current
        const next = current.includes(id)
          ? current.filter((dealId) => dealId !== id)
          : [...current, id]
        return sanitise(next, allDeals)
      })
    },
    [allDeals],
  )

  const selectOnlyEntity = useCallback(
    (id: string) => {
      setEntityIds(sanitise([id], allEntities))
    },
    [allEntities],
  )

  const selectOnlyDeal = useCallback(
    (id: string) => {
      setDealIds(sanitise([id], allDeals))
    },
    [allDeals],
  )

  const addEntity = useCallback((name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return
    const entity: OrganisationEntity = {
      id: slugId('entity', trimmed),
      name: trimmed,
    }
    setAllEntities((current) => [...current, entity])
    setEntityIds((current) =>
      current.length <= 1 ? [entity.id] : [...current, entity.id],
    )
  }, [])

  const updateEntity = useCallback((id: string, name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return
    setAllEntities((current) =>
      current.map((entity) =>
        entity.id === id ? { ...entity, name: trimmed } : entity,
      ),
    )
  }, [])

  const removeEntity = useCallback((id: string) => {
    setAllEntities((current) => {
      if (current.length <= 1) return current
      const next = current.filter((entity) => entity.id !== id)
      setEntityIds((selected) => sanitise(selected, next))
      return next
    })
  }, [])

  const addDeal = useCallback((name: string, periodLabel?: string) => {
    const trimmed = name.trim()
    if (!trimmed) return
    setAllDeals((current) => {
      const template = current[0] ?? seedDeals()[0]
      if (!template) return current
      const deal: FlexDealConfig = {
        ...structuredClone(template),
        id: slugId('deal', trimmed),
        name: trimmed,
        periodLabel: periodLabel?.trim() || template.periodLabel,
        status: 'active',
      }
      setDealIds((selected) =>
        selected.length <= 1 ? [deal.id] : [...selected, deal.id],
      )
      return [...current, deal]
    })
  }, [])

  const updateDeal = useCallback(
    (id: string, patch: { name: string; periodLabel: string }) => {
      const name = patch.name.trim()
      const periodLabel = patch.periodLabel.trim()
      if (!name) return
      setAllDeals((current) =>
        current.map((deal) =>
          deal.id === id
            ? {
                ...deal,
                name,
                periodLabel: periodLabel || deal.periodLabel,
              }
            : deal,
        ),
      )
    },
    [],
  )

  const removeDeal = useCallback((id: string) => {
    setAllDeals((current) => {
      if (current.length <= 1) return current
      const next = current.filter((deal) => deal.id !== id)
      setDealIds((selected) => sanitise(selected, next))
      return next
    })
  }, [])

  const reset = useCallback(() => {
    const entitiesSeed = seedEntities()
    const dealsSeed = seedDeals()
    setAllEntities(entitiesSeed)
    setAllDeals(dealsSeed)
    setEntityIds(entitiesSeed.map((entity) => entity.id))
    setDealIds(dealsSeed.map((deal) => deal.id))
    setVersionIdState(DEFAULT_PROTO_VERSION_ID)
    setValidationFlowState(DEFAULT_VALIDATION_FLOW)
    setProgressCollapseState(DEFAULT_PROGRESS_COLLAPSE)
  }, [])

  const value = useMemo<ProtoConfigValue>(
    () => ({
      allEntities,
      allDeals,
      entities,
      deals,
      entityMode: entities.length > 1 ? 'multiple' : 'single',
      dealMode: deals.length > 1 ? 'multiple' : 'single',
      setEntityMode,
      setDealMode,
      toggleEntity,
      toggleDeal,
      selectOnlyEntity,
      selectOnlyDeal,
      addEntity,
      updateEntity,
      removeEntity,
      addDeal,
      updateDeal,
      removeDeal,
      versionId,
      version,
      versions: PROTO_VERSIONS,
      setVersionId,
      validationFlow,
      setValidationFlow,
      includeValidationErrors: validationFlow === 'with-errors',
      progressCollapse,
      setProgressCollapse,
      allowProgressCollapse: progressCollapse === 'shown',
      reset,
    }),
    [
      allEntities,
      allDeals,
      entities,
      deals,
      setEntityMode,
      setDealMode,
      toggleEntity,
      toggleDeal,
      selectOnlyEntity,
      selectOnlyDeal,
      addEntity,
      updateEntity,
      removeEntity,
      addDeal,
      updateDeal,
      removeDeal,
      versionId,
      version,
      setVersionId,
      validationFlow,
      setValidationFlow,
      progressCollapse,
      setProgressCollapse,
      reset,
    ],
  )

  return (
    <ProtoConfigContext.Provider value={value}>
      {children}
    </ProtoConfigContext.Provider>
  )
}

export function useProtoConfig() {
  const ctx = useContext(ProtoConfigContext)
  if (!ctx) {
    throw new Error('useProtoConfig must be used within ProtoConfigProvider')
  }
  return ctx
}
