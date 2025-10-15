import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UsersSyncController } from './sync.controller';
import { PrismaModule } from '../common/prisma/prisma.module';
import { SyncAgentModule } from '../sync-agent/sync.module';

@Module({
  imports: [PrismaModule, SyncAgentModule],
  controllers: [UsersSyncController, UsersController], // UsersSyncController primeiro para priorizar rotas específicas
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}