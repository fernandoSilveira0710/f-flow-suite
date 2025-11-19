import { Body, Controller, Get, Post } from '@nestjs/common';
import { PublicService } from './public.service';
import { RegisterTenantDto } from './dto/register-tenant.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Post('register')
  async registerTenant(@Body() registerTenantDto: RegisterTenantDto) {
    return this.publicService.registerTenant(registerTenantDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.publicService.login(loginDto);
  }

  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.publicService.resetPassword(dto);
  }

  @Get('plans')
  async getPlans() {
    return this.publicService.getPlans();
  }
}