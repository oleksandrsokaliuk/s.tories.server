import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

interface RegistationParams {
  email: string;
  password: string;
}

@Injectable()
export class AuthService {
  constructor(private readonly prismaService: PrismaService) {}
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

  async login({ email, password }: RegistationParams) {
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
    return await this.generateJWT(email, user.id);
  }

  private generateJWT(email: string, id: string) {
    return jwt.sign({ email, id }, process.env.JWT_PRIVATE_KEY, {
      expiresIn: 3600000,
    });
  }

  generateProductKey(email: string, userRole: Role) {
    const string = `${email}-${userRole}-${process.env.PRODUCT_KEY_SECRET}`;
    return bcrypt.hash(string, 10);
  }

  googleAuth(req) {
    console.log(req);
  }

  googleAuthRedirect(req) {
    console.log(req);
    if (!req.user) {
      return 'No user from google';
    }

    return {
      message: 'User Info from Google',
      user: req.user,
    };
  }
}
