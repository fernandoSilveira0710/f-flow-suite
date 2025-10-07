import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  Query, 
  UseGuards,
  Request 
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto, UpdateAppointmentDto, AppointmentResponseDto } from './dto';
import { OidcGuard } from '../auth/oidc.guard';
import { LicenseGuard } from '../auth/license.guard';

@Controller('appointments')
@UseGuards(OidcGuard, LicenseGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  async create(
    @Request() req: any,
    @Body() createAppointmentDto: CreateAppointmentDto
  ): Promise<AppointmentResponseDto> {
    return this.appointmentsService.create(req.user.tenantId, createAppointmentDto);
  }

  @Get()
  async findAll(
    @Request() req: any,
    @Query('status') status?: string,
    @Query('professionalId') professionalId?: string,
    @Query('date') date?: string
  ): Promise<AppointmentResponseDto[]> {
    return this.appointmentsService.findAll(req.user.tenantId, status, professionalId, date);
  }

  @Get(':id')
  async findOne(
    @Request() req: any,
    @Param('id') id: string
  ): Promise<AppointmentResponseDto> {
    return this.appointmentsService.findOne(req.user.tenantId, id);
  }

  @Patch(':id')
  async update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() updateAppointmentDto: UpdateAppointmentDto
  ): Promise<AppointmentResponseDto> {
    return this.appointmentsService.update(req.user.tenantId, id, updateAppointmentDto);
  }

  @Delete(':id')
  async remove(
    @Request() req: any,
    @Param('id') id: string
  ): Promise<AppointmentResponseDto> {
    return this.appointmentsService.remove(req.user.tenantId, id);
  }
}