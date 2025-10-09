import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
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

  @Get('roles/list')
  async getRoles() {
    return this.usersService.getRoles();
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
}