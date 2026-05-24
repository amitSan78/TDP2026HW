import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UploadedFile,
  UseInterceptors,
  HttpCode,
  BadRequestException,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiResponse,
  ApiBearerAuth, ApiParam, ApiConsumes, ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { AttachmentsService } from './attachments.service';

const ALLOWED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'application/pdf',
  'text/plain',
];

@ApiTags('Attachments')
@ApiBearerAuth('access-token')
@Controller('tickets/:ticketId/attachments')
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Post()
  @HttpCode(200)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, uniqueSuffix + extname(file.originalname));
        },
      }),
      limits: {
        fileSize: 10 * 1024 * 1024,
      },
      fileFilter: (_req, file, cb) => {
        if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              `File type ${file.mimetype} not allowed. Allowed: png, jpeg, pdf, txt`,
            ),
            false,
          );
        }
      },
    }),
  )
  @ApiOperation({ summary: 'Upload a file attachment to a ticket' })
  @ApiParam({ name: 'ticketId', type: 'string', format: 'uuid', description: 'Ticket UUID' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'File to upload. Allowed types: PNG, JPEG, PDF, TXT. Max size: 10 MB.',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Attachment record created and file saved on disk' })
  @ApiResponse({ status: 400, description: 'ticketId is not a valid UUID, no file provided, or file type not allowed' })
  @ApiResponse({ status: 401, description: 'Missing or expired Bearer token' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  upload(
    @Param('ticketId', ParseUUIDPipe) ticketId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    return this.attachmentsService.create(ticketId, file);
  }

  @Get()
  @ApiOperation({ summary: 'List all attachments for a ticket' })
  @ApiParam({ name: 'ticketId', type: 'string', format: 'uuid', description: 'Ticket UUID' })
  @ApiResponse({ status: 200, description: 'Array of attachment records' })
  @ApiResponse({ status: 400, description: 'ticketId is not a valid UUID' })
  @ApiResponse({ status: 401, description: 'Missing or expired Bearer token' })
  findAll(@Param('ticketId', ParseUUIDPipe) ticketId: string) {
    return this.attachmentsService.findAll(ticketId);
  }

  @Delete(':id')
  @HttpCode(200)
  @ApiOperation({ summary: 'Delete an attachment record (file remains on disk)' })
  @ApiParam({ name: 'ticketId', type: 'string', format: 'uuid', description: 'Ticket UUID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid', description: 'Attachment UUID' })
  @ApiResponse({ status: 200, description: 'Attachment deleted' })
  @ApiResponse({ status: 400, description: 'ticketId or id is not a valid UUID' })
  @ApiResponse({ status: 401, description: 'Missing or expired Bearer token' })
  @ApiResponse({ status: 404, description: 'Attachment not found' })
  remove(
    @Param('ticketId', ParseUUIDPipe) _ticketId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.attachmentsService.remove(id);
  }
}
