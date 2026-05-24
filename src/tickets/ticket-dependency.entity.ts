import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, CreateDateColumn,
} from 'typeorm';
import { Ticket } from './ticket.entity';

@Entity('ticket_dependencies')
export class TicketDependency {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // The ticket that is blocked
  @Column()
  ticketId: string;

  @ManyToOne(() => Ticket)
  @JoinColumn({ name: 'ticketId' })
  ticket: Ticket;

  // The ticket that is blocking it
  @Column()
  blockedById: string;

  @ManyToOne(() => Ticket)
  @JoinColumn({ name: 'blockedById' })
  blockedBy: Ticket;

  @CreateDateColumn()
  createdAt: Date;
}