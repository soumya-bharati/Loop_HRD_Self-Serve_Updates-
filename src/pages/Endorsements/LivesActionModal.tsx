import { useEffect, useState, type ReactNode } from 'react'
import styled from 'styled-components'

import { assets } from '@/assets/figma'
import {
  getOrganisationEntity,
  organisationEntities,
} from '@/data/flexDeal'
import { listActiveDeals } from '@/domain/flex'
import { InsurerShareBanner } from '@/pages/Endorsements/InsurerShareBanner'
import { DealSelector } from '@/pages/LivesWizard/components/DealSelector'
import type { LifeMethod } from '@/pages/LivesWizard/WizardContext'

export type LifeAction = 'add' | 'edit' | 'delete'

interface LivesActionModalProps {
  open: boolean
  onClose: () => void
  onConfirm: (
    action: LifeAction,
    method: LifeMethod,
    entityId: string,
    dealId?: string,
  ) => void
}

type ModalStep = 'action' | 'method'

const ACTION_OPTIONS: {
  id: LifeAction
  title: string
  description: ReactNode
  icon: string
}[] = [
  {
    id: 'add',
    title: 'Add Lives',
    description: (
      <>
        Add multiple employees or dependants through{' '}
        <strong>excel upload</strong>
      </>
    ),
    icon: assets.modalIconAdd,
  },
  {
    id: 'edit',
    title: 'Edit Lives',
    description:
      'Edit the details of a single employee or dependant from the dashboard',
    icon: assets.modalIconEdit,
  },
  {
    id: 'delete',
    title: 'Delete Lives',
    description:
      'Delete employees and dependants from the dashboard or through excel',
    icon: assets.modalIconDelete,
  },
]

function methodOptions(action: LifeAction): {
  id: LifeMethod
  title: string
  description: string
  icon: string
}[] {
  if (action === 'add') {
    return [
      {
        id: 'single',
        title: 'Add new employee(s)',
        description: 'Add an employee along with their dependants',
        icon: assets.modalIconSingle,
      },
      {
        id: 'single-dependant',
        title: 'Add new dependant',
        description:
          'Add a spouse, child, or other dependant for an existing employee',
        icon: assets.modalIconDependant,
      },
    ]
  }

  if (action === 'edit') {
    return [
      {
        id: 'single',
        title: 'Edit single employee',
        description:
          'Edit the details of a single employee from the dashboard',
        icon: assets.modalIconSingle,
      },
      {
        id: 'single-dependant',
        title: 'Edit single dependant',
        description: 'Edit a dependant linked to an existing employee',
        icon: assets.modalIconDependant,
      },
    ]
  }

  return [
    {
      id: 'single',
      title: 'Delete a single employee',
      description:
        'Delete a single employee and their dependants from the dashboard',
      icon: assets.modalIconDeleteSingle,
    },
    {
      id: 'bulk',
      title: 'Bulk delete lives',
      description:
        'Delete multiple employees and their dependants using excel',
      icon: assets.modalIconDeleteBulk,
    },
  ]
}

function methodTitle(action: LifeAction) {
  if (action === 'add') return 'How would you like to add lives today?'
  if (action === 'edit') return 'How would you like to edit lives today?'
  return 'How would you like to delete lives today?'
}

export function LivesActionModal({
  open,
  onClose,
  onConfirm,
}: LivesActionModalProps) {
  const [step, setStep] = useState<ModalStep>('action')
  const [action, setAction] = useState<LifeAction | null>(null)
  const [selectedMethod, setSelectedMethod] = useState<LifeMethod | null>(null)
  const [entityId, setEntityId] = useState(
    () => organisationEntities[0]?.id ?? '',
  )
  const [entityError, setEntityError] = useState(false)
  const [dealId, setDealId] = useState('')

  const deals = listActiveDeals()

  useEffect(() => {
    if (!open) {
      setStep('action')
      setAction(null)
      setSelectedMethod(null)
      setEntityError(false)
      setDealId('')
      return
    }
    setEntityId((current) => getOrganisationEntity(current).id)
  }, [open])

  if (!open) return null

  const options = action ? methodOptions(action) : []
  const needsDeal = action === 'add' && selectedMethod === 'single'
  const canProceed = Boolean(selectedMethod) && (!needsDeal || Boolean(dealId))

  return (
    <Overlay
      role="presentation"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key !== 'Escape') return
        if (step === 'method') {
          setStep('action')
          setAction(null)
          setSelectedMethod(null)
        } else {
          onClose()
        }
      }}
    >
      <Dialog
        role="dialog"
        aria-modal="true"
        aria-labelledby="lives-action-title"
        onClick={(e) => e.stopPropagation()}
        $method={step === 'method'}
      >
        <Top>
          <Header>
            <Title id="lives-action-title">
              {step === 'action'
                ? 'Hi! Would you like to add, edit or delete lives today?'
                : methodTitle(action!)}
            </Title>
            <CloseButton type="button" aria-label="Close" onClick={onClose}>
              <DismissIcon aria-hidden>
                <img src={assets.modalDismiss} alt="" width={13} height={13} />
              </DismissIcon>
            </CloseButton>
          </Header>
          <InsurerShareBanner />
        </Top>

        {step === 'action' ? (
          <>
            <EntityField>
              <EntityLabel htmlFor="lives-entity">
                Entity <RequiredMark aria-hidden>*</RequiredMark>
              </EntityLabel>
              <SelectWrap>
                <EntitySelect
                  id="lives-entity"
                  value={entityId}
                  $invalid={entityError}
                  aria-invalid={entityError}
                  aria-required="true"
                  onChange={(event) => {
                    setEntityId(event.target.value)
                    setEntityError(false)
                  }}
                >
                  {organisationEntities.map((entity) => (
                    <option key={entity.id} value={entity.id}>
                      {entity.name}
                    </option>
                  ))}
                </EntitySelect>
                <SelectChevron src={assets.chevronDown} alt="" />
              </SelectWrap>
              {entityError ? (
                <EntityHint>Select the entity this action is for.</EntityHint>
              ) : (
                <EntityHint $muted>
                  Lives will be added, edited, or deleted only for this entity.
                </EntityHint>
              )}
            </EntityField>
            <OptionsRow>
              {ACTION_OPTIONS.map((option) => (
                <OptionCard
                  key={option.id}
                  type="button"
                  onClick={() => {
                    if (!entityId) {
                      setEntityError(true)
                      return
                    }
                    setAction(option.id)
                    setSelectedMethod(null)
                    setStep('method')
                  }}
                >
                  <OptionIcon src={option.icon} alt="" width={48} height={48} />
                  <TextGroup>
                    <OptionTitle>{option.title}</OptionTitle>
                    <OptionDescription>{option.description}</OptionDescription>
                  </TextGroup>
                </OptionCard>
              ))}
            </OptionsRow>
          </>
        ) : (
          <>
            <EntityField>
              <EntityHint $muted>
                Entity:{' '}
                <strong>
                  {organisationEntities.find((entity) => entity.id === entityId)
                    ?.name}
                </strong>
              </EntityHint>
            </EntityField>
            <OptionsRow $count={options.length} $noBottomPad>
              {options.map((option) => (
                <OptionCard
                  key={option.id}
                  type="button"
                  $selected={selectedMethod === option.id}
                  $compact={Boolean(action === 'add' && selectedMethod === 'single')}
                  onClick={() => {
                    setSelectedMethod(option.id)
                    if (action === 'add' && option.id === 'single') {
                      if (deals.length === 1) setDealId(deals[0]!.id)
                    } else {
                      setDealId('')
                    }
                  }}
                >
                  <OptionIcon src={option.icon} alt="" width={48} height={48} />
                  <TextGroup>
                    <OptionTitle>{option.title}</OptionTitle>
                    <OptionDescription>{option.description}</OptionDescription>
                  </TextGroup>
                </OptionCard>
              ))}
            </OptionsRow>

            {needsDeal ? (
              <DealBlock>
                <DealSelector
                  deals={deals}
                  value={dealId || null}
                  onChange={setDealId}
                  embedded
                />
              </DealBlock>
            ) : null}

            <Footer>
              <FooterRow>
                <BackButton
                  type="button"
                  onClick={() => {
                    setStep('action')
                    setAction(null)
                    setSelectedMethod(null)
                    setDealId('')
                  }}
                >
                  Go Back
                </BackButton>
                <ProceedButton
                  type="button"
                  disabled={!canProceed}
                  onClick={() => {
                    if (!action || !selectedMethod || !entityId) return
                    if (needsDeal && !dealId) return
                    onConfirm(
                      action,
                      selectedMethod,
                      entityId,
                      needsDeal ? dealId : undefined,
                    )
                  }}
                >
                  Proceed
                </ProceedButton>
              </FooterRow>
            </Footer>
          </>
        )}
      </Dialog>
    </Overlay>
  )
}

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(45, 55, 72, 0.45);
`

const Dialog = styled.div<{ $method?: boolean }>`
  width: min(800px, 100%);
  max-height: min(90vh, 860px);
  background: ${({ theme }) => theme.colors.surface1};
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 24px;
  overflow: auto;
  box-shadow: 0 16px 48px rgba(16, 24, 40, 0.16);
`

const Top = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 24px 24px 0;
`

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
`

const Title = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  line-height: 24px;
  color: ${({ theme }) => theme.colors.textPrimary};
  overflow: hidden;
  text-overflow: ellipsis;
`

const CloseButton = styled.button`
  border: none;
  background: transparent;
  padding: 0;
  width: 24px;
  height: 24px;
  cursor: pointer;
  flex-shrink: 0;
  display: grid;
  place-items: center;
`

const DismissIcon = styled.span`
  position: relative;
  width: 24px;
  height: 24px;
  overflow: hidden;
  display: block;

  img {
    position: absolute;
    inset: 23.78%;
    width: auto;
    height: auto;
    max-width: none;
  }
`

const EntityField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  padding: 0 24px;
  box-sizing: border-box;
`

const EntityLabel = styled.label`
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const RequiredMark = styled.span`
  color: ${({ theme }) => theme.colors.textError};
`

const SelectWrap = styled.div`
  position: relative;
`

const EntitySelect = styled.select<{ $invalid?: boolean }>`
  width: 100%;
  height: 48px;
  padding: 12px 48px 12px 20px;
  border: 1px solid
    ${({ theme, $invalid }) =>
      $invalid ? theme.colors.textError : theme.colors.defaultBorder};
  border-radius: 12px;
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textPrimary};
  background: ${({ theme }) => theme.colors.surface1};
  appearance: none;
  cursor: pointer;
  box-sizing: border-box;

  &:focus {
    outline: 1px solid ${({ theme }) => theme.colors.emerald};
  }
`

const SelectChevron = styled.img`
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 24px;
  pointer-events: none;
`

const EntityHint = styled.p<{ $muted?: boolean }>`
  margin: 0;
  font-size: 12px;
  font-weight: 400;
  line-height: 16px;
  letter-spacing: 0.2px;
  color: ${({ theme, $muted }) =>
    $muted ? theme.colors.textSecondary : theme.colors.textError};

  strong {
    font-weight: 500;
    color: ${({ theme }) => theme.colors.textPrimary};
  }
`

const OptionsRow = styled.div<{ $count?: number; $noBottomPad?: boolean }>`
  display: flex;
  gap: 16px;
  width: 100%;
  padding: 0 24px ${({ $noBottomPad }) => ($noBottomPad ? '0' : '24px')};
  box-sizing: border-box;

  @media (max-width: 720px) {
    flex-direction: column;
  }
`

const DealBlock = styled.div`
  width: 100%;
  padding: 0 24px;
  box-sizing: border-box;
`

const OptionCard = styled.button<{ $selected?: boolean; $compact?: boolean }>`
  flex: 1;
  min-width: 0;
  height: ${({ $compact }) => ($compact ? '156px' : '200px')};
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
  padding: 16px;
  border: 1px solid
    ${({ theme, $selected }) =>
      $selected ? theme.colors.emerald : theme.colors.disableFill};
  border-radius: 12px;
  background: ${({ theme, $selected }) =>
    $selected ? theme.colors.planeGreenLight : theme.colors.surface1};
  text-align: left;
  cursor: pointer;
  font-family: ${({ theme }) => theme.fontFamily};
  box-sizing: border-box;

  &:hover {
    border-color: ${({ theme }) => theme.colors.emerald};
    background: ${({ theme }) => theme.colors.planeGreenLight};
  }
`

const OptionIcon = styled.img`
  width: 48px;
  height: 48px;
  display: block;
  object-fit: contain;
  flex-shrink: 0;
`

const TextGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
`

const OptionTitle = styled.span`
  font-size: 16px;
  font-weight: 500;
  line-height: 24px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const OptionDescription = styled.span`
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textSecondary};

  strong {
    font-weight: 600;
    color: ${({ theme }) => theme.colors.textPrimary};
  }
`

const Footer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  padding: 24px;
  border-top: 0.5px solid ${({ theme }) => theme.colors.defaultBorder};
  background: ${({ theme }) => theme.colors.surface1};
  box-sizing: border-box;
`

const FooterRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 16px;
`

const BackButton = styled.button`
  width: 180px;
  height: 48px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 14px 24px;
  border: 1px solid ${({ theme }) => theme.colors.emerald};
  border-radius: 12px;
  background: transparent;
  color: ${({ theme }) => theme.colors.emerald};
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  letter-spacing: 0.2px;
  cursor: pointer;
  box-shadow: ${({ theme }) => theme.shadows.smooth};
`

const ProceedButton = styled.button`
  width: 180px;
  height: 48px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 14px 24px;
  border: none;
  border-radius: 12px;
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  letter-spacing: 0.2px;
  cursor: pointer;
  background: ${({ theme }) => theme.colors.fillGreen};
  color: ${({ theme }) => theme.colors.emerald};
  box-shadow: ${({ theme }) => theme.shadows.smooth};

  &:disabled {
    background: ${({ theme }) => theme.colors.disableFill};
    color: ${({ theme }) => theme.colors.textSecondary};
    cursor: not-allowed;
    box-shadow: ${({ theme }) => theme.shadows.smooth};
  }
`
