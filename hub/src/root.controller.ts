import { Controller, Get } from '@nestjs/common';

@Controller()
export class RootController {
  @Get()
  root() {
    return {
      name: 'Hub API',
      status: 'ok',
      environment: process.env.NODE_ENV || 'unknown',
      health: '/health',
      publicRoutes: ['/public/login', '/public/register', '/public/plans'],
      timestamp: new Date().toISOString(),
    };
  }
}