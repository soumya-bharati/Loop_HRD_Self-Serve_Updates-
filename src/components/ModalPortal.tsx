import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'

/**
 * Renders an overlay at the document root. Step containers animate with a
 * transform, which would otherwise make them the containing block for a
 * `position: fixed` overlay and pin the modal inside that one section.
 */
export function ModalPortal({ children }: { children: ReactNode }) {
  return createPortal(children, document.body)
}
