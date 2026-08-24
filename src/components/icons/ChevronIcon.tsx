import type { ImgHTMLAttributes } from 'react'
import styled from 'styled-components'

import { assets } from '@/assets/figma'

type ChevronDirection = 'up' | 'down' | 'right'

const srcByDirection: Record<ChevronDirection, string> = {
  up: assets.chevronUp,
  down: assets.chevronDown,
  right: assets.chevronRight,
}

interface ChevronIconProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  direction: ChevronDirection
  size?: number
}

export function ChevronIcon({ direction, size = 24, alt = '', ...rest }: ChevronIconProps) {
  return (
    <Icon
      src={srcByDirection[direction]}
      alt={alt}
      width={size}
      height={size}
      $size={size}
      {...rest}
    />
  )
}

const Icon = styled.img<{ $size: number }>`
  width: ${({ $size }) => $size}px;
  height: ${({ $size }) => $size}px;
  display: block;
  flex-shrink: 0;
`
