import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { PublicService } from './public.service';
import { PlansModule } from '../plans/plans.module';
import { CommonModule } from '../common/common.module';
import { JwtModule } from '@nestjs/jwt';
import { MailerModule } from '../mailer/mailer.module';

@Module({
  imports: [
    PlansModule,
    CommonModule,
    MailerModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'default-secret',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [PublicController],
  providers: [PublicService],
})
export class PublicModule {}