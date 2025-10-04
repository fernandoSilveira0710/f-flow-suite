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
import { ResourcesService } from './resources.service';
import { CreateResourceDto, UpdateResourceDto, ResourceResponseDto } from './dto';
import { OidcGuard } from '../auth/oidc.guard';
import { LicenseGuard } from '../licenses/license.guard';
import { TenantId } from '../common/tenant-id.decorator';

@Controller('resources')
@UseGuards(OidcGuard, LicenseGuard)
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Post()
  async create(
    @TenantId() tenantId: string,
    @Body() createResourceDto: CreateResourceDto,
  ): Promise<ResourceResponseDto> {
    return this.resourcesService.create(tenantId, createResourceDto);
  }

  @Get()
  async findAll(
    @TenantId() tenantId: string,
    @Query('type') type?: string,
    @Query('active') active?: string,
  ): Promise<ResourceResponseDto[]> {
    const activeFilter = active !== undefined ? active === 'true' : undefined;
    return this.resourcesService.findAll(tenantId, type, activeFilter);
  }

  @Get(':id')
  async findOne(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ): Promise<ResourceResponseDto> {
    return this.resourcesService.findOne(tenantId, id);
  }

  @Patch(':id')
  async update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() updateResourceDto: UpdateResourceDto,
  ): Promise<ResourceResponseDto> {
    return this.resourcesService.update(tenantId, id, updateResourceDto);
  }

  @Delete(':id')
  async remove(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ): Promise<void> {
    return this.resourcesService.remove(tenantId, id);
  }
}