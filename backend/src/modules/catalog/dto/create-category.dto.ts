import { IsString, IsNotEmpty, IsOptional, IsInt, IsIn, MaxLength } from 'class-validator';
import { CategoryType } from '../entities/category.entity';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsOptional()
  @IsIn(['FOOD', 'BEVERAGE'])
  type?: CategoryType;

  @IsInt()
  @IsOptional()
  displayOrder?: number;
}
