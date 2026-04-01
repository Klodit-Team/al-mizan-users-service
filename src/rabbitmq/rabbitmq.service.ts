import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Channel, ChannelModel, connect, ConsumeMessage } from 'amqplib';

export interface RabbitMqEventHandler {
  handle(message: unknown): Promise<void>;
}

@Injectable()
export class RabbitMqService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMqService.name);
  private connection?: ChannelModel;
  private channel?: Channel;
  private exchange: string;
  private maxRetries: number;
  private eventHandlers: Map<string, RabbitMqEventHandler> = new Map();

  constructor(private readonly configService: ConfigService) {
    this.exchange = this.configService.get<string>('RABBITMQ_EXCHANGE') ?? 'al-mizan.events';
    this.maxRetries = Number(this.configService.get<string>('RABBITMQ_MAX_RETRIES') ?? '3');
  }

  async onModuleInit(): Promise<void> {
    const amqpUrl = this.configService.get<string>('RABBITMQ_URL');

    if (!amqpUrl) {
      this.logger.warn('RABBITMQ_URL not configured. RabbitMQ is disabled.');
      return;
    }

    try {
      this.connection = await connect(amqpUrl);
      this.channel = await this.connection.createChannel();
      await this.channel.assertExchange(this.exchange, 'topic', { durable: true });
      this.logger.log(`RabbitMQ connected. Exchange: ${this.exchange}`);
    } catch (error) {
      const trace = error instanceof Error ? error.stack : undefined;
      this.logger.error('RabbitMQ initialization failed. Service will continue without broker.', trace);
    }
  }

  /**
   * Publish an event to the RabbitMQ exchange
   */
  async publish(routingKey: string, payload: unknown): Promise<void> {
    if (!this.channel) {
      this.logger.warn(`RabbitMQ channel unavailable. Skipping event: ${routingKey}`);
      return;
    }

    try {
      this.channel.publish(this.exchange, routingKey, Buffer.from(JSON.stringify(payload)), {
        contentType: 'application/json',
        persistent: true,
        timestamp: Date.now(),
      });
      this.logger.debug(`Published event [${routingKey}]:`, payload);
    } catch (error) {
      this.logger.error(`Failed to publish event [${routingKey}]:`, error);
    }
  }

  /**
   * Subscribe to events with a specific routing key pattern
   */
  async subscribe(
    routingKey: string,
    handler: RabbitMqEventHandler,
    queueName?: string,
  ): Promise<void> {
    if (!this.channel) {
      this.logger.warn(`RabbitMQ channel unavailable. Cannot subscribe to ${routingKey}`);
      return;
    }

    try {
      const queue = await this.channel.assertQueue(queueName ?? `users.${routingKey}`, {
        durable: true,
        arguments: {
          'x-message-ttl': 86400000, // 24 hours
        },
      });

      await this.channel.bindQueue(queue.queue, this.exchange, routingKey);

      await this.channel.consume(queue.queue, async (msg: ConsumeMessage | null) => {
        if (!msg) return;

        try {
          const content = JSON.parse(msg.content.toString());
          this.logger.debug(`Received event [${routingKey}]:`, content);
          await handler.handle(content);
          this.channel?.ack(msg);
        } catch (error) {
          this.logger.error(`Error processing event [${routingKey}]:`, error);

          const currentRetry = Number((msg.properties.headers?.['x-retry-count'] as number) ?? 0);

          if (currentRetry < this.maxRetries) {
            const nextRetry = currentRetry + 1;

            this.channel?.publish(this.exchange, routingKey, msg.content, {
              persistent: true,
              contentType: msg.properties.contentType ?? 'application/json',
              headers: {
                ...(msg.properties.headers ?? {}),
                'x-retry-count': nextRetry,
              },
            });

            this.channel?.ack(msg);
            this.logger.warn(
              `Requeued event [${routingKey}] with retry ${nextRetry}/${this.maxRetries}`,
            );
          } else {
            this.channel?.nack(msg, false, false);
            this.logger.error(
              `Dropped event [${routingKey}] after ${currentRetry} retries (max ${this.maxRetries})`,
            );
          }
        }
      });

      this.logger.log(`Subscribed to ${routingKey} (Queue: ${queue.queue})`);
    } catch (error) {
      this.logger.error(`Failed to subscribe to ${routingKey}:`, error);
    }
  }

  /**
   * Register an event handler for a specific routing key
   */
  registerHandler(routingKey: string, handler: RabbitMqEventHandler): void {
    this.eventHandlers.set(routingKey, handler);
    this.logger.debug(`Handler registered for ${routingKey}`);
  }

  /**
   * Get a registered handler
   */
  getHandler(routingKey: string): RabbitMqEventHandler | undefined {
    return this.eventHandlers.get(routingKey);
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.channel?.close();
      await this.connection?.close();
      this.logger.log('RabbitMQ connection closed');
    } catch (error) {
      this.logger.error('Error closing RabbitMQ connection:', error);
    }
  }
}
