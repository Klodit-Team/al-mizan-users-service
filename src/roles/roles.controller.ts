import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateRoleDto } from './dto/create-role.dto';
import { RolesService } from './roles.service';
import { RoleEntity } from './entities/role.entity';

@ApiTags('Roles')
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @ApiOperation({ summary: 'Create RBAC role' })
  @ApiResponse({ status: 201, type: RoleEntity })
  create(@Body() dto: CreateRoleDto): Promise<any> {
    return this.rolesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List RBAC roles' })
  @ApiResponse({ status: 200, type: [RoleEntity] })
  list(): Promise<any> {
    return this.rolesService.list();
  }

  @Post('seed-defaults')
  @ApiOperation({ summary: 'Seed default RBAC roles' })
  @ApiResponse({ status: 201, type: [RoleEntity] })
  seedDefaults(): Promise<any> {
    return this.rolesService.seedDefaults();
  }
}