import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsNumber,
  IsBoolean,
  Min,
  MaxLength,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @IsInt()
  @IsNotEmpty()
  categoryId: number;

  @IsInt()
  @IsOptional()
  subcategoryId?: number;

  @IsString()
  @IsOptional()
  kdsStationId?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  price: number;

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
}
