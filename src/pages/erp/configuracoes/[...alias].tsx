import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SETTINGS_ALIASES } from '@/routes/aliasMap';

/**
 * Catch-all para aliases PT-BR
 * Redireciona para a rota EN canonical correspondente
 */
export default function ConfiguracoesAlias() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const canonical = SETTINGS_ALIASES[pathname];
    if (canonical) {
      navigate(canonical, { replace: true });
    } else {
      // Fallback: se não encontrar no mapa, vai para organização
      navigate('/erp/settings/organization', { replace: true });
    }
  }, [pathname, navigate]);

  return null;
}
