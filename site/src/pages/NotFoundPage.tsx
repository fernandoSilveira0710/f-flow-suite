import { Link } from 'react-router-dom'
import { Home, ArrowLeft, Search } from 'lucide-react'
import Header from '../components/Header'
import Footer from '../components/Footer'

const NotFoundPage = () => {
  const popularPages = [
    { name: 'Página Inicial', path: '/' },
    { name: 'Recursos', path: '/recursos' },
    { name: 'Preços', path: '/precos' },
    { name: 'Documentação', path: '/docs' },
    { name: 'Instalação', path: '/docs/instalacao' },
    { name: 'Contato', path: '/contato' }
  ]

  return (
    <div className="min-h-screen">
      <Header />
      
      <div className="min-h-screen bg-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-md w-full">
          <div className="text-center">
            {/* 404 Number */}
            <div className="mb-8">
              <h1 className="text-9xl font-bold text-primary-600 opacity-20">
                404
              </h1>
            </div>

            {/* Error Message */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Página não encontrada
              </h2>
              <p className="text-lg text-gray-600 mb-2">
                Ops! A página que você está procurando não existe.
              </p>
              <p className="text-gray-500">
                Ela pode ter sido movida, removida ou você digitou o endereço incorretamente.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link
                to="/"
                className="btn-primary flex items-center justify-center"
              >
                <Home className="mr-2 h-4 w-4" />
                Voltar ao Início
              </Link>
              <button
                onClick={() => window.history.back()}
                className="btn-outline flex items-center justify-center"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Página Anterior
              </button>
            </div>

            {/* Search Suggestion */}
            <div className="mb-12">
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-center justify-center mb-4">
                  <Search className="h-6 w-6 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Procurando algo específico?
                </h3>
                <p className="text-gray-600 text-sm">
                  Tente navegar pelas páginas populares abaixo ou entre em contato conosco.
                </p>
              </div>
            </div>

            {/* Popular Pages */}
            <div className="text-left">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                Páginas Populares
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {popularPages.map((page, index) => (
                  <Link
                    key={index}
                    to={page.path}
                    className="block px-4 py-2 text-sm text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
                  >
                    {page.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Help Section */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <p className="text-gray-600 text-sm mb-4">
                Ainda não encontrou o que procura?
              </p>
              <Link
                to="/contato"
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Entre em contato conosco →
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default NotFoundPage