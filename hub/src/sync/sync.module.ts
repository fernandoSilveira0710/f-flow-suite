import { Module } from '@nestjs/common';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';
import { ProductsModule } from '../products/products.module';
import { SalesModule } from '../sales/sales.module';
import { CustomersModule } from '../customers/customers.module';
import { PetsModule } from '../pets/pets.module';
import { InventoryModule } from '../inventory/inventory.module';
import { ServicesModule } from '../services/services.module';
import { ProfessionalsModule } from '../professionals/professionals.module';
import { AppointmentsModule } from '../appointments/appointments.module';
import { CheckInsModule } from '../checkins/checkins.module';
import { ResourcesModule } from '../resources/resources.module';
import { GroomingModule } from '../grooming/grooming.module';

@Module({
  imports: [ProductsModule, SalesModule, CustomersModule, PetsModule, InventoryModule, ServicesModule, ProfessionalsModule, AppointmentsModule, CheckInsModule, ResourcesModule, GroomingModule],
  providers: [SyncService],
  controllers: [SyncController],
})
export class SyncModule {}
