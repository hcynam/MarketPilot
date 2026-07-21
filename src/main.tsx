import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import AppRouter from './AppRouter'
import { AuthProvider } from './auth/AuthContext'
import { PlanAccessProvider } from './plans/PlanAccessContext'

const root = document.getElementById('root')
if (!root) throw new Error('Root element not found')

createRoot(root).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <PlanAccessProvider>
          <AppRouter />
        </PlanAccessProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
