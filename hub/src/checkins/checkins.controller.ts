import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Query, 
  UseGuards,
  Request 
} from '@nestjs/common';
import { CheckInsService } from './checkins.service';
import { CreateCheckInDto, CheckOutDto, CheckInResponseDto } from './dto';
import { OidcGuard } from '../auth/oidc.guard';
import { LicenseGuard } from '../auth/license.guard';

@Controller('checkins')
@UseGuards(OidcGuard, LicenseGuard)
export class CheckInsController {
  constructor(private readonly checkInsService: CheckInsService) {}

  @Post('checkin')
  async checkIn(
    @Request() req: any,
    @Body() createCheckInDto: CreateCheckInDto
  ): Promise<CheckInResponseDto> {
    return this.checkInsService.checkIn(req.user.tenantId, createCheckInDto);
  }

  @Post('checkout/:id')
  async checkOut(
    @Request() req: any,
    @Param('id') id: string,
    @Body() checkOutDto?: CheckOutDto
  ): Promise<CheckInResponseDto> {
    return this.checkInsService.checkOut(req.user.tenantId, id, checkOutDto);
  }

  @Get()
  async findAll(
    @Request() req: any,
    @Query('petId') petId?: string,
    @Query('professionalId') professionalId?: string,
    @Query('activeOnly') activeOnly?: string
  ): Promise<CheckInResponseDto[]> {
    const isActiveOnly = activeOnly === 'true';
    return this.checkInsService.findAll(req.user.tenantId, petId, professionalId, isActiveOnly);
  }

  @Get('active/pet/:petId')
  async findActiveByPet(
    @Request() req: any,
    @Param('petId') petId: string
  ): Promise<CheckInResponseDto | null> {
    return this.checkInsService.findActiveCheckInByPet(req.user.tenantId, petId);
  }

  @Get(':id')
  async findOne(
    @Request() req: any,
    @Param('id') id: string
  ): Promise<CheckInResponseDto> {
    return this.checkInsService.findOne(req.user.tenantId, id);
  }
}