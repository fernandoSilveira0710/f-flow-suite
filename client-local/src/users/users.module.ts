import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PrismaModule } from '../common/prisma/prisma.module';
import { SyncAgentModule } from '../sync-agent/sync.module';

@Module({
  imports: [PrismaModule, SyncAgentModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}