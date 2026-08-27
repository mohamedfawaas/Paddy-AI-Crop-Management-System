import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import { LanguageProvider } from './context/LanguageContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Login from './pages/Login'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import Dashboard from './pages/Dashboard'
import SuitabilityPage from './pages/SuitabilityPage'
import DiseasePage from './pages/DiseasePage'
import IrrigationPage from './pages/IrrigationPage'
import History from './pages/History'
import ProfilePage from './pages/ProfilePage'
import AdminPanel from './pages/AdminPanel'
import FertilizerPage from './pages/FertilizerPage'
import YieldPage from './pages/YieldPage'
import PestPage from './pages/PestPage'
import WeatherPage from './pages/WeatherPage'
import FarmManagementPage from './pages/FarmManagementPage'

function PrivateRoute({ children }) {
  const { isAuth, loading } = useAuth()
  if (loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh'}}>
      <span className="spinner" style={{width:36,height:36,borderWidth:3}}/>
    </div>
  )
  return isAuth ? children : <Navigate to="/login" replace />
}

function AdminRoute({ children }) {
  const { isAuth, user, loading } = useAuth()
  if (loading) return null
  if (!isAuth) return <Navigate to="/login" replace />
  if (user?.role !== 'ADMIN') return <Navigate to="/dashboard" replace />
  return children
}

function Layout({ children }) {
  return (
    <div className="page-wrapper">
      <Navbar />
      <main className="main-content">
        {children}
        <Footer/>
      </main>
    </div>
  )
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard"   element={<PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>} />
      <Route path="/suitability" element={<PrivateRoute><Layout><SuitabilityPage /></Layout></PrivateRoute>} />
      <Route path="/disease"     element={<PrivateRoute><Layout><DiseasePage /></Layout></PrivateRoute>} />
      <Route path="/irrigation"  element={<PrivateRoute><Layout><IrrigationPage /></Layout></PrivateRoute>} />
      <Route path="/fertilizer"  element={<PrivateRoute><Layout><FertilizerPage /></Layout></PrivateRoute>} />
      <Route path="/yield"       element={<PrivateRoute><Layout><YieldPage /></Layout></PrivateRoute>} />
      <Route path="/pest"        element={<PrivateRoute><Layout><PestPage /></Layout></PrivateRoute>} />
      <Route path="/weather"     element={<PrivateRoute><Layout><WeatherPage /></Layout></PrivateRoute>} />
      <Route path="/farms"       element={<PrivateRoute><Layout><FarmManagementPage /></Layout></PrivateRoute>} />
      <Route path="/history"     element={<PrivateRoute><Layout><History /></Layout></PrivateRoute>} />
      <Route path="/profile"     element={<PrivateRoute><Layout><ProfilePage /></Layout></PrivateRoute>} />
      <Route path="/admin"       element={<AdminRoute><Layout><AdminPanel /></Layout></AdminRoute>} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <Toaster position="top-right" toastOptions={{
            style:{ background:'#0f1f16', color:'#fff', border:'1px solid rgba(46,204,113,0.2)', fontSize:13 }
          }}/>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  )
}
