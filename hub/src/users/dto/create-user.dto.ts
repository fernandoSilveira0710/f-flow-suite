import { IsString, IsEmail, IsBoolean, IsOptional } from 'class-validator';

export class CreateUserDto {
  @IsString()
  displayName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  role!: string;

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}