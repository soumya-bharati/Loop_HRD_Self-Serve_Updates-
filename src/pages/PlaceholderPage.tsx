import styled from 'styled-components'

interface PlaceholderPageProps {
  title: string
}

export function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <Wrap>
      <h1>{title}</h1>
      <p>This module will be available soon.</p>
    </Wrap>
  )
}

const Wrap = styled.div`
  width: 100%;
  padding: 40px ${({ theme }) => theme.layout.contentPadX} 64px;
  box-sizing: border-box;

  @media (max-width: 900px) {
    padding: 32px 24px 48px;
  }

  @media (max-width: 720px) {
    padding: 28px 20px 40px;
  }

  @media (max-width: 560px) {
    padding: 24px 16px 32px;
  }

  h1 {
    margin: 0 0 8px;
    font-size: 28px;
    line-height: 1.2;
    word-wrap: break-word;
    overflow-wrap: break-word;

    @media (max-width: 720px) {
      font-size: 24px;
    }

    @media (max-width: 560px) {
      font-size: 22px;
    }
  }

  p {
    margin: 0;
    color: ${({ theme }) => theme.colors.textSecondary};
    font-size: 14px;
    line-height: 20px;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }
`
