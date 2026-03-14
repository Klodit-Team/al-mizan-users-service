import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CreateOrganisationDto } from './dto/create-organisation.dto';
import { ListOrganisationsDto } from './dto/list-organisations.dto';
import { UpdateOrganisationDto } from './dto/update-organisation.dto';
import { PrismaService } from '../prisma/prisma.service';
import { RabbitMqService } from '../rabbitmq/rabbitmq.service';
import { buildPagination } from '../common/utils/pagination.util';

@Injectable()
export class OrganisationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rabbitMqService: RabbitMqService,
  ) {}

  async create(dto: CreateOrganisationDto) {
    const organisation = await this.prisma.organisation.create({
      data: {
        denomination: dto.denomination,
        nif: dto.nif,
        nis: dto.nis,
        registreCommerce: dto.registreCommerce,
        adresse: dto.adresse,
        wilaya: dto.wilaya,
        commune: dto.commune,
        telephone: dto.telephone,
        email: dto.email,
        type: dto.type,
      },
    });

    await this.rabbitMqService.publish('organisation.created', {
      organisationId: organisation.id,
    });

    return organisation;
  }

  async list(dto: ListOrganisationsDto) {
    const where: Prisma.OrganisationWhereInput = {
      type: dto.type,
      isVerified: dto.isVerified,
      ...(dto.q
        ? {
            OR: [
              { denomination: { contains: dto.q } },
              { nif: { contains: dto.q } },
              { nis: { contains: dto.q } },
            ],
          }
        : {}),
    };

    const { skip, take } = buildPagination(dto);

    const [data, total] = await Promise.all([
      this.prisma.organisation.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.organisation.count({ where }),
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
    const organisation = await this.prisma.organisation.findUnique({ where: { id } });
    if (!organisation) {
      throw new NotFoundException(`Organisation ${id} not found`);
    }
    return organisation;
  }

  async update(id: string, dto: UpdateOrganisationDto) {
    await this.getById(id);

    const organisation = await this.prisma.organisation.update({
      where: { id },
      data: dto,
    });

    await this.rabbitMqService.publish('organisation.updated', {
      organisationId: organisation.id,
    });

    return organisation;
  }

  async verify(id: string) {
    await this.getById(id);

    const organisation = await this.prisma.organisation.update({
      where: { id },
      data: { isVerified: true },
    });

    await this.rabbitMqService.publish('organisation.verified', {
      organisationId: organisation.id,
    });

    return organisation;
  }

  async delete(id: string) {
    await this.getById(id);
    await this.prisma.organisation.delete({ where: { id } });

    await this.rabbitMqService.publish('organisation.deleted', { organisationId: id });

    return { deleted: true };
  }
}
