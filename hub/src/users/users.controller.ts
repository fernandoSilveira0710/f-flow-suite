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
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto';
import { TenantId } from '../common/tenant-id.decorator';
import { LicenseGuard } from '../auth/license.guard';

@Controller()
@UseGuards(LicenseGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('tenants/:tenantId/users')
  findAll(
    @TenantId() tenantId: string,
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 50,
    @Query('search') search?: string,
    @Query('active', new ParseBoolPipe({ optional: true })) active?: boolean,
  ) {
    return this.usersService.findAll(tenantId, page, limit, search, active);
  }

  @Get('tenants/:tenantId/users/active')
  findActiveUsers(@TenantId() tenantId: string) {
    return this.usersService.findActiveUsers(tenantId);
  }

  @Get('tenants/:tenantId/users/:id')
  findOne(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.usersService.findOne(tenantId, id);
  }

  @Post('tenants/:tenantId/users')
  create(@TenantId() tenantId: string, @Body() createUserDto: CreateUserDto) {
    return this.usersService.create(tenantId, createUserDto);
  }

  @Patch('tenants/:tenantId/users/:id')
  update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(tenantId, id, updateUserDto);
  }

  @Delete('tenants/:tenantId/users/:id')
  remove(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.usersService.remove(tenantId, id);
  }
}