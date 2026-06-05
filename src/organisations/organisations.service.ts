import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CreateOrganisationDto } from './dto/create-organisation.dto';
import { ListOrganisationsDto } from './dto/list-organisations.dto';
import { UpdateOrganisationDto } from './dto/update-organisation.dto';
import { PrismaService } from '../prisma/prisma.service';
import { RabbitMqService } from '../rabbitmq/rabbitmq.service';
import { buildPagination } from '../common/utils/pagination.util';
import { OrganisationDocumentType } from './dto/organisation-document.dto';

interface OrganisationDocumentReferenceUpsertInput {
  type: OrganisationDocumentType;
  documentId: string;
  fileName?: string;
  storageKey?: string;
  url?: string;
  status?: string;
}

@Injectable()
export class OrganisationsService {
  private get prismaClient(): any {
    return this.prisma;
  }

  constructor(
    private readonly prisma: PrismaService,
    private readonly rabbitMqService: RabbitMqService,
  ) {}

  async create(dto: CreateOrganisationDto) {
    const {
      documents,
      nifFile,
      nisFile,
      denominationFile,
      userId,
      eventId,
      ...createData
    } = dto;

    const organisation = await this.prisma.organisation.create({
      data: {
        ...createData,
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
    const organisation = await this.prismaClient.organisation.findUnique({
      where: { id },
      include: { documentReferences: true },
    });
    if (!organisation) {
      throw new NotFoundException(`Organisation ${id} not found`);
    }
    return organisation;
  }

  async update(id: string, dto: UpdateOrganisationDto) {
    await this.getById(id);

    const {
      documents,
      nifFile: _nifFile,
      nisFile: _nisFile,
      denominationFile: _denominationFile,
      userId,
      eventId,
      ...updateData
    } = dto;

    const organisation = await this.prisma.organisation.update({
      where: { id },
      data: updateData,
    });

    await this.rabbitMqService.publish('organisation.updated', {
      organisationId: organisation.id,
    });

    return organisation;
  }

  async verify(id: string) {
    const organisation = await this.getById(id);

    // Contrôle de complétude pour la vérification du dossier
    const isPublicBody = ['EPA', 'EPIC', 'MINISTERE'].includes(organisation.type);
    if (!isPublicBody) {
      // 1. Vérifier les informations textuelles obligatoires
      if (!organisation.nif || !organisation.nis || !organisation.registreCommerce) {
        throw new BadRequestException(
          "Le dossier est incomplet : NIF, NIS et Registre du Commerce sont obligatoires pour ce type d'organisation.",
        );
      }

      // 2. Vérifier les documents téléversés
      const docTypes = organisation.documentReferences.map((ref: any) => ref.type);
      const hasNifDoc = docTypes.includes('NIF');
      const hasNisDoc = docTypes.includes('NIS');
      const hasDenominationDoc = docTypes.includes('DENOMINATION');

      if (!hasNifDoc || !hasNisDoc || !hasDenominationDoc) {
        throw new BadRequestException(
          "Le dossier est incomplet : Les documents justificatifs (NIF, NIS, Dénomination/RC) doivent être téléversés.",
        );
      }
    }

    const updated = await this.prisma.organisation.update({
      where: { id },
      data: { isVerified: true },
    });

    await this.rabbitMqService.publish('organisation.verified', {
      organisationId: updated.id,
    });

    return updated;
  }

  async delete(id: string) {
    await this.getById(id);
    await this.prisma.organisation.delete({ where: { id } });

    await this.rabbitMqService.publish('organisation.deleted', { organisationId: id });

    return { deleted: true };
  }

  async upsertDocumentReferences(
    organisationId: string,
    references: OrganisationDocumentReferenceUpsertInput[],
  ): Promise<void> {
    if (!references.length) {
      return;
    }

    await this.getById(organisationId);

    await this.prisma.$transaction(
      references.map(reference =>
        this.prismaClient.organisationDocumentReference.upsert({
          where: {
            organisationId_type: {
              organisationId,
              type: reference.type as any,
            },
          },
          update: {
            documentId: reference.documentId,
            fileName: reference.fileName,
            storageKey: reference.storageKey,
            url: reference.url,
            status: reference.status,
          },
          create: {
            organisationId,
            type: reference.type as any,
            documentId: reference.documentId,
            fileName: reference.fileName,
            storageKey: reference.storageKey,
            url: reference.url,
            status: reference.status,
          },
        }),
      ),
    );
  }
}
