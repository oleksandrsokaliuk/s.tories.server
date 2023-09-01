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
  Res,
  Query,
} from '@nestjs/common';
import { AuthService, UserDataI } from './auth.service';
import { RegistrationDto, generateProductKeyDto } from '../dtos/auth.dto';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { AuthGuard } from '@nestjs/passport';
import { HttpService } from '@nestjs/axios';
import { UserAgent } from 'src/decorators/user-agent.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly httpService: HttpService,
  ) {}
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
    }
    return this.authService.registration(body, userRole);
  }

  @Post('login')
  async login(@Body() body: RegistrationDto, @UserAgent() userAgent: string) {
    return this.authService.login(body, userAgent);
  }

  @Post('key')
  generateProductKey(@Body() body: generateProductKeyDto) {
    return this.authService.generateProductKey(body.email, body.userRole);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth(
    email: string,
    @UserAgent() userAgent: string,
    userData: UserDataI,
  ) {
    return this.authService.googleAuth(email, userAgent, userData);
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  googleAuthRedirect(@Req() req, @Res() res) {
    return this.authService.googleAuthRedirect(req, res);
  }

  @Get('google/success')
  googleAuthSuccess(
    @Query('token') token: string,
    @Query('firstName') firstName: string,
    @Query('lastName') lastName: string,
    @Query('picture') picture: string,
    @UserAgent() userAgent: string,
  ) {
    return this.authService.googleAuthSuccess({
      token,
      firstName,
      lastName,
      picture,
      userAgent,
    });
  }
}
