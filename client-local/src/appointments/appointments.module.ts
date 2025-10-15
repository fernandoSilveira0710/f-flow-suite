import { Module } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { AppointmentsController } from './appointments.controller';
import { PrismaModule } from '../common/prisma/prisma.module';
import { ValidationModule } from '../common/validation/validation.module';
import { ResourcesModule } from '../resources/resources.module';

@Module({
  imports: [PrismaModule, ValidationModule, ResourcesModule],
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}