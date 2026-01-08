import { IsOptional, IsString } from "class-validator";

export class UpdateProfileDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    dateOfBirth?: string;

    @IsOptional()
    age?: number;

    @IsOptional()
    @IsString()
    occupation?: string;

    @IsOptional()
    monthlyIncome?: number;

    @IsOptional()
    monthlyExpenses?: number;

    @IsOptional()
    dependents?: number;

    @IsOptional()
    @IsString()
    riskProfile?: string;

    @IsOptional()
    @IsString()
    investmentExperience?: string;

    @IsOptional()
    retirementAge?: number;

    @IsOptional()
    retirementTargetAmount?: number;

    @IsOptional()
    liabilities?: Record<string, number>;

    @IsOptional()
    insurance?: Record<string, number>;
}