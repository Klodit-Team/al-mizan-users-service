import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrganisationTypeEnum } from '../../common/enums/organisation-type.enum';

export class OrganisationEntity {
  @ApiProperty() id: string;
  @ApiProperty() denomination: string;
  @ApiPropertyOptional() nif: string | null;
  @ApiPropertyOptional() nis: string | null;
  @ApiPropertyOptional() registreCommerce: string | null;
  @ApiPropertyOptional() adresse: string | null;
  @ApiPropertyOptional() wilaya: string | null;
  @ApiPropertyOptional() commune: string | null;
  @ApiPropertyOptional() telephone: string | null;
  @ApiPropertyOptional() email: string | null;
  @ApiProperty({ enum: OrganisationTypeEnum }) type: OrganisationTypeEnum;
  @ApiProperty() isVerified: boolean;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}

export class PaginatedOrganisationMeta {
  @ApiProperty() total: number;
  @ApiProperty() page: number;
  @ApiProperty() limit: number;
}

export class PaginatedOrganisationEntity {
  @ApiProperty({ type: [OrganisationEntity] }) data: OrganisationEntity[];
  @ApiProperty({ type: PaginatedOrganisationMeta }) meta: PaginatedOrganisationMeta;
}

export class DeleteResponseEntity {
  @ApiProperty() deleted: boolean;
}