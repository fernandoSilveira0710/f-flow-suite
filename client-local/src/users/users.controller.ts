import { Controller, Get, Post, Put, Delete, Body, Param, Query, BadRequestException } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll(@Query('active') active?: string) {
    const isActive = active === 'true' ? true : active === 'false' ? false : undefined;
    return this.usersService.findAll(isActive);
  }

  @Get('lookup/by-email')
  async findByEmail(@Query('email') email: string) {
    if (!email) {
      return { error: 'email query param is required' };
    }
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return { error: 'User not found' };
    }
    return user;
  }

  @Get('roles/list')
  async getRoles() {
    return this.usersService.getRoles();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Post('roles')
  async createRole(@Body() roleData: { name: string; description?: string; permissions?: string[] }) {
    // Convert permissions array to JSON string if provided
    const processedRoleData = {
      ...roleData,
      permissions: roleData.permissions ? JSON.stringify(roleData.permissions) : undefined,
    };
    return this.usersService.createRole(processedRoleData);
  }

  @Put('roles/:id')
  async updateRole(
    @Param('id') id: string,
    @Body() roleData: { name?: string; description?: string; permissions?: string[]; active?: boolean }
  ) {
    const processedRoleData = {
      ...roleData,
      permissions: roleData.permissions ? JSON.stringify(roleData.permissions) : undefined,
    } as any;
    return this.usersService.updateRole(id, processedRoleData);
  }

  @Delete('roles/:id')
  async removeRole(@Param('id') id: string) {
    return this.usersService.removeRole(id);
  }

  @Post('pins/bulk')
  async bulkSetPins(@Body() body: { pin: string; onlyActive?: boolean }) {
    const cleanPin = String(body.pin ?? '').replace(/\D/g, '');
    if (!cleanPin || cleanPin.length !== 4) {
      throw new BadRequestException('PIN inválido: informe exatamente 4 dígitos.');
    }
    const onlyActive = typeof body.onlyActive === 'boolean' ? body.onlyActive : true;
    const result = await this.usersService.setAllPins(cleanPin, onlyActive);
    return { success: true, updated: result.updatedCount, pin: cleanPin, onlyActive };
  }
}
