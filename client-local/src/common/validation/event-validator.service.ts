import { Injectable, Logger } from '@nestjs/common';
import Ajv, { JSONSchemaType, ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';
import {
  productUpsertedEventSchema,
  productDeletedEventSchema,
  inventoryAdjustedEventSchema,
  ProductUpsertedEventPayload,
  ProductDeletedEventPayload,
  InventoryAdjustedEventPayload,
} from './schemas';

@Injectable()
export class EventValidatorService {
  private readonly logger = new Logger(EventValidatorService.name);
  private readonly ajv: Ajv;
  private readonly validators: Map<string, ValidateFunction<any>> = new Map();

  constructor() {
    this.ajv = new Ajv({ allErrors: true, strict: true });
    addFormats(this.ajv);
    this.initializeValidators();
  }

  private initializeValidators(): void {
    // Product event validators
    this.validators.set(
      'product.upserted.v1',
      this.ajv.compile(productUpsertedEventSchema)
    );
    this.validators.set(
      'product.deleted.v1',
      this.ajv.compile(productDeletedEventSchema)
    );

    // Inventory event validators
    this.validators.set(
      'inventory.adjusted.v1',
      this.ajv.compile(inventoryAdjustedEventSchema)
    );

    this.logger.log(`Initialized ${this.validators.size} event validators`);
  }

  validateEvent(eventType: string, payload: any): { valid: boolean; errors?: string[] } {
    const validator = this.validators.get(eventType);
    
    if (!validator) {
      this.logger.warn(`No validator found for event type: ${eventType}`);
      return { valid: false, errors: [`Unknown event type: ${eventType}`] };
    }

    const valid = validator(payload);
    
    if (!valid) {
      const errors = validator.errors?.map(error => {
        const path = error.instancePath || 'root';
        return `${path}: ${error.message}`;
      }) || ['Unknown validation error'];
      
      this.logger.warn(`Validation failed for event ${eventType}:`, errors);
      return { valid: false, errors };
    }

    this.logger.debug(`Event ${eventType} validated successfully`);
    return { valid: true };
  }

  validateProductUpsertedEvent(payload: any): payload is ProductUpsertedEventPayload {
    const result = this.validateEvent('product.upserted.v1', payload);
    return result.valid;
  }

  validateProductDeletedEvent(payload: any): payload is ProductDeletedEventPayload {
    const result = this.validateEvent('product.deleted.v1', payload);
    return result.valid;
  }

  validateInventoryAdjustedEvent(payload: any): payload is InventoryAdjustedEventPayload {
    const result = this.validateEvent('inventory.adjusted.v1', payload);
    return result.valid;
  }

  getSupportedEventTypes(): string[] {
    return Array.from(this.validators.keys());
  }
}