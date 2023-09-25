import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
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

export interface FacebookUserI {
  email: string;
  firstName: string;
  lastName: string;
}

export interface FacebookDataI {
  user: FacebookUserI;
  accessToken: string;
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
      throw new ConflictException(`User with email ${email} already exists`);
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

  async updateInfo(body) {
    console.log({ body });
  }

  async me(user) {
    const getUser = await this.prismaService.user.findUnique({
      where: {
        email: user.email,
      },
    });
    const { email, firstName, lastName, phone, picture, role } = getUser;
    return {
      email,
      firstName,
      lastName,
      phone,
      picture,
      role,
    };
  }

  private generateJWT(user: User, userAgent?: string) {
    return jwt.sign(
      { id: user.id, email: user.email, userAgent },
      process.env.JWT_PRIVATE_KEY,
      {
        expiresIn: 3600000,
      },
    );
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
      return { token: this.generateJWT(user, userAgent), user };
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

    return { token: this.generateJWT(createUser, userAgent), user: createUser };
  }

  googleAuthRedirect(req, res) {
    if (!req.user) {
      return 'No user from google';
    }
    const token = req.user['accessToken'];
    return res.redirect(
      `http://localhost:3001/auth/google/success?token=${token}&firstName=${req.user.firstName}&lastName=${req.user.lastName}&picture=${req.user.picture}`,
    );
  }

  async googleAuthSuccess(res, userData: UserDataI) {
    const profileToken = this.httpService
      .get(
        `https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${userData.token}`,
      )
      .pipe(
        mergeMap((dataFromGoogle) => {
          return this.googleAuth(dataFromGoogle, userData.userAgent, userData);
        }),
        handleTimeoutAndErrors(),
      );

    profileToken.subscribe(
      (data) => {
        if (!data) {
          throw new BadRequestException(`Profile does not exist`);
        }
        const { token, user } = data;
        const { email, firstName, lastName, picture } = user;
        console.log(data);
        // return res.redirect(
        //   `http://localhost:3000/auth/${token}/${email}/${firstName}/${lastName}/${picture}`,
        // );
        return res.redirect(
          `http://localhost:3000/auth/${token}/${email}/${firstName}/${lastName}/${encodeURIComponent(
            picture,
          )}`,
        );
      },
      (err) => {
        console.log(err);
      },
    );
  }

  async facebookLoginRedirect({ accessToken, user }: FacebookDataI) {
    const { email, lastName, firstName } = user;
    if (!email) {
      throw new BadRequestException(
        'You have to confirm your email address in Facebook to log in',
      );
    }
    const isAlreadyRegistered = await this.prismaService.user.findUnique({
      where: {
        email,
      },
    });
    if (isAlreadyRegistered) {
      if (!isAlreadyRegistered.firstName) {
        await this.prismaService.user.update({
          where: {
            email,
          },
          data: {
            firstName,
          },
        });
      }
      if (!isAlreadyRegistered.lastName) {
        await this.prismaService.user.update({
          where: {
            email,
          },
          data: {
            lastName,
          },
        });
      }
      return {
        message: 'The user already exists. You are logged in',
        accessToken,
      };
    }
    const newUser = await this.prismaService.user.create({
      data: {
        email,
        firstName,
        lastName,
        role: Role.USER,
      },
    });
    if (!newUser) {
      throw new InternalServerErrorException(
        `The user with email ${email} was NOT registered. Please, try again later`,
      );
    }
    return { message: 'User was created successfully', newUser, accessToken };
  }
}
