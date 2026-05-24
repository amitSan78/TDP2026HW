import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCommentDto {
  @ApiProperty({ example: 'Updated: confirmed fix works on Safari 17.', description: 'New comment body' })
  @IsString()
  content: string;
}
