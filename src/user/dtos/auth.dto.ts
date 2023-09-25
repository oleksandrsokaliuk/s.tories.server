import { Role } from '@prisma/client';
import {
  IsString,
  IsNotEmpty,
  IsEmail,
  MinLength,
  Matches,
  IsEnum,
  IsOptional,
} from 'class-validator';

export class RegistrationDto {
  // @IsString()
  // @Matches(/\(?([0-9]{3})\)?([ .-]?)([0-9]{3})\2([0-9]{4})/)
  // phone: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @MinLength(5)
  password: string;

  @IsOptional()
  @IsNotEmpty()
  @IsString()
  productKey?: string;
}

export class generateProductKeyDto {
  @IsEmail()
  email: string;

  @IsEnum(Role)
  userRole: Role;
}

export class UpdateUserInfoDto {
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  email: string;

  @IsOptional()
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @IsOptional()
  @IsNotEmpty()
  @IsString()
  lastName: string;

  @IsString()
  @IsOptional()
  @Matches(/\(?([0-9]{3})\)?([ .-]?)([0-9]{3})\2([0-9]{4})/)
  phone: string;

  @IsOptional()
  @IsNotEmpty()
  @IsString()
  picture: string;
}
