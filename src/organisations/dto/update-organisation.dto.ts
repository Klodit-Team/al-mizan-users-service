import { IsEmail, IsEnum, IsOptional, IsString, Length, MaxLength } from 'class-validator';
import { OrganisationTypeEnum } from '../../common/enums/organisation-type.enum';

export class UpdateOrganisationDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  denomination?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  nif?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  nis?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  registreCommerce?: string;

  @IsOptional()
  @IsString()
  adresse?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  wilaya?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  commune?: string;

  @IsOptional()
  @IsString()
  @Length(8, 20)
  telephone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsEnum(OrganisationTypeEnum)
  type?: OrganisationTypeEnum;
}
