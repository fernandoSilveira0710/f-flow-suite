import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { AuthModule } from './auth/auth.module';
import { TenantsModule } from './tenants/tenants.module';
import { LicensesModule } from './licenses/licenses.module';
import { EntitlementsModule } from './entitlements/entitlements.module';
import { SyncModule } from './sync/sync.module';
import { HealthController } from './health/health.controller';
import { PrismaTenantMiddleware } from './prisma-tenant.middleware';

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
