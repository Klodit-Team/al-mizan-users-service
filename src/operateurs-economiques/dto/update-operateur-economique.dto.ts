import { IsBoolean, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class UpdateOperateurEconomiqueDto {
  @IsOptional()
  @IsUUID()
  organisationId?: string;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsBoolean()
  isEligible?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  banqueNom?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  banqueRib?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  banqueAgence?: string;
}
