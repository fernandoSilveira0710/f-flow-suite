import { Injectable, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OidcGuard extends AuthGuard('oidc-jwt') {
  private readonly logger = new Logger(OidcGuard.name);
  private readonly oidcRequired: boolean;

  constructor() {
    super();
    this.oidcRequired = process.env.OIDC_REQUIRED !== 'false';
  }

  canActivate(context: ExecutionContext) {
    // If OIDC is not required, allow access
    if (!this.oidcRequired) {
      this.logger.debug('OIDC validation disabled (OIDC_REQUIRED=false)');
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    // If OIDC is not required, allow access
    if (!this.oidcRequired) {
      return user || {};
    }

    if (err || !user) {
      this.logger.warn('OIDC authentication failed:', { error: err?.message, info: info?.message });
      throw new UnauthorizedException('Missing or invalid identity token');
    }

    this.logger.debug('OIDC authentication successful');
    return user;
  }
}
