import { IsEnum, IsOptional, IsString, IsUUID, Length, MaxLength } from 'class-validator';
import { LanguageEnum } from '../../common/enums/language.enum';

export class CreateProfileDto {
  @IsUUID()
  userId!: string;

  @IsString()
  @MaxLength(100)
  nom!: string;

  @IsString()
  @MaxLength(100)
  prenom!: string;

  @IsOptional()
  @IsString()
  @Length(8, 20)
  telephone?: string;

  @IsOptional()
  @IsEnum(LanguageEnum)
  langue?: LanguageEnum;
}
