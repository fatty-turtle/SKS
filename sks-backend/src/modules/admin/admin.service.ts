import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from 'src/database/repositories/user.repository';
import { User, UserRole } from 'src/database/entities/user.entity';
import { CreateAdminUserDto } from './dtos/create-admin-user.dto';
import { UpdateAdminUserDto } from './dtos/update-admin-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminService {
  constructor(private readonly userRepo: UserRepository) {}

  async getAllUsers(): Promise<User[]> {
    return this.userRepo.findAll();
  }

  async getUserById(id: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async createUser(dto: CreateAdminUserDto): Promise<User> {
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    return this.userRepo.create({
      email: dto.email,
      password: hashedPassword,
      name: dto.name,
      role: dto.role || UserRole.USER,
      isActive: true,
    });
  }

  async updateUser(id: string, dto: UpdateAdminUserDto): Promise<User> {
    const user = await this.getUserById(id);
    if (dto.password) {
      dto.password = await bcrypt.hash(dto.password, 10);
    }
    Object.assign(user, dto);
    return this.userRepo.create(user);
  }

  async deleteUser(id: string): Promise<User> {
    const user = await this.getUserById(id);
    user.isActive = false;
    return this.userRepo.create(user);
  }

  async activateUser(id: string): Promise<User> {
    const user = await this.getUserById(id);
    user.isActive = true;
    return this.userRepo.create(user);
  }
}
