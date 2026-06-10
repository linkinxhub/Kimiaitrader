import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router'
import { TRPCProvider } from '@/providers/trpc'
import { ThemeProvider } from '@/hooks/useTheme'
import { ToastProvider } from '@/hooks/useToast'
import { ToastContainer } from '@/components/ToastContainer'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <TRPCProvider>
        <ThemeProvider>
          <ToastProvider>
            <App />
            <ToastContainer />
          </ToastProvider>
        </ThemeProvider>
      </TRPCProvider>
    </HashRouter>
  </StrictMode>,
)
