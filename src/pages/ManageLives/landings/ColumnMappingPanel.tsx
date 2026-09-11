import { useEffect, useState } from 'react'
import styled, { keyframes } from 'styled-components'

import { assets } from '@/assets/figma'
import { autoCorrectionFor } from '@/pages/ManageLives/bulk/normalizeFieldValue'
import type { ColumnMapping } from '@/pages/ManageLives/bulk/parseAndValidate'

/** How long the scanner "reads" each Loop field before revealing its match. */
const ROW_SCAN_MS = 520

interface ColumnMappingPanelProps {
  mappings: ColumnMapping[]
  uploadedColumns: string[]
  sampleValues: Record<string, string>
  fileName?: string
  fileSize?: number
  onMap: (mappingId: string, sourceColumn: string) => void
  onConfirm: () => void
  onBack: () => void
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function ColumnMappingPanel({
  mappings,
  uploadedColumns,
  sampleValues,
  fileName = 'Uploaded employee list.xlsx',
  fileSize = 0,
  onMap,
  onConfirm,
  onBack,
}: ColumnMappingPanelProps) {
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({})
  const [scannedCount, setScannedCount] = useState(0)
  const scanning = scannedCount < mappings.length
  const mappedCount = mappings
    .slice(0, scannedCount)
    .filter((mapping) => mapping.sourceColumn).length
  const usedColumns = new Set(
    mappings
      .map((mapping) => mapping.sourceColumn)
      .filter((column): column is string => Boolean(column)),
  )

  useEffect(() => {
    if (!scanning) return
    const timer = window.setTimeout(
      () => setScannedCount((current) => current + 1),
      ROW_SCAN_MS,
    )
    return () => window.clearTimeout(timer)
  }, [scanning, scannedCount])

  function confirmMapping() {
    if (scanning) return
    const nextErrors: Record<string, string> = {}

    for (const mapping of mappings) {
      if (!mapping.sourceColumn) {
        if (mapping.required) {
          nextErrors[mapping.id] =
            `Select an uploaded column for ${mapping.loopField}.`
        }
        continue
      }
      if (
        mapping.expectedSourceColumn &&
        mapping.sourceColumn !== mapping.expectedSourceColumn
      ) {
        nextErrors[mapping.id] =
          `“${mapping.sourceColumn}” doesn’t match ${mapping.loopField}. Select “${mapping.expectedSourceColumn}”.`
      }
    }

    setRowErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    onConfirm()
  }

  return (
    <MappingCard>
      <FileBar>
        <FileMeta>
          <FileIconWrap aria-hidden>
            <img src={assets.mlIconFileUploaded} alt="" width={20} height={20} />
          </FileIconWrap>
          <FileCopy>
            <FileName title={fileName}>{fileName}</FileName>
            <FileSize>{formatFileSize(fileSize)}</FileSize>
          </FileCopy>
        </FileMeta>
        <LoaderSpin
          src={assets.mlIconLoaderScan}
          alt=""
          width={32}
          height={32}
        />
      </FileBar>

      <MappingHeading>
        <div>
          <MappingTitle>
            {scanning ? 'Scanning column headers' : 'Review column mapping'}
          </MappingTitle>
          <MappingDescription>
            {scanning
              ? `Matching your uploaded columns to Loop fields — ${scannedCount} of ${mappings.length} checked.`
              : 'Map the columns from your file to the corresponding fields in Loop, then confirm to proceed.'}
          </MappingDescription>
        </div>
        <ProgressCount>
          {scanning ? (
            <LoaderSpin
              src={assets.mlIconLoaderSm}
              alt=""
              width={12}
              height={12}
            />
          ) : null}
          {mappedCount}/{mappings.length}
        </ProgressCount>
      </MappingHeading>

      <Table>
        <TableHead aria-hidden>
          <span>Loop’s Format</span>
          <span>Uploaded Document</span>
        </TableHead>
        <MappingList>
          {mappings.map((mapping, index) => {
            const error = rowErrors[mapping.id]
            const options = uploadedColumns.filter(
              (column) =>
                !usedColumns.has(column) || column === mapping.sourceColumn,
            )
            const pending = index >= scannedCount
            const needsInput =
              !pending && mapping.required && !mapping.sourceColumn
            const state = pending
              ? 'scanning'
              : error
                ? 'error'
                : needsInput
                  ? 'needs-input'
                  : 'mapped'
            const sample =
              mapping.sourceColumn && sampleValues[mapping.sourceColumn]
                ? sampleValues[mapping.sourceColumn]
                : null
            const correction = sample
              ? autoCorrectionFor(mapping.loopField, sample)
              : null
            const showMandatory = mapping.required

            return (
              <MappingRow key={mapping.id} $state={state}>
                <LoopColumn>
                  <span>{mapping.loopField}</span>
                  {showMandatory ? <MandatoryTag>Mandatory</MandatoryTag> : null}
                </LoopColumn>

                <MappingArrow aria-hidden>
                  <img src={assets.mlIconMappingArrow} alt="" />
                </MappingArrow>

                {pending ? (
                  <SourceColumn>
                    <ScanningBar aria-hidden />
                    <SampleBlock>
                      <SampleLabel>
                        {index === scannedCount
                          ? 'Looking for a match…'
                          : 'Waiting to scan'}
                      </SampleLabel>
                    </SampleBlock>
                  </SourceColumn>
                ) : (
                  <SourceColumn>
                    <SelectWrap>
                      <ColumnSelect
                        value={mapping.sourceColumn ?? ''}
                        $empty={!mapping.sourceColumn}
                        $invalid={Boolean(error)}
                        onChange={(event) => {
                          const next = event.target.value
                          setRowErrors((current) => {
                            if (!current[mapping.id]) return current
                            const { [mapping.id]: _removed, ...rest } = current
                            return rest
                          })
                          onMap(mapping.id, next || '')
                        }}
                        aria-invalid={Boolean(error)}
                        aria-label={`Uploaded column for ${mapping.loopField}`}
                      >
                        <option value="" disabled={mapping.required}>
                          {mapping.required
                            ? 'Select uploaded column'
                            : 'Skip this column'}
                        </option>
                        {options.map((column) => (
                          <option key={column} value={column}>
                            {column}
                          </option>
                        ))}
                      </ColumnSelect>
                      <SelectChevron
                        src={assets.mlIconChevronDownField}
                        alt=""
                        width={24}
                        height={24}
                      />
                    </SelectWrap>
                    {needsInput ? (
                      <WarningCopy>
                        We couldn’t confidently map this, your selection will be
                        used for this upload only.
                      </WarningCopy>
                    ) : sample ? (
                      <SampleBlock>
                        <SampleLabel>Extracted Sample:</SampleLabel>
                        <SampleValue>{sample}</SampleValue>
                        {correction ? (
                          <AutoCorrectNote>
                            We’ll auto-correct this to{' '}
                            <strong>{correction.to}</strong> for Loop’s format.
                          </AutoCorrectNote>
                        ) : null}
                      </SampleBlock>
                    ) : error ? (
                      <WarningCopy $error>{error}</WarningCopy>
                    ) : null}
                  </SourceColumn>
                )}

                <RowStatus aria-hidden $state={state}>
                  {state === 'mapped' ? (
                    <img
                      src={assets.mlIconCheckEmerald}
                      alt=""
                      width={12}
                      height={12}
                    />
                  ) : state === 'needs-input' || state === 'error' ? (
                    <img
                      src={assets.mlIconAlertTriangleAmber}
                      alt=""
                      width={12}
                      height={12}
                    />
                  ) : index === scannedCount ? (
                    <LoaderSpin
                      src={assets.mlIconLoaderSm}
                      alt=""
                      width={12}
                      height={12}
                    />
                  ) : (
                    <PendingDot />
                  )}
                </RowStatus>
              </MappingRow>
            )
          })}
        </MappingList>
      </Table>

      <Actions>
        <BackButton type="button" onClick={onBack}>
          Go Back
        </BackButton>
        <ConfirmButton type="button" disabled={scanning} onClick={confirmMapping}>
          {scanning ? 'Scanning document…' : 'Confirm & Proceed'}
        </ConfirmButton>
      </Actions>
    </MappingCard>
  )
}

const rowIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: none;
  }
`

const MappingCard = styled.section`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  padding: 16px;
  border: 1px solid ${({ theme }) => theme.colors.disableFill};
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.surface1};
  box-sizing: border-box;
`

const FileBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  padding: 16px 20px;
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.hoverSurface1};
  box-sizing: border-box;
`

const FileMeta = styled.div`
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 16px;
`

const FileIconWrap = styled.div`
  display: grid;
  width: 40px;
  height: 40px;
  flex: 0 0 40px;
  place-items: center;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.planeGreenLight};

  img {
    display: block;
    width: 20px;
    height: 20px;
  }
`

const FileCopy = styled.div`
  min-width: 0;
`

const FileName = styled.p`
  margin: 0;
  overflow: hidden;
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  letter-spacing: 0.2px;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const FileSize = styled.p`
  margin: 2px 0 0;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 12px;
  line-height: 18px;
  letter-spacing: 0.2px;
`

const MappingHeading = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
`

const MappingTitle = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  letter-spacing: 0.2px;
`

const MappingDescription = styled.p`
  margin: 4px 0 0;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 12px;
  font-weight: 400;
  line-height: 18px;
  letter-spacing: 0.2px;
`

const ProgressCount = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  padding: 4px 10px;
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.planeGreenLight};
  color: ${({ theme }) => theme.colors.emerald};
  font-size: 12px;
  font-weight: 600;
  line-height: 18px;
  letter-spacing: 0.2px;
`

const COLUMN_GRID = '200px 80px minmax(0, 1fr) 24px'

const Table = styled.div`
  width: 100%;
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.colors.surface0};
  border-radius: 12px;
`

const TableHead = styled.div`
  display: grid;
  grid-template-columns: ${COLUMN_GRID};
  gap: 16px;
  padding: 12px 16px;
  background: ${({ theme }) => theme.colors.surface0};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  letter-spacing: 0.2px;

  span:last-child {
    grid-column: 3;
  }
`

const MappingList = styled.div`
  display: flex;
  flex-direction: column;
`

const MappingRow = styled.div<{
  $state: 'mapped' | 'needs-input' | 'error' | 'scanning'
}>`
  display: grid;
  grid-template-columns: ${COLUMN_GRID};
  align-items: center;
  gap: 16px;
  padding: 14px 16px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.surface0};
  background: ${({ $state }) =>
    $state === 'error'
      ? '#FDECEC'
      : $state === 'needs-input'
        ? '#FFFBEB'
        : 'transparent'};
  box-sizing: border-box;
  animation: ${rowIn} 420ms cubic-bezier(0.22, 1, 0.36, 1) both;

  &:last-child {
    border-bottom: 0;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

const shimmer = keyframes`
  from {
    background-position: 200% 0;
  }
  to {
    background-position: -200% 0;
  }
`

const spin = keyframes`
  to {
    transform: rotate(360deg);
  }
`

const LoaderSpin = styled.img`
  display: block;
  animation: ${spin} 900ms linear infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

const ScanningBar = styled.span`
  width: 280px;
  max-width: 100%;
  height: 44px;
  flex: 0 0 280px;
  border-radius: 8px;
  background: linear-gradient(
      90deg,
      ${({ theme }) => theme.colors.disableFill} 25%,
      ${({ theme }) => theme.colors.surface1} 50%,
      ${({ theme }) => theme.colors.disableFill} 75%
    )
    0 0 / 200% 100%;
  animation: ${shimmer} 1200ms linear infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

const SourceColumn = styled.div`
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 16px;
`

const SelectWrap = styled.div`
  position: relative;
  width: 280px;
  max-width: 100%;
  flex: 0 0 280px;
`

const SelectChevron = styled.img`
  position: absolute;
  top: 50%;
  right: 16px;
  width: 24px;
  height: 24px;
  pointer-events: none;
  transform: translateY(-50%);
`

const ColumnSelect = styled.select<{ $invalid?: boolean; $empty?: boolean }>`
  width: 100%;
  height: 44px;
  padding: 12px 44px 12px 20px;
  border: 1px solid
    ${({ theme, $invalid }) =>
      $invalid ? theme.colors.textError : theme.colors.defaultBorder};
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.surface1};
  color: ${({ theme, $empty }) =>
    $empty ? theme.colors.textSecondary : theme.colors.textPrimary};
  font: inherit;
  font-size: 14px;
  font-weight: ${({ $empty }) => ($empty ? 400 : 500)};
  line-height: 20px;
  letter-spacing: 0.2px;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.emerald};
  }
`

const SampleBlock = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
  justify-content: center;
`

const SampleLabel = styled.span`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 12px;
  font-weight: 400;
  line-height: 18px;
  letter-spacing: 0.2px;
`

const SampleValue = styled.span`
  overflow: hidden;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  letter-spacing: 0.2px;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const AutoCorrectNote = styled.p`
  margin: 2px 0 0;
  color: ${({ theme }) => theme.colors.emerald};
  font-size: 12px;
  font-weight: 400;
  line-height: 18px;
  letter-spacing: 0.2px;

  strong {
    font-weight: 600;
  }
`

const WarningCopy = styled.p<{ $error?: boolean }>`
  margin: 0;
  min-width: 0;
  flex: 1;
  color: ${({ $error, theme }) =>
    $error ? theme.colors.textError : '#d97706'};
  font-size: 12px;
  font-weight: 500;
  line-height: 18px;
  letter-spacing: 0.2px;
`

const MappingArrow = styled.div`
  display: flex;
  width: 80px;
  height: 24px;
  align-items: center;
  justify-content: center;

  img {
    display: block;
    width: 80px;
    height: 24px;
    object-fit: contain;
  }
`

const LoopColumn = styled.div`
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  letter-spacing: 0.2px;

  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`

const MandatoryTag = styled.span`
  flex-shrink: 0;
  padding: 2px 6px;
  border-radius: 50px;
  background: ${({ theme }) => theme.colors.disableFill};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 10px;
  font-weight: 500;
  line-height: 18px;
  letter-spacing: 0.2px;
`

const RowStatus = styled.div<{
  $state: 'mapped' | 'needs-input' | 'error' | 'scanning'
}>`
  display: grid;
  width: 24px;
  height: 24px;
  place-items: center;
  border-radius: 12px;
  background: ${({ $state }) =>
    $state === 'mapped'
      ? '#d1e7dd'
      : $state === 'needs-input' || $state === 'error'
        ? '#fef3c7'
        : 'transparent'};
`

const PendingDot = styled.span`
  display: block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.disableFill};
`

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
`

const BackButton = styled.button`
  height: 48px;
  padding: 14px 24px;
  border: 1px solid ${({ theme }) => theme.colors.emerald};
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.surface1};
  color: ${({ theme }) => theme.colors.emerald};
  font: inherit;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  letter-spacing: 0.2px;
  cursor: pointer;
`

const ConfirmButton = styled.button`
  height: 48px;
  padding: 14px 24px;
  border: 0;
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.fillGreen};
  color: ${({ theme }) => theme.colors.emerald};
  font: inherit;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  letter-spacing: 0.2px;
  cursor: pointer;

  &:disabled {
    background: ${({ theme }) => theme.colors.disableFill};
    color: ${({ theme }) => theme.colors.textSecondary};
    cursor: progress;
  }
`
