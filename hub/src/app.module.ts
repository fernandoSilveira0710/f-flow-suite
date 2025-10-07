import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { AuthModule } from './auth/auth.module';
import { TenantsModule } from './tenants/tenants.module';
import { LicensesModule } from './licenses/licenses.module';
import { EntitlementsModule } from './entitlements/entitlements.module';
import { SyncModule } from './sync/sync.module';
import { ProductsModule } from './products/products.module';
import { SalesModule } from './sales/sales.module';
import { CustomersModule } from './customers/customers.module';
import { PetsModule } from './pets/pets.module';
import { InventoryModule } from './inventory/inventory.module';
import { ServicesModule } from './services/services.module';
import { ProfessionalsModule } from './professionals/professionals.module';
import { HealthController } from './health/health.controller';
import { JwksController } from './auth/jwks.controller';
import { PrismaTenantMiddleware } from './prisma-tenant.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    TenantsModule,
    LicensesModule,
    EntitlementsModule,
    SyncModule,
    ProductsModule,
    SalesModule,
    CustomersModule,
    PetsModule,
    InventoryModule,
    ServicesModule,
    ProfessionalsModule,
  ],
  controllers: [HealthController, JwksController],
  providers: [PrismaClient],
})
export class AppModule implements NestModule {
  constructor(private readonly prisma: PrismaClient) {}

  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(PrismaTenantMiddleware)
      .exclude('/.well-known/jwks.json', '/health')
      .forRoutes('*');
  }
}
