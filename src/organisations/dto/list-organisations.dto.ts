import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { OrganisationTypeEnum } from '../../common/enums/organisation-type.enum';

export class ListOrganisationsDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsEnum(OrganisationTypeEnum)
  type?: OrganisationTypeEnum;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === '') {
      return undefined;
    }
    return value === 'true' || value === true;
  })
  @IsBoolean()
  isVerified?: boolean;
}
