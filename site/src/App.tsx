import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './auth-context'
import HomePage from './pages/HomePage'
import DocsPage from './pages/DocsPage'
import InstallationPage from './pages/InstallationPage'
import FeaturesPage from './pages/FeaturesPage'
import PricingPage from './pages/PricingPage'
import ContactPage from './pages/ContactPage'
import SignupPage from './pages/SignupPage'
import RenewalPage from './pages/RenewalPage'
import NotFoundPage from './pages/NotFoundPage'

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-white">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/recursos" element={<FeaturesPage />} />
          <Route path="/precos" element={<PricingPage />} />
          <Route path="/planos" element={<PricingPage />} />
          <Route path="/cadastro" element={<SignupPage />} />
          <Route path="/renovacao" element={<RenewalPage />} />
          <Route path="/docs" element={<DocsPage />} />
          <Route path="/docs/instalacao" element={<InstallationPage />} />
          <Route path="/contato" element={<ContactPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
    </AuthProvider>
  )
}

export default App