import Header from '../components/Header'
import Footer from '../components/Footer'
import { Download, CheckCircle, AlertCircle, Monitor, Smartphone } from 'lucide-react'

const InstallationPage = () => {
  return (
    <div className="min-h-screen">
      <Header />
      
      <div className="bg-white py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Guia de Instalação
            </h1>
            <p className="text-lg text-gray-600">
              Siga este guia passo a passo para instalar o F-Flow Suite no seu computador
            </p>
          </div>

          {/* System Requirements */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Requisitos do Sistema</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-start">
                <Monitor className="h-6 w-6 text-blue-600 mr-3 mt-1" />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-2">Requisitos Mínimos</h3>
                  <ul className="space-y-1 text-blue-800">
                    <li>• Windows 10 ou superior</li>
                    <li>• 4GB de RAM</li>
                    <li>• 2GB de espaço livre em disco</li>
                    <li>• Conexão com internet (apenas para ativação inicial)</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Installation Steps */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Passos de Instalação</h2>
            
            <div className="space-y-8">
              {/* Step 1 */}
              <div className="flex items-start">
                <div className="bg-primary-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 mt-1">
                  1
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Adquira sua Licença
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Primeiro, você precisa adquirir uma licença através do nosso site. 
                    Após o pagamento, você receberá um email com os dados de acesso.
                  </p>
                  <a
                    href={`${import.meta.env.VITE_SITE_URL}/planos`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary inline-flex items-center"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Adquirir Licença
                  </a>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start">
                <div className="bg-primary-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 mt-1">
                  2
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Baixe o Instalador
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Após a compra, você receberá um link para download do instalador. 
                    O arquivo tem aproximadamente 150MB.
                  </p>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-sm text-gray-600">
                      <strong>Arquivo:</strong> f-flow-suite-installer.exe<br />
                      <strong>Tamanho:</strong> ~150MB<br />
                      <strong>Versão:</strong> 1.0.0
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start">
                <div className="bg-primary-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 mt-1">
                  3
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Execute a Instalação
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Execute o arquivo baixado como administrador e siga as instruções na tela.
                  </p>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <AlertCircle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
                      <div>
                        <p className="text-sm text-yellow-800">
                          <strong>Importante:</strong> Execute sempre como administrador para 
                          garantir que todos os componentes sejam instalados corretamente.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex items-start">
                <div className="bg-primary-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 mt-1">
                  4
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Ative sua Licença
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Na primeira execução, o sistema solicitará os dados da licença que 
                    você recebeu por email.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                      <span className="text-gray-700">Tenant ID</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                      <span className="text-gray-700">Chave de Licença</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                      <span className="text-gray-700">URL de Download</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 5 */}
              <div className="flex items-start">
                <div className="bg-primary-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 mt-1">
                  5
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Pronto para Usar!
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Após a ativação, o sistema estará pronto para uso. Você pode começar 
                    cadastrando seus dados básicos.
                  </p>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
                      <div>
                        <p className="text-sm text-green-800">
                          O sistema funcionará offline após a instalação. Conexão com internet 
                          é necessária apenas para atualizações.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Troubleshooting */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Solução de Problemas</h2>
            
            <div className="space-y-6">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Erro de Permissão durante a Instalação
                </h3>
                <p className="text-gray-600 mb-2">
                  Certifique-se de executar o instalador como administrador.
                </p>
                <p className="text-sm text-gray-500">
                  Clique com o botão direito no arquivo e selecione "Executar como administrador"
                </p>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Licença não Ativa
                </h3>
                <p className="text-gray-600 mb-2">
                  Verifique se os dados da licença foram inseridos corretamente.
                </p>
                <p className="text-sm text-gray-500">
                  Copie e cole os dados exatamente como recebidos no email
                </p>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Sistema não Inicia
                </h3>
                <p className="text-gray-600 mb-2">
                  Verifique se todos os requisitos do sistema foram atendidos.
                </p>
                <p className="text-sm text-gray-500">
                  Entre em contato com o suporte se o problema persistir
                </p>
              </div>
            </div>
          </section>

          {/* Support */}
          <section className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Precisa de Ajuda?
            </h2>
            <p className="text-gray-600 mb-6">
              Nossa equipe de suporte está pronta para ajudar você
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:suporte@fflowsuite.com"
                className="btn-primary px-6 py-3"
              >
                Contatar Suporte
              </a>
              <a
                href="https://wa.me/5511999999999"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline px-6 py-3"
              >
                WhatsApp
              </a>
            </div>
          </section>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default InstallationPage