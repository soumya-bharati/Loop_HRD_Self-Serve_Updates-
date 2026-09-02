import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import {
  bulkDeleteTemplateFileName,
  bulkTemplateFileName,
} from '@/data/employees'
import { parseSheet } from '@/pages/ManageLives/bulk/parseAndValidate'
import type { ParsedSheet } from '@/pages/ManageLives/bulk/parseAndValidate'
import { launchWizardPath } from '@/pages/ManageLives/launchWizard'

function downloadBulkTemplate(operation: 'add' | 'remove') {
  const isRemove = operation === 'remove'
  const headers = isRemove
    ? 'Employee ID,Date of Leaving,Confirm Delete\n'
    : 'Employee ID,First Name,Last Name,Grade,Core Cover,Email,DOB\n'
  const blob = new Blob([headers], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = (isRemove ? bulkDeleteTemplateFileName : bulkTemplateFileName)
    .replace('.xlsx', '.csv')
  link.click()
  URL.revokeObjectURL(url)
}

export function BulkSection({
  entityId,
  dealId,
  title = 'Manage employees in bulk',
  showCardChrome = true,
}: {
  entityId: string
  dealId?: string
  title?: string
  /** When false, render only the inner controls (for the dedicated bulk page). */
  showCardChrome?: boolean
}) {
  const navigate = useNavigate()
  const [operation, setOperation] = useState<'add' | 'remove' | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [phase, setPhase] = useState<'idle' | 'parsing' | 'ready'>('idle')
  const [parsed, setParsed] = useState<ParsedSheet | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [templateDownloaded, setTemplateDownloaded] = useState(false)
  const [deleteConfirmed, setDeleteConfirmed] = useState(false)

  const resetFile = () => {
    setFile(null)
    setParsed(null)
    setError(null)
    setPhase('idle')
    setDeleteConfirmed(false)
  }

  const chooseOperation = (next: 'add' | 'remove') => {
    setOperation(next)
    setTemplateDownloaded(false)
    resetFile()
  }

  const onFile = async (next: File | null) => {
    setFile(next)
    setParsed(null)
    setError(null)
    if (!next) {
      setPhase('idle')
      return
    }
    setPhase('parsing')
    try {
      setParsed(await parseSheet(next, operation ?? 'add'))
      setPhase('ready')
    } catch {
      setError('We could not read that file. Try CSV or XLSX.')
      setPhase('idle')
      setFile(null)
    }
  }

  const continueToValidation = () => {
    if (!operation || !file) return
    navigate(
      launchWizardPath({
        action: operation === 'add' ? 'add' : 'delete',
        method: 'bulk',
        entity: entityId,
        deal: dealId,
        file: file.name,
      }),
    )
  }

  const isRemove = operation === 'remove'

  const body = (
    <>
      {showCardChrome ? (
        <>
          <CardTitle>{title}</CardTitle>
          <CardCopy>
            Choose add or remove first. You will get the matching instructions
            and template, then upload the filled sheet for validation and cost.
          </CardCopy>
        </>
      ) : null}

      <ButtonRow>
        <Primary
          type="button"
          $active={operation === 'add'}
          onClick={() => chooseOperation('add')}
        >
          Add lives
        </Primary>
        <Secondary
          type="button"
          $active={operation === 'remove'}
          onClick={() => chooseOperation('remove')}
        >
          Remove lives
        </Secondary>
      </ButtonRow>

      {operation ? (
        <>
          <Instructions>
            <strong>
              {isRemove ? 'How to remove lives' : 'How to add lives'}
            </strong>
            {isRemove ? (
              <span>
                Download the deletion template, enter Employee ID and Date of
                Leaving, confirm you intend to off-board those people, then
                upload the filled sheet.
              </span>
            ) : (
              <span>
                Download the addition template, fill employee details (ID, name,
                grade, cover, email, date of birth), then upload the filled
                sheet. Invalid entity or deal rows are flagged on the next page.
              </span>
            )}
          </Instructions>

          <StepGrid>
            <StepCard>
              <StepTitle>1. Download template</StepTitle>
              <CardCopy>
                {isRemove
                  ? 'Columns: Employee ID, Date of Leaving, Confirm Delete.'
                  : 'Columns: Employee ID, First Name, Last Name, Grade, Core Cover, Email, DOB.'}
              </CardCopy>
              <Primary
                type="button"
                onClick={() => {
                  downloadBulkTemplate(operation)
                  setTemplateDownloaded(true)
                }}
              >
                {templateDownloaded
                  ? 'Downloaded — download again'
                  : 'Download template'}
              </Primary>
            </StepCard>
            <StepCard>
              <StepTitle>2. Upload filled sheet</StepTitle>
              {phase === 'parsing' ? (
                <Empty>Checking employee data…</Empty>
              ) : phase === 'ready' && file && parsed ? (
                <Meta>
                  <strong>{file.name}</strong>
                  <span>{parsed.rowCount} rows found.</span>
                  <Ghost type="button" onClick={() => void onFile(null)}>
                    Replace file
                  </Ghost>
                </Meta>
              ) : (
                <Drop
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault()
                    void onFile(event.dataTransfer.files[0] ?? null)
                  }}
                >
                  <span>Drop XLSX or CSV here, or</span>
                  <FileLabel>
                    Upload any file
                    <HiddenFile
                      type="file"
                      onChange={(event) =>
                        void onFile(event.target.files?.[0] ?? null)
                      }
                    />
                  </FileLabel>
                </Drop>
              )}
              {error ? <ErrorText>{error}</ErrorText> : null}
            </StepCard>
          </StepGrid>

          {isRemove ? (
            <Confirm>
              <input
                type="checkbox"
                checked={deleteConfirmed}
                onChange={(event) => setDeleteConfirmed(event.target.checked)}
              />
              <span>
                I confirm I intend to permanently delete the employees in this
                file and their dependants from all coverage.
              </span>
            </Confirm>
          ) : null}

          <ButtonRow>
            <Primary
              type="button"
              disabled={
                !file || phase !== 'ready' || (isRemove && !deleteConfirmed)
              }
              onClick={continueToValidation}
            >
              Continue to validation
            </Primary>
            <Ghost
              type="button"
              onClick={() => {
                setOperation(null)
                setTemplateDownloaded(false)
                resetFile()
              }}
            >
              Change action
            </Ghost>
          </ButtonRow>
          <Hint>
            Validation and cost stay on the next page. Nothing is submitted from
            here.
          </Hint>
        </>
      ) : null}
    </>
  )

  if (!showCardChrome) return <Inner>{body}</Inner>
  return <Card>{body}</Card>
}

const Inner = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const Card = styled.section`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  border-radius: 16px;
  background: ${({ theme }) => theme.colors.surface1};
  border: 1px solid ${({ theme }) => theme.colors.disableFill};
`

const CardTitle = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
`

const CardCopy = styled.p`
  margin: 0;
  font-size: 14px;
  line-height: 20px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const Primary = styled.button<{ $active?: boolean }>`
  align-self: flex-start;
  height: 44px;
  padding: 0 20px;
  border: ${({ theme, $active }) =>
    $active ? `2px solid ${theme.colors.emerald}` : '0'};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.fillGreen};
  color: ${({ theme }) => theme.colors.emerald};
  font: inherit;
  font-weight: 600;
  cursor: pointer;
  box-shadow: ${({ $active }) =>
    $active ? '0 0 0 2px rgba(2, 95, 76, 0.15)' : 'none'};

  &:disabled {
    background: ${({ theme }) => theme.colors.disableFill};
    color: ${({ theme }) => theme.colors.textSecondary};
    cursor: not-allowed;
    border: 0;
    box-shadow: none;
  }
`

const Secondary = styled(Primary)`
  background: transparent;
  border: 1px solid ${({ theme }) => theme.colors.emerald};
`

const Ghost = styled.button`
  border: 0;
  background: transparent;
  color: ${({ theme }) => theme.colors.emerald};
  font: inherit;
  font-weight: 500;
  cursor: pointer;
`

const Drop = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  padding: 28px;
  border: 1.5px dashed ${({ theme }) => theme.colors.defaultBorder};
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.surface0};
`

const FileLabel = styled.label`
  display: inline-flex;
  align-items: center;
  height: 40px;
  padding: 0 16px;
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.fillGreen};
  color: ${({ theme }) => theme.colors.emerald};
  font-weight: 600;
  cursor: pointer;
`

const HiddenFile = styled.input`
  display: none;
`

const Meta = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
`

const ButtonRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
`

const Instructions = styled.p`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 0;
  padding: 14px 16px;
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.planeGreenLight};
  color: ${({ theme }) => theme.colors.emerald};
  font-size: 14px;
  line-height: 20px;

  strong {
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.2px;
    text-transform: uppercase;
  }

  span {
    color: ${({ theme }) => theme.colors.textPrimary};
  }
`

const StepGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-template-columns: 1fr;
  }
`

const StepCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.colors.disableFill};
  background: ${({ theme }) => theme.colors.surface0};
`

const StepTitle = styled.h3`
  margin: 0;
  font-size: 14px;
  font-weight: 600;
`

const Confirm = styled.label`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 13px;
  line-height: 18px;
  color: ${({ theme }) => theme.colors.textPrimary};
  cursor: pointer;

  input {
    margin-top: 2px;
    accent-color: ${({ theme }) => theme.colors.emerald};
  }
`

const Empty = styled.p`
  margin: 0;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const Hint = styled.p`
  margin: 0;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const ErrorText = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textError};
  font-size: 13px;
`
