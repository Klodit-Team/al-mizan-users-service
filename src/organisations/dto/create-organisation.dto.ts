import {
  IsArray,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OrganisationTypeEnum } from '../../common/enums/organisation-type.enum';
import {
  OrganisationDocumentDto,
  OrganisationDocumentType,
} from './organisation-document.dto';

export class CreateOrganisationDto {
  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  eventId?: string;

  @IsString()
  @MaxLength(255)
  denomination!: string;

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
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrganisationDocumentDto)
  documents?: OrganisationDocumentDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => OrganisationDocumentDto)
  nifFile?: OrganisationDocumentDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => OrganisationDocumentDto)
  nisFile?: OrganisationDocumentDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => OrganisationDocumentDto)
  denominationFile?: OrganisationDocumentDto;

  @IsEnum(OrganisationTypeEnum)
  type!: OrganisationTypeEnum;
}

export const ORGANISATION_CREATE_DOCUMENT_TYPE_BY_FIELD = {
  nifFile: OrganisationDocumentType.NIF,
  nisFile: OrganisationDocumentType.NIS,
  denominationFile: OrganisationDocumentType.DENOMINATION,
} as const;
