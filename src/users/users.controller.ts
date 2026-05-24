import {
  Controller,
  Get,
  Post,
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
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Public } from '../auth/public.decorator';

@ApiTags('Users')
@ApiBearerAuth('access-token')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Public()
  @Post()
  @HttpCode(200)
  @ApiOperation({ summary: 'Register a new user (public — no token required)' })
  @ApiResponse({ status: 200, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error — missing/invalid fields' })
  @ApiResponse({ status: 409, description: 'Username or email already taken' })
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all users' })
  @ApiResponse({ status: 200, description: 'Array of user objects (passwords excluded)' })
  @ApiResponse({ status: 401, description: 'Missing or expired Bearer token' })
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single user by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'User object (password excluded)' })
  @ApiResponse({ status: 400, description: 'id is not a valid UUID' })
  @ApiResponse({ status: 401, description: 'Missing or expired Bearer token' })
  @ApiResponse({ status: 404, description: 'User not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id);
  }

  @Post('update/:userId')
  @ApiOperation({ summary: 'Update a user\'s fullName or role' })
  @ApiParam({ name: 'userId', type: 'string', format: 'uuid', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'Updated user object' })
  @ApiResponse({ status: 400, description: 'userId is not a valid UUID, or body has invalid fields' })
  @ApiResponse({ status: 401, description: 'Missing or expired Bearer token' })
  @ApiResponse({ status: 404, description: 'User not found' })
  update(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(userId, dto);
  }

  @Delete(':id')
  @HttpCode(200)
  @ApiOperation({ summary: 'Delete a user permanently' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'User deleted' })
  @ApiResponse({ status: 400, description: 'id is not a valid UUID' })
  @ApiResponse({ status: 401, description: 'Missing or expired Bearer token' })
  @ApiResponse({ status: 404, description: 'User not found' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.remove(id);
  }
}
