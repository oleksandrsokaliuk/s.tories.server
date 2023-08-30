import { IsNumber, IsOptional } from 'class-validator';

export class PostSrcAmtDto {
  @IsNumber()
  amount: number;

  source: string;
}

export class UpdateSrcAmtDto {
  @IsOptional()
  @IsNumber()
  amount: number;

  @IsOptional()
  source: string;
}
