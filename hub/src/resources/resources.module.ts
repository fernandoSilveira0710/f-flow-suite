import { Module } from '@nestjs/common';
import { ResourcesService } from './resources.service';
import { ResourcesController } from './resources.controller';
import { PrismaService } from '../common/prisma.service';
import { EventsService } from '../common/events.service';

@Module({
  controllers: [ResourcesController],
  providers: [ResourcesService, PrismaService, EventsService],
  exports: [ResourcesService],
})
export class ResourcesModule {}