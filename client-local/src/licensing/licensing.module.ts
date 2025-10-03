import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { LicensingService } from './licensing.service';
import { LicensingController } from './licensing.controller';
import { TokenStore } from './token.store';
import { LicensingRenewalService } from './licensing-renewal.service';
import { LicensingGuard } from './licensing.guard';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [LicensingService, TokenStore, LicensingRenewalService, LicensingGuard],
  controllers: [LicensingController],
  exports: [LicensingService, TokenStore, LicensingRenewalService, LicensingGuard],
})
export class LicensingModule {}
