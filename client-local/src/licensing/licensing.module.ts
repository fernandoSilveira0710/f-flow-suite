import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { LicensingService } from './licensing.service';
import { LicensingController } from './licensing.controller';
import { LicenseWarningController } from './license-warning.controller';
import { TokenStore } from './token.store';
import { LicensingRenewalService } from './licensing-renewal.service';
import { LicensingGuard } from './licensing.guard';
import { LicenseCacheGuard } from './license-cache.guard';
import { StartupLicenseGuard } from './startup-license.guard';
import { PrismaModule } from '../common/prisma/prisma.module';

@Module({
  imports: [ScheduleModule.forRoot(), PrismaModule],
  providers: [
    LicensingService, 
    TokenStore, 
    LicensingRenewalService, 
    LicensingGuard,
    LicenseCacheGuard,
    StartupLicenseGuard
  ],
  controllers: [LicensingController, LicenseWarningController],
  exports: [
    LicensingService, 
    TokenStore, 
    LicensingRenewalService, 
    LicensingGuard,
    LicenseCacheGuard,
    StartupLicenseGuard
  ],
})
export class LicensingModule {}
