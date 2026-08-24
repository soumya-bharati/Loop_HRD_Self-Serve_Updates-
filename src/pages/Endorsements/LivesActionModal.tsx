import { useEffect, useState, type ReactNode } from 'react'
import styled from 'styled-components'

import { assets } from '@/assets/figma'
import { InsurerShareBanner } from '@/pages/Endorsements/InsurerShareBanner'
import type { LifeMethod } from '@/pages/LivesWizard/WizardContext'

export type LifeAction = 'add' | 'edit' | 'delete'

interface LivesActionModalProps {
  open: boolean
  onClose: () => void
  onConfirm: (action: LifeAction, method: LifeMethod) => void
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

  useEffect(() => {
    if (!open) {
      setStep('action')
      setAction(null)
      setSelectedMethod(null)
    }
  }, [open])

  if (!open) return null

  const options = action ? methodOptions(action) : []
  const canProceed = Boolean(selectedMethod)

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
          <OptionsRow>
            {ACTION_OPTIONS.map((option) => (
              <OptionCard
                key={option.id}
                type="button"
                onClick={() => {
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
        ) : (
          <>
            <OptionsRow $count={options.length} $noBottomPad>
              {options.map((option) => (
                <OptionCard
                  key={option.id}
                  type="button"
                  $selected={selectedMethod === option.id}
                  onClick={() => setSelectedMethod(option.id)}
                >
                  <OptionIcon src={option.icon} alt="" width={48} height={48} />
                  <TextGroup>
                    <OptionTitle>{option.title}</OptionTitle>
                    <OptionDescription>{option.description}</OptionDescription>
                  </TextGroup>
                </OptionCard>
              ))}
            </OptionsRow>

            <Footer>
              <FooterRow>
                <BackButton
                  type="button"
                  onClick={() => {
                    setStep('action')
                    setAction(null)
                    setSelectedMethod(null)
                  }}
                >
                  Go Back
                </BackButton>
                <ProceedButton
                  type="button"
                  disabled={!canProceed}
                  onClick={() => {
                    if (!action || !selectedMethod) return
                    onConfirm(action, selectedMethod)
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
  background: ${({ theme }) => theme.colors.surface1};
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 24px;
  overflow: hidden;
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
  white-space: nowrap;
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

const OptionCard = styled.button<{ $selected?: boolean }>`
  flex: 1;
  min-width: 0;
  height: 200px;
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
