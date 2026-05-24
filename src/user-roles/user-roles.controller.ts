import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { AssignRoleDto } from './dto/assign-role.dto';
import { UserRolesService } from './user-roles.service';
import { UserRoleEntity } from './entities/user-role.entity';
import { DeleteResponseEntity } from '../organisations/entities/organisation.entity';

@ApiTags('User Roles')
@Controller('user-roles')
export class UserRolesController {
  constructor(private readonly userRolesService: UserRolesService) {}

  @Post()
  @ApiOperation({ summary: 'Assign role to user' })
  @ApiResponse({ status: 201, type: UserRoleEntity })
  assign(@Body() dto: AssignRoleDto): Promise<any> {
    return this.userRolesService.assign(dto);
  }

  @Get(':userId')
  @ApiOperation({ summary: 'List roles assigned to a user' })
  @ApiParam({ name: 'userId', type: String })
  @ApiResponse({ status: 200, type: [UserRoleEntity] })
  listForUser(@Param('userId') userId: string): Promise<any> {
    return this.userRolesService.listForUser(userId);
  }

  @Delete(':userId/:roleId')
  @ApiOperation({ summary: 'Remove role from user' })
  @ApiParam({ name: 'userId', type: String })
  @ApiParam({ name: 'roleId', type: String })
  @ApiResponse({ status: 200, type: DeleteResponseEntity })
  remove(@Param('userId') userId: string, @Param('roleId') roleId: string): Promise<any> {
    return this.userRolesService.remove(userId, roleId);
  }
}