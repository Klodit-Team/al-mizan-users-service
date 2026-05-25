import { ApiProperty } from '@nestjs/swagger';

export class UserRoleEntity {
  @ApiProperty() id!: string;
  @ApiProperty() userId!: string;
  @ApiProperty() roleId!: string;
  @ApiProperty() assignedAt!: Date;
}