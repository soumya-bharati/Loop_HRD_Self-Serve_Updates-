import { createGlobalStyle } from 'styled-components'

export const GlobalStyle = createGlobalStyle`
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  html,
  body,
  #root {
    margin: 0;
    min-height: 100%;
    max-width: 100%;
  }

  body {
    overflow-x: hidden;
    font-family: ${({ theme }) => theme.fontFamily};
    background: ${({ theme }) => theme.colors.surface0};
    color: ${({ theme }) => theme.colors.textPrimary};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  button,
  input,
  select,
  textarea {
    font: inherit;
  }

  img,
  svg {
    max-width: 100%;
  }

  button,
  [role='button'] {
    touch-action: manipulation;
  }
`
