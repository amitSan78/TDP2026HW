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
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Controller()
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post('tickets/:ticketId/comments')
  @HttpCode(200)
  create(
    @Param('ticketId', ParseUUIDPipe) ticketId: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentsService.create(ticketId, dto);
  }

  @Get('tickets/:ticketId/comments')
  findAll(@Param('ticketId', ParseUUIDPipe) ticketId: string) {
    return this.commentsService.findAllForTicket(ticketId);
  }

  @Patch('tickets/:ticketId/comments/:commentId')
  update(
    @Param('ticketId', ParseUUIDPipe) _ticketId: string,
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @Body() dto: UpdateCommentDto,
  ) {
    return this.commentsService.update(commentId, dto);
  }

  @Delete('tickets/:ticketId/comments/:commentId')
  @HttpCode(200)
  remove(
    @Param('ticketId', ParseUUIDPipe) _ticketId: string,
    @Param('commentId', ParseUUIDPipe) commentId: string,
  ) {
    return this.commentsService.remove(commentId);
  }

  @Get('users/:userId/mentions')
  getMentions(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(10), ParseIntPipe) pageSize: number,
  ) {
    return this.commentsService.findMentionsForUser(userId, page, pageSize);
  }
}
