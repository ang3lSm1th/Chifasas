import { IsString, IsNotEmpty, IsInt, Min, IsOptional } from 'class-validator';

export class RestockDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
