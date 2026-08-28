import styled from 'styled-components'

export function WizardFooter({
  secondaryLabel,
  onSecondary,
  primaryLabel,
  onPrimary,
  primaryDisabled,
}: {
  secondaryLabel?: string
  onSecondary?: () => void
  primaryLabel: string
  onPrimary: () => void
  primaryDisabled?: boolean
}) {
  return (
    <Footer>
      {secondaryLabel && onSecondary ? (
        <Secondary type="button" onClick={onSecondary}>
          {secondaryLabel}
        </Secondary>
      ) : (
        <span />
      )}
      <Primary type="button" onClick={onPrimary} disabled={primaryDisabled}>
        {primaryLabel}
      </Primary>
    </Footer>
  )
}

const Footer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: auto;
  padding-top: 32px;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    align-items: stretch;
    flex-direction: column-reverse;
    padding-top: 20px;
  }
`

const Secondary = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 180px;
  height: 48px;
  padding: 0 24px;
  border: 1px solid ${({ theme }) => theme.colors.emerald};
  border-radius: ${({ theme }) => theme.radii.md};
  background: transparent;
  color: ${({ theme }) => theme.colors.emerald};
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  box-sizing: border-box;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    width: 100%;
    min-width: 0;
  }
`

const Primary = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 180px;
  height: 48px;
  padding: 0 24px;
  border: none;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.fillGreen};
  color: ${({ theme }) => theme.colors.emerald};
  font-family: ${({ theme }) => theme.fontFamily};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  box-sizing: border-box;

  &:disabled {
    background: ${({ theme }) => theme.colors.disableFill};
    color: ${({ theme }) => theme.colors.textSecondary};
    cursor: not-allowed;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    width: 100%;
    min-width: 0;
  }
`
