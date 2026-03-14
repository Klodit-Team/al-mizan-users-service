import { IsBoolean, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateOperateurEconomiqueDto {
  @IsUUID()
  organisationId!: string;

  @IsUUID()
  userId!: string;

  @IsOptional()
  @IsString()
  qualifications?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  categories?: string;

  @IsOptional()
  @IsBoolean()
  isEligible?: boolean;
}
