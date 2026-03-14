import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { RoleNameEnum } from '../../common/enums/role-name.enum';

export class CreateRoleDto {
  @IsEnum(RoleNameEnum)
  name!: RoleNameEnum;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;
}
