import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';
import { UserRole } from '../user.entity';

export class CreateUserDto {
  @IsString()
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  fullName: string;

  @IsEnum(UserRole, { message: 'role must be ADMIN or DEVELOPER' })
  role: UserRole;

  @IsString()
  @MinLength(6, { message: 'password must be at least 6 characters' })
  password: string;
}
