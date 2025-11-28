import { IsOptional, IsNotEmpty, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsNotEmpty()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsNotEmpty()
  confirmPassword?: string;
}
