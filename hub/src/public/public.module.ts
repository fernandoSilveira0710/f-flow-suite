import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { PlansModule } from '../plans/plans.module';

@Module({
  imports: [PlansModule],
  controllers: [PublicController],
})
export class PublicModule {}