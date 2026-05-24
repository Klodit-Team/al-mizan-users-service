import { Injectable, NotFoundException } from '@nestjs/common';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { PrismaService } from '../prisma/prisma.service';
import { RabbitMqService } from '../rabbitmq/rabbitmq.service';
import { buildPagination } from '../common/utils/pagination.util';
import { CreateServiceContractantDto } from './dto/create-service-contractant.dto';
import { UpdateServiceContractantDto } from './dto/update-service-contractant.dto';

@Injectable()
export class ServicesContractantsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rabbitMqService: RabbitMqService,
  ) {}

  private async ensureOrganisationExists(organisationId: string): Promise<void> {
    const organisation = await this.prisma.organisation.findUnique({ where: { id: organisationId } });
    if (!organisation) {
      throw new NotFoundException(`Organisation ${organisationId} not found`);
    }
  }

  async create(dto: CreateServiceContractantDto) {
    await this.ensureOrganisationExists(dto.organisationId);

    const created = await this.prisma.serviceContractant.create({ data: dto });

    await this.rabbitMqService.publish('service-contractant.created', {
      id: created.id,
      userId: created.userId,
      organisationId: created.organisationId,
    });

    return created;
  }

  async list(dto: PaginationQueryDto) {
    const { skip, take } = buildPagination(dto);
    const [data, total] = await Promise.all([
      this.prisma.serviceContractant.findMany({
        skip,
        take,
        include: { organisation: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.serviceContractant.count(),
    ]);

    return {
      data,
      meta: {
        total,
        page: dto.page,
        limit: dto.limit,
      },
    };
  }

  async getById(id: string) {
    const entity = await this.prisma.serviceContractant.findUnique({
      where: { id },
      include: { organisation: true },
    });
    if (!entity) {
      throw new NotFoundException(`Service contractant ${id} not found`);
    }
    return entity;
  }

  async update(id: string, dto: UpdateServiceContractantDto) {
    await this.getById(id);

    if (dto.organisationId) {
      await this.ensureOrganisationExists(dto.organisationId);
    }

    const updated = await this.prisma.serviceContractant.update({
      where: { id },
      data: dto,
    });

    await this.rabbitMqService.publish('service-contractant.updated', {
      id: updated.id,
      userId: updated.userId,
      organisationId: updated.organisationId,
    });

    return updated;
  }

  async delete(id: string) {
    await this.getById(id);
    await this.prisma.serviceContractant.delete({ where: { id } });

    await this.rabbitMqService.publish('service-contractant.deleted', { id });

    return { deleted: true };
  }

  async getProfileByUserId(userId: string) {
    const entity = await this.prisma.serviceContractant.findFirst({
      where: { userId },
      include: { organisation: true },
    });
    if (!entity) {
      throw new NotFoundException(`Service contractant profile not found for user ${userId}`);
    }

    const profile = await this.prisma.profile.findFirst({
      where: { userId },
    }).catch(() => null);

    return {
      userInfo: {
        firstName: profile?.prenom || '',
        lastName: profile?.nom || '',
        email: '',
        phone: profile?.telephone || '',
        preferredLanguage: profile?.langue || 'fr',
      },
      organizationInfo: {
        denomination: entity.organisation?.denomination || '',
        nif: entity.organisation?.nif || '',
        nis: entity.organisation?.nis || '',
        rc: entity.organisation?.registreCommerce || '',
        address: entity.organisation?.adresse || '',
        wilaya: entity.organisation?.wilaya || '',
        organizationType: entity.organisation?.type || '',
        verificationStatus: entity.organisation?.isVerified ? 'verifie' : 'en_attente',
      },
      serviceInfo: {
        serviceCode: entity.codeService || '',
        activitySector: entity.secteurActivite || '',
        ordonnateur: entity.ordonateur || '',
      },
    };
  }

  async updateProfileByUserId(userId: string, dto: UpdateServiceContractantDto) {
    const entity = await this.prisma.serviceContractant.findFirst({
      where: { userId },
    });
    if (!entity) {
      throw new NotFoundException(`Service contractant profile not found for user ${userId}`);
    }

    await this.prisma.serviceContractant.update({
      where: { id: entity.id },
      data: dto,
    });

    return this.getProfileByUserId(userId);
  }
}
