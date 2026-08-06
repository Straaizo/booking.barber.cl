import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import { queryClient } from './services/queryClient'
import { AppRouter } from './routes/AppRouter'
import { Cursor } from './components/common/Cursor'
import { AuthProvider } from './context/AuthContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Cursor />
        <AppRouter />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>
)
