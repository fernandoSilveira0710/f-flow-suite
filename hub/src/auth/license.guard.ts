import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';

type LicenseJwtPayload = {
  tenant_id: string;
  plan_id: string;
  entitlements: Record<string, unknown>;
  max_seats: number;
  device_id?: string;
  exp?: number;
  iss?: string;
  aud?: string;
};

@Injectable()
export class LicenseGuard implements CanActivate {
  private readonly logger = new Logger(LicenseGuard.name);
  private readonly licensingEnforced: boolean;
  private readonly publicKey: string;

  constructor() {
    this.licensingEnforced = process.env.LICENSING_ENFORCED !== 'false';
    this.publicKey = process.env.LICENSE_PUBLIC_KEY_PEM || '';

    if (this.licensingEnforced && !this.publicKey) {
      throw new Error('LICENSE_PUBLIC_KEY_PEM is required when LICENSING_ENFORCED=true');
    }
  }

  canActivate(context: ExecutionContext): boolean {
    // If licensing is not enforced, allow access
    if (!this.licensingEnforced) {
      this.logger.debug('License validation disabled (LICENSING_ENFORCED=false)');
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      this.logger.warn('Missing or invalid Authorization header for license token');
      throw new ForbiddenException('Missing or invalid license token');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      // Validate and decode the license token
      const payload = jwt.verify(token, this.publicKey, {
        algorithms: ['RS256', 'RS512', 'ES256'],
        ignoreExpiration: false,
      }) as LicenseJwtPayload;

      // Basic validation of required fields
      if (!payload.tenant_id || !payload.plan_id) {
        this.logger.warn('License token missing required fields (tenant_id, plan_id)');
        throw new ForbiddenException('Invalid license token format');
      }

      // Attach license payload to request for use in controllers
      (request as any).license = payload;

      this.logger.debug(`License validated for tenant: ${payload.tenant_id}, plan: ${payload.plan_id}`);
      return true;

    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        this.logger.warn('Invalid license token:', error.message);
        throw new ForbiddenException('Missing or invalid license token');
      }
      
      if (error instanceof jwt.TokenExpiredError) {
        this.logger.warn('License token expired');
        throw new ForbiddenException('License token expired');
      }

      this.logger.error('License validation error:', error);
      throw new ForbiddenException('Missing or invalid license token');
    }
  }
}