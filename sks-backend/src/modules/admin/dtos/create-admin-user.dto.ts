import { IsEmail, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { UserRole } from 'src/database/entities/user.entity';

export class CreateAdminUserDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  password: string;

  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
