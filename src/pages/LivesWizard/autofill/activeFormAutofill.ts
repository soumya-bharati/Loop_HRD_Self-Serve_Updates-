import { useEffect, useSyncExternalStore } from 'react'

/**
 * A form that is currently on screen and owns its own draft state (for example
 * the employee onboarding overlay). Steps whose inputs live outside the wizard
 * context register here so Autofill targets what the user can actually see
 * instead of writing to a member further up the list.
 */
export interface ActiveFormAutofill {
  stepLabel: string
  hint: string
  run: (personaIndex: number) => string
}

let active: ActiveFormAutofill | null = null
const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function getSnapshot() {
  return active
}

/** Publishes `handler` while the calling component is mounted. */
export function useRegisterFormAutofill(handler: ActiveFormAutofill | null) {
  useEffect(() => {
    if (!handler) return
    active = handler
    emit()
    return () => {
      if (active !== handler) return
      active = null
      emit()
    }
  }, [handler])
}

export function useActiveFormAutofill() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}
