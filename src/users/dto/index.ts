import { IsEmail, IsString, MinLength, IsOptional, IsDefined } from 'class-validator';

export class RegisterDto {
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(6)
    password: string;

    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    phone?: string;
}

export class LoginDto {
    @IsEmail()
    email: string;

    @IsString()
    password: string;
}

export class SendOtpDto {
    @IsString()
    phone: string;

    @IsOptional()
    @IsEmail()
    email?: string;
}

export class VerifyOtpDto {
    @IsString()
    phone: string;

    @IsOptional()
    @IsEmail()
    email?: string;

    @IsString()
    otp: string;
}

export class SignupDto {
    @IsString()
    name: string;

    @IsString()
    phone: string;

    @IsEmail()
    email: string;
}

export class UpdateProfileDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
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

export class UpdatePortfolioDto {
    @IsOptional()
    totalValue?: number;

    @IsOptional()
    totalInvested?: number;

    @IsOptional()
    fixedDeposits?: number;

    @IsOptional()
    epf?: number;

    @IsOptional()
    ppf?: number;

    @IsOptional()
    nps?: number;

    @IsOptional()
    cash?: number;

    @IsOptional()
    gold?: number;

    @IsOptional()
    realEstate?: number;

    @IsOptional()
    mutualFunds?: any[];

    @IsOptional()
    stocks?: any[];
}

export class UpdateFieldDto {
    @IsString()
    field: string;

    @IsDefined()
    value: any;
}
