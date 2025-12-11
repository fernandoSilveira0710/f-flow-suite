import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Redirect PT-BR → EN canonical
 * /erp/configuracoes → /erp/settings (index decidirá o primeiro permitido)
 */
export default function ConfiguracoesRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/erp/settings', { replace: true });
  }, [navigate]);

  return null;
}
