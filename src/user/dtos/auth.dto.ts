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
