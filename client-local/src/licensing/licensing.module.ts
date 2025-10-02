import { Module } from '@nestjs/common';
import { LicensingService } from './licensing.service.js';

@Module({
  providers: [LicensingService],
  exports: [LicensingService],
})
export class LicensingModule {}
