import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LanguageEnum } from '../../common/enums/language.enum';

export class ProfileEntity {
  @ApiProperty() id!: string;
  @ApiProperty() userId!: string;
  @ApiProperty() nom!: string;
  @ApiProperty() prenom!: string;
  @ApiPropertyOptional() telephone!: string | null;
  @ApiProperty({ enum: LanguageEnum }) langue!: LanguageEnum;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}