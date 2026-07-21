import { Outlet, Route, Routes } from 'react-router-dom'
import App from './App'
import DashboardPage from './account/DashboardPage'
import AccountSettingsPage from './account/AccountSettingsPage'
import SavedPlanPage from './account/SavedPlanPage'
import { LoginPage, RecoveryPage, SignupPage, VerifyPhonePage } from './auth/AuthPages'
import { ProtectedRoute } from './auth/ProtectedRoute'
import AppHeader from './components/AppHeader'

function SiteLayout() { return <><AppHeader/><Outlet/></> }

export default function AppRouter() {
  return <Routes>
    <Route element={<SiteLayout/>}>
      <Route index element={<App/>}/>
      <Route path="account" element={<ProtectedRoute><DashboardPage/></ProtectedRoute>}/>
      <Route path="account/plans/:planId" element={<ProtectedRoute><SavedPlanPage/></ProtectedRoute>}/>
      <Route path="account/settings" element={<ProtectedRoute><AccountSettingsPage/></ProtectedRoute>}/>
      <Route path="me" element={<ProtectedRoute><DashboardPage/></ProtectedRoute>}/>
      <Route path="me/plans/:planId" element={<ProtectedRoute><SavedPlanPage/></ProtectedRoute>}/>
      <Route path="me/settings" element={<ProtectedRoute><AccountSettingsPage/></ProtectedRoute>}/>
    </Route>
    <Route path="login" element={<LoginPage/>}/>
    <Route path="signup" element={<SignupPage/>}/>
    <Route path="verify-phone" element={<VerifyPhonePage/>}/>
    <Route path="recover" element={<RecoveryPage/>}/>
    <Route path="*" element={<main className="route-state" dir="rtl"><h1>این صفحه پیدا نشد</h1><a href="/">بازگشت به MarketPilot</a></main>}/>
  </Routes>
}
