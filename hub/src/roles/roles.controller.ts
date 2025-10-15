import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  ParseBoolPipe,
  UseGuards,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto, UpdateRoleDto } from './dto';
import { TenantId } from '../common/tenant-id.decorator';
import { LicenseGuard } from '../auth/license.guard';

@Controller()
@UseGuards(LicenseGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get('tenants/:tenantId/roles')
  findAll(
    @TenantId() tenantId: string,
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 50,
    @Query('search') search?: string,
    @Query('active', new ParseBoolPipe({ optional: true })) active?: boolean,
  ) {
    return this.rolesService.findAll(tenantId, page, limit, search, active);
  }

  @Get('tenants/:tenantId/roles/active')
  findActiveRoles(@TenantId() tenantId: string) {
    return this.rolesService.findActiveRoles(tenantId);
  }

  @Get('tenants/:tenantId/roles/:id')
  findOne(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.rolesService.findOne(tenantId, id);
  }

  @Post('tenants/:tenantId/roles')
  create(@TenantId() tenantId: string, @Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.create(tenantId, createRoleDto);
  }

  @Patch('tenants/:tenantId/roles/:id')
  update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    return this.rolesService.update(tenantId, id, updateRoleDto);
  }

  @Delete('tenants/:tenantId/roles/:id')
  remove(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.rolesService.remove(tenantId, id);
  }
}