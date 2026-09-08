import { useEffect, useState } from 'react'
import styled, { keyframes } from 'styled-components'

import { assets } from '@/assets/figma'
import type { ColumnMapping } from '@/pages/ManageLives/bulk/parseAndValidate'

/** How long the scanner "reads" each Loop field before revealing its match. */
const ROW_SCAN_MS = 520

interface ColumnMappingPanelProps {
  mappings: ColumnMapping[]
  uploadedColumns: string[]
  sampleValues: Record<string, string>
  onMap: (mappingId: string, sourceColumn: string) => void
  onConfirm: () => void
}

export function ColumnMappingPanel({
  mappings,
  uploadedColumns,
  sampleValues,
  onMap,
  onConfirm,
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
        nextErrors[mapping.id] = `Select an uploaded column for ${mapping.loopField}.`
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

  const errorCount = Object.keys(rowErrors).length

  return (
    <MappingCard>
      <MappingHeading>
        <div>
          <MappingTitle>
            {scanning ? 'Scanning column headers' : 'Review column mapping'}
          </MappingTitle>
          <MappingDescription>
            {scanning
              ? `Matching your uploaded columns to Loop fields — ${scannedCount} of ${mappings.length} checked.`
              : 'Loop fields are on the left. Match each one to a column from your uploaded document, then confirm to continue.'}
          </MappingDescription>
        </div>
        <ProgressCount $scanning={scanning}>
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

      <ColumnLabels aria-hidden>
        <span>Loop format</span>
        <span>Uploaded document</span>
      </ColumnLabels>

      <MappingList>
        {mappings.map((mapping, index) => {
          const error = rowErrors[mapping.id]
          const options = uploadedColumns.filter(
            (column) =>
              !usedColumns.has(column) || column === mapping.sourceColumn,
          )
          const state = error
            ? 'error'
            : mapping.sourceColumn
              ? 'mapped'
              : 'needs-input'

          if (index >= scannedCount) {
            return (
              <MappingRow key={mapping.id} $state="scanning">
                <LoopColumn>
                  <span>{mapping.loopField}</span>
                </LoopColumn>

                <MappingArrow aria-hidden>
                  <img
                    src={assets.mlIconMappingArrow}
                    alt=""
                    width={64}
                    height={12}
                  />
                </MappingArrow>

                <ScanningCell>
                  <ScanningBar aria-hidden />
                  <ScanningLabel>
                    {index === scannedCount
                      ? 'Looking for a match…'
                      : 'Waiting to scan'}
                  </ScanningLabel>
                </ScanningCell>

                <RowStatus aria-hidden>
                  {index === scannedCount ? (
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
          }

          return (
            <MappingRow key={mapping.id} $state={state}>
              <LoopColumn>
                <span>{mapping.loopField}</span>
              </LoopColumn>

              <MappingArrow aria-hidden>
                <img
                  src={assets.mlIconMappingArrow}
                  alt=""
                  width={64}
                  height={12}
                />
              </MappingArrow>

              <SourceColumn>
                <SelectWrap>
                  <ColumnSelect
                    value={mapping.sourceColumn ?? ''}
                    $invalid={Boolean(error)}
                    onChange={(event) => {
                      const next = event.target.value
                      setRowErrors((current) => {
                        if (!current[mapping.id]) return current
                        const { [mapping.id]: _removed, ...rest } = current
                        return rest
                      })
                      onMap(mapping.id, next)
                    }}
                    aria-invalid={Boolean(error)}
                    aria-label={`Uploaded column for ${mapping.loopField}`}
                  >
                    <option value="" disabled>
                      Select uploaded column
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
                    width={16}
                    height={16}
                  />
                </SelectWrap>
                {mapping.sourceColumn && sampleValues[mapping.sourceColumn] ? (
                  <SampleValue>
                    Sample from uploaded file:{' '}
                    {sampleValues[mapping.sourceColumn]}
                  </SampleValue>
                ) : null}
              </SourceColumn>

              <RowStatus aria-hidden>
                {state === 'mapped' ? (
                  <img
                    src={assets.mlIconCheckEmerald}
                    alt=""
                    width={12}
                    height={12}
                  />
                ) : (
                  <WarningDot>!</WarningDot>
                )}
              </RowStatus>
            </MappingRow>
          )
        })}
      </MappingList>

      {scanning ? (
        <MappingHint>
          Reading your document — you can review and change every mapping once
          the scan finishes.
        </MappingHint>
      ) : errorCount > 0 ? (
        <MappingHint $error>
          {errorCount === 1
            ? 'One mapping still needs to be corrected before you can continue.'
            : `${errorCount} mappings still need to be corrected before you can continue.`}
        </MappingHint>
      ) : (
        <MappingHint>
          Confirm the mapping when every Loop field has the right uploaded
          column. This selection is used for this upload only.
        </MappingHint>
      )}

      <ConfirmButton type="button" disabled={scanning} onClick={confirmMapping}>
        {scanning ? 'Scanning document…' : 'Confirm mapping'}
      </ConfirmButton>
    </MappingCard>
  )
}

const rowIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(8px);
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

const COLUMN_GRID = 'minmax(0, 148px) 64px minmax(0, 1fr) 24px'

const MappingHeading = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
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
  margin: 2px 0 0;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 12px;
  line-height: 18px;
  letter-spacing: 0.2px;
`

const ProgressCount = styled.span<{ $scanning?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  padding: 4px 10px;
  border-radius: 999px;
  background: ${({ theme, $scanning }) =>
    $scanning ? theme.colors.disableFill : theme.colors.planeGreenLight};
  color: ${({ theme, $scanning }) =>
    $scanning ? theme.colors.textSecondary : theme.colors.emerald};
  font-size: 12px;
  font-weight: 500;
  line-height: 18px;
`

const ColumnLabels = styled.div`
  display: grid;
  grid-template-columns: ${COLUMN_GRID};
  gap: 12px;
  padding: 0 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 11px;
  font-weight: 500;
  line-height: 16px;
  letter-spacing: 0.2px;

  span:last-child {
    grid-column: 3;
  }
`

const MappingList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

/** Each row lands as the scanner reaches it, so the entrance needs no stagger. */
const MappingRow = styled.div<{
  $state: 'mapped' | 'needs-input' | 'error' | 'scanning'
}>`
  display: grid;
  grid-template-columns: ${COLUMN_GRID};
  align-items: center;
  gap: 12px;
  min-height: 56px;
  padding: 8px 12px;
  border: 1px solid
    ${({ theme, $state }) =>
      $state === 'error'
        ? theme.colors.textError
        : $state === 'needs-input'
          ? '#F5A623'
          : theme.colors.disableFill};
  border-radius: 8px;
  background: ${({ theme, $state }) =>
    $state === 'error'
      ? '#FDECEC'
      : $state === 'needs-input'
        ? '#FFF9EF'
        : theme.colors.surface0};
  box-sizing: border-box;
  transition:
    border-color 240ms ease,
    background-color 240ms ease;
  animation: ${rowIn} 520ms cubic-bezier(0.22, 1, 0.36, 1) both;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    transition: none;
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

const ScanningCell = styled.div`
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
`

const ScanningBar = styled.span`
  width: 168px;
  height: 32px;
  flex: 0 0 168px;
  max-width: 50%;
  border-radius: 6px;
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

const ScanningLabel = styled.span`
  overflow: hidden;
  min-width: 0;
  flex: 1;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 11px;
  line-height: 16px;
  letter-spacing: 0.2px;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const PendingDot = styled.span`
  display: block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.disableFill};
`

const SourceColumn = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  gap: 8px;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const SampleValue = styled.span`
  overflow: hidden;
  min-width: 0;
  flex: 1;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 11px;
  font-weight: 400;
  line-height: 16px;
  letter-spacing: 0.2px;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const SelectWrap = styled.div`
  position: relative;
  width: 168px;
  max-width: 50%;
  flex: 0 0 168px;
`

const SelectChevron = styled.img`
  position: absolute;
  top: 50%;
  right: 8px;
  width: 16px;
  height: 16px;
  pointer-events: none;
  transform: translateY(-50%);
`

const ColumnSelect = styled.select<{ $invalid?: boolean }>`
  width: 100%;
  height: 32px;
  padding: 0 28px 0 10px;
  border: 1px solid
    ${({ theme, $invalid }) =>
      $invalid ? theme.colors.textError : theme.colors.defaultBorder};
  border-radius: 6px;
  background: ${({ theme }) => theme.colors.surface1};
  color: ${({ theme }) => theme.colors.textPrimary};
  font: inherit;
  font-size: 12px;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.emerald};
  }
`

const MappingArrow = styled.div`
  display: flex;
  width: 64px;
  height: 12px;
  align-items: center;
  justify-content: center;
  overflow: hidden;

  img {
    display: block;
    width: 64px;
    height: 12px;
    object-fit: contain;
  }
`

const LoopColumn = styled.div`
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 12px;
  font-weight: 500;
  line-height: 18px;

  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`

const RowStatus = styled.div`
  display: grid;
  width: 24px;
  height: 24px;
  place-items: center;
`

const WarningDot = styled.span`
  display: grid;
  width: 20px;
  height: 20px;
  place-items: center;
  border-radius: 50%;
  background: #f5a623;
  color: white;
  font-size: 12px;
  font-weight: 600;
`

const MappingHint = styled.p<{ $error?: boolean }>`
  margin: 0;
  padding: 10px 12px;
  border-radius: 8px;
  background: ${({ $error }) => ($error ? '#FDECEC' : '#fff9ef')};
  color: ${({ theme, $error }) =>
    $error ? theme.colors.textError : '#8a5a00'};
  font-size: 12px;
  line-height: 18px;
  letter-spacing: 0.2px;
`

const ConfirmButton = styled.button`
  align-self: flex-start;
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
