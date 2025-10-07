import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { ProductsService } from '../products/products.service';
import { SalesService } from '../sales/sales.service';
import { CustomersService } from '../customers/customers.service';
import { PetsService } from '../pets/pets.service';
import { InventoryService } from '../inventory/inventory.service';
import { ServicesService } from '../services/services.service';
import { ProfessionalsService } from '../professionals/professionals.service';
import { AppointmentsService } from '../appointments/appointments.service';
import { CheckInsService } from '../checkins/checkins.service';

interface OutboxEvent {
  id: string;
  aggregate: string;
  type: string;
  payload: string | any;
  occurredAt: Date;
}

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly productsService: ProductsService,
    private readonly salesService: SalesService,
    private readonly customersService: CustomersService,
    private readonly petsService: PetsService,
    private readonly inventoryService: InventoryService,
    private readonly servicesService: ServicesService,
    private readonly professionalsService: ProfessionalsService,
    private readonly appointmentsService: AppointmentsService,
    private readonly checkInsService: CheckInsService,
  ) {}

  async ingestEvents(tenantId: string, events: OutboxEvent[]): Promise<void> {
    this.logger.debug(`Ingesting ${events.length} events for tenant ${tenantId}`);

    for (const event of events) {
      await this.processEvent(tenantId, event);
    }
  }

  private async processEvent(tenantId: string, event: OutboxEvent): Promise<void> {
    let payload: any;
    
    // Handle payload that might already be an object or a string
    if (typeof event.payload === 'string') {
      try {
        payload = JSON.parse(event.payload);
      } catch (error) {
        this.logger.error(`Failed to parse event payload: ${event.payload}`, error);
        throw error;
      }
    } else {
      payload = event.payload;
    }

    switch (event.type) {
      case 'product.upserted.v1':
        await this.productsService.upsertFromEvent(tenantId, payload);
        break;
      case 'product.deleted.v1':
        await this.productsService.deleteFromEvent(tenantId, (event.payload as any).id);
        break;
      case 'customer.upserted.v1':
        await this.customersService.upsertFromEvent(tenantId, payload);
        break;
      case 'customer.deleted.v1':
        await this.customersService.deleteFromEvent(tenantId, payload.id);
        break;
      case 'pet.upserted.v1':
        await this.petsService.upsertFromEvent(tenantId, payload);
        break;
      case 'pet.deleted.v1':
        await this.petsService.deleteFromEvent(tenantId, payload.id);
        break;
      case 'sale.created.v1':
        await this.processSaleCreatedEvent(tenantId, payload);
        break;
      case 'inventory.adjusted.v1':
        await this.inventoryService.processInventoryAdjustmentEvent(tenantId, payload);
        break;
      case 'service.upserted.v1':
        await this.servicesService.upsertFromEvent(tenantId, payload);
        break;
      case 'service.deleted.v1':
        await this.servicesService.deleteFromEvent(tenantId, payload.id);
        break;
      case 'professional.upserted.v1':
        await this.professionalsService.upsertFromEvent(tenantId, payload);
        break;
      case 'professional.deleted.v1':
        await this.professionalsService.deleteFromEvent(tenantId, payload.id);
        break;
      case 'appointment.created.v1':
        await this.processAppointmentEvent(tenantId, 'created', payload);
        break;
      case 'appointment.updated.v1':
        await this.processAppointmentEvent(tenantId, 'updated', payload);
        break;
      case 'appointment.deleted.v1':
        await this.processAppointmentEvent(tenantId, 'deleted', payload);
        break;
      case 'checkin.created.v1':
        await this.processCheckInEvent(tenantId, 'checkin', payload);
        break;
      case 'checkout.created.v1':
        await this.processCheckInEvent(tenantId, 'checkout', payload);
        break;
      default:
        this.logger.warn(`Unknown event type: ${event.type}`);
    }
  }

  private async processSaleCreatedEvent(tenantId: string, payload: Record<string, unknown>): Promise<void> {
    this.logger.debug(`Processing sale.created.v1 event for tenant ${tenantId}`);
    
    try {
      await this.salesService.upsertFromEvent(tenantId, payload as any);
      this.logger.log(`Successfully processed sale.created.v1 event for tenant ${tenantId}`);
    } catch (error) {
      this.logger.error(`Failed to process sale.created.v1 event for tenant ${tenantId}:`, error);
      throw error;
    }
  }

  private async processAppointmentEvent(tenantId: string, action: string, payload: Record<string, unknown>): Promise<void> {
    this.logger.debug(`Processing appointment.${action}.v1 event for tenant ${tenantId}`);
    
    try {
      // For now, just log the event - in a real implementation, you might want to:
      // - Store appointment data in a centralized appointments table
      // - Send notifications to other clients
      // - Update analytics/reporting data
      this.logger.log(`Successfully processed appointment.${action}.v1 event for tenant ${tenantId}`, payload);
    } catch (error) {
      this.logger.error(`Failed to process appointment.${action}.v1 event for tenant ${tenantId}:`, error);
      throw error;
    }
  }

  private async processCheckInEvent(tenantId: string, action: string, payload: Record<string, unknown>): Promise<void> {
    this.logger.debug(`Processing ${action}.created.v1 event for tenant ${tenantId}`);
    
    try {
      // For now, just log the event - in a real implementation, you might want to:
      // - Store check-in data in a centralized check-ins table
      // - Send notifications to other clients
      // - Update analytics/reporting data
      this.logger.log(`Successfully processed ${action}.created.v1 event for tenant ${tenantId}`, payload);
    } catch (error) {
      this.logger.error(`Failed to process ${action}.created.v1 event for tenant ${tenantId}:`, error);
      throw error;
    }
  }

  async fetchCommands(tenantId: string, limit = 100): Promise<Record<string, unknown>[]> {
    this.logger.debug(`Pulling commands for tenant ${tenantId}`);
    return [];
  }
}
