import styled from 'styled-components'

import type { FamilyRelationship, FamilySlotSummary } from '@/domain/flex'

export function DependantSlotSelector({
  summary,
  selected,
  onSelect,
  benefitLabels,
}: {
  summary: FamilySlotSummary
  selected?: string
  onSelect?: (relationship: FamilyRelationship) => void
  benefitLabels: Record<string, string>
}) {
  if (summary.allSlotsConsumed) {
    return (
      <Empty>
        <strong>No dependant can be added</strong>
        <span>{summary.emptyReason}</span>
      </Empty>
    )
  }

  return (
    <Grid>
      {summary.slots.map((slot) => {
        const disabled = slot.remainingSlots === 0
        return (
          <Card
            key={slot.relationship}
            type="button"
            $selected={selected === slot.relationship}
            disabled={disabled || !onSelect}
            onClick={() => onSelect?.(slot.relationship)}
          >
            <Top>
              <Name>{slot.relationship}</Name>
              <Count>
                {disabled
                  ? 'No slots'
                  : `${slot.remainingSlots} slot${slot.remainingSlots === 1 ? '' : 's'} available`}
              </Count>
            </Top>
            <Meta>
              Eligible for:{' '}
              {slot.availableBenefitIds
                .map((id) => benefitLabels[id] ?? id)
                .join(', ') || 'None'}
            </Meta>
            {slot.usedSlots > 0 ? (
              <Used>{slot.usedSlots} already enrolled</Used>
            ) : null}
          </Card>
        )
      })}
    </Grid>
  )
}

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
`

const Card = styled.button<{ $selected: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
  padding: 16px;
  border-radius: 12px;
  border: 1.5px solid
    ${({ theme, $selected }) =>
      $selected ? theme.colors.emerald : theme.colors.defaultBorder};
  background: ${({ theme, $selected }) =>
    $selected ? theme.colors.planeGreenLight : theme.colors.surface1};
  text-align: left;
  font-family: ${({ theme }) => theme.fontFamily};
  cursor: pointer;

  &:disabled {
    opacity: 0.62;
    cursor: default;
  }
`

const Top = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 8px;
`

const Name = styled.strong`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const Count = styled.span`
  font-size: 11px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.emerald};
`

const Meta = styled.span`
  font-size: 12px;
  line-height: 17px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const Used = styled.span`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const Empty = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 20px;
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.disableFill};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 13px;

  strong {
    color: ${({ theme }) => theme.colors.textPrimary};
  }
`
