import { IsOptional } from "class-validator";

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
