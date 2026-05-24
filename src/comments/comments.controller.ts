import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, HttpCode, Query,
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
    @Param('ticketId') ticketId: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentsService.create(ticketId, dto);
  }

  @Get('tickets/:ticketId/comments')
  findAll(@Param('ticketId') ticketId: string) {
    return this.commentsService.findAllForTicket(ticketId);
  }

  @Patch('tickets/:ticketId/comments/:commentId')
  update(@Param('commentId') commentId: string, @Body() dto: UpdateCommentDto) {
    return this.commentsService.update(commentId, dto);
  }

  @Delete('tickets/:ticketId/comments/:commentId')
  @HttpCode(200)
  remove(@Param('commentId') commentId: string) {
    return this.commentsService.remove(commentId);
  }

  @Get('users/:userId/mentions')
  getMentions(
    @Param('userId') userId: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '10',
  ) {
    return this.commentsService.findMentionsForUser(
      userId,
      parseInt(page, 10),
      parseInt(pageSize, 10),
    );
  }
}
