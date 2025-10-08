import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ConfigurationsService } from './configurations.service';
import { CreateConfigurationDto, UpdateConfigurationDto } from './dto';
import { TenantId } from '../common/tenant-id.decorator';
import { LicenseGuard } from '../licenses/license.guard';

@Controller('tenants/:tenantId/configurations')
@UseGuards(LicenseGuard)
export class ConfigurationsController {
  constructor(private readonly configurationsService: ConfigurationsService) {}

  @Post()
  create(
    @TenantId() tenantId: string,
    @Body() createConfigurationDto: CreateConfigurationDto,
  ) {
    return this.configurationsService.create(tenantId, createConfigurationDto);
  }

  @Get()
  findAll(
    @TenantId() tenantId: string,
    @Query('category') category?: string,
  ) {
    return this.configurationsService.findAll(tenantId, category);
  }

  @Get('schedule')
  getScheduleSettings(@TenantId() tenantId: string) {
    return this.configurationsService.getScheduleSettings(tenantId);
  }

  @Get('pos')
  getPosSettings(@TenantId() tenantId: string) {
    return this.configurationsService.getPosSettings(tenantId);
  }

  @Get('notifications')
  getNotificationsSettings(@TenantId() tenantId: string) {
    return this.configurationsService.getNotificationsSettings(tenantId);
  }

  @Get('inventory')
  getInventorySettings(@TenantId() tenantId: string) {
    return this.configurationsService.getInventorySettings(tenantId);
  }

  @Get('grooming')
  getGroomingSettings(@TenantId() tenantId: string) {
    return this.configurationsService.getGroomingSettings(tenantId);
  }

  @Get(':key')
  findOne(@TenantId() tenantId: string, @Param('key') key: string) {
    return this.configurationsService.findOne(tenantId, key);
  }

  @Patch(':key')
  update(
    @TenantId() tenantId: string,
    @Param('key') key: string,
    @Body() updateConfigurationDto: UpdateConfigurationDto,
  ) {
    return this.configurationsService.update(tenantId, key, updateConfigurationDto);
  }

  @Post(':key/upsert')
  upsert(
    @TenantId() tenantId: string,
    @Param('key') key: string,
    @Body() body: { value: any },
  ) {
    return this.configurationsService.upsert(tenantId, key, body.value);
  }

  @Delete(':key')
  remove(@TenantId() tenantId: string, @Param('key') key: string) {
    return this.configurationsService.remove(tenantId, key);
  }
}