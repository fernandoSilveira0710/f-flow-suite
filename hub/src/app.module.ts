import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { AuthModule } from './auth/auth.module.js';
import { TenantsModule } from './tenants/tenants.module.js';
import { LicensesModule } from './licenses/licenses.module.js';
import { EntitlementsModule } from './entitlements/entitlements.module.js';
import { SyncModule } from './sync/sync.module.js';
import { HealthController } from './health/health.controller.js';
import { PrismaTenantMiddleware } from './prisma-tenant.middleware.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    TenantsModule,
    LicensesModule,
    EntitlementsModule,
    SyncModule,
  ],
  controllers: [HealthController],
  providers: [PrismaClient],
})
export class AppModule implements NestModule {
  constructor(private readonly prisma: PrismaClient) {}

  configure(consumer: MiddlewareConsumer) {
    consumer.apply(PrismaTenantMiddleware).forRoutes('*');
  }
}
