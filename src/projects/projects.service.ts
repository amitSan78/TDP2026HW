import {
  Injectable, NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectsRepo: Repository<Project>,
  ) {}

  async create(dto: CreateProjectDto): Promise<Project> {
    const project = this.projectsRepo.create(dto);
    return this.projectsRepo.save(project);
  }

  async findAll(): Promise<Project[]> {
    return this.projectsRepo.find();
  }

  async findOne(id: string): Promise<Project> {
    const project = await this.projectsRepo.findOne({ where: { id } });
    if (!project) throw new NotFoundException(`Project ${id} not found`);
    return project;
  }

  async update(id: string, dto: UpdateProjectDto): Promise<Project> {
    const project = await this.findOne(id);
    Object.assign(project, dto);
    return this.projectsRepo.save(project);
  }

  async remove(id: string): Promise<void> {
    const project = await this.findOne(id);
    // softRemove sets deletedAt instead of deleting the row
    await this.projectsRepo.softRemove(project);
  }

  async findDeleted(): Promise<Project[]> {
  return this.projectsRepo
    .createQueryBuilder('project')
    .withDeleted()
    .where('project.deletedAt IS NOT NULL')
    .getMany();
}

  async restore(id: string): Promise<Project> {
    const project = await this.projectsRepo.findOne({
      where: { id },
      withDeleted: true,
    });
    if (!project) throw new NotFoundException(`Project ${id} not found`);
    await this.projectsRepo.restore(id);
    return this.findOne(id);
  }
  async getWorkload(projectId: string): Promise<any[]> {
  const result = await this.projectsRepo.manager.query(
    `SELECT u.id as "userId", u.username, 
     COUNT(t.id) FILTER (WHERE t.status != 'DONE' AND t."deletedAt" IS NULL) as "openTicketCount"
     FROM users u
     LEFT JOIN tickets t ON t."assigneeId" = u.id AND t."projectId" = $1
     WHERE u.role = 'DEVELOPER'
     GROUP BY u.id, u.username
     ORDER BY "openTicketCount" ASC`,
    [projectId],
  );
  return result;
}
}