import styled from 'styled-components'

import { assets } from '@/assets/figma'
import type { DependantFormData, EmployeeFormData } from '@/data/employees'
import type { FamilyRelationship, FamilySlotSummary } from '@/domain/flex'

export function DependantSlotSelector({
  summary,
  selected,
  onSelect,
  benefitLabels,
  employee,
  dependants = [],
  onAddSlot,
  onEditDependant,
  onEditSelf,
}: {
  summary: FamilySlotSummary
  selected?: string
  onSelect?: (relationship: FamilyRelationship) => void
  benefitLabels: Record<string, string>
  employee?: EmployeeFormData
  dependants?: DependantFormData[]
  onAddSlot?: (relationship: FamilyRelationship) => void
  onEditDependant?: (dependant: DependantFormData) => void
  onEditSelf?: () => void
}) {
  if (employee) {
    return (
      <FamilyBoard
        summary={summary}
        employee={employee}
        dependants={dependants}
        onAddSlot={onAddSlot}
        onEditDependant={onEditDependant}
        onEditSelf={onEditSelf}
      />
    )
  }

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

function FamilyBoard({
  summary,
  employee,
  dependants,
  onAddSlot,
  onEditDependant,
  onEditSelf,
}: {
  summary: FamilySlotSummary
  employee: EmployeeFormData
  dependants: DependantFormData[]
  onAddSlot?: (relationship: FamilyRelationship) => void
  onEditDependant?: (dependant: DependantFormData) => void
  onEditSelf?: () => void
}) {
  const spouseSlot = summary.slots.find((slot) => slot.relationship === 'Spouse')
  const childSlot = summary.slots.find((slot) => slot.relationship === 'Child')
  const extraSlots = summary.slots.filter(
    (slot) => slot.relationship !== 'Spouse' && slot.relationship !== 'Child',
  )
  const spouses = dependants.filter((item) => item.relationship === 'Spouse')
  const children = dependants.filter((item) => item.relationship === 'Child')
  const childCount = childSlot?.maxSlots ?? 0

  return (
    <Board>
      <Section>
        <SectionTitle>You and your spouse</SectionTitle>
        <Row>
          <FilledCard>
            <CardTop>
              <Identity>
                <Avatar>
                  <AvatarBg src={assets.familyAvatarBg} alt="" />
                  <AvatarFace src={assets.avatar} alt="" />
                </Avatar>
                <div>
                  <PersonName>
                    {[employee.firstName, employee.lastName]
                      .filter(Boolean)
                      .join(' ') || 'Employee'}
                  </PersonName>
                  <Relationship>Self</Relationship>
                </div>
              </Identity>
              {onEditSelf ? (
                <IconButton type="button" aria-label="Edit employee" onClick={onEditSelf}>
                  <img src={assets.iconEditGreen} alt="" width={20} height={20} />
                </IconButton>
              ) : null}
            </CardTop>
            <MetaRow>
              {employee.dateOfBirth ? (
                <MetaItem>
                  <img src={assets.iconCakeFamily} alt="" width={20} height={20} />
                  {employee.dateOfBirth}
                </MetaItem>
              ) : null}
              {employee.mobile ? (
                <MetaItem>
                  <img src={assets.iconPhoneFamily} alt="" width={20} height={20} />
                  {employee.mobile}
                </MetaItem>
              ) : null}
            </MetaRow>
          </FilledCard>
          {spouses.map((dependant) => (
            <FilledMemberCard
              key={dependant.id}
              dependant={dependant}
              onEdit={onEditDependant}
            />
          ))}
          {spouseSlot
            ? Array.from({ length: spouseSlot.remainingSlots }, (_, index) => (
                <EmptySlot
                  key={`spouse-empty-${index}`}
                  label="Add spouse"
                  disabled={!onAddSlot}
                  onClick={() => onAddSlot?.('Spouse')}
                />
              ))
            : null}
        </Row>
      </Section>

      {childCount > 0 ? (
        <Section>
          <SectionHeading>
            <SectionTitle>{childCount} Kids</SectionTitle>
            <SectionHint>
              This insures {childCount} kids, with maximum age of 25 years.
            </SectionHint>
          </SectionHeading>
          <Row>
            {children.map((dependant) => (
              <FilledMemberCard
                key={dependant.id}
                dependant={dependant}
                onEdit={onEditDependant}
              />
            ))}
            {childSlot
              ? Array.from({ length: childSlot.remainingSlots }, (_, index) => (
                  <EmptySlot
                    key={`child-empty-${index}`}
                    label="Add child"
                    disabled={!onAddSlot}
                    onClick={() => onAddSlot?.('Child')}
                  />
                ))
              : null}
          </Row>
        </Section>
      ) : null}

      {extraSlots.map((slot) => {
        const members = dependants.filter(
          (item) => item.relationship === slot.relationship,
        )
        return (
          <Section key={slot.relationship}>
            <SectionTitle>{slot.relationship}</SectionTitle>
            <Row>
              {members.map((dependant) => (
                <FilledMemberCard
                  key={dependant.id}
                  dependant={dependant}
                  onEdit={onEditDependant}
                />
              ))}
              {Array.from({ length: slot.remainingSlots }, (_, index) => (
                <EmptySlot
                  key={`${slot.relationship}-empty-${index}`}
                  label={`Add ${slot.relationship.toLowerCase()}`}
                  disabled={!onAddSlot}
                  onClick={() => onAddSlot?.(slot.relationship)}
                />
              ))}
            </Row>
          </Section>
        )
      })}
    </Board>
  )
}

function FilledMemberCard({
  dependant,
  onEdit,
}: {
  dependant: DependantFormData
  onEdit?: (dependant: DependantFormData) => void
}) {
  return (
    <FilledCard>
      <CardTop>
        <Identity>
          <Avatar>
            <AvatarBg src={assets.familyAvatarBg} alt="" />
            <AvatarFace src={assets.avatar} alt="" />
          </Avatar>
          <div>
            <PersonName>
              {[dependant.firstName, dependant.lastName]
                .filter(Boolean)
                .join(' ') || dependant.relationship}
            </PersonName>
            <Relationship>{dependant.relationship}</Relationship>
          </div>
        </Identity>
        {onEdit ? (
          <IconButton
            type="button"
            aria-label={`Edit ${dependant.relationship}`}
            onClick={() => onEdit(dependant)}
          >
            <img src={assets.iconEditGreen} alt="" width={20} height={20} />
          </IconButton>
        ) : null}
      </CardTop>
      <MetaRow>
        {dependant.dateOfBirth ? (
          <MetaItem>
            <img src={assets.iconCakeFamily} alt="" width={20} height={20} />
            {dependant.dateOfBirth}
          </MetaItem>
        ) : null}
        {dependant.mobile ? (
          <MetaItem>
            <img src={assets.iconPhoneFamily} alt="" width={20} height={20} />
            {dependant.mobile}
          </MetaItem>
        ) : null}
      </MetaRow>
    </FilledCard>
  )
}

function EmptySlot({
  label,
  disabled,
  onClick,
}: {
  label: string
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <EmptyCard type="button" disabled={disabled} onClick={onClick}>
      {label}
    </EmptyCard>
  )
}

const Board = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
`

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const SectionHeading = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 8px;

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    align-items: flex-start;
    flex-direction: column;
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

const SectionHint = styled.span`
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const Row = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: 1fr;
    gap: 12px;
  }
`

const FilledCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 116px;
  padding: 16px;
  border: 1px solid ${({ theme }) => theme.colors.defaultBorder};
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.surface1};
  box-sizing: border-box;

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    padding: 14px;
  }
`

const CardTop = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
`

const Identity = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    gap: 12px;
  }
`

const Avatar = styled.span`
  position: relative;
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  overflow: hidden;
  border-radius: 50%;
`

const AvatarBg = styled.img`
  position: absolute;
  inset: 0;
  width: 48px;
  height: 48px;
`

const AvatarFace = styled.img`
  position: absolute;
  inset: 0;
  width: 48px;
  height: 48px;
  object-fit: cover;
`

const PersonName = styled.p`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  line-height: 24px;
  color: ${({ theme }) => theme.colors.textPrimary};
  overflow-wrap: anywhere;
`

const Relationship = styled.p`
  margin: 0;
  font-size: 12px;
  font-weight: 500;
  line-height: 18px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const IconButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
`

const MetaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 48px;

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    gap: 12px 20px;
  }
`

const MetaItem = styled.span`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const EmptyCard = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 116px;
  padding: 16px;
  border: 2px dashed ${({ theme }) => theme.colors.defaultBorder};
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.planeGreenLight};
  color: ${({ theme }) => theme.colors.emerald};
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  letter-spacing: 0.2px;
  cursor: pointer;

  &:disabled {
    cursor: default;
    opacity: 0.7;
  }
`

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
