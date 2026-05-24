import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../user.entity';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Alice Johnson', description: 'New full display name' })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional({ enum: UserRole, example: UserRole.ADMIN, description: 'New role' })
  @IsOptional()
  @IsEnum(UserRole, { message: 'role must be ADMIN or DEVELOPER' })
  role?: UserRole;
}
