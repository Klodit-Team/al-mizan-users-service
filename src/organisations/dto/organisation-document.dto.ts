import { IsBase64, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export enum OrganisationDocumentType {
  NIS = 'NIS',
  NIF = 'NIF',
  DENOMINATION = 'DENOMINATION',
}

export class OrganisationDocumentDto {
  @IsEnum(OrganisationDocumentType)
  type!: OrganisationDocumentType;

  @IsString()
  @MaxLength(255)
  fileName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  mimeType?: string;

  @IsString()
  @IsBase64()
  contentBase64!: string;
}
