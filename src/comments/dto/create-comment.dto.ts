import { IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({ example: 'Confirmed on Safari 17 as well. Assigning to @alice.', description: 'Comment body. Mention users with @username.' })
  @IsString()
  content: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001', format: 'uuid', description: 'UUID of the user posting the comment' })
  @IsUUID()
  authorId: string;
}
