import { Module } from '@nestjs/common';
import { FeatureFlagsModule as CommonFeatureFlagsModule } from '../common/feature-flags/feature-flags.module';
import { FeatureFlagsController } from './feature-flags.controller';

@Module({
  imports: [CommonFeatureFlagsModule],
  controllers: [FeatureFlagsController],
})
export class FeatureFlagsModule {}