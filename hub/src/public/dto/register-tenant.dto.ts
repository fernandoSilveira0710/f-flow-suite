export interface RegisterTenantDto {
  name: string;
  email: string;
  cpf?: string;
  password: string;
  planId?: string;
}