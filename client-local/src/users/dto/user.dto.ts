import { IsEmail, IsString, IsBoolean, IsOptional, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @MinLength(2)
  displayName: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  role?: string = 'user';

  @IsBoolean()
  @IsOptional()
  active?: boolean = true;
}

export class UpdateUserDto {
  @IsString()
  @MinLength(2)
  @IsOptional()
  displayName?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  role?: string;

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}