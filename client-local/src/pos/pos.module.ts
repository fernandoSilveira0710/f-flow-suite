import { Module } from '@nestjs/common';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';
import { ValidationModule } from '../common/validation';
import { PrismaModule } from '../common/prisma/prisma.module';

@Module({
  imports: [ValidationModule, PrismaModule],
  controllers: [SalesController],
  providers: [SalesService],
})
export class PosModule {}
