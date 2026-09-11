import { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'

import { assets } from '@/assets/figma'
import { ModalPortal } from '@/components/ModalPortal'
import {
  emptyDependantForm,
  type DependantFormData,
  type Gender,
} from '@/data/employees'
import { parseDateOnly } from '@/domain/flex'
import type { FamilyRelationship } from '@/domain/flex'
import {
  isDependantValid,
  relationshipProofLabel,
} from '@/pages/LivesWizard/addEmployees'
import { toDisplayDate } from '@/pages/LivesWizard/autofill/personas'

export function AddDependantModal({
  open,
  relationship,
  initial,
  requireRelationshipProof = false,
  onClose,
  onSave,
}: {
  open: boolean
  relationship: FamilyRelationship
  initial?: DependantFormData | null
  /** Spouse needs a marriage certificate; child needs a birth certificate. */
  requireRelationshipProof?: boolean
  onClose: () => void
  onSave: (dependant: DependantFormData) => void
}) {
  const proofInputRef = useRef<HTMLInputElement>(null)
  const [draft, setDraft] = useState<DependantFormData>(
    emptyDependantForm('draft'),
  )

  useEffect(() => {
    if (!open) return
    setDraft(
      initial
        ? { ...initial }
        : { ...emptyDependantForm('draft'), relationship },
    )
  }, [initial, open, relationship])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.stopPropagation()
      onClose()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [onClose, open])

  if (!open) return null

  const title = `${initial?.firstName ? 'Edit' : 'Add'} ${relationship.toLowerCase()}`
  const proofLabel = requireRelationshipProof
    ? relationshipProofLabel(relationship)
    : null
  const canSave =
    isDependantValid({ ...draft, relationship }) &&
    (!proofLabel || Boolean(draft.supportingDocumentName.trim()))
  const update = (patch: Partial<DependantFormData>) =>
    setDraft((current) => ({ ...current, ...patch }))

  return (
    <ModalPortal>
      <Overlay role="dialog" aria-modal="true" aria-label={title}>
        <Dialog>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <CloseButton type="button" aria-label="Close" onClick={onClose}>
              <img src={assets.modalDismiss} alt="" width={16} height={16} />
            </CloseButton>
          </DialogHeader>
          <Form>
            <Field>
              <Label>
                First Name<Required>*</Required>
              </Label>
              <Input
                value={draft.firstName}
                placeholder="Enter Here"
                onChange={(event) => update({ firstName: event.target.value })}
              />
            </Field>
            <Field>
              <Label>Last Name</Label>
              <Input
                value={draft.lastName}
                placeholder="Enter Here"
                onChange={(event) => update({ lastName: event.target.value })}
              />
            </Field>
            <Field>
              <Label>
                Date of Birth<Required>*</Required>
              </Label>
              <ModalDateInput
                value={draft.dateOfBirth}
                onChange={(dateOfBirth) => update({ dateOfBirth })}
              />
            </Field>
            <Field>
              <Label>
                Gender<Required>*</Required>
              </Label>
              <GenderRow>
                {(['Male', 'Female'] as const).map((gender) => (
                  <GenderPill
                    key={gender}
                    type="button"
                    $selected={draft.gender === gender}
                    onClick={() => update({ gender: gender as Gender })}
                  >
                    {gender}
                  </GenderPill>
                ))}
              </GenderRow>
            </Field>
            <Field>
              <Label>Mobile Number</Label>
              <PhoneField>
                <PhonePrefix>+91</PhonePrefix>
                <PhoneDivider />
                <PhoneInput
                  value={draft.mobile}
                  placeholder="Enter mobile number"
                  onChange={(event) => update({ mobile: event.target.value })}
                />
              </PhoneField>
            </Field>
            <Field>
              <Label>Email</Label>
              <Input
                type="email"
                value={draft.email}
                placeholder="Enter Here"
                onChange={(event) => update({ email: event.target.value })}
              />
            </Field>
            {proofLabel ? (
              <ProofField>
                <Label>
                  {proofLabel}
                  <Required>*</Required>
                </Label>
                <ProofDrop
                  type="button"
                  onClick={() => proofInputRef.current?.click()}
                >
                  {draft.supportingDocumentName.trim() ||
                    `Upload ${proofLabel} (PDF, JPG or PNG)`}
                  <input
                    ref={proofInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                    hidden
                    onChange={(event) => {
                      const file = event.target.files?.[0]
                      if (file) update({ supportingDocumentName: file.name })
                    }}
                  />
                </ProofDrop>
                <ProofHint>
                  This document is required for KYC before you can save this{' '}
                  {relationship.toLowerCase()}.
                </ProofHint>
              </ProofField>
            ) : null}
          </Form>
          <DialogFooter>
            <SaveButton
              type="button"
              disabled={!canSave}
              onClick={() =>
                onSave({
                  ...draft,
                  relationship,
                })
              }
            >
              {title}
            </SaveButton>
          </DialogFooter>
        </Dialog>
      </Overlay>
    </ModalPortal>
  )
}

function ModalDateInput({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const pickerRef = useRef<HTMLInputElement>(null)
  const parsed = parseDateOnly(value)
  const isoValue = parsed
    ? [
        `${parsed.year}`.padStart(4, '0'),
        `${parsed.month}`.padStart(2, '0'),
        `${parsed.day}`.padStart(2, '0'),
      ].join('-')
    : ''

  return (
    <DateField>
      <DateIcon src={assets.iconCalendar24} alt="" aria-hidden />
      <Input
        value={value}
        placeholder="Enter Date (DD-MM-YYYY)"
        onChange={(event) => onChange(event.target.value)}
      />
      <PickerTrigger
        type="button"
        aria-label="Choose date of birth"
        onClick={(event) => {
          event.preventDefault()
          try {
            pickerRef.current?.showPicker()
          } catch {
            /* typed entry still works */
          }
        }}
      />
      <NativeDatePicker
        ref={pickerRef}
        type="date"
        tabIndex={-1}
        aria-hidden
        value={isoValue}
        onChange={(event) => {
          if (!event.target.value) return
          onChange(toDisplayDate(event.target.value))
        }}
      />
    </DateField>
  )
}

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 400;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(17, 24, 39, 0.45);

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    align-items: flex-end;
    padding: 0;
  }
`

const Dialog = styled.div`
  display: flex;
  width: 640px;
  max-width: 100%;
  flex-direction: column;
  background: ${({ theme }) => theme.colors.surface1};
  border-radius: 16px;
  box-shadow: 0 16px 48px rgba(17, 24, 39, 0.18);
  max-height: calc(100dvh - 24px);
  overflow-y: auto;

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    width: 100%;
    max-height: 92dvh;
    border-radius: 16px 16px 0 0;
  }
`

const DialogHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.defaultBorder};

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    position: sticky;
    top: 0;
    z-index: 2;
    padding: 16px;
    background: ${({ theme }) => theme.colors.surface1};
  }
`

const DialogTitle = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  line-height: 24px;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const CloseButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
`

const Form = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px 16px;
  padding: 24px;

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-template-columns: 1fr;
    gap: 16px;
    padding: 16px;
  }
`

const Field = styled.label`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 8px;
`

const Label = styled.span`
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const Required = styled.span`
  color: ${({ theme }) => theme.colors.textError};
`

const Input = styled.input`
  width: 100%;
  height: 48px;
  padding: 12px 20px;
  border: 1px solid ${({ theme }) => theme.colors.defaultBorder};
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.surface1};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: 14px;
  box-sizing: border-box;

  &::placeholder {
    color: ${({ theme }) => theme.colors.textSecondary};
  }
`

const DateField = styled.div`
  position: relative;

  ${Input} {
    padding-left: 48px;
  }
`

const DateIcon = styled.img`
  position: absolute;
  top: 12px;
  left: 12px;
  width: 24px;
  height: 24px;
  pointer-events: none;
`

const PickerTrigger = styled.button`
  position: absolute;
  top: 0;
  left: 0;
  width: 48px;
  height: 48px;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
`

const NativeDatePicker = styled.input`
  position: absolute;
  left: 16px;
  bottom: 0;
  width: 1px;
  height: 1px;
  padding: 0;
  border: none;
  opacity: 0;
  pointer-events: none;
`

const GenderRow = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
`

const GenderPill = styled.button<{ $selected: boolean }>`
  height: 40px;
  padding: 0 20px;
  border: 1px solid
    ${({ theme, $selected }) =>
      $selected ? theme.colors.emerald : theme.colors.defaultBorder};
  border-radius: 999px;
  background: ${({ theme, $selected }) =>
    $selected ? theme.colors.planeGreenLight : theme.colors.surface1};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
`

const PhoneField = styled.div`
  display: flex;
  align-items: center;
  height: 48px;
  padding: 0 20px;
  border: 1px solid ${({ theme }) => theme.colors.defaultBorder};
  border-radius: 8px;
  box-sizing: border-box;
`

const PhonePrefix = styled.span`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const PhoneDivider = styled.span`
  width: 1px;
  height: 20px;
  margin: 0 12px;
  background: ${({ theme }) => theme.colors.defaultBorder};
`

const ProofField = styled(Field)`
  grid-column: 1 / -1;
`

const ProofDrop = styled.button`
  min-height: 48px;
  padding: 12px 16px;
  border: 1px dashed ${({ theme }) => theme.colors.defaultBorder};
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.surface1};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: 14px;
  text-align: left;
  cursor: pointer;
`

const ProofHint = styled.span`
  font-size: 12px;
  line-height: 16px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const PhoneInput = styled.input`
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.colors.textPrimary};
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: 14px;

  &:focus {
    outline: none;
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.textSecondary};
  }
`

const DialogFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  padding: 16px 24px 24px;
  border-top: 1px solid ${({ theme }) => theme.colors.defaultBorder};

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    position: sticky;
    bottom: 0;
    padding: 12px 16px max(16px, env(safe-area-inset-bottom));
    background: ${({ theme }) => theme.colors.surface1};
  }
`

const SaveButton = styled.button`
  height: 44px;
  padding: 0 24px;
  border: none;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.emerald};
  color: ${({ theme }) => theme.colors.textTertiary};
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;

  &:disabled {
    background: ${({ theme }) => theme.colors.disableFill};
    color: ${({ theme }) => theme.colors.surface1};
    cursor: not-allowed;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    width: 100%;
  }
`
