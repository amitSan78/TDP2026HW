import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Who did the action — userId or 'SYSTEM'
  @Column()
  actor: string;

  // What happened — CREATE_TICKET, UPDATE_STATUS, AUTO_ASSIGN etc
  @Column()
  action: string;

  // Which type of entity was affected — ticket, project, comment etc
  @Column()
  entityType: string;

  // The ID of the affected entity
  @Column()
  entityId: string;

  // Extra details about the action — stored as JSON
  @Column({ type: 'jsonb', nullable: true })
  payload: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
