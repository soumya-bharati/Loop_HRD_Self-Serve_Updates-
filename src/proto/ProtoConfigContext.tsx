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

const STORAGE_KEY = 'loop-proto-config'

export type ProtoCardinality = 'single' | 'multiple'

interface StoredProtoConfig {
  entityIds: string[]
  dealIds: string[]
}

interface ProtoConfigValue {
  /** Every entity/deal the mock data ships with. */
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
  reset: () => void
}

const ProtoConfigContext = createContext<ProtoConfigValue | null>(null)

function readStored(): StoredProtoConfig | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<StoredProtoConfig>
    if (!Array.isArray(parsed.entityIds) || !Array.isArray(parsed.dealIds)) {
      return null
    }
    return { entityIds: parsed.entityIds, dealIds: parsed.dealIds }
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
  const allEntities = organisationEntities
  const allDeals = useMemo(() => listActiveDeals(), [])

  const [entityIds, setEntityIds] = useState<string[]>(() => {
    const stored = readStored()
    return sanitise(
      stored?.entityIds ?? allEntities.map((entity) => entity.id),
      allEntities,
    )
  })
  const [dealIds, setDealIds] = useState<string[]>(() => {
    const stored = readStored()
    return sanitise(stored?.dealIds ?? allDeals.map((deal) => deal.id), allDeals)
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ entityIds, dealIds }),
      )
    } catch {
      // Prototype-only preference — safe to lose when storage is unavailable.
    }
  }, [entityIds, dealIds])

  const entities = useMemo(
    () => allEntities.filter((entity) => entityIds.includes(entity.id)),
    [allEntities, entityIds],
  )
  const deals = useMemo(
    () => allDeals.filter((deal) => dealIds.includes(deal.id)),
    [allDeals, dealIds],
  )

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

  const reset = useCallback(() => {
    setEntityIds(allEntities.map((entity) => entity.id))
    setDealIds(allDeals.map((deal) => deal.id))
  }, [allEntities, allDeals])

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
