import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateServiceContractantDto {
  @IsUUID()
  organisationId!: string;

  @IsUUID()
  userId!: string;

  @IsString()
  @MaxLength(50)
  codeService!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  secteurActivite?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  ordonateur?: string;
}
