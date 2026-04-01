# Users Service - RabbitMQ Integration Setup

## Quick Start

### 1. Prerequisites
- Node.js 18+
- MySQL 8.0+
- RabbitMQ 3.12+
- Docker (optional, for RabbitMQ)

### 2. Environment Setup

Create a `.env` file in the project root:

```env
# Database
DATABASE_URL=mysql://root:password@localhost:3306/al_mizan_users

# RabbitMQ
RABBITMQ_URL=amqp://guest:guest@localhost:5672
RABBITMQ_EXCHANGE=al-mizan.events

# Environment
NODE_ENV=development
```

### 3. Start RabbitMQ (using Docker)

```bash
docker run -d \
  --name rabbitmq \
  -p 5672:5672 \
  -p 15672:15672 \
  -e RABBITMQ_DEFAULT_USER=guest \
  -e RABBITMQ_DEFAULT_PASS=guest \
  rabbitmq:3-management
```

Access Management UI: http://localhost:15672 (guest:guest)

### 4. Install Dependencies

```bash
npm install
```

### 5. Generate Prisma Client

```bash
npm run prisma:generate
```

### 6. Run Migrations

```bash
npm run prisma:migrate
```

### 7. Seed Database (Optional)

```bash
npm run db:seed
```

### 8. Start the Service

**Development:**
```bash
npm run start:dev
```

**Production:**
```bash
npm run build
npm run start:prod
```

## Architecture Overview

### Event Flow

```
┌──────────────────────┐
│   Auth Service       │
│ (External Service)   │
└──────────┬───────────┘
           │
           │ Publishes: user.registered
           │ Exchange: al-mizan.events
           │ Routing Key: user.registered
           │
           ▼
┌──────────────────────────────────┐
│      RabbitMQ Broker             │
│  Topic Exchange: al-mizan.events │
│  Durable: Yes                    │
└──────────┬───────────────────────┘
           │
           │ Bindings:
           │ - Queue: users-service.user.registered
           │   Pattern: user.registered
           │
           ▼
┌──────────────────────┐
│  Users Service       │
│  (This Service)      │
│                      │
│ Consumers:           │
│ - AuthEventsListener │
│   (auto-subscribed)  │
└──────────────────────┘
```

### Key Components

#### 1. RabbitMqService (`src/rabbitmq/rabbitmq.service.ts`)
- **Purpose**: Core RabbitMQ connection and communication
- **Type**: Global injectable service
- **Features**:
  - Auto-connection on module init
  - Graceful degradation if RabbitMQ unavailable
  - Event publishing
  - Event subscription with handlers
  - Automatic reconnection support

#### 2. AuthEventsListener (`src/rabbitmq/auth-events.listener.ts`)
- **Purpose**: Listen for authentication events
- **Type**: Module provider, auto-initialized
- **Subscriptions**:
  - `user.registered` → Queue: `users-service.user.registered`

#### 3. RabbitMqModule (`src/rabbitmq/rabbitmq.module.ts`)
- **Purpose**: NestJS module exporting RabbitMQ services
- **Type**: Global module
- **Exports**: RabbitMqService

## Event Details

### Event: `user.registered`

**Published by**: Authentication Service

**When**: User successfully registers

**Routing Key**: `user.registered`

**Payload Schema**:
```typescript
interface UserRegisteredEvent {
  event_id: string;        // UUID of the event
  user_id: string;         // UUID of the new user
  email: string;           // User's email address
  timestamp: string;       // ISO 8601 timestamp
}
```

**Example Payload**:
```json
{
  "event_id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "email": "john.doe@example.com",
  "timestamp": "2026-03-30T15:49:00.000Z"
}
```

**Handler**: `UserRegisteredHandler`
- Location: `src/rabbitmq/auth-events.listener.ts`
- Action: Logs event for audit trail
- Future: Can be extended for profile creation, role assignment, etc.

## Testing the Integration

### 1. Via RabbitMQ Management UI

1. Navigate to http://localhost:15672
2. Login with guest:guest
3. Go to **Exchanges** tab
4. Click on **al-mizan.events**
5. Scroll to "Publish message"
6. Set Routing key: `user.registered`
7. Set Payload (Json):
   ```json
   {
     "event_id": "test-event-001",
     "user_id": "test-user-001",
     "email": "test@example.com",
     "timestamp": "2026-03-30T15:49:00Z"
   }
   ```
8. Click "Publish message"
9. Check Users Service logs for processing message

### 2. Via Service Logs

When a message is processed successfully, you should see:
```
[AuthEventsListener] [AUTH EVENT] User registered from Auth Service:
  - Event ID: test-event-001
  - User ID: test-user-001
  - Email: test@example.com
  - Timestamp: 2026-03-30T15:49:00Z
[AuthEventsListener] User registration event processed successfully for user: test-user-001
```

### 3. Check Queue Status

In RabbitMQ Management UI:
1. Go to **Queues** tab
2. Look for `users-service.user.registered`
3. Monitor:
   - Ready: Number of unacknowledged messages
   - Unacked: Number of acknowledged messages
   - Total: Total message count

## Monitoring & Debugging

### 1. Service Logs
Check for initialization messages:
```
[RabbitMqService] RabbitMQ connected. Exchange: al-mizan.events
[AuthEventsListener] Initializing Auth Events Listeners...
[AuthEventsListener] ✓ Auth Events Listeners initialized successfully
```

### 2. RabbitMQ Management UI
- **Exchanges**: Verify `al-mizan.events` exists and is type "topic"
- **Queues**: Check `users-service.user.registered` queue status
- **Connections**: Monitor active connections
- **Channels**: View message throughput

### 3. Common Issues

**Issue**: RabbitMQ channel unavailable
```
[RabbitMqService] RabbitMQ connection failed: Error: connect ECONNREFUSED
```
**Solution**: 
- Verify RabbitMQ is running
- Check RABBITMQ_URL is correct
- Ensure RabbitMQ credentials are valid

**Issue**: Queue not receiving messages
```
[RabbitMqService] RabbitMQ channel unavailable. Skipping event: user.registered
```
**Solution**:
- Verify RABBITMQ_EXCHANGE matches auth service
- Check routing key spelling
- Verify exchange-queue binding exists

**Issue**: Messages not being acknowledged
- Check handler for exceptions
- Verify message format matches interface
- Check logs for handler errors

## Configuration Reference

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `RABBITMQ_URL` | - | RabbitMQ connection URL (required) |
| `RABBITMQ_EXCHANGE` | `al-mizan.events` | Topic exchange name |
| `DATABASE_URL` | - | MySQL connection URL (required) |
| `NODE_ENV` | `development` | Environment (development/production) |

### RabbitMQ Connection URL Format

```
amqp://[username]:[password]@[host]:[port]
```

Examples:
- Local: `amqp://guest:guest@localhost:5672`
- Docker: `amqp://guest:guest@rabbitmq:5672`
- Remote: `amqp://user:pass@rabbitmq.example.com:5672`

## Extending the Integration

### Adding New Event Handlers

1. Create handler class implementing `RabbitMqEventHandler`:

```typescript
class MyEventHandler implements RabbitMqEventHandler {
  constructor(private readonly logger: Logger) {}

  async handle(message: unknown): Promise<void> {
    // Process message
    this.logger.log('Processing my event:', message);
  }
}
```

2. Subscribe in listener or module:

```typescript
const handler = new MyEventHandler(this.logger);
await this.rabbitmq.subscribe('my.event', handler, 'my-queue-name');
```

### Publishing Events from Users Service

```typescript
// Inject RabbitMqService
constructor(private rabbitmq: RabbitMqService) {}

// Publish event
async notifyUserCreated(userId: string) {
  await this.rabbitmq.publish('user.profile_created', {
    user_id: userId,
    timestamp: new Date().toISOString(),
  });
}
```

## Production Deployment

### Recommendations

1. **RabbitMQ Cluster**: Use RabbitMQ cluster for HA
2. **Persistent Storage**: Enable RabbitMQ persistence
3. **Connection Pooling**: Configure connection pool size
4. **Error Handling**: Implement dead-letter queues for failed messages
5. **Monitoring**: Use Prometheus metrics for monitoring
6. **Logging**: Use ELK stack or similar for log aggregation

### Environment Setup

```env
RABBITMQ_URL=amqp://rabbitmq-user:strong-password@rabbitmq.example.com:5672
RABBITMQ_EXCHANGE=al-mizan.events
DATABASE_URL=mysql://db-user:db-pass@db.example.com/al_mizan_users
NODE_ENV=production
```

## Troubleshooting Guide

### Connection Issues

**Symptom**: Service fails to start or RabbitMQ connection times out

**Diagnostics**:
```bash
# Test RabbitMQ connectivity
telnet localhost 5672

# Check RabbitMQ logs
docker logs rabbitmq

# Verify environment variables
echo $RABBITMQ_URL
```

**Solutions**:
1. Ensure RabbitMQ is running and accessible
2. Verify credentials in RABBITMQ_URL
3. Check firewall rules (port 5672)
4. Verify network connectivity between services

### Message Processing Issues

**Symptom**: Messages published but not processed

**Diagnostics**:
1. Check RabbitMQ Management UI for queue depth
2. Verify queue is bound to exchange with correct pattern
3. Check service logs for errors
4. Verify message format matches expected schema

**Solutions**:
1. Restart consumer service
2. Purge queue and re-publish test message
3. Check handler implementation for exceptions
4. Verify routing key matches subscription pattern

## References

- [RabbitMQ Official Documentation](https://www.rabbitmq.com/documentation.html)
- [AMQP Protocol](https://www.rabbitmq.com/tutorials/amqp-concepts.html)
- [amqplib Node.js Client](https://amqp-node.github.io/amqplib/)
- [NestJS Event-Driven Architecture](https://docs.nestjs.com/microservices/rabbitmq)

## Support

For issues or questions:
1. Check this documentation first
2. Review RabbitMQ logs
3. Check service logs for detailed errors
4. Consult RabbitMQ documentation
5. Contact the development team
