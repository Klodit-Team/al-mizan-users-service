import { IsEnum, IsOptional, IsString, Length, MaxLength } from 'class-validator';
import { LanguageEnum } from '../../common/enums/language.enum';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nom?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  prenom?: string;

  @IsOptional()
  @IsString()
  @Length(8, 20)
  telephone?: string;

  @IsOptional()
  @IsEnum(LanguageEnum)
  langue?: LanguageEnum;
}
