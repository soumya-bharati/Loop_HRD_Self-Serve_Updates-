import styled from 'styled-components'

export type CoverageMember = {
  name: string
  meta: string
}

export type CoverageGroup = {
  id: string
  label: string
  kind: 'policy' | 'plan' | 'benefit'
  members: CoverageMember[]
}

export function AssignmentSummary({
  groups,
}: {
  groups: CoverageGroup[]
}) {
  if (groups.length === 0) {
    return (
      <Wrap>
        <Section>
          <Title>Coverage</Title>
          <Empty>No policies or benefits selected yet.</Empty>
        </Section>
      </Wrap>
    )
  }

  return (
    <Wrap>
      <Section>
        <Title>Who’s covered</Title>
        <GroupList>
          {groups.map((group) => (
            <Group key={group.id}>
              <GroupHeader>
                <GroupLabel>{group.label}</GroupLabel>
                <KindBadge $kind={group.kind}>
                  {group.kind === 'policy'
                    ? 'Policy'
                    : group.kind === 'plan'
                      ? 'Plan'
                      : 'Benefit'}
                </KindBadge>
              </GroupHeader>
              <MemberList>
                {group.members.map((member) => (
                  <MemberRow key={`${group.id}-${member.name}-${member.meta}`}>
                    <MemberName>{member.name}</MemberName>
                    <MemberMeta>{member.meta}</MemberMeta>
                  </MemberRow>
                ))}
              </MemberList>
            </Group>
          ))}
        </GroupList>
      </Section>
    </Wrap>
  )
}

const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.surface1};
  border: 1px solid ${({ theme }) => theme.colors.disableFill};
`

const Title = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.beyondGrey};
`

const Empty = styled.p`
  margin: 0;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const GroupList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const Group = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border-radius: 10px;
  background: ${({ theme }) => theme.colors.surface0};
`

const GroupHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`

const GroupLabel = styled.div`
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const KindBadge = styled.span<{ $kind: CoverageGroup['kind'] }>`
  flex-shrink: 0;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 500;
  line-height: 16px;
  color: ${({ theme, $kind }) =>
    $kind === 'policy' ? theme.colors.emerald : theme.colors.textSecondary};
  background: ${({ theme, $kind }) =>
    $kind === 'policy'
      ? theme.colors.planeGreenLight
      : theme.colors.disableFill};
`

const MemberList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
`

const MemberRow = styled.li`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
  font-size: 13px;
  line-height: 18px;
`

const MemberName = styled.span`
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const MemberMeta = styled.span`
  color: ${({ theme }) => theme.colors.textSecondary};
  text-align: right;
`
