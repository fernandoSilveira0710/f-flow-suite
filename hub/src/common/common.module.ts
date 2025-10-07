import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { EventsService } from './events.service';

@Global()
@Module({
  providers: [PrismaService, EventsService],
  exports: [PrismaService, EventsService],
})
export class CommonModule {}