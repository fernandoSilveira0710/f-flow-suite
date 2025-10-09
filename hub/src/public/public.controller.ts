import { Controller, Get, Query } from '@nestjs/common';
import { PlansService } from '../plans/plans.service';

@Controller('public')
export class PublicController {
  constructor(private readonly plansService: PlansService) {}

  @Get('plans')
  async getPlans(@Query('active') active?: string) {
    const isActive = active === 'true';
    const plans = await this.plansService.findAllPlans(isActive);
    
    // Mapear para formato esperado pelo frontend
    return plans.map(plan => ({
      id: plan.id,
      name: plan.name,
      price: plan.price,
      billingCycle: 'monthly', // Assumindo mensal por padrão
      features: JSON.parse(plan.featuresEnabled || '[]'),
      active: plan.active
    }));
  }
}