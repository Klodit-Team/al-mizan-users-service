import { Global, Module } from '@nestjs/common';
import { RabbitMqService } from './rabbitmq.service';
import { AuthEventsListener } from './auth-events.listener';

@Global()
@Module({
  providers: [RabbitMqService, AuthEventsListener],
  exports: [RabbitMqService],
})
export class RabbitMqModule {}