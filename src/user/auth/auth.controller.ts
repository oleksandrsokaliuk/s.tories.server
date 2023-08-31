import {
  Body,
  Controller,
  Param,
  ParseEnumPipe,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegistrationDto, generateProductKeyDto } from '../dtos/auth.dto';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Post('registration/:userRole')
  async registration(
    @Body() body: RegistrationDto,
    @Param('userRole', new ParseEnumPipe(Role)) userRole: Role,
  ) {
    if (userRole !== Role.USER) {
      if (!body.productKey) {
        throw new UnauthorizedException();
      }
      const validProductKey = `${body.email}-${userRole}-${process.env.PRODUCT_KEY_SECRET}`;

      const isValidProductKey = await bcrypt.compare(
        validProductKey,
        body.productKey,
      );

      if (!isValidProductKey) {
        throw new UnauthorizedException();
      }
      console.log(isValidProductKey);
    }
    return this.authService.registration(body, userRole);
  }

  @Post('login')
  async login(@Body() body: RegistrationDto) {
    return this.authService.login(body);
  }

  @Post('key')
  generateProductKey(@Body() body: generateProductKeyDto) {
    return this.authService.generateProductKey(body.email, body.userRole);
  }
}