import styled from 'styled-components'

import { assets } from '@/assets/figma'

/** Insurer-share notice — Flex Self-Serve modal (`15:7376`). */
export function InsurerShareBanner() {
  return (
    <Banner>
      <Megaphone src={assets.modalAnnounce} alt="" width={36} height={36} />
      <Text>
        While you can submit your data with us, Loop will share the data with
        the insurer on the <Emphasis>1st of every month!</Emphasis>
      </Text>
    </Banner>
  )
}

const Banner = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px;
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.bannerMint};
  box-sizing: border-box;
`

const Megaphone = styled.img`
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  display: block;
  object-fit: contain;
`

const Text = styled.p`
  margin: 0;
  flex: 1;
  min-width: 0;
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const Emphasis = styled.span`
  font-weight: 600;
  color: ${({ theme }) => theme.colors.emerald};
`
