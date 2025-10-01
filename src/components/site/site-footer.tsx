import { Link } from 'react-router-dom';
import { Package2 } from 'lucide-react';

export function SiteFooter() {
  return (
    <footer className="border-t bg-muted/50">
      <div className="container-2f py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <Package2 className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg">2F Solutions</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Sistema completo de gestão para o seu comércio.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Produto</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/planos" className="text-muted-foreground hover:text-primary transition-colors">
                  Planos
                </Link>
              </li>
              <li>
                <Link to="/" className="text-muted-foreground hover:text-primary transition-colors">
                  Funcionalidades
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Empresa</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/contato" className="text-muted-foreground hover:text-primary transition-colors">
                  Contato
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Termos de Uso
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Privacidade
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} 2F Solutions. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}
