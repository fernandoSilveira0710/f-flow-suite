# Appointment and Check-In Synchronization

This document describes the synchronization architecture and event patterns for appointments and check-ins in the F-Flow system.

## Overview

The F-Flow system implements a distributed synchronization mechanism between Client-Local and Hub applications for appointments and check-ins. This ensures data consistency across all instances while maintaining local autonomy.

## Architecture

### Client-Local
- **Appointments Module**: Manages appointment scheduling, updates, and cancellations
- **Check-Ins Module**: Handles pet check-in and check-out operations
- **Sync Agent**: Pushes local events to Hub and pulls commands from Hub

### Hub
- **Sync Service**: Processes incoming events from Client-Local instances
- **Event Processing**: Routes events to appropriate handlers for data storage and business logic

## Event Patterns

### Appointment Events

#### `appointment.created.v1`
Triggered when a new appointment is scheduled in Client-Local.

**Payload Structure:**
```json
{
  "id": "uuid",
  "petId": "uuid",
  "professionalId": "uuid", 
  "serviceId": "uuid",
  "scheduledAt": "2024-12-31T10:00:00.000Z",
  "status": "SCHEDULED",
  "notes": "Optional appointment notes",
  "createdAt": "2024-12-31T09:00:00.000Z",
  "updatedAt": "2024-12-31T09:00:00.000Z"
}
```

#### `appointment.updated.v1`
Triggered when an existing appointment is modified.

**Payload Structure:**
```json
{
  "id": "uuid",
  "petId": "uuid",
  "professionalId": "uuid",
  "serviceId": "uuid", 
  "scheduledAt": "2024-12-31T14:00:00.000Z",
  "status": "CONFIRMED",
  "notes": "Updated appointment notes",
  "createdAt": "2024-12-31T09:00:00.000Z",
  "updatedAt": "2024-12-31T13:00:00.000Z"
}
```

#### `appointment.deleted.v1`
Triggered when an appointment is cancelled/deleted.

**Payload Structure:**
```json
{
  "id": "uuid",
  "deletedAt": "2024-12-31T15:00:00.000Z"
}
```

### Check-In Events

#### `checkin.created.v1`
Triggered when a pet is checked in at the clinic.

**Payload Structure:**
```json
{
  "id": "uuid",
  "petId": "uuid",
  "professionalId": "uuid",
  "checkInAt": "2024-12-31T10:00:00.000Z",
  "checkOutAt": null,
  "notes": "Pet arrived for consultation",
  "createdAt": "2024-12-31T10:00:00.000Z",
  "updatedAt": "2024-12-31T10:00:00.000Z"
}
```

#### `checkout.created.v1`
Triggered when a pet is checked out from the clinic.

**Payload Structure:**
```json
{
  "id": "uuid",
  "petId": "uuid", 
  "professionalId": "uuid",
  "checkInAt": "2024-12-31T10:00:00.000Z",
  "checkOutAt": "2024-12-31T11:30:00.000Z",
  "notes": "Pet left after consultation",
  "createdAt": "2024-12-31T10:00:00.000Z",
  "updatedAt": "2024-12-31T11:30:00.000Z"
}
```

## Implementation Details

### Client-Local Implementation

#### Appointments Service
- **Location**: `client-local/src/appointments/appointments.service.ts`
- **Event Generation**: Creates outbox events for create, update, and delete operations
- **Validation**: Ensures event payload integrity before persistence

#### Check-Ins Service  
- **Location**: `client-local/src/checkins/checkins.service.ts`
- **Event Generation**: Creates outbox events for check-in and check-out operations
- **Business Logic**: Prevents duplicate check-ins and validates check-out operations

#### Sync Agent
- **Location**: `client-local/src/sync-agent/sync.service.ts`
- **Push Operations**: Fetches unprocessed outbox events and sends to Hub
- **Pull Operations**: Retrieves commands from Hub for local processing

### Hub Implementation

#### Sync Service
- **Location**: `hub/src/sync/sync.service.ts`
- **Event Processing**: Routes appointment and check-in events to appropriate handlers
- **Extensibility**: Designed for future integration with notifications, analytics, and reporting

## API Endpoints

### Client-Local Appointments
- `GET /appointments` - List all appointments
- `POST /appointments` - Create new appointment
- `GET /appointments/:id` - Get specific appointment
- `PATCH /appointments/:id` - Update appointment
- `DELETE /appointments/:id` - Delete appointment

### Client-Local Check-Ins
- `GET /checkins` - List all check-ins
- `POST /checkins` - Check-in a pet
- `GET /checkins/:id` - Get specific check-in
- `PATCH /checkins/:id/checkout` - Check-out a pet
- `GET /checkins/active/:petId` - Get active check-in for a pet

## Testing

### Postman Collection
A comprehensive Postman collection is available at:
- **File**: `postman/F-Flow-Client-Local.postman_collection.json`
- **Sections**: Appointments and Check-Ins with full CRUD operations
- **Variables**: Uses collection variables for dynamic testing

### Test Scenarios
1. **Appointment Lifecycle**: Create → Read → Update → Delete
2. **Check-In Flow**: Check-in → Verify Active → Check-out
3. **Sync Validation**: Verify events are generated and processed
4. **Error Handling**: Test duplicate check-ins and invalid operations

## Monitoring and Troubleshooting

### Event Tracking
- Monitor outbox events in Client-Local database
- Track event processing in Hub logs
- Verify sync agent push/pull operations

### Common Issues
1. **Missing Events**: Check outbox event generation in Client-Local
2. **Sync Failures**: Verify Hub connectivity and authentication
3. **Duplicate Check-ins**: Validate business logic in check-ins service

## Future Enhancements

### Planned Features
- **Idempotency**: Prevent duplicate event processing
- **Dead Letter Queue**: Handle failed event processing
- **Backoff Strategy**: Implement exponential backoff for retries
- **Real-time Notifications**: Push notifications for appointment changes
- **Analytics Integration**: Track appointment and check-in metrics

### Scalability Considerations
- **Event Partitioning**: Distribute events across multiple processors
- **Batch Processing**: Process multiple events in single operations
- **Caching**: Implement caching for frequently accessed data