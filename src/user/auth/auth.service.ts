import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Provider, Role, User } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { HttpService } from '@nestjs/axios';
import { mergeMap } from 'rxjs';
import { handleTimeoutAndErrors } from 'src/helpers';

interface RegistationParams {
  email: string;
  password: string;
}

export interface UserDataI {
  token: string;
  firstName: string;
  lastName: string;
  picture: string;
  userAgent: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly httpService: HttpService,
  ) {}
  async registration({ email, password }: RegistationParams, userRole: Role) {
    const userExists = await this.prismaService.user.findUnique({
      where: {
        email,
      },
    });
    if (userExists) {
      throw new ConflictException();
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.prismaService.user.create({
      data: {
        email,
        password: hashedPassword,
        role: userRole,
      },
    });
    const token = await jwt.sign(
      { email, id: user.id },
      process.env.JWT_PRIVATE_KEY,
      {
        expiresIn: 3600000,
      },
    );
    return token;
  }

  async login({ email, password }: RegistationParams, userAgent: string) {
    const user = await this.prismaService.user.findUnique({
      where: {
        email,
      },
    });
    if (!user) {
      throw new HttpException(
        'The credentials are incorrect',
        HttpStatus.NOT_FOUND,
      );
    }
    const hashedPassword = user.password;
    const isValidPassword = await bcrypt.compare(password, hashedPassword);
    if (!isValidPassword) {
      throw new HttpException(
        'The credentials are incorrect',
        HttpStatus.FORBIDDEN,
      );
    }
    return await this.generateJWT(user, userAgent);
  }

  private generateJWT(user: User, userAgent?: string) {
    return jwt.sign({ user, userAgent }, process.env.JWT_PRIVATE_KEY, {
      expiresIn: 3600000,
    });
  }

  generateProductKey(email: string, userRole: Role) {
    const string = `${email}-${userRole}-${process.env.PRODUCT_KEY_SECRET}`;
    return bcrypt.hash(string, 10);
  }

  async googleAuth(dataFromGoogle, userAgent: string, userData: UserDataI) {
    const user = await this.prismaService.user.findUnique({
      where: {
        email: dataFromGoogle.data.email,
      },
    });

    if (user) {
      return this.generateJWT(user, userAgent);
    }
    const createUser = await this.prismaService.user.create({
      data: {
        email: dataFromGoogle.data.email,
        role: Role.USER,
        provider: Provider.GOOGLE,
        firstName: userData.firstName ? userData.firstName : null,
        lastName: userData.lastName ? userData.lastName : null,
        picture: userData.picture ? userData.picture : null,
      },
    });

    if (!createUser) {
      throw new BadRequestException(
        `User with email ${dataFromGoogle.email} was NOT created in Google Auth`,
      );
    }

    return this.generateJWT(createUser, userAgent);
  }

  googleAuthRedirect(req, res) {
    if (!req.user) {
      return 'No user from google';
    }
    const token = req.user['accessToken'];
    return res.redirect(
      `http://localhost:3000/auth/google/success?token=${token}&firstName=${req.user.firstName}&lastName=${req.user.lastName}&picture=${req.user.picture}`,
    );
  }

  async googleAuthSuccess(userData: UserDataI) {
    return this.httpService
      .get(
        `https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${userData.token}`,
      )
      .pipe(
        mergeMap((dataFromGoogle) => {
          return this.googleAuth(dataFromGoogle, userData.userAgent, userData);
        }),
        handleTimeoutAndErrors(),
      );
  }
}
