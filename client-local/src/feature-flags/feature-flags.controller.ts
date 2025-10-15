import { Controller, Get } from '@nestjs/common';
import { FeatureFlagsService, FeatureFlags } from '../common/feature-flags/feature-flags.service';

@Controller('feature-flags')
export class FeatureFlagsController {
  constructor(private readonly featureFlagsService: FeatureFlagsService) {}

  @Get()
  getFeatureFlags(): FeatureFlags {
    return this.featureFlagsService.getFeatureFlags();
  }

  @Get('pos')
  isPosEnabled(): { enabled: boolean } {
    return { enabled: this.featureFlagsService.isPosEnabled() };
  }

  @Get('grooming')
  isGroomingEnabled(): { enabled: boolean } {
    return { enabled: this.featureFlagsService.isGroomingEnabled() };
  }

  @Get('appointments')
  isAppointmentsEnabled(): { enabled: boolean } {
    return { enabled: this.featureFlagsService.isAppointmentsEnabled() };
  }

  @Get('inventory')
  isInventoryEnabled(): { enabled: boolean } {
    return { enabled: this.featureFlagsService.isInventoryEnabled() };
  }

  @Get('customers')
  isCustomersEnabled(): { enabled: boolean } {
    return { enabled: this.featureFlagsService.isCustomersEnabled() };
  }

  @Get('reports')
  isReportsEnabled(): { enabled: boolean } {
    return { enabled: this.featureFlagsService.isReportsEnabled() };
  }
}