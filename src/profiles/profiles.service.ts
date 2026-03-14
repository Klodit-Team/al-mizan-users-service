import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { PrismaService } from '../prisma/prisma.service';
import { RabbitMqService } from '../rabbitmq/rabbitmq.service';

@Injectable()
export class ProfilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rabbitMqService: RabbitMqService,
  ) {}

  async create(dto: CreateProfileDto) {
    const existing = await this.prisma.profile.findUnique({ where: { userId: dto.userId } });
    if (existing) {
      throw new ConflictException(`Profile already exists for user ${dto.userId}`);
    }

    const profile = await this.prisma.profile.create({ data: dto });

    await this.rabbitMqService.publish('profile.created', {
      profileId: profile.id,
      userId: profile.userId,
    });

    return profile;
  }

  async getById(id: string) {
    const profile = await this.prisma.profile.findUnique({ where: { id } });
    if (!profile) {
      throw new NotFoundException(`Profile ${id} not found`);
    }
    return profile;
  }

  async getByUserId(userId: string) {
    const profile = await this.prisma.profile.findUnique({ where: { userId } });
    if (!profile) {
      throw new NotFoundException(`Profile not found for user ${userId}`);
    }
    return profile;
  }

  async update(id: string, dto: UpdateProfileDto) {
    await this.getById(id);

    const profile = await this.prisma.profile.update({
      where: { id },
      data: dto,
    });

    await this.rabbitMqService.publish('profile.updated', {
      profileId: profile.id,
      userId: profile.userId,
    });

    return profile;
  }

  async delete(id: string) {
    const profile = await this.getById(id);
    await this.prisma.profile.delete({ where: { id } });

    await this.rabbitMqService.publish('profile.deleted', {
      profileId: profile.id,
      userId: profile.userId,
    });

    return { deleted: true };
  }
}
