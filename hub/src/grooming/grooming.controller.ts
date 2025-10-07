import { Controller, Get, Param, UseGuards, Query } from '@nestjs/common';
import { GroomingService } from './grooming.service';
import { GroomingTicketResponse } from './dto/grooming-ticket-response.dto';
import { OidcGuard } from '../auth/oidc.guard';
import { LicenseGuard } from '../auth/license.guard';

@Controller('tenants/:tenantId/grooming')
@UseGuards(OidcGuard, LicenseGuard)
export class GroomingController {
  constructor(private readonly groomingService: GroomingService) {}

  @Get('tickets')
  async findAll(
    @Param('tenantId') tenantId: string,
    @Query('status') status?: string
  ): Promise<GroomingTicketResponse[]> {
    if (status) {
      return this.groomingService.findByStatus(tenantId, status);
    }
    return this.groomingService.findAll(tenantId);
  }

  @Get('pets/:petId/tickets')
  async findByPet(
    @Param('tenantId') tenantId: string,
    @Param('petId') petId: string
  ): Promise<GroomingTicketResponse[]> {
    return this.groomingService.findByPet(tenantId, petId);
  }

  @Get('tickets/:id')
  async findOne(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string
  ): Promise<GroomingTicketResponse> {
    return this.groomingService.findOne(tenantId, id);
  }
}