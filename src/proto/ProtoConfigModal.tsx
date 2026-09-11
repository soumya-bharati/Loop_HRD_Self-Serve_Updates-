import { useEffect, useState } from 'react'
import styled from 'styled-components'

import { assets } from '@/assets/figma'
import {
  useProtoConfig,
  type ProtoCardinality,
  type ProtoProgressCollapse,
  type ProtoValidationFlow,
} from '@/proto/ProtoConfigContext'

const MODE_OPTIONS: { id: ProtoCardinality; label: string }[] = [
  { id: 'single', label: 'Single' },
  { id: 'multiple', label: 'Multiple' },
]

const VALIDATION_FLOW_OPTIONS: {
  id: ProtoValidationFlow
  label: string
  hint: string
}[] = [
  {
    id: 'with-errors',
    label: 'With errors',
    hint: 'Shows unmapped columns and lives that need fixing or ignoring before final validation.',
  },
  {
    id: 'clean',
    label: 'No errors',
    hint: 'Happy path — columns map cleanly and every life passes straight to final validation.',
  },
]

const PROGRESS_COLLAPSE_OPTIONS: {
  id: ProtoProgressCollapse
  label: string
  hint: string
}[] = [
  {
    id: 'hidden',
    label: 'Hidden',
    hint: 'The bulk progress sidebar stays expanded with step titles. No collapse control.',
  },
  {
    id: 'shown',
    label: 'Shown',
    hint: 'Adds a control to collapse the bulk progress timeline to step icons.',
  },
]

type Editor =
  | { kind: 'entity'; mode: 'add' }
  | { kind: 'entity'; mode: 'edit'; id: string }
  | { kind: 'deal'; mode: 'add' }
  | { kind: 'deal'; mode: 'edit'; id: string }
  | null

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
    addEntity,
    updateEntity,
    removeEntity,
    addDeal,
    updateDeal,
    removeDeal,
    validationFlow,
    setValidationFlow,
    progressCollapse,
    setProgressCollapse,
    reset,
  } = useProtoConfig()

  const [editor, setEditor] = useState<Editor>(null)
  const [draftName, setDraftName] = useState('')
  const [draftPeriod, setDraftPeriod] = useState('')

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (!open) setEditor(null)
  }, [open])

  if (!open) return null

  const selectedEntityIds = new Set(entities.map((entity) => entity.id))
  const selectedDealIds = new Set(deals.map((deal) => deal.id))

  function startAdd(kind: 'entity' | 'deal') {
    setEditor({ kind, mode: 'add' })
    setDraftName(kind === 'entity' ? 'New company' : 'New flex deal')
    setDraftPeriod(allDeals[0]?.periodLabel ?? 'FY 2026–27')
  }

  function startEditEntity(id: string, name: string) {
    setEditor({ kind: 'entity', mode: 'edit', id })
    setDraftName(name)
  }

  function startEditDeal(id: string, name: string, periodLabel: string) {
    setEditor({ kind: 'deal', mode: 'edit', id })
    setDraftName(name)
    setDraftPeriod(periodLabel)
  }

  function saveEditor() {
    if (!editor) return
    if (editor.kind === 'entity') {
      if (editor.mode === 'add') addEntity(draftName)
      else updateEntity(editor.id, draftName)
    } else if (editor.mode === 'add') {
      addDeal(draftName, draftPeriod)
    } else {
      updateDeal(editor.id, { name: draftName, periodLabel: draftPeriod })
    }
    setEditor(null)
  }

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
              Shape the account this prototype pretends to be. Add, edit, or
              remove companies and deals — changes apply to the Add / Edit /
              Delete Lives flow straight away.
            </Subtitle>
          </HeaderText>
          <CloseButton type="button" aria-label="Close" onClick={onClose}>
            <img src={assets.modalDismiss} alt="" width={16} height={16} />
          </CloseButton>
        </Header>

        <Section>
          <SectionHead>
            <SectionTitle>Bulk validation flow</SectionTitle>
            <ModeSwitch role="group" aria-label="Bulk validation flow">
              {VALIDATION_FLOW_OPTIONS.map((option) => (
                <ModeButton
                  key={option.id}
                  type="button"
                  $active={validationFlow === option.id}
                  aria-pressed={validationFlow === option.id}
                  onClick={() => setValidationFlow(option.id)}
                >
                  {option.label}
                </ModeButton>
              ))}
            </ModeSwitch>
          </SectionHead>
          <SectionHint>
            {
              VALIDATION_FLOW_OPTIONS.find(
                (option) => option.id === validationFlow,
              )?.hint
            }
          </SectionHint>
        </Section>

        <Section>
          <SectionHead>
            <SectionTitle>Progress sidebar collapse</SectionTitle>
            <ModeSwitch role="group" aria-label="Progress sidebar collapse">
              {PROGRESS_COLLAPSE_OPTIONS.map((option) => (
                <ModeButton
                  key={option.id}
                  type="button"
                  $active={progressCollapse === option.id}
                  aria-pressed={progressCollapse === option.id}
                  onClick={() => setProgressCollapse(option.id)}
                >
                  {option.label}
                </ModeButton>
              ))}
            </ModeSwitch>
          </SectionHead>
          <SectionHint>
            {
              PROGRESS_COLLAPSE_OPTIONS.find(
                (option) => option.id === progressCollapse,
              )?.hint
            }
          </SectionHint>
        </Section>

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
              const editing =
                editor?.kind === 'entity' &&
                editor.mode === 'edit' &&
                editor.id === entity.id
              if (editing) {
                return (
                  <EditorRow key={entity.id}>
                    <EditorInput
                      autoFocus
                      value={draftName}
                      onChange={(event) => setDraftName(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') saveEditor()
                      }}
                      aria-label="Company name"
                    />
                    <TextAction type="button" onClick={saveEditor}>
                      Save
                    </TextAction>
                    <TextAction type="button" onClick={() => setEditor(null)}>
                      Cancel
                    </TextAction>
                  </EditorRow>
                )
              }
              return (
                <OptionRow key={entity.id}>
                  <Option
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
                  <RowActions>
                    <TextAction
                      type="button"
                      onClick={() => startEditEntity(entity.id, entity.name)}
                    >
                      Edit
                    </TextAction>
                    <TextAction
                      type="button"
                      $danger
                      disabled={allEntities.length <= 1}
                      onClick={() => removeEntity(entity.id)}
                    >
                      Delete
                    </TextAction>
                  </RowActions>
                </OptionRow>
              )
            })}
            {editor?.kind === 'entity' && editor.mode === 'add' ? (
              <EditorRow>
                <EditorInput
                  autoFocus
                  value={draftName}
                  onChange={(event) => setDraftName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') saveEditor()
                  }}
                  aria-label="New company name"
                />
                <TextAction type="button" onClick={saveEditor}>
                  Add
                </TextAction>
                <TextAction type="button" onClick={() => setEditor(null)}>
                  Cancel
                </TextAction>
              </EditorRow>
            ) : (
              <AddButton type="button" onClick={() => startAdd('entity')}>
                Add company
              </AddButton>
            )}
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
              const editing =
                editor?.kind === 'deal' &&
                editor.mode === 'edit' &&
                editor.id === deal.id
              if (editing) {
                return (
                  <EditorColumn key={deal.id}>
                    <EditorInput
                      autoFocus
                      value={draftName}
                      onChange={(event) => setDraftName(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') saveEditor()
                      }}
                      aria-label="Deal name"
                    />
                    <EditorInput
                      value={draftPeriod}
                      onChange={(event) => setDraftPeriod(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') saveEditor()
                      }}
                      aria-label="Deal period"
                    />
                    <EditorRow>
                      <TextAction type="button" onClick={saveEditor}>
                        Save
                      </TextAction>
                      <TextAction type="button" onClick={() => setEditor(null)}>
                        Cancel
                      </TextAction>
                    </EditorRow>
                  </EditorColumn>
                )
              }
              return (
                <OptionRow key={deal.id}>
                  <Option
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
                  <RowActions>
                    <TextAction
                      type="button"
                      onClick={() =>
                        startEditDeal(deal.id, deal.name, deal.periodLabel)
                      }
                    >
                      Edit
                    </TextAction>
                    <TextAction
                      type="button"
                      $danger
                      disabled={allDeals.length <= 1}
                      onClick={() => removeDeal(deal.id)}
                    >
                      Delete
                    </TextAction>
                  </RowActions>
                </OptionRow>
              )
            })}
            {editor?.kind === 'deal' && editor.mode === 'add' ? (
              <EditorColumn>
                <EditorInput
                  autoFocus
                  value={draftName}
                  onChange={(event) => setDraftName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') saveEditor()
                  }}
                  aria-label="New deal name"
                />
                <EditorInput
                  value={draftPeriod}
                  onChange={(event) => setDraftPeriod(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') saveEditor()
                  }}
                  aria-label="New deal period"
                />
                <EditorRow>
                  <TextAction type="button" onClick={saveEditor}>
                    Add
                  </TextAction>
                  <TextAction type="button" onClick={() => setEditor(null)}>
                    Cancel
                  </TextAction>
                </EditorRow>
              </EditorColumn>
            ) : (
              <AddButton type="button" onClick={() => startAdd('deal')}>
                Add deal
              </AddButton>
            )}
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
  -webkit-overflow-scrolling: touch;

  @media (max-width: 900px) {
    gap: 20px;
  }

  @media (max-width: 720px) {
    max-height: none;
    padding: 20px 16px;
    border-radius: 12px;
  }

  @media (max-width: 560px) {
    gap: 16px;
    padding: 16px 12px;
    border-radius: 10px;
  }
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

  @media (max-width: 720px) {
    flex-wrap: wrap;
    align-items: flex-start;
    gap: 10px;
  }

  @media (max-width: 560px) {
    flex-direction: column;
    align-items: stretch;
  }
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

  @media (max-width: 560px) {
    width: 100%;
    justify-content: stretch;
  }
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

  @media (max-width: 560px) {
    flex: 1;
    min-width: 0;
  }
`

const Options = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const OptionRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`

const Option = styled.button<{ $selected: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  flex: 1;
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

const RowActions = styled.div`
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 8px;
`

const EditorRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`

const EditorColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
  border: 1px solid ${({ theme }) => theme.colors.defaultBorder};
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme }) => theme.colors.surface1};
`

const EditorInput = styled.input`
  min-width: 0;
  flex: 1;
  height: 36px;
  padding: 0 10px;
  border: 1px solid ${({ theme }) => theme.colors.defaultBorder};
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme }) => theme.colors.surface1};
  color: ${({ theme }) => theme.colors.textPrimary};
  font: inherit;
  font-size: 13px;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.emerald};
  }
`

const TextAction = styled.button<{ $danger?: boolean }>`
  flex-shrink: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: ${({ theme, $danger }) =>
    $danger ? theme.colors.textError : theme.colors.emerald};
  font: inherit;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.2px;
  cursor: pointer;

  &:disabled {
    color: ${({ theme }) => theme.colors.textSecondary};
    cursor: not-allowed;
  }
`

const AddButton = styled.button`
  align-self: flex-start;
  height: 32px;
  padding: 0 12px;
  border: 1px dashed ${({ theme }) => theme.colors.defaultBorder};
  border-radius: ${({ theme }) => theme.radii.sm};
  background: transparent;
  color: ${({ theme }) => theme.colors.emerald};
  font: inherit;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.2px;
  cursor: pointer;
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

  @media (max-width: 560px) {
    flex-direction: column-reverse;
    align-items: stretch;
    gap: 10px;
  }
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

  @media (max-width: 560px) {
    text-align: center;
    padding: 8px 0;
  }
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

  @media (max-width: 560px) {
    width: 100%;
    min-width: 0;
  }
`
