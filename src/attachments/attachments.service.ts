import {
  Injectable, NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attachment } from './attachment.entity';
import * as fs from 'fs';

@Injectable()
export class AttachmentsService {
  constructor(
    @InjectRepository(Attachment)
    private readonly attachmentsRepo: Repository<Attachment>,
  ) {}

  async create(
    ticketId: string,
    file: Express.Multer.File,
  ): Promise<Attachment> {
    const attachment = this.attachmentsRepo.create({
      ticketId,
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      path: file.path,
    });
    return this.attachmentsRepo.save(attachment);
  }

  async findAll(ticketId: string): Promise<Attachment[]> {
    return this.attachmentsRepo.find({ where: { ticketId } });
  }

  async remove(id: string): Promise<void> {
    const attachment = await this.attachmentsRepo.findOne({ where: { id } });
    if (!attachment) throw new NotFoundException(`Attachment ${id} not found`);

    // Delete the actual file from disk
    if (fs.existsSync(attachment.path)) {
      fs.unlinkSync(attachment.path);
    }

    await this.attachmentsRepo.remove(attachment);
  }
}