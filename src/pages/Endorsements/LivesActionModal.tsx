import { useEffect, useState, type ReactNode } from 'react'
import styled from 'styled-components'

import { assets } from '@/assets/figma'
import { SelectField } from '@/components/form/SelectField'
import { InsurerShareBanner } from '@/pages/Endorsements/InsurerShareBanner'
import { DealSelector } from '@/pages/LivesWizard/components/DealSelector'
import type { LifeMethod } from '@/pages/LivesWizard/WizardContext'
import { useProtoConfig } from '@/proto/ProtoConfigContext'

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
  const { entities, deals } = useProtoConfig()
  const [step, setStep] = useState<ModalStep>('action')
  const [action, setAction] = useState<LifeAction | null>(null)
  const [selectedMethod, setSelectedMethod] = useState<LifeMethod | null>(null)
  /** A lone entity needs no choosing; otherwise HR picks one before acting. */
  const impliedEntityId = entities.length === 1 ? entities[0]!.id : ''
  const [entityId, setEntityId] = useState(impliedEntityId)
  const [entityError, setEntityError] = useState(false)
  const [dealId, setDealId] = useState('')

  const singleEntity = entities.length === 1

  useEffect(() => {
    if (!open) {
      setStep('action')
      setAction(null)
      setSelectedMethod(null)
      setEntityError(false)
      setDealId('')
      return
    }
    setEntityId(impliedEntityId)
  }, [open, impliedEntityId])

  if (!open) return null

  const options = action ? methodOptions(action) : []
  const dealApplies = action === 'add' && selectedMethod === 'single'
  /** A lone deal is implicit — HR only picks when the account runs several. */
  const needsDeal = dealApplies && deals.length > 1
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
              {singleEntity ? (
                <EntityHint $muted>
                  Entity: <strong>{entities[0]?.name}</strong>
                </EntityHint>
              ) : (
                <>
                  <EntityLabel id="lives-entity-label">
                    Entity <RequiredMark aria-hidden>*</RequiredMark>
                  </EntityLabel>
                  <SelectField
                    id="lives-entity"
                    ariaLabelledBy="lives-entity-label"
                    value={entityId}
                    invalid={entityError}
                    placeholder="Select an entity"
                    options={entities.map((entity) => ({
                      value: entity.id,
                      label: entity.name,
                    }))}
                    onChange={(next) => {
                      setEntityId(next)
                      setEntityError(false)
                    }}
                  />
                  {entityError ? (
                    <EntityHint>
                      Select the entity this action is for.
                    </EntityHint>
                  ) : (
                    <EntityHint $muted>
                      {entityId
                        ? 'Lives will be added, edited, or deleted only for this entity.'
                        : 'Pick the entity first — then choose what you want to do.'}
                    </EntityHint>
                  )}
                </>
              )}
            </EntityField>
            <OptionsRow>
              {ACTION_OPTIONS.map((option) => (
                <OptionCard
                  key={option.id}
                  type="button"
                  $locked={!entityId}
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
                  {entities.find((entity) => entity.id === entityId)?.name}
                </strong>
              </EntityHint>
            </EntityField>
            <OptionsRow $count={options.length} $noBottomPad>
              {options.map((option) => (
                <OptionCard
                  key={option.id}
                  type="button"
                  $selected={selectedMethod === option.id}
                  $compact={needsDeal}
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
                      dealApplies ? dealId || undefined : undefined,
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
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;

  @media (max-width: 720px) {
    padding: 16px;
    align-items: flex-start;
  }

  @media (max-width: 560px) {
    padding: 12px;
  }
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
  -webkit-overflow-scrolling: touch;

  @media (max-width: 900px) {
    gap: 20px;
  }

  @media (max-width: 720px) {
    max-height: none;
    border-radius: 12px;
  }

  @media (max-width: 560px) {
    gap: 16px;
    border-radius: 10px;
  }
`

const Top = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 24px 24px 0;

  @media (max-width: 720px) {
    gap: 16px;
    padding: 20px 16px 0;
  }

  @media (max-width: 560px) {
    gap: 12px;
    padding: 16px 12px 0;
  }
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

  @media (max-width: 720px) {
    white-space: normal;
    overflow: visible;
    text-overflow: unset;
  }

  @media (max-width: 560px) {
    font-size: 16px;
    line-height: 22px;
  }
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

  @media (max-width: 720px) {
    padding: 0 16px;
  }

  @media (max-width: 560px) {
    padding: 0 12px;
  }
`

const EntityLabel = styled.span`
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const RequiredMark = styled.span`
  color: ${({ theme }) => theme.colors.textError};
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

  @media (max-width: 900px) {
    gap: 12px;
  }

  @media (max-width: 720px) {
    flex-direction: column;
    padding: 0 16px ${({ $noBottomPad }) => ($noBottomPad ? '0' : '16px')};
  }

  @media (max-width: 560px) {
    gap: 10px;
    padding: 0 12px ${({ $noBottomPad }) => ($noBottomPad ? '0' : '12px')};
  }
`

const DealBlock = styled.div`
  width: 100%;
  padding: 0 24px;
  box-sizing: border-box;

  @media (max-width: 720px) {
    padding: 0 16px;
  }

  @media (max-width: 560px) {
    padding: 0 12px;
  }
`

const OptionCard = styled.button<{
  $selected?: boolean
  $compact?: boolean
  $locked?: boolean
}>`
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
  opacity: ${({ $locked }) => ($locked ? 0.55 : 1)};
  transition: opacity 0.15s ease;

  @media (max-width: 720px) {
    flex: none;
    width: 100%;
    height: auto;
    min-height: ${({ $compact }) => ($compact ? '140px' : '160px')};
  }

  @media (max-width: 560px) {
    min-height: 0;
    padding: 14px;
    gap: 12px;
  }

  &:hover {
    border-color: ${({ theme, $locked }) =>
      $locked ? theme.colors.disableFill : theme.colors.emerald};
    background: ${({ theme, $locked }) =>
      $locked ? theme.colors.surface1 : theme.colors.planeGreenLight};
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

  @media (max-width: 720px) {
    padding: 16px;
  }

  @media (max-width: 560px) {
    padding: 12px;
  }
`

const FooterRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 16px;

  @media (max-width: 560px) {
    flex-direction: column-reverse;
    align-items: stretch;
    gap: 10px;
  }
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

  @media (max-width: 560px) {
    width: 100%;
  }
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

  @media (max-width: 560px) {
    width: 100%;
  }

  &:disabled {
    background: ${({ theme }) => theme.colors.disableFill};
    color: ${({ theme }) => theme.colors.textSecondary};
    cursor: not-allowed;
    box-shadow: ${({ theme }) => theme.shadows.smooth};
  }
`
