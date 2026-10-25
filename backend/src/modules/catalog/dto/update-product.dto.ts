import {
  IsString,
  IsOptional,
  IsInt,
  IsNumber,
  IsBoolean,
  Min,
  MaxLength,
} from 'class-validator';

export class UpdateProductDto {
  @IsString()
  @IsOptional()
  @MaxLength(150)
  name?: string;

  @IsInt()
  @IsOptional()
  categoryId?: number;

  @IsInt()
  @IsOptional()
  subcategoryId?: number;

  @IsString()
  @IsOptional()
  kdsStationId?: string | null;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @IsBoolean()
  @IsOptional()
  isBeverage?: boolean;

  @IsInt()
  @Min(0)
  @IsOptional()
  currentStock?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  minStockAlert?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
