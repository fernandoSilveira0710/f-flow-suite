/**
 * Mapa de aliases PT-BR → EN (canonical)
 * Usado para redirecionar rotas antigas/PT para as rotas EN oficiais
 */
export const SETTINGS_ALIASES: Record<string, string> = {
  '/erp/configuracoes': '/erp/settings/organization',
  '/erp/configurações': '/erp/settings/organization',
  '/erp/configuracoes/organizacao': '/erp/settings/organization',
  '/erp/configuracoes/usuarios': '/erp/settings/users',
  '/erp/configuracoes/papeis': '/erp/settings/roles',
  '/erp/configuracoes/faturamento': '/erp/settings/billing',
  '/erp/configuracoes/licencas': '/erp/settings/licenses',
  '/erp/configuracoes/pdv': '/erp/settings/pos',
  '/erp/configuracoes/agenda': '/erp/settings/schedule',
  '/erp/configuracoes/banho-tosa': '/erp/settings/grooming',
  '/erp/configuracoes/estoque': '/erp/settings/inventory',
  '/erp/configuracoes/metodos-pagamento': '/erp/settings/payments',
  '/erp/configuracoes/categorias': '/erp/settings/categories',
  '/erp/configuracoes/notificacoes': '/erp/settings/organization',
  '/erp/configuracoes/importar-exportar': '/erp/settings/import-export',
};

/**
 * Rótulos PT-BR para breadcrumbs
 */
export const SETTINGS_LABELS: Record<string, string> = {
  organization: 'Organização',
  users: 'Usuários',
  roles: 'Papéis & Permissões',
  billing: 'Plano & Faturamento',
  licenses: 'Licenças & Ativação',
  pos: 'PDV',
  schedule: 'Agenda',
  grooming: 'Banho & Tosa',
  inventory: 'Estoque',
  payments: 'Métodos de Pagamento',
  categories: 'Categorias',
  notifications: 'Notificações',
  'import-export': 'Importar/Exportar',
};
