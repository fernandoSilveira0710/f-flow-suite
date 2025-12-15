import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { PrismaService } from './common/prisma.service';

@Injectable()
export class PrismaTenantMiddleware implements NestMiddleware {
  constructor(private readonly prisma: PrismaService) {}

  async use(req: Request, _res: Response, next: NextFunction) {
    // Excluir endpoints públicos da verificação de tenant
    const publicEndpoints = new Set<string>([
      '/.well-known/jwks.json',
      '/health',
      '/licenses/activate',
      '/licenses/validate',
    ]);

    if (publicEndpoints.has(req.path)) {
      return next();
    }

    // Tentar extrair tenantId de múltiplas fontes: header, usuário (OIDC), query e path
    let tenantId =
      (req.headers['x-tenant-id'] as string | undefined) ??
      (req as Request & { user?: { tenantId?: string } })?.user?.tenantId ??
      (req.query.tenantId as string | undefined) ??
      null;

    // Extrair de path quando padrão for /tenants/:tenantId/...
    if (!tenantId) {
      const pathMatch = req.path.match(/^\/tenants\/([^\/]+)/);
      if (pathMatch && pathMatch[1]) {
        tenantId = pathMatch[1];
      }
    }

    console.log(`[PrismaTenantMiddleware] Path: ${req.path}, Method: ${req.method}, TenantId: ${tenantId}`);

    const rlsEnforced = process.env.RLS_ENFORCED === 'true';

    // Se RLS está habilitado, exigir tenantId para todas as rotas não públicas
    if (rlsEnforced && !publicEndpoints.has(req.path)) {
      if (!tenantId || tenantId.trim() === '') {
        throw new ForbiddenException('Missing tenant');
      }
    }

    if (tenantId) {
      try {
        console.log(`[PrismaTenantMiddleware] Setting tenant context: ${tenantId}`);
        
        // Para SQLite, não podemos usar SET app.tenant_id
        // O controle de tenant será feito através do request.tenantId
        // e filtros nas queries do Prisma
        
        // Definir o tenantId no request para o decorator TenantId
        req.tenantId = tenantId;
        console.log(`[PrismaTenantMiddleware] Set request.tenantId: ${tenantId}`);
        console.log(`[PrismaTenantMiddleware] Tenant context set successfully`);
      } catch (error) {
        console.error(`[PrismaTenantMiddleware] Error setting tenant context:`, error);
      }
    }

    next();
  }
}
