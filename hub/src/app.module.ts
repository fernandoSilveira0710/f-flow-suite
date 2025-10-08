import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './common/prisma.service';
import { CommonModule } from './common/common.module';
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
import { AppointmentsModule } from './appointments/appointments.module';
import { CheckInsModule } from './checkins/checkins.module';
import { ResourcesModule } from './resources/resources.module';
import { GroomingModule } from './grooming/grooming.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { PaymentMethodsModule } from './payment-methods/payment-methods.module';
import { ConfigurationsModule } from './configurations/configurations.module';
import { HealthController } from './health/health.controller';
import { JwksController } from './auth/jwks.controller';
import { PrismaTenantMiddleware } from './prisma-tenant.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CommonModule,
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
    AppointmentsModule,
    CheckInsModule,
    ResourcesModule,
    GroomingModule,
    UsersModule,
    RolesModule,
    PaymentMethodsModule,
    ConfigurationsModule,
  ],
  controllers: [HealthController, JwksController],
  providers: [PrismaService],
})
export class AppModule implements NestModule {
  constructor(private readonly prisma: PrismaService) {}

  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(PrismaTenantMiddleware)
      .exclude('/.well-known/jwks.json', '/health')
      .forRoutes('*');
  }
}
