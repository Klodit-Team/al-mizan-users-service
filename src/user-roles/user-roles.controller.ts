import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AssignRoleDto } from './dto/assign-role.dto';
import { UserRolesService } from './user-roles.service';

@ApiTags('User Roles')
@Controller('user-roles')
export class UserRolesController {
  constructor(private readonly userRolesService: UserRolesService) {}

  @Post()
  assign(@Body() dto: AssignRoleDto) {
    return this.userRolesService.assign(dto);
  }

  @Get(':userId')
  listForUser(@Param('userId') userId: string) {
    return this.userRolesService.listForUser(userId);
  }

  @Delete(':userId/:roleId')
  remove(@Param('userId') userId: string, @Param('roleId') roleId: string) {
    return this.userRolesService.remove(userId, roleId);
  }
}
