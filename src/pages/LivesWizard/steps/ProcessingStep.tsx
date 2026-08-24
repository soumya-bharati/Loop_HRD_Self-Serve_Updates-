import styled from 'styled-components'

import { useLivesWizard } from '@/pages/LivesWizard/WizardContext'

export function ProcessingStep() {
  const { processingProgress, rows } = useLivesWizard()
  const total = rows.filter((r) => r.status === 'pass').length
  const done = Math.round((processingProgress / 100) * total)

  return (
    <Wrap>
      <Title>Processing bulk addition</Title>
      <Copy>
        Validating, assigning, and submitting rows… {done}/{total}
      </Copy>
      <Bar>
        <Fill style={{ width: `${processingProgress}%` }} />
      </Bar>
      <Pct>{processingProgress}%</Pct>
    </Wrap>
  )
}

const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  flex: 1;
  min-height: 360px;
  padding: 48px;
`

const Title = styled.h1`
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.beyondGrey};
`

const Copy = styled.p`
  margin: 0;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const Bar = styled.div`
  width: min(420px, 100%);
  height: 10px;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.disableFill};
  overflow: hidden;
`

const Fill = styled.div`
  height: 100%;
  background: ${({ theme }) => theme.colors.emerald};
  transition: width 0.25s ease;
`

const Pct = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.emerald};
`
