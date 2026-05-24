import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../user.entity';

export class CreateUserDto {
  @ApiProperty({ example: 'alice', description: 'Unique username' })
  @IsString()
  username: string;

  @ApiProperty({ example: 'alice@example.com', description: 'Unique email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Alice Smith', description: 'Full display name' })
  @IsString()
  fullName: string;

  @ApiProperty({ enum: UserRole, example: UserRole.DEVELOPER, description: 'User role' })
  @IsEnum(UserRole, { message: 'role must be ADMIN or DEVELOPER' })
  role: UserRole;

  @ApiProperty({ example: 'secret123', description: 'Password (minimum 6 characters)', minLength: 6 })
  @IsString()
  @MinLength(6, { message: 'password must be at least 6 characters' })
  password: string;
}
