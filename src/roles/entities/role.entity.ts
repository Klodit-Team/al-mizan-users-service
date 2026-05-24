import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RoleNameEnum } from '../../common/enums/role-name.enum';

export class RoleEntity {
  @ApiProperty() id: string;
  @ApiProperty({ enum: RoleNameEnum }) name: RoleNameEnum;
  @ApiPropertyOptional() description: string | null;
}