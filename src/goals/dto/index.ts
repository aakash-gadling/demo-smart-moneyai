import { IsString, IsNumber, IsOptional, IsEnum, IsDateString, Min } from 'class-validator';

export class CreateGoalDto {
    @IsString()
    userId: string;

    @IsString()
    name: string;

    @IsString()
    category: string;

    @IsNumber()
    @Min(0)
    targetAmount: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    currentAmount?: number;

    @IsDateString()
    deadline: string;

    @IsOptional()
    @IsString()
    priority?: string;
}

export class UpdateGoalDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    targetAmount?: number;

    @IsOptional()
    @IsDateString()
    deadline?: string;

    @IsOptional()
    @IsString()
    priority?: string;

    @IsOptional()
    @IsString()
    status?: string;
}

export class AddProgressDto {
    @IsNumber()
    @Min(0)
    amount: number;

    @IsOptional()
    @IsString()
    note?: string;
}
