import { Module } from '@nestjs/common';
import { ResourceTypeService } from './resource-type.service';
import { ResourceTypeController } from './resource-type.controller';
import { PrismaModule } from '../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ResourceTypeController],
  providers: [ResourceTypeService],
  exports: [ResourceTypeService],
})
export class ResourceTypeModule {}