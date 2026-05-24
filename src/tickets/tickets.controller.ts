import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, HttpCode,
  Res, UseInterceptors, UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';

@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  @HttpCode(200)
  create(@Body() dto: CreateTicketDto) {
    return this.ticketsService.create(dto);
  }

  @Get()
  findAll(@Query('projectId') projectId: string) {
    return this.ticketsService.findAll(projectId);
  }

  @Get('export')
  async exportCsv(
    @Query('projectId') projectId: string,
    @Res() res: Response,
  ) {
    const csv = await this.ticketsService.exportToCsv(projectId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="tickets-${projectId}.csv"`,
    );
    res.send(csv);
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  importCsv(
    @Body('projectId') projectId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No CSV file uploaded');
    return this.ticketsService.importFromCsv(projectId, file.buffer);
  }

  @Roles(UserRole.ADMIN)
  @Get('deleted')
  findDeleted(@Query('projectId') projectId: string) {
    return this.ticketsService.findDeleted(projectId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ticketsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTicketDto) {
    return this.ticketsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(200)
  remove(@Param('id') id: string) {
    return this.ticketsService.remove(id);
  }

  @Roles(UserRole.ADMIN)
  @Post(':id/restore')
  restore(@Param('id') id: string) {
    return this.ticketsService.restore(id);
  }

  @Post(':id/dependencies')
  @HttpCode(200)
  addDependency(
    @Param('id') id: string,
    @Body('blockedBy') blockedById: string,
  ) {
    return this.ticketsService.addDependency(id, blockedById);
  }

  @Get(':id/dependencies')
  getDependencies(@Param('id') id: string) {
    return this.ticketsService.getDependencies(id);
  }

  @Delete(':id/dependencies/:blockerId')
  @HttpCode(200)
  removeDependency(
    @Param('id') id: string,
    @Param('blockerId') blockerId: string,
  ) {
    return this.ticketsService.removeDependency(id, blockerId);
  }
}
