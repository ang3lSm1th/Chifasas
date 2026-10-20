import {
  IsNotEmpty,
  IsString,
  MinLength,
  IsOptional,
  IsInt,
  IsIn,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  @MinLength(3, { message: 'El nombre de usuario debe tener al menos 3 caracteres' })
  username: string;

  @IsString()
  @IsNotEmpty({ message: 'El nombre completo es obligatorio' })
  fullName: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  password: string;

  @IsInt({ message: 'El rol debe ser un identificador numérico válido' })
  @IsIn([2, 3, 4, 5], { message: 'Rol inválido. Roles válidos: 2 (ADMIN), 3 (CAJERO), 4 (MESERA), 5 (COCINERO)' })
  roleId: number;

  @IsOptional()
  @IsString()
  dni?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}
