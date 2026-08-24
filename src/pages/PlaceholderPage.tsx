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
  h1 {
    margin: 0 0 8px;
    font-size: 28px;
  }

  p {
    margin: 0;
    color: ${({ theme }) => theme.colors.textSecondary};
  }
`
