import { Module } from '@nestjs/common';
import { AutoUpdateService } from './auto-update.service';
import { AutoUpdateController } from './auto-update.controller';

@Module({
  providers: [AutoUpdateService],
  controllers: [AutoUpdateController],
  exports: [AutoUpdateService],
})
export class AutoUpdateModule {}