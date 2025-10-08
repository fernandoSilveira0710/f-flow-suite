import { Module } from '@nestjs/common';
import { ConfigurationsController } from './configurations.controller';
import { ConfigurationsService } from './configurations.service';
import { PrismaModule } from '../common/prisma/prisma.module';
import { SyncAgentModule } from '../sync-agent/sync.module';

@Module({
  imports: [PrismaModule, SyncAgentModule],
  controllers: [ConfigurationsController],
  providers: [ConfigurationsService],
  exports: [ConfigurationsService],
})
export class ConfigurationsModule {}