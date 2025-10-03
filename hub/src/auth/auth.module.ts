import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { OidcJwtStrategy } from './oidc-jwt.strategy';
import { OidcGuard } from './oidc.guard';
import { LicenseGuard } from './license.guard';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  providers: [JwtStrategy, OidcJwtStrategy, OidcGuard, LicenseGuard],
  exports: [PassportModule, OidcGuard, LicenseGuard],
})
export class AuthModule {}
