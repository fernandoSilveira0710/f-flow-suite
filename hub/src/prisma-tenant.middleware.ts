import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { PrismaService } from './common/prisma.service';

@Injectable()
export class PrismaTenantMiddleware implements NestMiddleware {
  constructor(private readonly prisma: PrismaService) {}

  async use(req: Request, _res: Response, next: NextFunction) {
    // Excluir endpoints públicos da verificação de tenant
    const publicEndpoints = [
      '/.well-known/jwks.json',
      '/health'
    ];

    if (publicEndpoints.includes(req.path)) {
      return next();
    }

    const tenantId =
      (req.headers['x-tenant-id'] as string | undefined) ??
      (req as Request & { user?: { tenantId?: string } })?.user?.tenantId ??
      null;

    console.log(`[PrismaTenantMiddleware] Path: ${req.path}, Method: ${req.method}, TenantId: ${tenantId}`);

    const rlsEnforced = process.env.RLS_ENFORCED === 'true';

    // Se RLS está habilitado, exigir tenant válido
    if (rlsEnforced) {
      if (!tenantId || tenantId.trim() === '') {
        throw new ForbiddenException('Missing tenant');
      }
    }

    if (tenantId) {
      try {
        const sanitizedTenantId = tenantId.replace(/'/g, "''");
        console.log(`[PrismaTenantMiddleware] Setting tenant context: ${sanitizedTenantId}`);
        await this.prisma.$executeRawUnsafe(
          `SET app.tenant_id = '${sanitizedTenantId}'`
        );
        console.log(`[PrismaTenantMiddleware] Tenant context set successfully`);
        
        // Definir o tenantId no request para o decorator TenantId
        req.tenantId = tenantId;
        console.log(`[PrismaTenantMiddleware] Set request.tenantId: ${tenantId}`);
      } catch (error) {
        console.error(`[PrismaTenantMiddleware] Error setting tenant context:`, error);
        // Se o SET falhar, as policies RLS impedirão o acesso.
      }
    }

    next();
  }
}
