import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  HttpCode,
  Query,
  ParseUUIDPipe,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiResponse,
  ApiBearerAuth, ApiParam, ApiQuery,
} from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@ApiTags('Comments')
@ApiBearerAuth('access-token')
@Controller()
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post('tickets/:ticketId/comments')
  @HttpCode(200)
  @ApiOperation({ summary: 'Post a comment on a ticket. Mention users with @username in the content.' })
  @ApiParam({ name: 'ticketId', type: 'string', format: 'uuid', description: 'Ticket UUID' })
  @ApiResponse({ status: 200, description: 'Comment created, mentionedUsers array populated' })
  @ApiResponse({ status: 400, description: 'ticketId is not a valid UUID, or body is invalid' })
  @ApiResponse({ status: 401, description: 'Missing or expired Bearer token' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  create(
    @Param('ticketId', ParseUUIDPipe) ticketId: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentsService.create(ticketId, dto);
  }

  @Get('tickets/:ticketId/comments')
  @ApiOperation({ summary: 'List all comments on a ticket' })
  @ApiParam({ name: 'ticketId', type: 'string', format: 'uuid', description: 'Ticket UUID' })
  @ApiResponse({ status: 200, description: 'Array of comment objects with mentionedUsers' })
  @ApiResponse({ status: 400, description: 'ticketId is not a valid UUID' })
  @ApiResponse({ status: 401, description: 'Missing or expired Bearer token' })
  findAll(@Param('ticketId', ParseUUIDPipe) ticketId: string) {
    return this.commentsService.findAllForTicket(ticketId);
  }

  @Patch('tickets/:ticketId/comments/:commentId')
  @ApiOperation({ summary: 'Edit the content of a comment' })
  @ApiParam({ name: 'ticketId', type: 'string', format: 'uuid', description: 'Ticket UUID' })
  @ApiParam({ name: 'commentId', type: 'string', format: 'uuid', description: 'Comment UUID' })
  @ApiResponse({ status: 200, description: 'Updated comment object' })
  @ApiResponse({ status: 400, description: 'ticketId or commentId is not a valid UUID, or body is invalid' })
  @ApiResponse({ status: 401, description: 'Missing or expired Bearer token' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  update(
    @Param('ticketId', ParseUUIDPipe) _ticketId: string,
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @Body() dto: UpdateCommentDto,
  ) {
    return this.commentsService.update(commentId, dto);
  }

  @Delete('tickets/:ticketId/comments/:commentId')
  @HttpCode(200)
  @ApiOperation({ summary: 'Delete a comment' })
  @ApiParam({ name: 'ticketId', type: 'string', format: 'uuid', description: 'Ticket UUID' })
  @ApiParam({ name: 'commentId', type: 'string', format: 'uuid', description: 'Comment UUID' })
  @ApiResponse({ status: 200, description: 'Comment deleted' })
  @ApiResponse({ status: 400, description: 'ticketId or commentId is not a valid UUID' })
  @ApiResponse({ status: 401, description: 'Missing or expired Bearer token' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  remove(
    @Param('ticketId', ParseUUIDPipe) _ticketId: string,
    @Param('commentId', ParseUUIDPipe) commentId: string,
  ) {
    return this.commentsService.remove(commentId);
  }

  @Get('users/:userId/mentions')
  @ApiOperation({ summary: 'Get all comments that mention a specific user, paginated' })
  @ApiParam({ name: 'userId', type: 'string', format: 'uuid', description: 'User UUID' })
  @ApiQuery({ name: 'page', type: 'integer', required: false, example: 1, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'pageSize', type: 'integer', required: false, example: 10, description: 'Results per page (default: 10)' })
  @ApiResponse({ status: 200, description: 'Paginated result: { data, total, page }' })
  @ApiResponse({ status: 400, description: 'userId is not a valid UUID, or page/pageSize are not integers' })
  @ApiResponse({ status: 401, description: 'Missing or expired Bearer token' })
  getMentions(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(10), ParseIntPipe) pageSize: number,
  ) {
    return this.commentsService.findMentionsForUser(userId, page, pageSize);
  }
}
