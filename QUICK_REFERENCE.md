# RabbitMQ Integration - Quick Reference

## 🚀 Quick Start (5 minutes)

### 1. Setup Environment
```bash
# Copy and edit .env
cp .env.example .env
# Edit: RABBITMQ_URL and DATABASE_URL
```

### 2. Start RabbitMQ
```bash
docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management
```

### 3. Install & Start
```bash
npm install
npm run start:dev
```

### 4. Verify Integration
```
✅ Check logs for: "RabbitMQ connected"
✅ Check logs for: "Auth Events Listeners initialized successfully"
```

---

## 📡 RabbitMQ Connection

| Aspect | Value |
|--------|-------|
| **URL** | `amqp://guest:guest@localhost:5672` |
| **Exchange** | `al-mizan.events` |
| **Exchange Type** | `topic` |
| **Durable** | Yes |
| **Management UI** | http://localhost:15672 |
| **UI Credentials** | guest:guest |

---

## 📨 Event Schemas

### Event: `user.registered`

**From**: Authentication Service

**Routing Key**: `user.registered`

**Queue**: `users-service.user.registered`

**Payload**:
```typescript
{
  event_id: string;      // UUID
  user_id: string;       // UUID from Auth Service
  email: string;         // User email
  timestamp: string;     // ISO 8601
}
```

**Handler**: `UserRegisteredHandler` in `AuthEventsListener`

**Current Action**: Logs event for audit trail

---

## 🛠️ Key Files

| File | Purpose |
|------|---------|
| `src/rabbitmq/rabbitmq.service.ts` | Core RabbitMQ client |
| `src/rabbitmq/auth-events.listener.ts` | Auth event handler |
| `src/rabbitmq/rabbitmq.module.ts` | NestJS module |
| `RABBITMQ_INTEGRATION.md` | Detailed docs |
| `SETUP_GUIDE.md` | Setup instructions |

---

## 📊 Monitoring

### RabbitMQ Management UI
```
URL: http://localhost:15672
Username: guest
Password: guest

Navigate to:
- Exchanges → al-mizan.events (verify exists)
- Queues → users-service.user.registered (verify messages)
- Connections (verify connected)
```

### Service Logs
```bash
npm run start:dev

Look for:
✅ "RabbitMQ connected. Exchange: al-mizan.events"
✅ "Subscribed to user.registered"
✅ "[AUTH EVENT] User registered from Auth Service"
```

---

## 🧪 Test Message

### Via RabbitMQ Management UI

1. Go to http://localhost:15672
2. Exchanges → al-mizan.events
3. Publish message:
   - **Routing key**: `user.registered`
   - **Payload**:
   ```json
   {
     "event_id": "test-1",
     "user_id": "user-1",
     "email": "test@example.com",
     "timestamp": "2026-03-30T15:49:00Z"
   }
   ```

4. Check service logs for:
   ```
   [AUTH EVENT] User registered from Auth Service:
     - Event ID: test-1
     - User ID: user-1
     - Email: test@example.com
     - Timestamp: 2026-03-30T15:49:00Z
   ```

---

## 🔧 Configuration

### Environment Variables (.env)
```env
# RabbitMQ
RABBITMQ_URL=amqp://guest:guest@localhost:5672
RABBITMQ_EXCHANGE=al-mizan.events

# Database
DATABASE_URL=mysql://root:password@localhost:3306/al_mizan_users

# Environment
NODE_ENV=development
```

### Docker Compose Example
```yaml
version: '3.8'

services:
  rabbitmq:
    image: rabbitmq:3-management
    ports:
      - "5672:5672"
      - "15672:15672"
    environment:
      RABBITMQ_DEFAULT_USER: guest
      RABBITMQ_DEFAULT_PASS: guest
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq

  mysql:
    image: mysql:8
    ports:
      - "3306:3306"
    environment:
      MYSQL_ROOT_PASSWORD: password
      MYSQL_DATABASE: al_mizan_users
    volumes:
      - mysql_data:/var/lib/mysql

volumes:
  rabbitmq_data:
  mysql_data:
```

---

## 🎯 API Methods

### Publishing Events
```typescript
// Inject RabbitMqService
constructor(private rabbitmq: RabbitMqService) {}

// Publish an event
await this.rabbitmq.publish('routing.key', {
  data: 'value',
  timestamp: new Date().toISOString()
});
```

### Subscribing to Events
```typescript
// In your listener or service
const handler: RabbitMqEventHandler = {
  async handle(message: unknown) {
    // Process message
    console.log('Received:', message);
  }
};

await this.rabbitmq.subscribe('routing.key', handler, 'queue-name');
```

---

## ⚠️ Troubleshooting

### "RabbitMQ channel unavailable"
```
Cause: RabbitMQ not running or RABBITMQ_URL not set
Solution:
1. docker ps | grep rabbitmq (verify running)
2. Check RABBITMQ_URL in .env
3. Restart: docker restart rabbitmq
```

### "Messages not being processed"
```
Cause: Queue not bound or routing key mismatch
Solution:
1. Check RabbitMQ Management UI for queue bindings
2. Verify routing key matches exactly (case-sensitive)
3. Check message format matches interface
```

### "Connection timeout"
```
Cause: RabbitMQ not accessible
Solution:
1. telnet localhost 5672 (test connectivity)
2. docker logs rabbitmq (check RabbitMQ logs)
3. Check firewall/network rules
```

---

## 📚 Documentation

| Document | Content |
|----------|---------|
| `INTEGRATION_SUMMARY.md` | This integration overview |
| `RABBITMQ_INTEGRATION.md` | Complete integration guide |
| `SETUP_GUIDE.md` | Step-by-step setup instructions |

---

## ✅ Checklist

- [ ] RabbitMQ running on port 5672
- [ ] MySQL running on port 3306
- [ ] `.env` file configured with URLs
- [ ] `npm install` completed
- [ ] `npm run prisma:migrate` executed
- [ ] Service starts: `npm run start:dev`
- [ ] Logs show RabbitMQ connected
- [ ] Test message published and processed
- [ ] All 3 documentation files in place

---

## 🚀 Ready to Use!

Your Users Service is now consuming events from the Auth Service via RabbitMQ.

**Current capabilities**:
- ✅ Receives user.registered events
- ✅ Logs events for audit trail
- ✅ Handles failures gracefully
- ✅ Ready for extension

**Next steps**:
- Extend event handlers with business logic
- Add more event types as needed
- Monitor via RabbitMQ Management UI
- Set up production deployment

---

**Last Updated**: 2026-03-30
**Author**: Configuration Team
**Status**: ✅ Ready for Integration
