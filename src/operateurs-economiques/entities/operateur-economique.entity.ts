import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OperateurEconomiqueEntity {
  @ApiProperty() id!: string;
  @ApiProperty() organisationId!: string;
  @ApiProperty() userId!: string;
  @ApiPropertyOptional() qualifications!: string | null;
  @ApiPropertyOptional() categories!: string | null;
  @ApiProperty() isEligible!: boolean;
  @ApiProperty() isBlacklisted!: boolean;
  @ApiPropertyOptional() raisonBlacklist!: string | null;
  @ApiProperty() createdAt!: Date;
}

export class PaginatedOperateurEconomiqueMeta {
  @ApiProperty() total!: number;
  @ApiProperty() page!: number;
  @ApiProperty() limit!: number;
}

export class PaginatedOperateurEconomiqueEntity {
  @ApiProperty({ type: [OperateurEconomiqueEntity] }) data!: OperateurEconomiqueEntity[];
  @ApiProperty({ type: PaginatedOperateurEconomiqueMeta }) meta!: PaginatedOperateurEconomiqueMeta;
}

export class OperateurEconomiqueUserInfo {
  @ApiProperty() firstName!: string;
  @ApiProperty() lastName!: string;
  @ApiProperty() email!: string;
  @ApiProperty() phone!: string;
  @ApiProperty() preferredLanguage!: string;
}

export class OperateurEconomiqueOrgInfo {
  @ApiProperty() denomination!: string;
  @ApiProperty() nif!: string;
  @ApiProperty() nis!: string;
  @ApiProperty() rc!: string;
  @ApiProperty() address!: string;
  @ApiProperty() wilaya!: string;
  @ApiProperty() organizationType!: string;
  @ApiProperty() verificationStatus!: string;
}

export class OperateurEconomiqueInfo {
  @ApiProperty() qualifications!: string;
  @ApiProperty() categories!: string;
  @ApiProperty() isEligible!: boolean;
  @ApiProperty() isBlacklisted!: boolean;
}

export class OperateurEconomiqueProfileEntity {
  @ApiProperty({ type: OperateurEconomiqueUserInfo }) userInfo!: OperateurEconomiqueUserInfo;
  @ApiProperty({ type: OperateurEconomiqueOrgInfo }) organizationInfo!: OperateurEconomiqueOrgInfo;
  @ApiProperty({ type: OperateurEconomiqueInfo }) operateurInfo!: OperateurEconomiqueInfo;
}