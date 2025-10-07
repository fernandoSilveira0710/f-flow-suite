import { Module } from '@nestjs/common';
import { ResourcesController } from './resources.controller';
import { ResourcesService } from './resources.service';
import { PrismaModule } from '../common/prisma/prisma.module';
import { ValidationModule } from '../common/validation/validation.module';

@Module({
  imports: [PrismaModule, ValidationModule],
  controllers: [ResourcesController],
  providers: [ResourcesService],
  exports: [ResourcesService],
})
export class ResourcesModule {}