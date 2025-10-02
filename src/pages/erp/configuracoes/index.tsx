import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Redirect PT-BR → EN canonical
 * /erp/configuracoes → /erp/settings/organization
 */
export default function ConfiguracoesRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/erp/settings/organization', { replace: true });
  }, [navigate]);

  return null;
}
