import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'alice', description: 'Username of the account' })
  @IsString()
  username: string;

  @ApiProperty({ example: 'secret123', description: 'Password (minimum 6 characters)' })
  @IsString()
  @MinLength(6)
  password: string;
}
