// src/auth/authentication.controller.ts

import {
    Controller,
    Post,
    Body,
    Get,
    UseGuards,
    HttpCode,
    HttpStatus,
    Request,
    Put,
    Req,
} from '@nestjs/common';
import { AuthenticationService } from './authentication.service';
import { CreateUserDto } from './dtos/create-user.dto';
import { LoginDto } from './dtos/login.dto';

import { UpdateProfileDto } from './dtos/update-profile.dto';
import { JwtAuthGuard } from './jwt/jwt-auth.guard';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { User } from 'src/database/entities/user.entity';
import { Public } from 'src/common/decorators/public.decorator';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('auth')
export class AuthenticationController {
    constructor(private readonly authService: AuthenticationService) { }

    @Public()
    @Post("register")
    @ApiOperation({ summary: "Register a new user" })
    @ApiResponse({
        status: 201,
        description: "User successfully registered",
        schema: {
            type: "object",
            properties: {
                user: {
                    type: "object",
                    properties: {
                        id: { type: "string" },
                        email: { type: "string" },
                        name: { type: "string" },
                        role: { type: "string" },

                        createdAt: { type: "string" },
                        updatedAt: { type: "string" },
                    },
                },
            },
        },
    })
    async register(@Body() dto: CreateUserDto) {
        return this.authService.register(dto);
    }

    @Public()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Login user" })
    @ApiResponse({ status: 200, description: "User successfully logged in" })
    @Post('login')
    async login(@Body() dto: LoginDto) {
        return this.authService.login(dto);
    }



    @ApiBearerAuth("bearer")
    @ApiOperation({ summary: "Get current user profile" })
    @ApiResponse({ status: 200, description: "Current user profile" })
    @UseGuards(JwtAuthGuard)
    @Get('profile')
    async getMe(@Request() req) {
        return this.authService.getProfile(req.user.userId);
    }

    @HttpCode(HttpStatus.OK)
    @ApiBearerAuth("bearer")
    @ApiOperation({ summary: "Logout user" })
    @ApiResponse({ status: 200, description: "User logged out successfully" })
    @UseGuards(JwtAuthGuard)
    @Post('logout')
    async logout() {
        return this.authService.logout();
    }

    @ApiBearerAuth("bearer")
    @ApiOperation({ summary: "Update user profile" })
    @ApiResponse({ status: 200, description: "Profile updated successfully" })
    @UseGuards(JwtAuthGuard)
    @Put('profile')
    async updateProfile(@Req() req, @Body() dto: UpdateProfileDto) {
        return this.authService.updateProfile(req.user.userId, dto);
    }
}
