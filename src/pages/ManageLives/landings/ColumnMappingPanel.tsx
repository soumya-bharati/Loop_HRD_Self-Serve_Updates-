import { useState } from 'react'
import styled, { css, keyframes } from 'styled-components'

import { assets } from '@/assets/figma'
import type { ColumnMapping } from '@/pages/ManageLives/bulk/parseAndValidate'

interface ColumnMappingPanelProps {
  mappings: ColumnMapping[]
  uploadedColumns: string[]
  sampleValues: Record<string, string>
  activeIndex: number
  onMap: (mappingId: string, sourceColumn: string) => void
}

export function ColumnMappingPanel({
  mappings,
  uploadedColumns,
  sampleValues,
  activeIndex,
  onMap,
}: ColumnMappingPanelProps) {
  const [mismatch, setMismatch] = useState<string | null>(null)
  const unresolved = mappings.filter(
    (mapping, index) => index <= activeIndex && !mapping.sourceColumn,
  )
  const usedColumns = new Set(
    mappings
      .map((mapping) => mapping.sourceColumn)
      .filter((column): column is string => Boolean(column)),
  )
  const visibleMappings = mappings.slice(
    0,
    Math.min(activeIndex + 1, mappings.length),
  )
  const complete = activeIndex >= mappings.length

  return (
    <MappingCard>
      <MappingHeading>
        <div>
          <MappingTitle>
            {unresolved.length > 0
              ? 'Help us map the missing column'
              : complete
                ? 'Columns mapped successfully'
                : 'Detecting and mapping columns'}
          </MappingTitle>
          <MappingDescription>
            {unresolved.length > 0
              ? 'Select the matching column from your uploaded document.'
              : 'Matching your document headers to Loop’s format.'}
          </MappingDescription>
        </div>
        <ProgressCount>
          {Math.min(activeIndex, mappings.length)}/{mappings.length}
        </ProgressCount>
      </MappingHeading>

      <ColumnLabels aria-hidden>
        <span>Uploaded document</span>
        <span>Loop format</span>
      </ColumnLabels>

      <MappingList>
        {visibleMappings.map((mapping, index) => {
          const detecting =
            index === activeIndex && Boolean(mapping.sourceColumn) && !complete
          const needsInput = index === activeIndex && !mapping.sourceColumn
          const mapped = index < activeIndex || complete
          const options = uploadedColumns.filter(
            (column) =>
              !usedColumns.has(column) || column === mapping.sourceColumn,
          )

          return (
            <MappingRow
              key={mapping.id}
              $state={
                needsInput
                  ? mismatch
                    ? 'error'
                    : 'needs-input'
                  : detecting
                    ? 'detecting'
                    : 'mapped'
              }
            >
              <SourceColumn>
                {needsInput ? (
                  <ColumnSelect
                    value=""
                    $invalid={Boolean(mismatch)}
                    onChange={(event) => {
                      const next = event.target.value
                      if (
                        mapping.expectedSourceColumn &&
                        next !== mapping.expectedSourceColumn
                      ) {
                        setMismatch(
                          `“${next}” doesn’t match ${mapping.loopField}. Select “${mapping.expectedSourceColumn}” to continue.`,
                        )
                        return
                      }
                      setMismatch(null)
                      onMap(mapping.id, next)
                    }}
                    aria-invalid={Boolean(mismatch)}
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
                ) : (
                  <>
                    <ColumnName>{mapping.sourceColumn}</ColumnName>
                    {mapping.sourceColumn &&
                    sampleValues[mapping.sourceColumn] ? (
                      <SampleValue>
                        Sample from uploaded file:{' '}
                        {sampleValues[mapping.sourceColumn]}
                      </SampleValue>
                    ) : null}
                  </>
                )}
              </SourceColumn>

              <MappingArrow $active={detecting} aria-hidden>
                <img
                  src={assets.mlIconMappingArrow}
                  alt=""
                  width={64}
                  height={12}
                />
              </MappingArrow>

              <LoopColumn>
                <span>{mapping.loopField}</span>
              </LoopColumn>

              <RowStatus aria-hidden>
                {mapped ? (
                  <img
                    src={assets.mlIconCheckEmerald}
                    alt=""
                    width={12}
                    height={12}
                  />
                ) : detecting ? (
                  <DetectingDot />
                ) : (
                  <WarningDot>!</WarningDot>
                )}
              </RowStatus>
            </MappingRow>
          )
        })}
      </MappingList>

      {mismatch ? (
        <MappingHint $error>
          {mismatch}
        </MappingHint>
      ) : unresolved.length > 0 ? (
        <MappingHint>
          We couldn’t confidently map “{unresolved[0].loopField}”. Your
          selection will be used for this upload only.
        </MappingHint>
      ) : null}
    </MappingCard>
  )
}

const rowIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(-6px);
  }
  to {
    opacity: 1;
    transform: none;
  }
`

const mappingPulse = keyframes`
  0%, 100% { transform: scaleX(0.35); opacity: 0.45; }
  50% { transform: scaleX(1); opacity: 1; }
`

const dotPulse = keyframes`
  50% { transform: scale(0.65); opacity: 0.45; }
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

const ProgressCount = styled.span`
  flex-shrink: 0;
  padding: 4px 10px;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.planeGreenLight};
  color: ${({ theme }) => theme.colors.emerald};
  font-size: 12px;
  font-weight: 500;
  line-height: 18px;
`

const ColumnLabels = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 64px minmax(0, 1fr) 24px;
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

const MappingRow = styled.div<{
  $state: 'detecting' | 'mapped' | 'needs-input' | 'error'
}>`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 64px minmax(0, 1fr) 24px;
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
  animation: ${rowIn} 240ms ease-out;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

const SourceColumn = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const ColumnName = styled.span`
  overflow: hidden;
  font-size: 12px;
  font-weight: 500;
  line-height: 18px;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const SampleValue = styled.span`
  overflow: hidden;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 11px;
  font-weight: 400;
  line-height: 16px;
  letter-spacing: 0.2px;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const ColumnSelect = styled.select<{ $invalid?: boolean }>`
  width: 100%;
  height: 32px;
  padding: 0 30px 0 10px;
  border: 1px solid
    ${({ theme, $invalid }) =>
      $invalid ? theme.colors.textError : theme.colors.defaultBorder};
  border-radius: 6px;
  background: ${({ theme }) => theme.colors.surface1}
    url(${assets.mlChevronDown24}) no-repeat right 7px center / 16px 16px;
  color: ${({ theme }) => theme.colors.textPrimary};
  font: inherit;
  font-size: 12px;
  appearance: none;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.emerald};
  }
`

const MappingArrow = styled.div<{ $active: boolean }>`
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
    transform-origin: left center;
  }

  ${({ $active }) =>
    $active &&
    css`
      img {
        animation: ${mappingPulse} 850ms ease-in-out infinite;
      }
    `}

  @media (prefers-reduced-motion: reduce) {
    img {
      animation: none;
    }
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
`

const RowStatus = styled.div`
  display: grid;
  width: 24px;
  height: 24px;
  place-items: center;
`

const DetectingDot = styled.span`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.fillGreen};
  box-shadow: 0 0 0 5px ${({ theme }) => theme.colors.planeGreenLight};
  animation: ${dotPulse} 850ms ease-in-out infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
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
