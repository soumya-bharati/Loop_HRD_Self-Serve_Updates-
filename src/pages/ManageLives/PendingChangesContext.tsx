import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import {
  employeeLifecycle,
  type EmployeeLifecycle,
  type PendingChange,
} from '@/pages/ManageLives/pendingChanges'

const STORAGE_KEY = 'loop-manage-lives-pending'

function readStored(): PendingChange[] {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as PendingChange[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeStored(items: PendingChange[]) {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    // Prototype cart — safe to lose if storage is blocked.
  }
}

interface PendingChangesValue {
  changes: PendingChange[]
  addChange: (change: PendingChange) => void
  removeChange: (id: string) => void
  clearChanges: () => void
  lifecycleFor: (employeeId: string, leavingDate?: string) => EmployeeLifecycle
}

const PendingChangesContext = createContext<PendingChangesValue | null>(null)

export function PendingChangesProvider({ children }: { children: ReactNode }) {
  const [changes, setChanges] = useState<PendingChange[]>(() => readStored())

  const persist = useCallback((next: PendingChange[]) => {
    setChanges(next)
    writeStored(next)
  }, [])

  const addChange = useCallback(
    (change: PendingChange) => {
      persist([...changes.filter((item) => item.id !== change.id), change])
    },
    [changes, persist],
  )

  const removeChange = useCallback(
    (id: string) => {
      persist(changes.filter((item) => item.id !== id))
    },
    [changes, persist],
  )

  const clearChanges = useCallback(() => persist([]), [persist])

  const lifecycleFor = useCallback(
    (employeeId: string, leavingDate?: string) => {
      const exit = [...changes]
        .reverse()
        .find((item) => {
          if (item.action !== 'employee_exit') return false
          const payload = item.payload as { employeeId?: string } | undefined
          return (
            item.employeeId === employeeId || payload?.employeeId === employeeId
          )
        })
      const date =
        (exit?.payload as { leavingDate?: string } | undefined)?.leavingDate ??
        exit?.effectiveDate ??
        leavingDate
      return employeeLifecycle(date)
    },
    [changes],
  )

  const value = useMemo(
    () => ({ changes, addChange, removeChange, clearChanges, lifecycleFor }),
    [changes, addChange, removeChange, clearChanges, lifecycleFor],
  )

  return (
    <PendingChangesContext.Provider value={value}>
      {children}
    </PendingChangesContext.Provider>
  )
}

export function usePendingChanges() {
  const ctx = useContext(PendingChangesContext)
  if (!ctx) {
    throw new Error('usePendingChanges must be used within PendingChangesProvider')
  }
  return ctx
}
