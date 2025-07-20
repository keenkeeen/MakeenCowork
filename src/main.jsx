import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { CacheProvider } from '@emotion/react'
import createCache from '@emotion/cache'
import rtlPlugin from 'stylis-plugin-rtl'
import { prefixer } from 'stylis'
import { useState } from 'react'

const Main = () => {
  const [darkMode, setDarkMode] = useState(false)
  const theme = createTheme({
    direction: 'rtl',
    palette: {
      mode: 'light',
      primary: { main: '#1976d2' },
      secondary: { main: '#fbc02d' },
    },
    typography: {
      fontFamily: 'Vazirmatn, Arial, sans-serif',
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: darkMode ? { backgroundColor: '#23272f', color: '#fff' } : {},
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: darkMode ? { backgroundColor: '#23272f', color: '#fff' } : {},
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: darkMode ? { color: '#fff', borderColor: '#333' } : {},
          head: darkMode ? { color: '#fff', fontWeight: 700 } : {},
        },
      },
      MuiTypography: {
        styleOverrides: {
          root: darkMode ? { color: '#fff' } : {},
        },
      },
      MuiInputBase: {
        styleOverrides: {
          root: darkMode ? { color: '#fff' } : {},
          input: darkMode ? { color: '#fff' } : {},
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          notchedOutline: darkMode ? { borderColor: '#555' } : {},
        },
      },
      MuiChip: {
        styleOverrides: {
          root: darkMode ? { color: '#fff', background: '#333' } : {},
        },
      },
      MuiButton: {
        styleOverrides: {
          root: darkMode ? { color: '#fff' } : {},
        },
      },
    },
  })
  const cacheRtl = createCache({
    key: 'muirtl',
    stylisPlugins: [prefixer, rtlPlugin],
  })
  return (
    <CacheProvider value={cacheRtl}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <StrictMode>
          <App />
        </StrictMode>
      </ThemeProvider>
    </CacheProvider>
  )
}

createRoot(document.getElementById('root')).render(<Main />)
