import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Comment } from './comment.entity';

@Entity('comment_mentions')
export class CommentMention {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  commentId: string;

  @ManyToOne(() => Comment, (comment) => comment.mentions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'commentId' })
  comment: Comment;

  @Column()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;
}
