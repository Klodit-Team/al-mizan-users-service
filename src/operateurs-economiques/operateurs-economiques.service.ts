import { Injectable, NotFoundException } from '@nestjs/common';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { PrismaService } from '../prisma/prisma.service';
import { RabbitMqService } from '../rabbitmq/rabbitmq.service';
import { buildPagination } from '../common/utils/pagination.util';
import { BlacklistOperateurDto } from './dto/blacklist-operateur.dto';
import { CreateOperateurEconomiqueDto } from './dto/create-operateur-economique.dto';
import { UpdateOperateurEconomiqueDto } from './dto/update-operateur-economique.dto';

@Injectable()
export class OperateursEconomiquesService {
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

  async create(dto: CreateOperateurEconomiqueDto) {
    await this.ensureOrganisationExists(dto.organisationId);

    const { banqueNom, banqueRib, banqueAgence, ...createData } = dto;

    if (banqueNom !== undefined || banqueRib !== undefined || banqueAgence !== undefined) {
      await this.prisma.organisation.update({
        where: { id: dto.organisationId },
        data: { banqueNom, banqueRib, banqueAgence },
      });
    }

    const created = await this.prisma.operateurEconomique.create({ data: createData });

    await this.rabbitMqService.publish('operateur.created', {
      id: created.id,
      userId: created.userId,
      organisationId: created.organisationId,
    });

    return created;
  }

  async list(dto: PaginationQueryDto) {
    const { skip, take } = buildPagination(dto);
    const [data, total] = await Promise.all([
      this.prisma.operateurEconomique.findMany({
        skip,
        take,
        include: { organisation: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.operateurEconomique.count(),
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
    const entity = await this.prisma.operateurEconomique.findUnique({
      where: { id },
      include: { organisation: true },
    });

    if (!entity) {
      throw new NotFoundException(`Operateur economique ${id} not found`);
    }

    return entity;
  }

  async update(id: string, dto: UpdateOperateurEconomiqueDto) {
    const existing = await this.getById(id);

    if (dto.organisationId) {
      await this.ensureOrganisationExists(dto.organisationId);
    }

    const { banqueNom, banqueRib, banqueAgence, ...updateData } = dto;

    const orgId = dto.organisationId || existing.organisationId;
    if (banqueNom !== undefined || banqueRib !== undefined || banqueAgence !== undefined) {
      await this.prisma.organisation.update({
        where: { id: orgId },
        data: { banqueNom, banqueRib, banqueAgence },
      });
    }

    const updated = await this.prisma.operateurEconomique.update({
      where: { id },
      data: updateData,
    });

    await this.rabbitMqService.publish('operateur.updated', {
      id: updated.id,
      userId: updated.userId,
      organisationId: updated.organisationId,
    });

    return updated;
  }

  async blacklist(id: string, dto: BlacklistOperateurDto) {
    await this.getById(id);

    const updated = await this.prisma.operateurEconomique.update({
      where: { id },
      data: {
        isBlacklisted: true,
        raisonBlacklist: dto.reason,
      },
    });

    await this.rabbitMqService.publish('operateur.blacklisted', {
      id: updated.id,
      userId: updated.userId,
      reason: dto.reason,
    });

    return updated;
  }

  async unblacklist(id: string) {
    await this.getById(id);

    const updated = await this.prisma.operateurEconomique.update({
      where: { id },
      data: {
        isBlacklisted: false,
        raisonBlacklist: null,
      },
    });

    await this.rabbitMqService.publish('operateur.unblacklisted', {
      id: updated.id,
      userId: updated.userId,
    });

    return updated;
  }

  async delete(id: string) {
    await this.getById(id);
    await this.prisma.operateurEconomique.delete({ where: { id } });

    await this.rabbitMqService.publish('operateur.deleted', { id });

    return { deleted: true };
  }

  async getProfileByUserId(userId: string) {
    const entity = await this.prisma.operateurEconomique.findFirst({
      where: { userId },
      include: { organisation: true },
    });
    if (!entity) {
      throw new NotFoundException(`Operateur economique profile not found for user ${userId}`);
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
      operateurInfo: {
        qualifications: entity.qualifications || '',
        categories: entity.categories || '',
        isEligible: entity.isEligible,
        isBlacklisted: entity.isBlacklisted,
      },
    };
  }

  async updateProfileByUserId(userId: string, dto: UpdateOperateurEconomiqueDto) {
    const entity = await this.prisma.operateurEconomique.findFirst({
      where: { userId },
    });
    if (!entity) {
      throw new NotFoundException(`Operateur economique profile not found for user ${userId}`);
    }

    await this.prisma.operateurEconomique.update({
      where: { id: entity.id },
      data: dto,
    });

    return this.getProfileByUserId(userId);
  }
}
