import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module.js';
import { TenantsModule } from './tenants/tenants.module.js';
import { LicensesModule } from './licenses/licenses.module.js';
import { EntitlementsModule } from './entitlements/entitlements.module.js';
import { SyncModule } from './sync/sync.module.js';
import { HealthController } from './health/health.controller.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    TenantsModule,
    LicensesModule,
    EntitlementsModule,
    SyncModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
