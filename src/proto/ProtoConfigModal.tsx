import { useEffect } from 'react'
import styled from 'styled-components'

import { assets } from '@/assets/figma'
import {
  useProtoConfig,
  type ProtoCardinality,
} from '@/proto/ProtoConfigContext'

const MODE_OPTIONS: { id: ProtoCardinality; label: string }[] = [
  { id: 'single', label: 'Single' },
  { id: 'multiple', label: 'Multiple' },
]

export function ProtoConfigModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const {
    allEntities,
    allDeals,
    entities,
    deals,
    entityMode,
    dealMode,
    setEntityMode,
    setDealMode,
    toggleEntity,
    toggleDeal,
    selectOnlyEntity,
    selectOnlyDeal,
    reset,
  } = useProtoConfig()

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const selectedEntityIds = new Set(entities.map((entity) => entity.id))
  const selectedDealIds = new Set(deals.map((deal) => deal.id))

  return (
    <Overlay role="presentation" onClick={onClose}>
      <Dialog
        role="dialog"
        aria-modal="true"
        aria-labelledby="proto-config-title"
        onClick={(event) => event.stopPropagation()}
      >
        <Header>
          <HeaderText>
            <Title id="proto-config-title">Prototype controls</Title>
            <Subtitle>
              Shape the account this prototype pretends to be. Changes apply to
              the Add / Edit / Delete Lives flow straight away.
            </Subtitle>
          </HeaderText>
          <CloseButton type="button" aria-label="Close" onClick={onClose}>
            <img src={assets.modalDismiss} alt="" width={16} height={16} />
          </CloseButton>
        </Header>

        <Section>
          <SectionHead>
            <SectionTitle>Company entities</SectionTitle>
            <ModeSwitch role="group" aria-label="Number of entities">
              {MODE_OPTIONS.map((option) => (
                <ModeButton
                  key={option.id}
                  type="button"
                  $active={entityMode === option.id}
                  aria-pressed={entityMode === option.id}
                  onClick={() => setEntityMode(option.id)}
                >
                  {option.label}
                </ModeButton>
              ))}
            </ModeSwitch>
          </SectionHead>
          <SectionHint>
            {entityMode === 'single'
              ? 'One legal entity — the lives modal shows it as fixed context instead of a picker.'
              : 'Several legal entities — HR must pick one before starting a lives action.'}
          </SectionHint>
          <Options>
            {allEntities.map((entity) => {
              const selected = selectedEntityIds.has(entity.id)
              return (
                <Option
                  key={entity.id}
                  type="button"
                  $selected={selected}
                  aria-pressed={selected}
                  onClick={() =>
                    entityMode === 'single'
                      ? selectOnlyEntity(entity.id)
                      : toggleEntity(entity.id)
                  }
                >
                  <Marker $selected={selected} $round={entityMode === 'single'}>
                    {selected ? <Tick aria-hidden>✓</Tick> : null}
                  </Marker>
                  <OptionName>{entity.name}</OptionName>
                </Option>
              )
            })}
          </Options>
        </Section>

        <Section>
          <SectionHead>
            <SectionTitle>Flex deals</SectionTitle>
            <ModeSwitch role="group" aria-label="Number of deals">
              {MODE_OPTIONS.map((option) => (
                <ModeButton
                  key={option.id}
                  type="button"
                  $active={dealMode === option.id}
                  aria-pressed={dealMode === option.id}
                  onClick={() => setDealMode(option.id)}
                >
                  {option.label}
                </ModeButton>
              ))}
            </ModeSwitch>
          </SectionHead>
          <SectionHint>
            {dealMode === 'single'
              ? 'One active deal — it is auto-selected and the deal choice is skipped.'
              : 'Several active deals — HR chooses which deal the addition belongs to.'}
          </SectionHint>
          <Options>
            {allDeals.map((deal) => {
              const selected = selectedDealIds.has(deal.id)
              return (
                <Option
                  key={deal.id}
                  type="button"
                  $selected={selected}
                  aria-pressed={selected}
                  onClick={() =>
                    dealMode === 'single'
                      ? selectOnlyDeal(deal.id)
                      : toggleDeal(deal.id)
                  }
                >
                  <Marker $selected={selected} $round={dealMode === 'single'}>
                    {selected ? <Tick aria-hidden>✓</Tick> : null}
                  </Marker>
                  <OptionName>
                    {deal.name}
                    <OptionMeta>
                      {deal.periodLabel} · {deal.benefits.length} coverages
                    </OptionMeta>
                  </OptionName>
                </Option>
              )
            })}
          </Options>
        </Section>

        <Footer>
          <ResetButton type="button" onClick={reset}>
            Reset to defaults
          </ResetButton>
          <DoneButton type="button" onClick={onClose}>
            Done
          </DoneButton>
        </Footer>
      </Dialog>
    </Overlay>
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
  background: rgba(45, 55, 72, 0.45);
`

const Dialog = styled.div`
  width: min(560px, 100%);
  max-height: min(90vh, 780px);
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 24px;
  border-radius: 16px;
  background: ${({ theme }) => theme.colors.surface1};
  box-shadow: 0 16px 48px rgba(16, 24, 40, 0.16);
  box-sizing: border-box;
  overflow: auto;
`

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
`

const HeaderText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
`

const Title = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  line-height: 24px;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const Subtitle = styled.p`
  margin: 0;
  font-size: 13px;
  font-weight: 400;
  line-height: 18px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const CloseButton = styled.button`
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  padding: 0;
  cursor: pointer;
  display: grid;
  place-items: center;
`

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border: 1px solid ${({ theme }) => theme.colors.disableFill};
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.surface0};
`

const SectionHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
`

const SectionTitle = styled.h3`
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const SectionHint = styled.p`
  margin: 0;
  font-size: 12px;
  font-weight: 400;
  line-height: 18px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const ModeSwitch = styled.div`
  display: inline-flex;
  flex-shrink: 0;
  padding: 2px;
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ theme }) => theme.colors.disableFill};
`

const ModeButton = styled.button<{ $active: boolean }>`
  min-width: 76px;
  height: 28px;
  padding: 0 14px;
  border: none;
  border-radius: ${({ theme }) => theme.radii.full};
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.2px;
  cursor: pointer;
  background: ${({ theme, $active }) =>
    $active ? theme.colors.emerald : 'transparent'};
  color: ${({ theme, $active }) =>
    $active ? theme.colors.textTertiary : theme.colors.textSecondary};
`

const Options = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const Option = styled.button<{ $selected: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 10px 12px;
  border: 1px solid
    ${({ theme, $selected }) =>
      $selected ? theme.colors.emerald : theme.colors.defaultBorder};
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme, $selected }) =>
    $selected ? theme.colors.planeGreenLight : theme.colors.surface1};
  font-family: ${({ theme }) => theme.fontFamily};
  text-align: left;
  cursor: pointer;
  box-sizing: border-box;
`

const Marker = styled.span<{ $selected: boolean; $round: boolean }>`
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  display: grid;
  place-items: center;
  border-radius: ${({ $round }) => ($round ? '50%' : '4px')};
  border: 1.5px solid
    ${({ theme, $selected }) =>
      $selected ? theme.colors.emerald : theme.colors.defaultBorder};
  background: ${({ theme, $selected }) =>
    $selected ? theme.colors.emerald : theme.colors.surface1};
`

const Tick = styled.span`
  font-size: 11px;
  line-height: 1;
  color: ${({ theme }) => theme.colors.textTertiary};
`

const OptionName = styled.span`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  font-size: 13px;
  font-weight: 500;
  line-height: 18px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const OptionMeta = styled.span`
  font-size: 11px;
  font-weight: 400;
  line-height: 16px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const Footer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
`

const ResetButton = styled.button`
  border: none;
  background: transparent;
  padding: 0;
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textSecondary};
  cursor: pointer;
  text-decoration: underline;
`

const DoneButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 120px;
  height: 40px;
  padding: 0 20px;
  border: none;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.fillGreen};
  color: ${({ theme }) => theme.colors.emerald};
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.2px;
  cursor: pointer;
`
