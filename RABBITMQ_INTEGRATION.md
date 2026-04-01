# RabbitMQ Integration Guide - Users Service

## Overview
The Users Service acts as a **consumer** of events published by the Authentication Service via RabbitMQ. This enables asynchronous communication and event-driven architecture.

## Architecture

```
┌─────────────────────┐
│  Auth Service       │
│  (Publisher)        │
└──────────┬──────────┘
           │
           │ Publishes: user.registered
           │
           ▼
┌────────────────────────────────┐
│  RabbitMQ (Topic Exchange)     │
│  Exchange: al-mizan.events     │
│  Durable: Yes                  │
└──────────┬─────────────────────┘
           │
           │ Consumes: user.registered
           │
           ▼
┌──────────────────────┐
│  Users Service       │
│  (Consumer)          │
│                      │
│ Listens to:          │
│ - user.registered    │
└──────────────────────┘
```

## Events Consumed

### 1. `user.registered`
**Description:** Published when a user successfully registers in the Authentication Service

**Routing Key:** `user.registered`

**Payload:**
```json
{
  "event_id": "uuid",
  "user_id": "uuid",
  "email": "user@example.com",
  "timestamp": "2026-03-30T15:49:00Z"
}
```

**Handler:** `AuthEventsListener`
- Location: `src/rabbitmq/auth-events.listener.ts`
- Queue: `users-service.user.registered`
- Behavior:
  - Logs the event
  - Can trigger related business logic (create profile, assign roles, etc.)
  - Negative acknowledges on error for automatic requeue

## Configuration

### Environment Variables

Add these to your `.env` file:

```env
# RabbitMQ Connection
RABBITMQ_URL=amqp://guest:guest@localhost:5672

# RabbitMQ Exchange (should match Auth Service)
RABBITMQ_EXCHANGE=al-mizan.events
```

### Setup Instructions

1. **Start RabbitMQ:**
   ```bash
   docker run -d --name rabbitmq \
     -p 5672:5672 \
     -p 15672:15672 \
     rabbitmq:3-management
   ```
   - Management UI: http://localhost:15672 (guest:guest)

2. **Generate Prisma Client:**
   ```bash
   npm run prisma:generate
   ```

3. **Run Database Migrations:**
   ```bash
   npm run prisma:migrate
   ```

4. **Seed Database (Optional):**
   ```bash
   npm run db:seed
   ```

5. **Start the Users Service:**
   ```bash
   npm run start:dev
   ```

## Service Architecture

### RabbitMqService (`src/rabbitmq/rabbitmq.service.ts`)
Core service handling RabbitMQ connection and communication.

**Methods:**
- `publish(routingKey: string, payload: unknown)` - Publish events
- `subscribe(routingKey: string, handler: RabbitMqEventHandler, queueName?: string)` - Subscribe to events
- `registerHandler(routingKey: string, handler: RabbitMqEventHandler)` - Register event handlers
- `getHandler(routingKey: string)` - Retrieve registered handlers

**Features:**
- Automatic connection management (OnModuleInit/OnModuleDestroy)
- Graceful error handling if RabbitMQ is unavailable
- Persistent messages and durable queues
- Message acknowledgment (ack) and negative acknowledgment (nack) with requeue

### AuthEventsListener (`src/rabbitmq/auth-events.listener.ts`)
Listens for user registration events from the Auth Service.

**Features:**
- Automatically initializes on module load
- Creates durable queue for fault tolerance
- Handles `user.registered` events
- Logs event details for monitoring
- Prepared for future business logic integration

## Event Flow Example

```
Auth Service publishes:
┌─────────────────────────────────────────┐
│ {                                       │
│   "event_id": "550e8400-e29b-41d4...",│
│   "user_id": "123e4567-e89b-12d3...",  │
│   "email": "john@example.com",          │
│   "timestamp": "2026-03-30T15:49:00Z"  │
│ }                                       │
└────────────────┬────────────────────────┘
                 │
                 ▼
        RabbitMQ Topic Exchange
        (al-mizan.events)
                 │
                 ▼
    ┌────────────────────────────┐
    │ users-service.user.registered
    │ Queue (Durable)            │
    └────────────┬───────────────┘
                 │
                 ▼
        AuthEventsListener
        (UserRegisteredHandler)
                 │
                 ▼ (Process & Log)
        Message Acknowledged ✓
```

## Monitoring

### Logs
- All events are logged with context information
- Errors are logged with stack traces
- Service initialization logs indicate successful subscription

### RabbitMQ Management UI
- URL: `http://localhost:15672`
- Username: `guest`
- Password: `guest`

**Monitor:**
- Exchange: `al-mizan.events`
- Queues: `users-service.*`
- Message rates and backlogs

## Error Handling

### Message Processing Failures
1. Exception thrown during message handling
2. Message is NOT acknowledged (negative ack)
3. Message is requeued automatically
4. Retry logic will attempt processing again
5. Log entry created for investigation

### Connection Failures
1. Service logs warning if RABBITMQ_URL is missing
2. Service continues running without event processing
3. When RabbitMQ becomes available, subscribers will reconnect
4. No message loss if using persistent messages and durable queues

## Future Integration Points

The Users Service can extend the event handling to:

1. **Create Initial Profile**
   - Auto-create profile when user registers
   - Set default preferences

2. **Assign Default Roles**
   - Automatically assign roles based on registration context
   - Can be overridden later by admins

3. **Send Notifications**
   - Send welcome email
   - Create audit log entries

4. **User Onboarding**
   - Trigger KYC/AML checks
   - Generate verification codes

Example implementation:
```typescript
async handle(message: unknown): Promise<void> {
  const event = message as UserRegisteredEvent;
  
  // Create profile
  await this.prisma.profile.create({
    data: {
      userId: event.user_id,
      nom: '', // To be filled by user
      prenom: '', // To be filled by user
    }
  });
  
  // Assign default role
  const defaultRole = await this.prisma.role.findUnique({
    where: { name: RoleName.OPERATEUR_ECONOMIQUE }
  });
  
  await this.prisma.userRole.create({
    data: {
      userId: event.user_id,
      roleId: defaultRole.id
    }
  });
}
```

## Testing

### Manual Testing with RabbitMQ

1. **Connect to RabbitMQ Management UI**
   ```
   http://localhost:15672
   ```

2. **Publish Test Message**
   - Go to Exchanges → al-mizan.events
   - Click "Publish message"
   - Routing key: `user.registered`
   - Payload:
   ```json
   {
     "event_id": "test-123",
     "user_id": "user-456",
     "email": "test@example.com",
     "timestamp": "2026-03-30T15:49:00Z"
   }
   ```

3. **Check Logs**
   - Verify Users Service logs show the processed event
   - Should show: "User registered from Auth Service"

### Programmatic Testing

```typescript
// In a test service or controller
constructor(private rabbitmq: RabbitMqService) {}

async testEvent() {
  await this.rabbitmq.publish('user.registered', {
    event_id: 'test-event-1',
    user_id: 'test-user-1',
    email: 'test@example.com',
    timestamp: new Date().toISOString(),
  });
}
```

## Troubleshooting

### Issue: "RabbitMQ channel unavailable"
- **Cause:** RABBITMQ_URL not set or RabbitMQ service not running
- **Solution:** 
  1. Verify RABBITMQ_URL in .env
  2. Verify RabbitMQ is running: `docker ps | grep rabbitmq`
  3. Check RabbitMQ logs: `docker logs rabbitmq`

### Issue: Messages not being processed
- **Cause:** Event handlers not registered or routing key mismatch
- **Solution:**
  1. Verify routing key matches exactly (case-sensitive)
  2. Check RabbitMQ UI for queue bindings
  3. Verify event payload format matches interface

### Issue: Memory leaks or connection issues
- **Cause:** Improper connection cleanup
- **Solution:**
  - Service uses OnModuleDestroy to cleanup connections
  - Verify service is being destroyed properly
  - Check RabbitMQ connection count in Management UI

## References

- [RabbitMQ Documentation](https://www.rabbitmq.com/documentation.html)
- [amqplib Documentation](https://amqp-node.github.io/amqplib/)
- [NestJS RabbitMQ Integration](https://docs.nestjs.com/microservices/rabbitmq)
- [Topic Exchange Pattern](https://www.rabbitmq.com/tutorials/amqp-concepts.html)
