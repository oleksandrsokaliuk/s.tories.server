import { ExecutionContext, createParamDecorator } from '@nestjs/common';

export interface UserTypeI {
  name: string;
  id: string;
  iat: number;
  exp: number;
}

const User = createParamDecorator((data, context: ExecutionContext) => {
  const request = context.switchToHttp().getRequest();
  return request.user;
});

export default User;
