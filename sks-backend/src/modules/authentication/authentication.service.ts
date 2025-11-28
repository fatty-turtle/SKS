import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as nodemailer from 'nodemailer';

import { CreateUserDto } from './dtos/create-user.dto';
import { LoginDto } from './dtos/login.dto';
import { UpdateProfileDto } from './dtos/update-profile.dto';
import { UserRole } from 'src/database/entities/user.entity';
import { UserRepository } from 'src/database/repositories/user.repository';
import { FolderRepository } from 'src/database/repositories/folder.repository';

@Injectable()
export class AuthenticationService {
  constructor(
    private readonly usersRepo: UserRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly folderRepo: FolderRepository,
  ) {}

  // -------------------
  // Register new user
  // -------------------
  async register(dto: CreateUserDto): Promise<any> {
    const existing = await this.usersRepo.findOne({
      where: { email: dto.email },
    });
    if (existing) {
      throw new BadRequestException('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.usersRepo.create({
      email: dto.email,
      password: hashedPassword,
      name: dto.name,
      role: UserRole.USER,
      isActive: true,
    });

    // Create root folder for the user
    await this.folderRepo.create({
      ownerId: user.id,
      name: 'Root',
      parentId: undefined,
      users: [user],
    });

    return {
      user: {
        userId: user.id,
        email: dto.email,
        role: UserRole.USER,
      },
      message: 'User registered successfully.',
    };
  }

  // -------------------
  // Login existing user
  // -------------------
  async login(dto: LoginDto): Promise<{ accessToken: string }> {
    const user = await this.usersRepo.findOne({ where: { email: dto.email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('You have been deactivated');
    }

    const payload = { sub: user.id, role: user.role };
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: this.configService.get('JWT_EXPIRES_IN'),
    });

    return { accessToken };
  }



  // -------------------
  // Logout user
  // -------------------
  async logout(): Promise<{ message: string }> {
    return { message: 'Logged out successfully' };
  }

  // -------------------
  // Get user profile
  // -------------------
  async getProfile(userId: string): Promise<{ name: string; email: string }> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    return {
      name: user.name,
      email: user.email,
    };
  }

  // -------------------
  // Update user profile
  // -------------------
  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<any> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (dto.password && dto.confirmPassword && dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    if (dto.name !== undefined) {
      user.name = dto.name;
    }

    if (dto.password) {
      user.password = await bcrypt.hash(dto.password, 10);
    }

    await this.usersRepo.create(user);

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
