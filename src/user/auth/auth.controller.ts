import {
  Body,
  Controller,
  Get,
  Param,
  ParseEnumPipe,
  Post,
  UnauthorizedException,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegistrationDto, generateProductKeyDto } from '../dtos/auth.dto';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { AuthGuard } from '@nestjs/passport';

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

  @Get('googleauth')
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req) {
    // return this.authService.googleAuth(req);
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  googleAuthRedirect(@Req() req) {
    return this.authService.googleAuthRedirect(req);
  }
}
