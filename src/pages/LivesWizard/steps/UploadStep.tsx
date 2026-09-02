import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import {
  bulkDeleteTemplateFileName,
  bulkTemplateFileName,
} from '@/data/employees'
import { flexDeal } from '@/data/flexDeal'
import { WizardChrome } from '@/pages/LivesWizard/WizardChrome'
import { useLivesWizard } from '@/pages/LivesWizard/WizardContext'

export function UploadStep() {
  const navigate = useNavigate()
  const {
    action,
    fileName,
    setFileName,
    templateDownloaded,
    setTemplateDownloaded,
    deleteConfirmed,
    setDeleteConfirmed,
    setStep,
  } = useLivesWizard()
  const inputRef = useRef<HTMLInputElement>(null)
  const isDelete = action === 'delete'

  return (
    <WizardChrome
      title={isDelete ? 'Bulk delete lives' : 'Bulk add lives'}
      onBack={() => navigate('/endorsements')}
      onExit={() => navigate('/endorsements')}
      primaryLabel="Proceed to validation"
      primaryDisabled={!fileName || (isDelete && !deleteConfirmed)}
      onPrimary={() => setStep('bulk-validate')}
    >
      <Intro>
        {isDelete ? (
          <>
            Download the delete template, enter employee IDs and dates of
            leaving, confirm deletion intent, then reupload.
          </>
        ) : (
          <>
            Download the template for <strong>{flexDeal.name}</strong>. It
            includes existing per-policy sheets plus one sheet per active deal
            (custom attributes + purchase-group columns).
          </>
        )}
      </Intro>

      <ActionsGrid>
        <ActionCard>
          <ActionTitle>1. Download sheet</ActionTitle>
          <ActionCopy>
            {isDelete
              ? 'Employee ID and Date of Leaving columns.'
              : 'Per-policy sheets + deal sheets with Grade, Work Location, Core Cover, Add-ons.'}
          </ActionCopy>
          <DownloadButton
            type="button"
            onClick={() => {
              setTemplateDownloaded(true)
              const headers = isDelete
                ? 'Employee ID,Date of Leaving,Confirm Delete\n'
                : 'Employee ID,First Name,Last Name,Grade,Core Cover,Email,DOB\n'
              const blob = new Blob([headers], { type: 'text/csv' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = (
                isDelete ? bulkDeleteTemplateFileName : bulkTemplateFileName
              ).replace('.xlsx', '.csv')
              a.click()
              URL.revokeObjectURL(url)
            }}
          >
            {templateDownloaded
              ? 'Downloaded ✓ — Download again'
              : 'Download template'}
          </DownloadButton>
        </ActionCard>

        <ActionCard>
          <ActionTitle>2. Reupload sheet</ActionTitle>
          <Dropzone
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              const file = e.dataTransfer.files?.[0]
              if (file) setFileName(file.name)
            }}
          >
            <DropTitle>
              {fileName ?? 'Drag & drop Excel here, or click to browse'}
            </DropTitle>
            <DropHint>Accepted: .xlsx · .csv</DropHint>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) setFileName(file.name)
              }}
            />
          </Dropzone>
        </ActionCard>
      </ActionsGrid>

      {isDelete ? (
        <Confirm>
          <input
            type="checkbox"
            checked={deleteConfirmed}
            onChange={(e) => setDeleteConfirmed(e.target.checked)}
          />
          <span>
            I confirm I intend to permanently delete the employees in this file
            and their dependants from all coverage.
          </span>
        </Confirm>
      ) : null}
    </WizardChrome>
  )
}

const Intro = styled.p`
  margin: 0;
  font-size: 14px;
  line-height: 20px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const ActionsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`

const ActionCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 20px;
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.surface1};
  border: 1px solid ${({ theme }) => theme.colors.disableFill};
`

const ActionTitle = styled.h3`
  margin: 0;
  font-size: 15px;
  font-weight: 600;
`

const ActionCopy = styled.p`
  margin: 0;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  flex: 1;
`

const DownloadButton = styled.button`
  align-self: flex-start;
  border: none;
  background: ${({ theme }) => theme.colors.fillGreen};
  color: ${({ theme }) => theme.colors.emerald};
  border-radius: 8px;
  padding: 10px 16px;
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
`

const Dropzone = styled.button`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 20px;
  border-radius: 8px;
  border: 1px dashed ${({ theme }) => theme.colors.defaultBorder};
  background: ${({ theme }) => theme.colors.surface0};
  text-align: left;
  cursor: pointer;
  font-family: ${({ theme }) => theme.fontFamily};
`

const DropTitle = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const DropHint = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const Confirm = styled.label`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textPrimary};
  cursor: pointer;

  input {
    margin-top: 2px;
    accent-color: ${({ theme }) => theme.colors.emerald};
  }
`
