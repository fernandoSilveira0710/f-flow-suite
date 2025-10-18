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
      const payload = jwt.verify(token, this.publicKey, {
        algorithms: ['RS256', 'RS512', 'ES256'],
        ignoreExpiration: false,
      }) as LicenseJwtPayload;

      // Basic validation of required fields
      if (!payload.tid || !payload.plan) {
        this.logger.warn('License token missing required fields (tid, plan)');
        throw new ForbiddenException('Invalid license token format');
      }

      // Attach license payload to request for use in controllers
      (request as any).license = payload;

      this.logger.debug(`License validated for tenant: ${payload.tid}, plan: ${payload.plan}${payload.planId ? ` (${payload.planId})` : ''}`);
      return true;

    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        this.logger.warn('Invalid license token:', (error as Error).message);
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