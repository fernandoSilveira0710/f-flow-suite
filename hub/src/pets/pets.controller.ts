import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { OidcGuard } from '../auth/oidc.guard';
import { LicenseGuard } from '../auth/license.guard';
import { PetsService } from './pets.service';
import { CreatePetDto, UpdatePetDto, PetResponseDto } from './dto';

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

  @Post()
  async create(
    @Param('tenantId') tenantId: string,
    @Body() createPetDto: CreatePetDto,
  ): Promise<PetResponseDto> {
    return this.petsService.create(tenantId, createPetDto);
  }

  @Put(':id')
  async update(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() updatePetDto: UpdatePetDto,
  ): Promise<PetResponseDto> {
    return this.petsService.update(tenantId, id, updatePetDto);
  }

  @Delete(':id')
  async remove(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
  ): Promise<void> {
    return this.petsService.remove(tenantId, id);
  }
}