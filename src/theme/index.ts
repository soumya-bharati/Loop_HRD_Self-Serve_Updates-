export const theme = {
  colors: {
    emerald: '#025F4C',
    planeGreenDark: '#0D7963',
    fillGreen: '#BCDD33',
    planeGreenLight: '#E6EFED',
    bannerMint: '#EBF4F1',
    surface0: '#F8F9FA',
    surface1: '#FFFFFF',
    fillRed: '#FF8080',
    textPrimary: '#595959',
    textSecondary: '#7F8785',
    textTertiary: '#FFFFFF',
    textError: '#EB5757',
    defaultBorder: '#CBD6D3',
    disableFill: '#EEEEEE',
    beyondGrey: '#595959',
    yellow: '#FDD506',
    turquoise: '#36D6C3',
  },
  radii: {
    sm: '8px',
    md: '12px',
    full: '999px',
  },
  fontFamily: "'Work Sans', system-ui, sans-serif",
  shadows: {
    nav: '0px 2px 8px 0px rgba(55, 65, 81, 0.06)',
    smooth: '0px 0px 16px 0px rgba(55, 65, 81, 0.03)',
  },
  layout: {
    sidebarWidth: '190px',
    topNavHeight: '64px',
    contentPadX: '56px',
  },
} as const

export type AppTheme = typeof theme
