import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaTenantMiddleware implements NestMiddleware {
  constructor(private readonly prisma: PrismaClient) {}

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
        await this.prisma.$executeRawUnsafe(
          `SET app.tenant_id = '${sanitizedTenantId}'`
        );
      } catch (error) {
        // Se o SET falhar, as policies RLS impedirão o acesso.
      }
    }

    next();
  }
}
