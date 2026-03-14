import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Channel, ChannelModel, connect } from 'amqplib';

@Injectable()
export class RabbitMqService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMqService.name);
  private connection?: ChannelModel;
  private channel?: Channel;
  private exchange: string;

  constructor(private readonly configService: ConfigService) {
    this.exchange = this.configService.get<string>('RABBITMQ_EXCHANGE') ?? 'users.events';
  }

  async onModuleInit(): Promise<void> {
    const amqpUrl = this.configService.get<string>('RABBITMQ_URL');

    if (!amqpUrl) {
      this.logger.warn('RABBITMQ_URL not configured. RabbitMQ publisher is disabled.');
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

  async publish(routingKey: string, payload: unknown): Promise<void> {
    if (!this.channel) {
      this.logger.warn(`RabbitMQ channel unavailable. Skipping event: ${routingKey}`);
      return;
    }

    this.channel.publish(this.exchange, routingKey, Buffer.from(JSON.stringify(payload)), {
      contentType: 'application/json',
      persistent: true,
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.channel?.close();
    await this.connection?.close();
  }
}
