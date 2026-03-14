import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { RoleName } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateRoleDto) {
    const exists = await this.prisma.role.findUnique({ where: { name: dto.name as RoleName } });
    if (exists) {
      throw new ConflictException(`Role ${dto.name} already exists`);
    }

    return this.prisma.role.create({
      data: {
        name: dto.name as RoleName,
        description: dto.description,
      },
    });
  }

  async list() {
    return this.prisma.role.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async getById(id: string) {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) {
      throw new NotFoundException(`Role ${id} not found`);
    }
    return role;
  }

  async seedDefaults() {
    const defaults: Array<{ name: RoleName; description: string }> = [
      { name: RoleName.ADMIN, description: 'Administration complete de la plateforme' },
      {
        name: RoleName.SERVICE_CONTRACTANT,
        description: 'Gestion des appels d offres et attributions',
      },
      {
        name: RoleName.OPERATEUR_ECONOMIQUE,
        description: 'Soumission des offres et suivi des dossiers',
      },
      {
        name: RoleName.MEMBRE_COMMISSION,
        description: 'Participation aux commissions d ouverture/evaluation',
      },
      {
        name: RoleName.CONTROLEUR,
        description: 'Controle des procedures et decisions',
      },
    ];

    await Promise.all(
      defaults.map((item) =>
        this.prisma.role.upsert({
          where: { name: item.name },
          create: item,
          update: { description: item.description },
        }),
      ),
    );

    return this.list();
  }
}
