import styled from 'styled-components'

import { assets } from '@/assets/figma'

/** Figma node 896:19478 — 154×154 slot with layered calendar art */
export function BannerCalendarArt() {
  return (
    <Slot aria-hidden>
      <Layer $inset="13.86% 20.68% 13.96% 21.08%">
        <img src={assets.bannerCal1} alt="" />
      </Layer>
      <Layer $inset="40.59% 31.62% 35.31% 44.22%">
        <img src={assets.bannerCal2} alt="" />
      </Layer>
      <Layer $inset="41.58% 25.03% 47.12% 58.6%">
        <img src={assets.bannerCal3} alt="" />
      </Layer>
    </Slot>
  )
}

const Slot = styled.div`
  position: relative;
  width: 154px;
  height: 154px;
  overflow: hidden;
  flex-shrink: 0;
`

const Layer = styled.div<{ $inset: string }>`
  position: absolute;
  inset: ${({ $inset }) => $inset};

  img {
    display: block;
    width: 100%;
    height: 100%;
    max-width: none;
  }
`
