import {
  Injectable, NotFoundException, ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './comment.entity';
import { CommentMention } from './comment-mention.entity';
import { User } from '../users/user.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentsRepo: Repository<Comment>,
    @InjectRepository(CommentMention)
    private readonly mentionsRepo: Repository<CommentMention>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  private extractMentions(content: string): string[] {
    const matches = content.match(/@(\w+)/g) || [];
    return matches.map((m) => m.slice(1).toLowerCase());
  }

  private async resolveMentions(
    content: string,
    commentId: string,
  ): Promise<CommentMention[]> {
    const usernames = this.extractMentions(content);
    if (usernames.length === 0) return [];

    const mentions: CommentMention[] = [];
    for (const username of usernames) {
      const user = await this.usersRepo
        .createQueryBuilder('user')
        .where('LOWER(user.username) = :username', { username })
        .getOne();

      if (user) {
        mentions.push(this.mentionsRepo.create({ commentId, userId: user.id }));
      }
    }
    return mentions;
  }

  // Maps entity to the response shape the README specifies
  private toResponse(comment: Comment): any {
    const { mentions, version, ...rest } = comment as any;
    return {
      ...rest,
      mentionedUsers: (mentions || []).map((m: CommentMention) => ({
        id: m.user?.id,
        username: m.user?.username,
        fullName: m.user?.fullName,
      })),
    };
  }

  async create(ticketId: string, dto: CreateCommentDto): Promise<any> {
    const comment = this.commentsRepo.create({ ...dto, ticketId });
    const saved = await this.commentsRepo.save(comment);

    const mentions = await this.resolveMentions(dto.content, saved.id);
    if (mentions.length > 0) {
      await this.mentionsRepo.save(mentions);
    }

    return this.toResponse(await this.findOneEntity(saved.id));
  }

  private async findOneEntity(id: string): Promise<Comment> {
    const comment = await this.commentsRepo.findOne({
      where: { id },
      relations: { mentions: { user: true } },
    });
    if (!comment) throw new NotFoundException(`Comment ${id} not found`);
    return comment;
  }

  async findOne(id: string): Promise<Comment> {
    return this.findOneEntity(id);
  }

  async findAllForTicket(ticketId: string): Promise<any[]> {
    const comments = await this.commentsRepo.find({
      where: { ticketId },
      relations: { mentions: { user: true } },
      order: { createdAt: 'ASC' },
    });
    return comments.map((c) => this.toResponse(c));
  }

  async update(id: string, dto: UpdateCommentDto): Promise<any> {
    const comment = await this.findOneEntity(id);

    const oldMentionUserIds = comment.mentions.map((m) => m.userId);

    comment.content = dto.content;

    try {
      await this.commentsRepo.save(comment);
    } catch (err: any) {
      if (err.name === 'OptimisticLockVersionMismatchError') {
        throw new ConflictException(
          'Comment was updated by someone else. Please refresh and try again.'
        );
      }
      throw err;
    }

    const newMentions = await this.resolveMentions(dto.content, id);
    const newMentionUserIds = newMentions.map((m) => m.userId);

    const toAdd = newMentions.filter((m) => !oldMentionUserIds.includes(m.userId));
    if (toAdd.length > 0) await this.mentionsRepo.save(toAdd);

    const toRemove = comment.mentions.filter((m) => !newMentionUserIds.includes(m.userId));
    if (toRemove.length > 0) await this.mentionsRepo.remove(toRemove);

    return this.toResponse(await this.findOneEntity(id));
  }

  async remove(id: string): Promise<void> {
    const comment = await this.findOneEntity(id);
    await this.commentsRepo.remove(comment);
  }

  async findMentionsForUser(
    userId: string,
    page: number,
    pageSize: number,
  ): Promise<{ data: any[]; total: number; page: number }> {
    const [mentions, total] = await this.mentionsRepo.findAndCount({
      where: { userId },
      relations: { comment: { mentions: { user: true } } },
      order: { comment: { createdAt: 'DESC' } },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return {
      data: mentions.map((m) => this.toResponse(m.comment)),
      total,
      page,
    };
  }
}
