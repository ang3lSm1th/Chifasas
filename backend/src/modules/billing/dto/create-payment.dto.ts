import {
  IsString,
  IsIn,
  IsOptional,
  IsNumber,
  Min,
  MaxLength,
} from 'class-validator';
import type { PaymentMethod, ReceiptType } from '../entities/payment.entity';

export class CreatePaymentDto {
  @IsString()
  orderId: string;

  @IsString()
  @IsIn(['CASH', 'YAPE', 'PLIN', 'CARD'])
  paymentMethod: PaymentMethod;

  @IsOptional()
  @IsString()
  @IsIn(['TICKET', 'BOLETA', 'FACTURA'])
  receiptType?: ReceiptType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  cashReceived?: number;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  operationCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(25)
  customerDocument?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  customerName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  notes?: string;
}
