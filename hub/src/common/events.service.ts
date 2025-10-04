import { Injectable } from '@nestjs/common';

@Injectable()
export class EventsService {
  async emit(eventType: string, payload: any): Promise<void> {
    // Basic event emission - can be extended with actual event bus
    console.log(`Event emitted: ${eventType}`, payload);
  }
}