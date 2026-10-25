import { IsString, IsNotEmpty, IsOptional, IsInt, MaxLength } from 'class-validator';

export class CreateSubcategoryDto {
  @IsInt()
  @IsNotEmpty()
  categoryId: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsInt()
  @IsOptional()
  displayOrder?: number;
}
