import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { LicensingService } from './licensing.service';
import { LicensingController } from './licensing.controller';
import { TokenStore } from './token.store';
import { LicensingRenewalService } from './licensing-renewal.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [LicensingController],
  providers: [LicensingService, TokenStore, LicensingRenewalService],
  exports: [LicensingService, TokenStore, LicensingRenewalService],
})
export class LicensingModule {}
