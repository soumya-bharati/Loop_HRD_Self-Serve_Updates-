import { useState } from 'react'
import styled from 'styled-components'

import { ProtoConfigModal } from '@/proto/ProtoConfigModal'
import { useProtoConfig } from '@/proto/ProtoConfigContext'

function countLabel(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`
}

export function ProtoControlBar() {
  const [open, setOpen] = useState(false)
  const { entities, deals } = useProtoConfig()

  return (
    <>
      <Bar>
        <Left>
          <Tag>Prototype</Tag>
          <Summary>
            {countLabel(entities.length, 'entity', 'entities')} ·{' '}
            {countLabel(deals.length, 'flex deal', 'flex deals')}
          </Summary>
        </Left>
        <Cta type="button" onClick={() => setOpen(true)}>
          Configure account
        </Cta>
      </Bar>

      <ProtoConfigModal open={open} onClose={() => setOpen(false)} />
    </>
  )
}

const Bar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  min-height: 44px;
  padding: 6px 24px;
  background: #111111;
  box-sizing: border-box;

  @media (max-width: 900px) {
    padding: 6px 20px;
    gap: 12px;
  }

  @media (max-width: 720px) {
    flex-wrap: wrap;
    padding: 8px 16px;
  }

  @media (max-width: 560px) {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
    padding: 10px 12px;
  }
`

const Left = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;

  @media (max-width: 560px) {
    flex-wrap: wrap;
  }
`

const Tag = styled.span`
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  height: 20px;
  padding: 0 8px;
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ theme }) => theme.colors.fillGreen};
  color: ${({ theme }) => theme.colors.emerald};
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.4px;
  text-transform: uppercase;
`

const Summary = styled.span`
  min-width: 0;
  font-size: 12px;
  font-weight: 500;
  line-height: 18px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textTertiary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  @media (max-width: 720px) {
    white-space: normal;
    overflow: visible;
    text-overflow: unset;
  }
`

const Cta = styled.button`
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  height: 28px;
  padding: 0 14px;
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: ${({ theme }) => theme.radii.full};
  background: transparent;
  color: ${({ theme }) => theme.colors.textTertiary};
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.2px;
  cursor: pointer;

  @media (max-width: 560px) {
    width: 100%;
    justify-content: center;
    height: 32px;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.12);
    border-color: #ffffff;
  }
`
