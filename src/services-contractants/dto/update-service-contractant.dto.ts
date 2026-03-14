import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class UpdateServiceContractantDto {
  @IsOptional()
  @IsUUID()
  organisationId?: string;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  codeService?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  secteurActivite?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  ordonateur?: string;
}
