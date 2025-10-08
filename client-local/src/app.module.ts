import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PosModule } from './pos/pos.module';
import { InventoryModule } from './inventory/inventory.module';
import { GroomingModule } from './grooming/grooming.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { LicensingModule } from './licensing/licensing.module';
import { SyncAgentModule } from './sync-agent/sync.module';
import { ProductsModule } from './products/products.module';
import { CustomersModule } from './customers/customers.module';
import { PetsModule } from './pets/pets.module';
import { ServicesModule } from './services/services.module';
import { ProfessionalsModule } from './professionals/professionals.module';
import { CheckInsModule } from './checkins/checkins.module';
import { ResourcesModule } from './resources/resources.module';
import { HealthModule } from './health/health.module';
import { ConfigurationsModule } from './configurations/configurations.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { FeatureFlagsModule } from './feature-flags/feature-flags.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LicensingModule,
    PosModule,
    ProductsModule,
    CustomersModule,
    PetsModule,
    ServicesModule,
    ProfessionalsModule,
    CheckInsModule,
    InventoryModule,
    GroomingModule,
    AppointmentsModule,
    ResourcesModule,
    SyncAgentModule,
    HealthModule,
    ConfigurationsModule,
    DashboardModule,
    FeatureFlagsModule,
  ],
})
export class AppModule {}
