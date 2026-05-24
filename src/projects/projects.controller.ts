import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  HttpCode,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiResponse,
  ApiBearerAuth, ApiParam,
} from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';

@ApiTags('Projects')
@ApiBearerAuth('access-token')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @HttpCode(200)
  @ApiOperation({ summary: 'Create a new project' })
  @ApiResponse({ status: 200, description: 'Project created' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Missing or expired Bearer token' })
  create(@Body() dto: CreateProjectDto) {
    return this.projectsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all active projects' })
  @ApiResponse({ status: 200, description: 'Array of project objects' })
  @ApiResponse({ status: 401, description: 'Missing or expired Bearer token' })
  findAll() {
    return this.projectsService.findAll();
  }

  @Roles(UserRole.ADMIN)
  @Get('deleted')
  @ApiOperation({ summary: 'List soft-deleted projects (ADMIN only)' })
  @ApiResponse({ status: 200, description: 'Array of soft-deleted project objects' })
  @ApiResponse({ status: 401, description: 'Missing or expired Bearer token' })
  @ApiResponse({ status: 403, description: 'Forbidden — ADMIN role required' })
  findDeleted() {
    return this.projectsService.findDeleted();
  }

  @Get(':id/workload')
  @ApiOperation({ summary: 'Get ticket workload breakdown for a project' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid', description: 'Project UUID' })
  @ApiResponse({ status: 200, description: 'Workload summary grouped by assignee' })
  @ApiResponse({ status: 400, description: 'id is not a valid UUID' })
  @ApiResponse({ status: 401, description: 'Missing or expired Bearer token' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  getWorkload(@Param('id', ParseUUIDPipe) id: string) {
    return this.projectsService.getWorkload(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single project by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid', description: 'Project UUID' })
  @ApiResponse({ status: 200, description: 'Project object' })
  @ApiResponse({ status: 400, description: 'id is not a valid UUID' })
  @ApiResponse({ status: 401, description: 'Missing or expired Bearer token' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.projectsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: "Update a project's name or description" })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid', description: 'Project UUID' })
  @ApiResponse({ status: 200, description: 'Updated project object' })
  @ApiResponse({ status: 400, description: 'id is not a valid UUID, or body has invalid fields' })
  @ApiResponse({ status: 401, description: 'Missing or expired Bearer token' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(200)
  @ApiOperation({ summary: 'Soft-delete a project' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid', description: 'Project UUID' })
  @ApiResponse({ status: 200, description: 'Project soft-deleted' })
  @ApiResponse({ status: 400, description: 'id is not a valid UUID' })
  @ApiResponse({ status: 401, description: 'Missing or expired Bearer token' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.projectsService.remove(id);
  }

  @Roles(UserRole.ADMIN)
  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore a soft-deleted project (ADMIN only)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid', description: 'Project UUID' })
  @ApiResponse({ status: 200, description: 'Project restored' })
  @ApiResponse({ status: 400, description: 'id is not a valid UUID' })
  @ApiResponse({ status: 401, description: 'Missing or expired Bearer token' })
  @ApiResponse({ status: 403, description: 'Forbidden — ADMIN role required' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  restore(@Param('id', ParseUUIDPipe) id: string) {
    return this.projectsService.restore(id);
  }
}
