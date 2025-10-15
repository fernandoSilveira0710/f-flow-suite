import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface FeatureFlags {
  mvpPosEnabled: boolean;
  mvpGroomingEnabled: boolean;
  mvpAppointmentsEnabled: boolean;
  mvpInventoryEnabled: boolean;
  mvpCustomersEnabled: boolean;
  mvpReportsEnabled: boolean;
}

@Injectable()
export class FeatureFlagsService {
  constructor(private readonly configService: ConfigService) {}

  getFeatureFlags(): FeatureFlags {
    return {
      mvpPosEnabled: this.configService.get<boolean>('MVP_POS_ENABLED', true),
      mvpGroomingEnabled: this.configService.get<boolean>('MVP_GROOMING_ENABLED', true),
      mvpAppointmentsEnabled: this.configService.get<boolean>('MVP_APPOINTMENTS_ENABLED', true),
      mvpInventoryEnabled: this.configService.get<boolean>('MVP_INVENTORY_ENABLED', true),
      mvpCustomersEnabled: this.configService.get<boolean>('MVP_CUSTOMERS_ENABLED', true),
      mvpReportsEnabled: this.configService.get<boolean>('MVP_REPORTS_ENABLED', true),
    };
  }

  isFeatureEnabled(feature: keyof FeatureFlags): boolean {
    const flags = this.getFeatureFlags();
    return flags[feature];
  }

  // Métodos de conveniência para verificar features específicas
  isPosEnabled(): boolean {
    return this.isFeatureEnabled('mvpPosEnabled');
  }

  isGroomingEnabled(): boolean {
    return this.isFeatureEnabled('mvpGroomingEnabled');
  }

  isAppointmentsEnabled(): boolean {
    return this.isFeatureEnabled('mvpAppointmentsEnabled');
  }

  isInventoryEnabled(): boolean {
    return this.isFeatureEnabled('mvpInventoryEnabled');
  }

  isCustomersEnabled(): boolean {
    return this.isFeatureEnabled('mvpCustomersEnabled');
  }

  isReportsEnabled(): boolean {
    return this.isFeatureEnabled('mvpReportsEnabled');
  }
}