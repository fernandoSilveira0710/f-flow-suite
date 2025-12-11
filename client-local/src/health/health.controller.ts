import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  check() {
    const envVersion = this.configService.get<string>('APP_VERSION')
      ?? this.configService.get<string>('VITE_APP_VERSION');
    const version = envVersion || undefined;
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'f-flow-client-local',
      version,
    };
  }

  @Get('deps')
  async checkDependencies() {
    const result = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      dependencies: {
        sqlite: { status: 'unknown', message: '', responseTime: 0 },
        hub: { status: 'unknown', message: '', responseTime: 0 },
      },
    };

    // Test SQLite connection
    try {
      const start = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      result.dependencies.sqlite = {
        status: 'ok',
        message: 'SQLite connection successful',
        responseTime: Date.now() - start,
      };
    } catch (error) {
      result.dependencies.sqlite = {
        status: 'error',
        message: `SQLite connection failed: ${(error as Error).message}`,
        responseTime: 0,
      };
      result.status = 'degraded';
    }

    // Test Hub connectivity
    try {
      const hubUrl = this.configService.get<string>('HUB_URL', 'http://localhost:3001');
      const start = Date.now();
      
      const response = await fetch(`${hubUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      if (response.ok) {
        result.dependencies.hub = {
          status: 'ok',
          message: 'Hub connection successful',
          responseTime: Date.now() - start,
        };
      } else {
        result.dependencies.hub = {
          status: 'error',
          message: `Hub returned status ${response.status}`,
          responseTime: Date.now() - start,
        };
        result.status = 'degraded';
      }
    } catch (error) {
      result.dependencies.hub = {
        status: 'error',
        message: `Hub connection failed: ${(error as Error).message}`,
        responseTime: 0,
      };
      result.status = 'degraded';
    }

    return result;
  }
}
