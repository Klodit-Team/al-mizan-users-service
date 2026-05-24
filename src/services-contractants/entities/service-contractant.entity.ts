import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ServiceContractantEntity {
  @ApiProperty() id!: string;
  @ApiProperty() organisationId!: string;
  @ApiProperty() userId!: string;
  @ApiProperty() codeService!: string;
  @ApiPropertyOptional() secteurActivite!: string | null;
  @ApiPropertyOptional() ordonateur!: string | null;
  @ApiProperty() createdAt!: Date;
}

export class PaginatedServiceContractantMeta {
  @ApiProperty() total!: number;
  @ApiProperty() page!: number;
  @ApiProperty() limit!: number;
}

export class PaginatedServiceContractantEntity {
  @ApiProperty({ type: [ServiceContractantEntity] }) data!: ServiceContractantEntity[];
  @ApiProperty({ type: PaginatedServiceContractantMeta }) meta!: PaginatedServiceContractantMeta;
}

export class ServiceContractantUserInfo {
  @ApiProperty() firstName!: string;
  @ApiProperty() lastName!: string;
  @ApiProperty() email!: string;
  @ApiProperty() phone!: string;
  @ApiProperty() preferredLanguage!: string;
}

export class ServiceContractantOrgInfo {
  @ApiProperty() denomination!: string;
  @ApiProperty() nif!: string;
  @ApiProperty() nis!: string;
  @ApiProperty() rc!: string;
  @ApiProperty() address!: string;
  @ApiProperty() wilaya!: string;
  @ApiProperty() organizationType!: string;
  @ApiProperty() verificationStatus!: string;
}

export class ServiceContractantServiceInfo {
  @ApiProperty() serviceCode!: string;
  @ApiProperty() activitySector!: string;
  @ApiProperty() ordonnateur!: string;
}

export class ServiceContractantProfileEntity {
  @ApiProperty({ type: ServiceContractantUserInfo }) userInfo!: ServiceContractantUserInfo;
  @ApiProperty({ type: ServiceContractantOrgInfo }) organizationInfo!: ServiceContractantOrgInfo;
  @ApiProperty({ type: ServiceContractantServiceInfo }) serviceInfo!: ServiceContractantServiceInfo;
}