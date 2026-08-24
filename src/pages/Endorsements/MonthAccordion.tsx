import styled from 'styled-components'

import { assets } from '@/assets/figma'
import { ChevronIcon } from '@/components/icons/ChevronIcon'
import type { MonthGroup } from '@/data/endorsements'
import { EndorsementCard } from '@/pages/Endorsements/EndorsementCard'

interface MonthAccordionProps {
  group: MonthGroup
  expanded: boolean
  onToggle: () => void
}

export function MonthAccordion({ group, expanded, onToggle }: MonthAccordionProps) {
  return (
    <Section>
      <Header type="button" onClick={onToggle} aria-expanded={expanded}>
        <Left>
          <Cal src={assets.monthCalendar} alt="" width={24} height={24} />
          <span>{group.label}</span>
        </Left>
        <ChevronIcon direction={expanded ? 'up' : 'down'} size={24} />
      </Header>

      {expanded ? (
        <Body>
          {group.endorsements.map((endo) => (
            <EndorsementCard key={endo.id} endorsement={endo} />
          ))}
        </Body>
      ) : null}
    </Section>
  )
}

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
`

const Header = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border: none;
  background: ${({ theme }) => theme.colors.surface1};
  padding: 28px ${({ theme }) => theme.layout.contentPadX};
  cursor: pointer;
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: 16px;
  font-weight: 400;
  line-height: 24px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const Left = styled.span`
  display: inline-flex;
  align-items: flex-start;
  gap: 8px;
`

const Cal = styled.img`
  width: 24px;
  height: 24px;
  flex-shrink: 0;
`

const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: 28px;
  width: 100%;
`
