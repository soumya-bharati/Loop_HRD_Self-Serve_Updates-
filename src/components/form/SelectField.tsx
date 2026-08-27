import { useEffect, useId, useRef, useState } from 'react'
import styled from 'styled-components'

import { assets } from '@/assets/figma'

export interface SelectFieldOption {
  value: string
  label: string
}

export function SelectField({
  id,
  value,
  options,
  onChange,
  placeholder = 'Select an option',
  invalid = false,
  ariaLabelledBy,
}: {
  id?: string
  value: string
  options: SelectFieldOption[]
  onChange: (value: string) => void
  placeholder?: string
  invalid?: boolean
  ariaLabelledBy?: string
}) {
  const generatedId = useId()
  const listId = `${id ?? generatedId}-list`
  const wrapRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  const selectedIndex = options.findIndex((option) => option.value === value)
  const selected = selectedIndex >= 0 ? options[selectedIndex] : undefined

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

  const openList = () => {
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0)
    setOpen(true)
  }

  const commit = (index: number) => {
    const option = options[index]
    if (!option) return
    onChange(option.value)
    setOpen(false)
  }

  /** Escape is swallowed while open so it closes the list, not the host modal. */
  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      if (!open) return
      event.stopPropagation()
      event.preventDefault()
      setOpen(false)
      return
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (!open) {
        openList()
        return
      }
      const step = event.key === 'ArrowDown' ? 1 : -1
      setActiveIndex((current) => {
        const next = current + step
        if (next < 0) return options.length - 1
        if (next >= options.length) return 0
        return next
      })
      return
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (!open) {
        openList()
        return
      }
      commit(activeIndex)
    }
  }

  return (
    <Wrap ref={wrapRef} onKeyDown={onKeyDown}>
      <Trigger
        type="button"
        id={id}
        $invalid={invalid}
        $placeholder={!selected}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-labelledby={ariaLabelledBy}
        aria-invalid={invalid}
        onClick={() => (open ? setOpen(false) : openList())}
      >
        <TriggerLabel>{selected?.label ?? placeholder}</TriggerLabel>
        <Chevron src={assets.chevronDown} alt="" $open={open} aria-hidden />
      </Trigger>

      {open ? (
        <List id={listId} role="listbox" aria-activedescendant={`${listId}-${activeIndex}`}>
          {options.map((option, index) => (
            <Item
              key={option.value}
              id={`${listId}-${index}`}
              type="button"
              role="option"
              aria-selected={option.value === value}
              $active={index === activeIndex}
              $selected={option.value === value}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => commit(index)}
            >
              {option.label}
            </Item>
          ))}
        </List>
      ) : null}
    </Wrap>
  )
}

const Wrap = styled.div`
  position: relative;
  width: 100%;
`

const Trigger = styled.button<{ $invalid: boolean; $placeholder: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  height: 48px;
  padding: 12px 16px 12px 20px;
  border: 1px solid
    ${({ theme, $invalid }) =>
      $invalid ? theme.colors.textError : theme.colors.defaultBorder};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.surface1};
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  letter-spacing: 0.2px;
  color: ${({ theme, $placeholder }) =>
    $placeholder ? theme.colors.textSecondary : theme.colors.textPrimary};
  text-align: left;
  cursor: pointer;
  box-sizing: border-box;

  &:focus-visible {
    outline: 1px solid ${({ theme }) => theme.colors.emerald};
  }
`

const TriggerLabel = styled.span`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const Chevron = styled.img<{ $open: boolean }>`
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  transition: transform 0.15s ease;
  transform: rotate(${({ $open }) => ($open ? '180deg' : '0deg')});
`

const List = styled.div`
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  max-height: 240px;
  overflow-y: auto;
  border: 1px solid ${({ theme }) => theme.colors.defaultBorder};
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme }) => theme.colors.surface1};
  box-shadow: 0px -2px 8px 0px rgba(55, 65, 81, 0.06);
  box-sizing: border-box;
`

const Item = styled.button<{ $active: boolean; $selected: boolean }>`
  display: flex;
  align-items: center;
  width: 100%;
  padding: 12px 20px;
  border: none;
  background: ${({ theme, $active, $selected }) =>
    $active || $selected ? theme.colors.planeGreenLight : theme.colors.surface1};
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: 14px;
  font-weight: ${({ $selected }) => ($selected ? 500 : 400)};
  line-height: 20px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textPrimary};
  text-align: left;
  cursor: pointer;
  box-sizing: border-box;
`
