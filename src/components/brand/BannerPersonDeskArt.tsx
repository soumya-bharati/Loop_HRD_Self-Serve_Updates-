import styled from 'styled-components'

import { assets } from '@/assets/figma'

/** Figma node 74:192147 — person-at-desk illustration for Employees banner */
export function BannerPersonDeskArt() {
  return (
    <Slot aria-hidden>
      <Art>
        <img src={assets.bannerPersonDesk} alt="" />
      </Art>
    </Slot>
  )
}

const Slot = styled.div`
  position: relative;
  width: 73px;
  height: 64px;
  flex-shrink: 0;
`

const Art = styled.div`
  position: absolute;
  inset: -3.12% 1.37% -28.31% -32.81%;

  img {
    display: block;
    width: 100%;
    height: 100%;
    max-width: none;
  }
`
