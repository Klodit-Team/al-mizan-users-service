import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RabbitMqService } from '../rabbitmq/rabbitmq.service';
import { AssignRoleDto } from './dto/assign-role.dto';
import { RolesService } from '../roles/roles.service';

@Injectable()
export class UserRolesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rabbitMqService: RabbitMqService,
    private readonly rolesService: RolesService,
  ) {}

  async assign(dto: AssignRoleDto) {
    await this.rolesService.getById(dto.roleId);

    const existing = await this.prisma.userRole.findFirst({
      where: { userId: dto.userId, roleId: dto.roleId },
    });

    if (existing) {
      throw new ConflictException('Role already assigned to this user');
    }

    const assigned = await this.prisma.userRole.create({
      data: dto,
      include: { role: true },
    });

    await this.rabbitMqService.publish('user-role.assigned', {
      userId: assigned.userId,
      roleId: assigned.roleId,
      roleName: assigned.role.name,
    });

    return assigned;
  }

  async listForUser(userId: string) {
    return this.prisma.userRole.findMany({
      where: { userId },
      include: { role: true },
      orderBy: { assignedAt: 'desc' },
    });
  }

  async remove(userId: string, roleId: string) {
    const existing = await this.prisma.userRole.findFirst({
      where: { userId, roleId },
      include: { role: true },
    });

    if (!existing) {
      throw new NotFoundException('Role assignment not found');
    }

    await this.prisma.userRole.delete({ where: { id: existing.id } });

    await this.rabbitMqService.publish('user-role.removed', {
      userId,
      roleId,
      roleName: existing.role.name,
    });

    return { deleted: true };
  }
}
