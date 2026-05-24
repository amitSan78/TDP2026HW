import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  Res,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiResponse,
  ApiBearerAuth, ApiParam, ApiQuery,
  ApiConsumes, ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';

@ApiTags('Tickets')
@ApiBearerAuth('access-token')
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  @HttpCode(200)
  @ApiOperation({ summary: 'Create a new ticket' })
  @ApiResponse({ status: 200, description: 'Ticket created' })
  @ApiResponse({ status: 400, description: 'Validation error — missing/invalid fields' })
  @ApiResponse({ status: 401, description: 'Missing or expired Bearer token' })
  create(@Body() dto: CreateTicketDto) {
    return this.ticketsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all tickets for a project' })
  @ApiQuery({ name: 'projectId', type: 'string', required: true, description: 'Project UUID to filter by' })
  @ApiResponse({ status: 200, description: 'Array of ticket objects' })
  @ApiResponse({ status: 400, description: 'projectId is not a valid UUID' })
  @ApiResponse({ status: 401, description: 'Missing or expired Bearer token' })
  findAll(@Query('projectId', ParseUUIDPipe) projectId: string) {
    return this.ticketsService.findAll(projectId);
  }

  @Get('export')
  @ApiOperation({ summary: 'Export tickets for a project as a CSV file' })
  @ApiQuery({ name: 'projectId', type: 'string', required: true, description: 'Project UUID to export' })
  @ApiResponse({ status: 200, description: 'CSV file download (Content-Type: text/csv)' })
  @ApiResponse({ status: 400, description: 'projectId is not a valid UUID' })
  @ApiResponse({ status: 401, description: 'Missing or expired Bearer token' })
  async exportCsv(
    @Query('projectId', ParseUUIDPipe) projectId: string,
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
  @ApiOperation({ summary: 'Import tickets from a CSV file into a project' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'projectId'],
      properties: {
        file: { type: 'string', format: 'binary', description: 'CSV file with ticket rows' },
        projectId: { type: 'string', format: 'uuid', description: 'Target project UUID' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Tickets imported — returns count of created tickets' })
  @ApiResponse({ status: 400, description: 'No file uploaded, projectId missing, or CSV is malformed' })
  @ApiResponse({ status: 401, description: 'Missing or expired Bearer token' })
  importCsv(
    @Body('projectId') projectId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No CSV file uploaded');
    if (!projectId) throw new BadRequestException('projectId is required');
    return this.ticketsService.importFromCsv(projectId, file.buffer);
  }

  @Roles(UserRole.ADMIN)
  @Get('deleted')
  @ApiOperation({ summary: 'List soft-deleted tickets for a project (ADMIN only)' })
  @ApiQuery({ name: 'projectId', type: 'string', required: true, description: 'Project UUID' })
  @ApiResponse({ status: 200, description: 'Array of soft-deleted ticket objects' })
  @ApiResponse({ status: 400, description: 'projectId is not a valid UUID' })
  @ApiResponse({ status: 401, description: 'Missing or expired Bearer token' })
  @ApiResponse({ status: 403, description: 'Forbidden — ADMIN role required' })
  findDeleted(@Query('projectId', ParseUUIDPipe) projectId: string) {
    return this.ticketsService.findDeleted(projectId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single ticket by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid', description: 'Ticket UUID' })
  @ApiResponse({ status: 200, description: 'Ticket object' })
  @ApiResponse({ status: 400, description: 'id is not a valid UUID' })
  @ApiResponse({ status: 401, description: 'Missing or expired Bearer token' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.ticketsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a ticket (title, status, priority, assignee, due date)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid', description: 'Ticket UUID' })
  @ApiResponse({ status: 200, description: 'Updated ticket object' })
  @ApiResponse({ status: 400, description: 'id is not a valid UUID, or body has invalid fields' })
  @ApiResponse({ status: 401, description: 'Missing or expired Bearer token' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  @ApiResponse({ status: 409, description: 'Conflict — optimistic lock version mismatch' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTicketDto,
  ) {
    return this.ticketsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(200)
  @ApiOperation({ summary: 'Soft-delete a ticket' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid', description: 'Ticket UUID' })
  @ApiResponse({ status: 200, description: 'Ticket soft-deleted' })
  @ApiResponse({ status: 400, description: 'id is not a valid UUID' })
  @ApiResponse({ status: 401, description: 'Missing or expired Bearer token' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.ticketsService.remove(id);
  }

  @Roles(UserRole.ADMIN)
  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore a soft-deleted ticket (ADMIN only)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid', description: 'Ticket UUID' })
  @ApiResponse({ status: 200, description: 'Ticket restored' })
  @ApiResponse({ status: 400, description: 'id is not a valid UUID' })
  @ApiResponse({ status: 401, description: 'Missing or expired Bearer token' })
  @ApiResponse({ status: 403, description: 'Forbidden — ADMIN role required' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  restore(@Param('id', ParseUUIDPipe) id: string) {
    return this.ticketsService.restore(id);
  }

  @Post(':id/dependencies')
  @HttpCode(200)
  @ApiOperation({ summary: 'Add a "blocked by" dependency between two tickets' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid', description: 'The ticket that is blocked' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['blockedBy'],
      properties: {
        blockedBy: { type: 'string', format: 'uuid', description: 'UUID of the ticket that blocks this one' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Dependency added' })
  @ApiResponse({ status: 400, description: 'id or blockedBy is not a valid UUID' })
  @ApiResponse({ status: 401, description: 'Missing or expired Bearer token' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  addDependency(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('blockedBy') blockedById: string,
  ) {
    return this.ticketsService.addDependency(id, blockedById);
  }

  @Get(':id/dependencies')
  @ApiOperation({ summary: 'Get all dependencies (blockers) for a ticket' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid', description: 'Ticket UUID' })
  @ApiResponse({ status: 200, description: 'List of tickets that block this one' })
  @ApiResponse({ status: 400, description: 'id is not a valid UUID' })
  @ApiResponse({ status: 401, description: 'Missing or expired Bearer token' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  getDependencies(@Param('id', ParseUUIDPipe) id: string) {
    return this.ticketsService.getDependencies(id);
  }

  @Delete(':id/dependencies/:blockerId')
  @HttpCode(200)
  @ApiOperation({ summary: 'Remove a "blocked by" dependency' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid', description: 'The blocked ticket UUID' })
  @ApiParam({ name: 'blockerId', type: 'string', format: 'uuid', description: 'The blocking ticket UUID to remove' })
  @ApiResponse({ status: 200, description: 'Dependency removed' })
  @ApiResponse({ status: 400, description: 'id or blockerId is not a valid UUID' })
  @ApiResponse({ status: 401, description: 'Missing or expired Bearer token' })
  @ApiResponse({ status: 404, description: 'Ticket or dependency not found' })
  removeDependency(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('blockerId', ParseUUIDPipe) blockerId: string,
  ) {
    return this.ticketsService.removeDependency(id, blockerId);
  }
}
