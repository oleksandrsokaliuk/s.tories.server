import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-facebook';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor() {
    super({
      clientID: '837655584340296',
      clientSecret: 'c919e572b0d2c4c07df9f2e3fa69150a',
      callbackURL: 'http://localhost:3001/auth/facebook/redirect',
      profileFields: ['emails', 'name', 'photos'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (err: any, user: any, info?: any) => void,
  ): Promise<any> {
    console.log({ profile });
    console.log(profile.email);
    const { name, emails } = profile;
    console.log({ emails });
    const user = emails
      ? {
          email: emails[0].value,
          firstName: name.givenName,
          lastName: name.familyName,
        }
      : {
          firstName: name.givenName,
          lastName: name.familyName,
        };
    const payload = {
      user,
      accessToken,
    };

    done(null, payload);
  }
}
