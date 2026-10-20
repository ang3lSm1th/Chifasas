import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CloseShiftDto {
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El efectivo declarado debe ser un número válido' })
  @Min(0, { message: 'El efectivo declarado no puede ser negativo' })
  @Type(() => Number)
  declaredCash: number;

  @IsOptional()
  @IsString({ message: 'Las notas de arqueo deben ser un texto válido' })
  notes?: string;
}
