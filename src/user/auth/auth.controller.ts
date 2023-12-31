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
  HttpStatus,
  Put,
  UseInterceptors,
} from '@nestjs/common';
import { AuthService, FacebookDataI, UserDataI } from './auth.service';
import {
  RegistrationDto,
  UpdateUserInfoDto,
  generateProductKeyDto,
} from '../dtos/auth.dto';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { AuthGuard } from '@nestjs/passport';
import { HttpService } from '@nestjs/axios';
import { UserAgent } from 'src/decorators/user-agent.decorator';
import { Request } from 'express';
import { UserInterceptor } from 'src/interceptors/user.interceptor';
import User, { UserTypeI } from 'src/decorators/user.decorator';

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

  @UseInterceptors(UserInterceptor)
  @Put('update')
  async updateInfo(@Body() body: UpdateUserInfoDto) {
    return this.authService.updateInfo(body);
  }

  @UseInterceptors(UserInterceptor)
  @Get('/me')
  async me(@User() user: UserTypeI) {
    return this.authService.me(user);
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
    @Res() res,
    @Query('token') token: string,
    @Query('firstName') firstName: string,
    @Query('lastName') lastName: string,
    @Query('picture') picture: string,
    @UserAgent() userAgent: string,
  ) {
    return this.authService.googleAuthSuccess(res, {
      token,
      firstName,
      lastName,
      picture,
      userAgent,
    });
  }

  @Get('/facebook')
  @UseGuards(AuthGuard('facebook'))
  async facebookLogin(): Promise<any> {
    return HttpStatus.OK;
  }

  @Get('/facebook/redirect')
  @UseGuards(AuthGuard('facebook'))
  async facebookLoginRedirect(@Req() req: Request): Promise<any> {
    return {
      statusCode: HttpStatus.OK,
      data: req.user,
    };
    // return this.authService.facebookLoginRedirect(req.user as FacebookDataI);
  }
}
