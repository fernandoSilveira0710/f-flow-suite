import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { OidcGuard } from '../auth/oidc.guard';
import { LicenseGuard } from '../auth/license.guard';
import { ProfessionalsService } from './professionals.service';
import { CreateProfessionalDto, UpdateProfessionalDto, ProfessionalResponseDto } from './dto';

@Controller('tenants/:tenantId/professionals')
@UseGuards(OidcGuard, LicenseGuard)
export class ProfessionalsController {
  constructor(private readonly professionalsService: ProfessionalsService) {}

  @Get()
  async findAll(@Param('tenantId') tenantId: string): Promise<ProfessionalResponseDto[]> {
    return this.professionalsService.findAllByTenant(tenantId);
  }

  @Get(':id')
  async findOne(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
  ): Promise<ProfessionalResponseDto> {
    return this.professionalsService.findOneByTenant(tenantId, id);
  }

  @Post()
  async create(
    @Param('tenantId') tenantId: string,
    @Body() createProfessionalDto: CreateProfessionalDto,
  ): Promise<ProfessionalResponseDto> {
    return this.professionalsService.create(tenantId, createProfessionalDto);
  }

  @Put(':id')
  async update(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() updateProfessionalDto: UpdateProfessionalDto,
  ): Promise<ProfessionalResponseDto> {
    return this.professionalsService.update(tenantId, id, updateProfessionalDto);
  }

  @Delete(':id')
  async remove(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
  ): Promise<void> {
    return this.professionalsService.remove(tenantId, id);
  }
}