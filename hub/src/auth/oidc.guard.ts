import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';

/**
 * Placeholder OIDC guard. Replace with real guard once the identity provider is configured.
 */
@Injectable()
export class OidcGuard implements CanActivate {
  private readonly logger = new Logger(OidcGuard.name);

  canActivate(context: ExecutionContext): boolean {
    this.logger.warn('OIDC guard is currently a placeholder implementation.');
    const request = context.switchToHttp().getRequest();
    return Boolean(request.user);
  }
}
