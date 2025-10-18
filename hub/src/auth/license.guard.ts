import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';

type LicenseJwtPayload = {
  tid: string; // tenant id
  did?: string; // device id
  plan: string; // plan name/key
  planId?: string; // plan UUID
  ent?: Record<string, unknown>; // entitlements/features
  maxSeats?: number;
  maxDevices?: number;
  exp?: number;
  grace?: number;
  iat?: number;
  iss?: string;
};

@Injectable()
export class LicenseGuard implements CanActivate {
  private readonly logger = new Logger(LicenseGuard.name);

  constructor() {}

  canActivate(context: ExecutionContext): boolean {
    const licensingEnforced = process.env.LICENSING_ENFORCED !== 'false';

    // If licensing is not enforced, allow access
    if (!licensingEnforced) {
      this.logger.debug('License validation disabled (LICENSING_ENFORCED=false)');
      return true;
    }

    const publicKey = process.env.LICENSE_PUBLIC_KEY_PEM || '';
    if (!publicKey) {
      this.logger.warn('Missing LICENSE_PUBLIC_KEY_PEM while licensing is enforced');
      throw new ForbiddenException('Missing or invalid license token');
    }

    const request = context.switchToHttp().getRequest<Request>();
    
    // Try X-License-Token header first (preferred)
    let token = request.headers['x-license-token'] as string;
    
    // Fallback to Authorization header if X-License-Token is not present
    // This maintains backward compatibility
    if (!token) {
      const authHeader = request.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7); // Remove 'Bearer ' prefix
        this.logger.debug('Using Authorization header for license token (consider using X-License-Token)');
      }
    }

    if (!token) {
      this.logger.warn('Missing license token in X-License-Token or Authorization header');
      throw new ForbiddenException('Missing or invalid license token');
    }

    try {
      // Validate and decode the license token
      const payload = jwt.verify(token, publicKey, {
        algorithms: ['RS256', 'RS512', 'ES256'],
        ignoreExpiration: false,
      }) as LicenseJwtPayload;

      // Normalize required fields to support legacy tokens
      const normalizedTid = (payload as any).tid ?? (payload as any).tenant_id ?? (payload as any).tenantId;
      const normalizedPlan = (payload as any).plan ?? (payload as any).plan_id ?? (payload as any).planKey;
      const normalizedPlanId = (payload as any).planId ?? (payload as any).plan_id ?? undefined;

      // Basic validation of required fields
      if (!normalizedTid || !normalizedPlan) {
        this.logger.warn('License token missing required fields (tid/tenant_id, plan/plan_id)');
        throw new ForbiddenException('Missing or invalid license token');
      }

      // Attach normalized license payload to request for use in controllers
      (request as any).license = {
        ...payload,
        tid: normalizedTid,
        plan: normalizedPlan,
        planId: normalizedPlanId,
      };

      this.logger.debug(`License validated for tenant: ${normalizedTid}, plan: ${normalizedPlan}${normalizedPlanId ? ` (${normalizedPlanId})` : ''}`);
      return true;

    } catch (error) {
      // Check expiration first because TokenExpiredError extends JsonWebTokenError
      if (error instanceof jwt.TokenExpiredError) {
        this.logger.warn('License token expired');
        throw new ForbiddenException('License token expired');
      }

      if (error instanceof jwt.JsonWebTokenError) {
        this.logger.warn('Invalid license token:', (error as Error).message);
        throw new ForbiddenException('Missing or invalid license token');
      }

      this.logger.error('License validation error:', error);
      throw new ForbiddenException('Missing or invalid license token');
    }
  }
}