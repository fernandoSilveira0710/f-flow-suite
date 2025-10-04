import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { OidcGuard } from '../auth/oidc.guard';
import { LicenseGuard } from '../auth/license.guard';
import { PetsService } from './pets.service';
import { PetResponseDto } from './dto';

@Controller('tenants/:tenantId/pets')
@UseGuards(OidcGuard, LicenseGuard)
export class PetsController {
  constructor(private readonly petsService: PetsService) {}

  @Get()
  async findAll(
    @Param('tenantId') tenantId: string,
    @Query('tutorId') tutorId?: string,
  ): Promise<PetResponseDto[]> {
    if (tutorId) {
      return this.petsService.findByTutor(tenantId, tutorId);
    }
    return this.petsService.findAllByTenant(tenantId);
  }

  @Get(':id')
  async findOne(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
  ): Promise<PetResponseDto> {
    return this.petsService.findOneByTenant(tenantId, id);
  }
}