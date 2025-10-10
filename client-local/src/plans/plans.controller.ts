import { Controller, Get, Param, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { PlansService } from './plans.service';

@Controller('plans')
export class PlansController {
  private readonly logger = new Logger(PlansController.name);

  constructor(private readonly plansService: PlansService) {}

  @Get('tenants/:tenantId/subscription')
  async getTenantSubscription(@Param('tenantId') tenantId: string) {
    try {
      this.logger.log(`Fetching subscription for tenant: ${tenantId}`);
      const subscription = await this.plansService.getTenantSubscription(tenantId);
      return subscription;
    } catch (error) {
      this.logger.error(`Failed to fetch subscription for tenant ${tenantId}:`, error);
      throw new HttpException(
        'Failed to fetch subscription',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('tenants/:tenantId/invoices')
  async getTenantInvoices(@Param('tenantId') tenantId: string) {
    try {
      this.logger.log(`Fetching invoices for tenant: ${tenantId}`);
      const invoices = await this.plansService.getTenantInvoices(tenantId);
      return invoices;
    } catch (error) {
      this.logger.error(`Failed to fetch invoices for tenant ${tenantId}:`, error);
      throw new HttpException(
        'Failed to fetch invoices',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}