
export class CreateMutualFundHoldingDto {
    isin?: string;
    schemeName: string;
    amc?: string;
    folioNumber?: string;
    category?: string;

    units?: number;
    nav?: number;

    investedValue?: number;
    currentValue?: number;

    fundType?: 'EQUITY' | 'DEBT' | 'HYBRID';
}
