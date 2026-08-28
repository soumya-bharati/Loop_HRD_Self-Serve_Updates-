import styled from 'styled-components'

import { assets } from '@/assets/figma'

interface SummaryCardsProps {
  ongoing: string
  completed: string
}

export function SummaryCards({ ongoing, completed }: SummaryCardsProps) {
  return (
    <Grid>
      <Card $variant="ongoing">
        <Row>
          <Dot src={assets.dotYellow} alt="" width={18} height={18} />
          <Label $variant="ongoing">Ongoing Endorsements</Label>
        </Row>
        <Count $variant="ongoing">{ongoing}</Count>
      </Card>
      <Card $variant="completed">
        <Row>
          <Dot src={assets.dotTurquoise} alt="" width={18} height={18} />
          <Label $variant="completed">Completed Requests</Label>
        </Row>
        <Count $variant="completed">{completed}</Count>
      </Card>
    </Grid>
  )
}

const Grid = styled.div`
  display: flex;
  gap: 14px;
  padding: 0 ${({ theme }) => theme.layout.contentPadX};

  @media (max-width: 900px) {
    gap: 12px;
  }

  @media (max-width: 720px) {
    flex-direction: column;
  }

  @media (max-width: 560px) {
    gap: 10px;
    padding: 0 16px;
  }
`

const Card = styled.div<{ $variant: 'ongoing' | 'completed' }>`
  flex: 1;
  min-width: 0;
  border-radius: ${({ theme }) => theme.radii.sm};
  padding: ${({ $variant }) => ($variant === 'ongoing' ? '16px 20px' : '16px')};
  background: ${({ theme, $variant }) =>
    $variant === 'ongoing' ? theme.colors.planeGreenDark : theme.colors.surface1};
  box-shadow: ${({ theme, $variant }) =>
    $variant === 'completed' ? theme.shadows.smooth : 'none'};
  overflow: hidden;

  @media (max-width: 720px) {
    flex: none;
    width: 100%;
  }

  @media (max-width: 560px) {
    padding: ${({ $variant }) => ($variant === 'ongoing' ? '14px 16px' : '14px 16px')};
  }
`

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`

const Dot = styled.img`
  width: 18px;
  height: 18px;
  flex-shrink: 0;
`

const Label = styled.span<{ $variant: 'ongoing' | 'completed' }>`
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  letter-spacing: 0.2px;
  color: ${({ theme, $variant }) =>
    $variant === 'ongoing' ? theme.colors.textTertiary : theme.colors.textPrimary};
`

const Count = styled.div<{ $variant: 'ongoing' | 'completed' }>`
  margin-top: 8px;
  padding-left: 30px;
  font-size: 18px;
  font-weight: 600;
  line-height: 24px;
  color: ${({ theme, $variant }) =>
    $variant === 'ongoing' ? theme.colors.textTertiary : theme.colors.textPrimary};
`
