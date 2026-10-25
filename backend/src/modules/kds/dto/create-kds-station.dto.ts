import { IsString, IsNotEmpty, IsOptional, IsInt, MaxLength } from 'class-validator';

export class CreateKdsStationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  colorHex?: string;

  @IsInt()
  @IsOptional()
  displayOrder?: number;
}
