import styled from 'styled-components'

import { assets } from '@/assets/figma'

export function LoopLogo() {
  return (
    <Wrap aria-label="loop">
      <Mark src={assets.loopLogo} alt="" width={48} height={24} />
    </Wrap>
  )
}

const Wrap = styled.div`
  display: flex;
  align-items: center;
  width: 48px;
  height: 24px;
`

const Mark = styled.img`
  display: block;
  width: 48px;
  height: 24px;
  object-fit: contain;
`
