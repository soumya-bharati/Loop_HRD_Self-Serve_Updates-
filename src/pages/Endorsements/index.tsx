import { useState } from 'react'
import styled from 'styled-components'

import { endorsementsSummary, monthGroups } from '@/data/endorsements'
import { flexDeal } from '@/data/flexDeal'
import { MonthAccordion } from '@/pages/Endorsements/MonthAccordion'
import { SummaryCards } from '@/pages/Endorsements/SummaryCards'

export function EndorsementsPage() {
  const [expandedIds, setExpandedIds] = useState<string[]>(() =>
    monthGroups.map((g) => g.id),
  )

  return (
    <Page>
      <Content>
        <Intro>
          <Title>Endorsements</Title>
          <Description>
            {flexDeal.isFlexCompany
              ? 'Add, edit, or delete lives, assign Flex plans and benefits, and launch enrolments — then track endorsement status.'
              : 'Add, Edit, Delete lives from policies and track status for ongoing requests!'}
          </Description>
        </Intro>

        <SummaryCards
          ongoing={endorsementsSummary.ongoing}
          completed={endorsementsSummary.completed}
        />

        <List>
          {monthGroups.map((group) => (
            <MonthAccordion
              key={group.id}
              group={group}
              expanded={expandedIds.includes(group.id)}
              onToggle={() =>
                setExpandedIds((current) =>
                  current.includes(group.id)
                    ? current.filter((id) => id !== group.id)
                    : [...current, group.id],
                )
              }
            />
          ))}
        </List>
      </Content>

    </Page>
  )
}

const Page = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`

const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: 40px;
  padding: 40px 0 64px;
  width: 100%;

  @media (max-width: 900px) {
    gap: 32px;
    padding: 32px 0 48px;
  }

  @media (max-width: 720px) {
    gap: 28px;
    padding: 28px 0 40px;
  }

  @media (max-width: 560px) {
    gap: 24px;
    padding: 24px 0 32px;
  }
`

const Intro = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0 ${({ theme }) => theme.layout.contentPadX};

  @media (max-width: 560px) {
    padding: 0 16px;
  }
`

const Title = styled.h1`
  margin: 0;
  font-size: 20px;
  font-weight: 500;
  line-height: 24px;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const Description = styled.p`
  margin: 0;
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 56px;
  width: 100%;

  @media (max-width: 900px) {
    gap: 40px;
  }

  @media (max-width: 720px) {
    gap: 32px;
  }

  @media (max-width: 560px) {
    gap: 24px;
  }
`
