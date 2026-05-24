import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OperateurEconomiqueEntity {
  @ApiProperty() id: string;
  @ApiProperty() organisationId: string;
  @ApiProperty() userId: string;
  @ApiPropertyOptional() qualifications: string | null;
  @ApiPropertyOptional() categories: string | null;
  @ApiProperty() isEligible: boolean;
  @ApiProperty() isBlacklisted: boolean;
  @ApiPropertyOptional() raisonBlacklist: string | null;
  @ApiProperty() createdAt: Date;
}

export class PaginatedOperateurEconomiqueMeta {
  @ApiProperty() total: number;
  @ApiProperty() page: number;
  @ApiProperty() limit: number;
}

export class PaginatedOperateurEconomiqueEntity {
  @ApiProperty({ type: [OperateurEconomiqueEntity] }) data: OperateurEconomiqueEntity[];
  @ApiProperty({ type: PaginatedOperateurEconomiqueMeta }) meta: PaginatedOperateurEconomiqueMeta;
}