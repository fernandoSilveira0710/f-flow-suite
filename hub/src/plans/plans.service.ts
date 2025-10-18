import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { 
  CreatePlanDto, 
  UpdatePlanDto, 
  PlanResponseDto,
  CreateSubscriptionDto,
  UpdateSubscriptionDto,
  SubscriptionResponseDto
} from './dto';

@Injectable()
export class PlansService {
  constructor(private readonly prisma: PrismaService) {}

  // ===== PLAN MANAGEMENT =====

  async createPlan(createPlanDto: CreatePlanDto): Promise<PlanResponseDto> {
    // Check if plan with same name already exists
    const existingPlan = await this.prisma.plan.findUnique({
      where: { name: createPlanDto.name },
    });

    if (existingPlan) {
      throw new ConflictException(`Plan with name '${createPlanDto.name}' already exists`);
    }

    const plan = await this.prisma.plan.create({
      data: {
        name: createPlanDto.name,
        description: createPlanDto.description ?? undefined,
        price: createPlanDto.price,
        currency: createPlanDto.currency ?? 'BRL',
        maxSeats: createPlanDto.maxSeats ?? 1,
        maxDevices: createPlanDto.maxDevices ?? 1,
        featuresEnabled: typeof (createPlanDto as any).featuresEnabled === 'string'
          ? (createPlanDto as any).featuresEnabled
          : JSON.stringify((createPlanDto as any).featuresEnabled),
        active: createPlanDto.active ?? true,
      },
    });

    return plan;
  }

  async findAllPlans(activeOnly = false): Promise<PlanResponseDto[]> {
    const plans = await this.prisma.plan.findMany({
      where: activeOnly ? { active: true } : undefined,
      orderBy: { createdAt: 'asc' },
    });

    return plans;
  }

  async findPlanById(id: string): Promise<PlanResponseDto> {
    const plan = await this.prisma.plan.findUnique({
      where: { id },
    });

    if (!plan) {
      throw new NotFoundException(`Plan with ID '${id}' not found`);
    }

    return plan;
  }

  async updatePlan(id: string, updatePlanDto: UpdatePlanDto): Promise<PlanResponseDto> {
    // Check if plan exists
    await this.findPlanById(id);

    // If updating name, check for conflicts
    if (updatePlanDto.name) {
      const existingPlan = await this.prisma.plan.findFirst({
        where: { 
          name: updatePlanDto.name,
          id: { not: id }
        },
      });

      if (existingPlan) {
        throw new ConflictException(`Plan with name '${updatePlanDto.name}' already exists`);
      }
    }

    const data: any = { ...updatePlanDto };
    if (updatePlanDto.featuresEnabled !== undefined) {
      data.featuresEnabled = typeof updatePlanDto.featuresEnabled === 'string'
        ? updatePlanDto.featuresEnabled
        : JSON.stringify(updatePlanDto.featuresEnabled);
    }

    const plan = await this.prisma.plan.update({
      where: { id },
      data,
    });

    return plan;
  }

  async deletePlan(id: string): Promise<void> {
    // Check if plan exists
    await this.findPlanById(id);

    // Check if plan has active subscriptions
    const activeSubscriptions = await this.prisma.subscription.count({
      where: { 
        planId: id,
        status: 'ACTIVE'
      },
    });

    if (activeSubscriptions > 0) {
      throw new BadRequestException(`Cannot delete plan with ${activeSubscriptions} active subscriptions`);
    }

    await this.prisma.plan.delete({
      where: { id },
    });
  }

  // ===== SUBSCRIPTION MANAGEMENT =====

  async createSubscription(createSubscriptionDto: CreateSubscriptionDto): Promise<SubscriptionResponseDto> {
    // Check if tenant already has an active subscription
    const existingSubscription = await this.prisma.subscription.findFirst({
      where: { 
        tenantId: createSubscriptionDto.tenantId,
        status: 'ACTIVE'
      },
    });

    if (existingSubscription) {
      throw new ConflictException(`Tenant already has an active subscription`);
    }

    // Verify plan exists
    await this.findPlanById(createSubscriptionDto.planId);

    // Verify tenant exists
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: createSubscriptionDto.tenantId },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID '${createSubscriptionDto.tenantId}' not found`);
    }

    const subscription = await this.prisma.subscription.create({
      data: {
        tenantId: createSubscriptionDto.tenantId,
        planId: createSubscriptionDto.planId,
        status: createSubscriptionDto.status ?? 'ACTIVE',
        startAt: createSubscriptionDto.startAt ? new Date(createSubscriptionDto.startAt) : new Date(),
        expiresAt: createSubscriptionDto.expiresAt ? new Date(createSubscriptionDto.expiresAt) : undefined,
        paymentData: createSubscriptionDto.paymentData
          ? (typeof createSubscriptionDto.paymentData === 'string' 
              ? createSubscriptionDto.paymentData 
              : JSON.stringify(createSubscriptionDto.paymentData))
          : undefined,
        billingCycle: createSubscriptionDto.billingCycle ?? 'MONTHLY',
        autoRenew: createSubscriptionDto.autoRenew ?? true,
      },
      include: {
        plan: true,
      },
    });

    return subscription;
  }

  async findAllSubscriptions(tenantId?: string): Promise<SubscriptionResponseDto[]> {
    const subscriptions = await this.prisma.subscription.findMany({
      where: tenantId ? { tenantId } : undefined,
      include: {
        plan: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return subscriptions;
  }

  async findSubscriptionById(id: string): Promise<SubscriptionResponseDto> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
      include: {
        plan: true,
      },
    });

    if (!subscription) {
      throw new NotFoundException(`Subscription with ID '${id}' not found`);
    }

    return subscription;
  }

  async findActiveSubscriptionByTenant(tenantId: string): Promise<SubscriptionResponseDto | null> {
    const subscription = await this.prisma.subscription.findFirst({
      where: { 
        tenantId,
        status: 'ACTIVE'
      },
      include: {
        plan: true,
      },
    });

    return subscription;
  }

  async updateSubscription(id: string, updateSubscriptionDto: UpdateSubscriptionDto): Promise<SubscriptionResponseDto> {
    // Check if subscription exists
    const existingSubscription = await this.findSubscriptionById(id);

    // If updating plan, verify new plan exists
    if (updateSubscriptionDto.planId) {
      await this.findPlanById(updateSubscriptionDto.planId);
    }

    // Handle status changes
    const updateData: any = { ...updateSubscriptionDto };
    
    if (updateSubscriptionDto.status === 'CANCELED' && !updateData.canceledAt) {
      updateData.canceledAt = new Date();
    }

    if (updateSubscriptionDto.expiresAt) {
      updateData.expiresAt = new Date(updateSubscriptionDto.expiresAt);
    }

    if (updateSubscriptionDto.paymentData !== undefined) {
      updateData.paymentData = updateSubscriptionDto.paymentData
        ? (typeof updateSubscriptionDto.paymentData === 'string'
            ? updateSubscriptionDto.paymentData
            : JSON.stringify(updateSubscriptionDto.paymentData))
        : null;
    }

    const subscription = await this.prisma.subscription.update({
      where: { id },
      data: updateData,
      include: {
        plan: true,
      },
    });

    return subscription;
  }

  async cancelSubscription(id: string): Promise<SubscriptionResponseDto> {
    return this.updateSubscription(id, {
      status: 'CANCELED',
    });
  }
}