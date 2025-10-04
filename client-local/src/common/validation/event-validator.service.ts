import { Injectable, Logger } from '@nestjs/common';
import Ajv, { JSONSchemaType, ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';
import {
  ProductUpsertedEventPayload,
  ProductDeletedEventPayload,
  productUpsertedEventSchema,
  productDeletedEventSchema,
  InventoryAdjustedEventPayload,
  inventoryAdjustedEventSchema,
  SaleCreatedEventPayload,
  saleCreatedEventSchema,
  CustomerUpsertedEventPayload,
  CustomerDeletedEventPayload,
  customerUpsertedEventSchema,
  customerDeletedEventSchema,
  PetUpsertedEventPayload,
  PetDeletedEventPayload,
  petUpsertedEventSchema,
  petDeletedEventSchema,
  ServiceUpsertedEventPayload,
  ServiceDeletedEventPayload,
  serviceUpsertedEventSchema,
  serviceDeletedEventSchema,
  ProfessionalUpsertedEventPayload,
  ProfessionalDeletedEventPayload,
  professionalUpsertedEventSchema,
  professionalDeletedEventSchema,
} from './schemas';

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
}

@Injectable()
export class EventValidatorService {
  private readonly logger = new Logger(EventValidatorService.name);
  private readonly ajv: Ajv;
  private readonly validators: Map<string, ValidateFunction<any>> = new Map();

  constructor() {
    this.ajv = new Ajv({ allErrors: true });
    addFormats(this.ajv);
    this.initializeSchemas();
  }

  private initializeSchemas(): void {
    // Product event schemas
    this.validators.set(
      'product.upserted.v1',
      this.ajv.compile(productUpsertedEventSchema)
    );
    this.validators.set(
      'product.deleted.v1',
      this.ajv.compile(productDeletedEventSchema)
    );

    // Inventory event schemas
    this.validators.set(
      'inventory.adjusted.v1',
      this.ajv.compile(inventoryAdjustedEventSchema)
    );

    // Sale event schemas
    this.validators.set(
      'sale.created.v1',
      this.ajv.compile(saleCreatedEventSchema)
    );

    // Customer event schemas
    this.validators.set(
      'customer.upserted.v1',
      this.ajv.compile(customerUpsertedEventSchema)
    );
    this.validators.set(
      'customer.deleted.v1',
      this.ajv.compile(customerDeletedEventSchema)
    );

    // Pet event schemas
    this.validators.set(
      'pet.upserted.v1',
      this.ajv.compile(petUpsertedEventSchema)
    );
    this.validators.set(
      'pet.deleted.v1',
      this.ajv.compile(petDeletedEventSchema)
    );

    // Service event schemas
    this.validators.set(
      'service.upserted.v1',
      this.ajv.compile(serviceUpsertedEventSchema)
    );
    this.validators.set(
      'service.deleted.v1',
      this.ajv.compile(serviceDeletedEventSchema)
    );

    // Professional event schemas
    this.validators.set(
      'professional.upserted.v1',
      this.ajv.compile(professionalUpsertedEventSchema)
    );
    this.validators.set(
      'professional.deleted.v1',
      this.ajv.compile(professionalDeletedEventSchema)
    );

    this.logger.log('Event validation schemas initialized');
  }

  validateEvent(eventType: string, payload: unknown): ValidationResult {
    const validator = this.validators.get(eventType);
    if (!validator) {
      return {
        valid: false,
        errors: [`Unknown event type: ${eventType}`],
      };
    }

    const isValid = validator(payload);
    if (!isValid) {
      const errors = validator.errors?.map(
        (error) => `${error.instancePath} ${error.message}`
      ) || ['Unknown validation error'];
      
      return {
        valid: false,
        errors,
      };
    }

    return { valid: true };
  }

  // Type-safe validation methods
  validateProductUpsertedEvent(payload: unknown): payload is ProductUpsertedEventPayload {
    return this.validateEvent('product.upserted.v1', payload).valid;
  }

  validateProductDeletedEvent(payload: unknown): payload is ProductDeletedEventPayload {
    return this.validateEvent('product.deleted.v1', payload).valid;
  }

  validateInventoryAdjustedEvent(payload: unknown): payload is InventoryAdjustedEventPayload {
    return this.validateEvent('inventory.adjusted.v1', payload).valid;
  }

  validateSaleCreatedEvent(payload: unknown): payload is SaleCreatedEventPayload {
    return this.validateEvent('sale.created.v1', payload).valid;
  }

  validateCustomerUpsertedEvent(payload: unknown): payload is CustomerUpsertedEventPayload {
    return this.validateEvent('customer.upserted.v1', payload).valid;
  }

  validateCustomerDeletedEvent(payload: unknown): payload is CustomerDeletedEventPayload {
    return this.validateEvent('customer.deleted.v1', payload).valid;
  }

  validatePetUpsertedEvent(payload: unknown): payload is PetUpsertedEventPayload {
    return this.validateEvent('pet.upserted.v1', payload).valid;
  }

  validatePetDeletedEvent(payload: unknown): payload is PetDeletedEventPayload {
    return this.validateEvent('pet.deleted.v1', payload).valid;
  }
}