
export class CreateStockHoldingDto {
    symbol: string;
    companyName?: string;

    quantity: number;
    averagePrice?: number;

    currentPrice?: number;
    investedValue?: number;
    currentValue?: number;
}
