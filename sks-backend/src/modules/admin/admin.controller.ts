import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { User } from 'src/database/entities/user.entity';
import { RolesGuard } from 'src/modules/authentication/jwt/roles.guard';
import { JwtAuthGuard } from 'src/modules/authentication/jwt/jwt-auth.guard';
import { Roles } from 'src/common/decorators/role.decorator';
import { UserRole } from 'src/database/entities/user.entity';
import { CreateAdminUserDto } from './dtos/create-admin-user.dto';
import { UpdateAdminUserDto } from './dtos/update-admin-user.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  async getAllUsers(): Promise<User[]> {
    return this.adminService.getAllUsers();
  }

  @Get('users/:id')
  async getUserById(@Param('id') id: string): Promise<User> {
    return this.adminService.getUserById(id);
  }

  @Post('users')
  async createUser(@Body() dto: CreateAdminUserDto): Promise<User> {
    return this.adminService.createUser(dto);
  }

  @Put('users/:id')
  async updateUser(
    @Param('id') id: string,
    @Body() dto: UpdateAdminUserDto,
  ): Promise<User> {
    return this.adminService.updateUser(id, dto);
  }

  @Delete('users/:id')
  async deleteUser(@Param('id') id: string): Promise<User> {
    return this.adminService.deleteUser(id);
  }

  @Put('users/:id/activate')
  async activateUser(@Param('id') id: string): Promise<User> {
    return this.adminService.activateUser(id);
  }
}
