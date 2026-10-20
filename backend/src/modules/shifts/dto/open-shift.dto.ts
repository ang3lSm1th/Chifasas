import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class OpenShiftDto {
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El fondo inicial debe ser un número válido' })
  @Min(0, { message: 'El fondo inicial no puede ser negativo' })
  @Type(() => Number)
  initialCash: number;

  @IsOptional()
  @IsString({ message: 'Las notas deben ser un texto válido' })
  notes?: string;
}
