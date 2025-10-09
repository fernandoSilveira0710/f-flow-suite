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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PlansService } from './plans.service';
import { 
  CreatePlanDto, 
  UpdatePlanDto, 
  PlanResponseDto,
  CreateSubscriptionDto,
  UpdateSubscriptionDto,
  SubscriptionResponseDto
} from './dto';
import { OidcGuard } from '../auth/oidc.guard';
import { LicenseGuard } from '../licenses/license.guard';
import { TenantId } from '../common/tenant-id.decorator';

@Controller()
@UseGuards(OidcGuard, LicenseGuard)
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  // ===== PLAN ENDPOINTS =====

  @Post('plans')
  async createPlan(@Body() createPlanDto: CreatePlanDto): Promise<PlanResponseDto> {
    return this.plansService.createPlan(createPlanDto);
  }

  @Get('plans')
  async findAllPlans(@Query('active') active?: string): Promise<PlanResponseDto[]> {
    const activeOnly = active === 'true';
    return this.plansService.findAllPlans(activeOnly);
  }

  @Get('plans/:id')
  async findPlan(@Param('id') id: string): Promise<PlanResponseDto> {
    return this.plansService.findPlanById(id);
  }

  @Patch('plans/:id')
  async updatePlan(
    @Param('id') id: string,
    @Body() updatePlanDto: UpdatePlanDto,
  ): Promise<PlanResponseDto> {
    return this.plansService.updatePlan(id, updatePlanDto);
  }

  @Delete('plans/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePlan(@Param('id') id: string): Promise<void> {
    return this.plansService.deletePlan(id);
  }

  // ===== SUBSCRIPTION ENDPOINTS =====

  @Post('subscriptions')
  async createSubscription(
    @Body() createSubscriptionDto: CreateSubscriptionDto,
  ): Promise<SubscriptionResponseDto> {
    return this.plansService.createSubscription(createSubscriptionDto);
  }

  @Get('subscriptions')
  async findAllSubscriptions(
    @Query('tenantId') tenantId?: string,
  ): Promise<SubscriptionResponseDto[]> {
    return this.plansService.findAllSubscriptions(tenantId);
  }

  @Get('subscriptions/:id')
  async findSubscription(@Param('id') id: string): Promise<SubscriptionResponseDto> {
    return this.plansService.findSubscriptionById(id);
  }

  @Patch('subscriptions/:id')
  async updateSubscription(
    @Param('id') id: string,
    @Body() updateSubscriptionDto: UpdateSubscriptionDto,
  ): Promise<SubscriptionResponseDto> {
    return this.plansService.updateSubscription(id, updateSubscriptionDto);
  }

  @Post('subscriptions/:id/cancel')
  async cancelSubscription(@Param('id') id: string): Promise<SubscriptionResponseDto> {
    return this.plansService.cancelSubscription(id);
  }

  // ===== TENANT-SPECIFIC ENDPOINTS =====

  @Get('tenants/:tenantId/subscription')
  async findTenantSubscription(
    @Param('tenantId') tenantId: string,
  ): Promise<SubscriptionResponseDto | null> {
    return this.plansService.findActiveSubscriptionByTenant(tenantId);
  }

  @Post('tenants/:tenantId/subscription')
  async createTenantSubscription(
    @Param('tenantId') tenantId: string,
    @Body() createSubscriptionDto: Omit<CreateSubscriptionDto, 'tenantId'>,
  ): Promise<SubscriptionResponseDto> {
    return this.plansService.createSubscription({
      ...createSubscriptionDto,
      tenantId,
    });
  }
}