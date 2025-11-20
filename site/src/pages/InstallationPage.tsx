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
              Siga este guia para instalação, ativação inicial online e operação offline segura.
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
                    Primeiro, adquira um plano no nosso site. 
                    Após a criação da conta e confirmação, você receberá um email de boas‑vindas 
                    com os detalhes da conta e o link para download do instalador.
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
                    Baixar o Instalador pelo site (opcional)
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Você também pode baixar diretamente pelo nosso canal oficial. Clique em <strong>Download</strong> na página
                    e escolha a versão de <strong>Windows</strong>. Mesmo assim, você receberá o email de boas‑vindas com o link
                    e instruções para ativação.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <a
                      href="https://2fsolutions.itch.io/f-flow"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-outline inline-flex items-center"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Abrir página de download
                    </a>
                  </div>
                  <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <AlertCircle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
                      <div>
                        <p className="text-sm text-yellow-800">
                          No momento, o serviço roda apenas <strong>em uma máquina</strong> por licença.
                          A ativação vincula sua licença ao dispositivo escolhido. Para trocar de máquina,
                          entre em contato com o suporte.
                        </p>
                      </div>
                    </div>
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
                    Receba e Baixe o Instalador (via Email)
                  </h3>
                  <p className="text-gray-600 mb-4">
                    O instalador é enviado por email com um botão de download. 
                    Utilize o link do email para baixar o arquivo. O instalador tem aproximadamente 150MB.
                  </p>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-sm text-gray-600">
                      <strong>Arquivo:</strong> f-flow-suite-installer.exe<br />
                      <strong>Tamanho:</strong> ~150MB<br />
                      <strong>Versão:</strong> {import.meta.env.VITE_APP_VERSION ?? 'dev'}
                    </p>
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

              {/* Step 5 */}
              <div className="flex items-start">
                <div className="bg-primary-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 mt-1">
                  5
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Ative sua Licença (Login Online)
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Na primeira execução, conecte‑se à internet e faça login com seu 
                    email e senha cadastrados. O sistema se comunica com nosso servidor de licenças (Hub)
                    para validar e vincular sua licença ao dispositivo automaticamente.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                      <span className="text-gray-700">Email da conta</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                      <span className="text-gray-700">Senha de acesso</span>
                    </div>
                    <div className="flex items-start">
                      <AlertCircle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
                      <span className="text-gray-700">
                        Conexão com internet é obrigatória apenas nesta ativação inicial para validação no Hub.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 6 */}
              <div className="flex items-start">
                <div className="bg-primary-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 mt-1">
                  6
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Operação Offline Segura
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Após a ativação online, o sistema pode operar sem internet por um período limitado.
                    Mantenha a conexão com o Hub periodicamente para renovar a validação.
                  </p>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
                      <div>
                        <p className="text-sm text-green-800">
                          Limite de uso offline: por padrão até 5 dias sem contato com o Hub
                          (configurável). Se excedido, o sistema solicita login online e pode encerrar
                          sessões ativas.
                        </p>
                        <p className="text-xs text-green-700 mt-2">
                          Dica: o aplicativo mostra "Restam X dias offline" na barra superior quando o Hub está indisponível.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Offline Policy */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Política de Operação Offline</h2>
            <div className="space-y-6">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-2">Como funciona</h3>
                <ul className="text-gray-700 space-y-2">
                  <li>• Ativação inicial exige login online para validar a licença no Hub.</li>
                  <li>• Após ativado, o sistema utiliza o token de licença local para operar offline.</li>
                  <li>• Existe um período máximo sem comunicação com o Hub (padrão 5 dias, configurável via ambiente).</li>
                  <li>• Há também um período de graça da licença local; expirada e fora da graça, o acesso é bloqueado.</li>
                </ul>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-yellow-700 mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm text-yellow-800">
                      Se ultrapassar o limite de dias offline sem sincronizar com o Hub,
                      o login offline é bloqueado e será necessário reconectar e fazer login online.
                    </p>
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
                  Não consigo ativar / fazer login
                </h3>
                <p className="text-gray-600 mb-2">
                  Verifique sua conexão com a internet e confirme email/senha.
                  A ativação inicial requer comunicação com o Hub.
                </p>
                <p className="text-sm text-gray-500">
                  Se o Hub estiver indisponível, tente novamente mais tarde ou use o modo offline se já estiver validado.
                </p>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Bloqueio por excesso de tempo offline
                </h3>
                <p className="text-gray-600 mb-2">
                  O sistema bloqueia o login offline após exceder o limite de dias sem o Hub (padrão 5).
                </p>
                <p className="text-sm text-gray-500">
                  Reconecte à internet e faça login online para revalidar sua licença.
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