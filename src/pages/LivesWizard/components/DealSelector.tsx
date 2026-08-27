import styled from 'styled-components'

import { assets } from '@/assets/figma'
import type { FlexDealConfig } from '@/domain/flex'

export function DealSelector({
  deals,
  value,
  onChange,
  compact = false,
  embedded = false,
}: {
  deals: FlexDealConfig[]
  value: string | null
  onChange: (dealId: string) => void
  compact?: boolean
  embedded?: boolean
}) {
  if (deals.length === 0) return null

  const selectedDeal = value
    ? deals.find((deal) => deal.id === value)
    : deals.length === 1
      ? deals[0]
      : undefined

  if (compact && selectedDeal) {
    return (
      <Context>
        <ContextLabel>Flex Deal</ContextLabel>
        <strong>{selectedDeal.name}</strong>
        <span>· {selectedDeal.periodLabel}</span>
      </Context>
    )
  }

  return (
    <Section $embedded={embedded}>
      {!compact ? <Title>In which you want to add?</Title> : null}
      <Grid $list={embedded}>
        {deals.map((deal) => {
          const selected = value === deal.id
          const coverageCount = deal.benefits.length
          return (
            <Card
              key={deal.id}
              type="button"
              $selected={selected}
              $list={embedded}
              onClick={() => onChange(deal.id)}
              aria-pressed={selected}
            >
              <CardMain>
                <IconBox>
                  <IconImg
                    src={assets.flexDealIcon}
                    alt=""
                    width={48}
                    height={48}
                  />
                </IconBox>
                <Copy>
                  <CardName>{deal.name}</CardName>
                  <MetaRow>
                    <Period>{deal.periodLabel}</Period>
                    <MetaDot
                      src={assets.sepDot}
                      alt=""
                      width={6}
                      height={6}
                      aria-hidden
                    />
                    <Coverages>
                      {coverageCount} Coverage
                      {coverageCount === 1 ? '' : 's'} Available
                    </Coverages>
                  </MetaRow>
                </Copy>
              </CardMain>
              {selected ? <SelectedBadge>Selected</SelectedBadge> : null}
            </Card>
          )
        })}
      </Grid>
    </Section>
  )
}

const Section = styled.section<{ $embedded?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: ${({ $embedded }) => ($embedded ? '0' : '16px')};
  border-radius: ${({ $embedded }) => ($embedded ? '0' : '16px')};
  background: ${({ theme, $embedded }) =>
    $embedded ? 'transparent' : theme.colors.surface1};
  overflow: ${({ $embedded }) => ($embedded ? 'visible' : 'hidden')};
`

const Title = styled.h2`
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const Grid = styled.div<{ $list?: boolean }>`
  display: flex;
  flex-direction: ${({ $list }) => ($list ? 'column' : 'row')};
  gap: 16px;
  align-items: stretch;
  width: 100%;

  @media (max-width: 900px) {
    flex-direction: column;
  }
`

const Card = styled.button<{ $selected: boolean; $list?: boolean }>`
  flex: ${({ $list }) => ($list ? 'none' : '1 0 0')};
  width: ${({ $list }) => ($list ? '100%' : 'auto')};
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid
    ${({ theme, $selected }) =>
      $selected ? theme.colors.emerald : theme.colors.disableFill};
  background: ${({ theme, $selected }) =>
    $selected ? theme.colors.planeGreenLight : theme.colors.surface1};
  text-align: left;
  font-family: ${({ theme }) => theme.fontFamily};
  cursor: pointer;
  box-sizing: border-box;
`

const CardMain = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
`

const IconBox = styled.div`
  position: relative;
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  border-radius: 6px;
  background: conic-gradient(
    from 90deg,
    #025f4c 0%,
    #0e674a 6.25%,
    #196f49 12.5%,
    #317e46 25%,
    #488e42 37.5%,
    #609e3f 50%,
    #8ebd39 75%,
    #bddc32 100%
  );
`

const IconImg = styled.img`
  position: absolute;
  inset: 0;
  width: 48px;
  height: 48px;
  object-fit: cover;
  filter: drop-shadow(0px 4px 7px rgba(0, 0, 0, 0.36));
`

const Copy = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
`

const CardName = styled.p`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  line-height: 24px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textPrimary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const MetaRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  width: 100%;
`

const Period = styled.span`
  flex-shrink: 0;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const MetaDot = styled.img`
  flex-shrink: 0;
  width: 6px;
  height: 6px;
  display: block;
`

const Coverages = styled.span`
  min-width: 0;
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textPrimary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const SelectedBadge = styled.span`
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 99px;
  background: #c0d7d2;
  font-size: 12px;
  font-weight: 500;
  line-height: 18px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.planeGreenDark};
`

const Context = styled.div`
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.planeGreenLight};
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};

  strong {
    color: ${({ theme }) => theme.colors.emerald};
  }
`

const ContextLabel = styled.span`
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
`
