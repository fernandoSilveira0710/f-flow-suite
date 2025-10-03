import { Module } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PetsService } from './pets.service';
import { PetsController } from './pets.controller';

@Module({
  controllers: [PetsController],
  providers: [PetsService, PrismaClient],
  exports: [PetsService],
})
export class PetsModule {}