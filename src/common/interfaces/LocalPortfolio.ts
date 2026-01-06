
// TODO: move to domain/shared-ai
export interface LocalPortfolio {
    id?: string;
    userId: string;

    totalValue?: number;
    totalInvested?: number;

    fixedDeposits?: number;
    epf?: number;
    ppf?: number;
    nps?: number;

    cash?: number;
    gold?: number;
    realEstate?: number;

    mutualFunds?: LocalMutualFundHolding[];
    stocks?: LocalStockHolding[];
}

export interface LocalMutualFundHolding {
    id?: string;
    portfolioId?: string; // optional when nested under Portfolio

    schemeName: string;
    isin?: string;
    amc?: string;
    folioNumber?: string;
    category?: string;

    units: number;
    nav: number;

    currentValue: number;
    investedValue: number;

    gainAbsolute?: number;
    gainPercentage?: number;

    fundType?: string;
}


export interface LocalStockHolding {
    id?: string;
    portfolioId?: string; // optional when nested

    symbol: string;
    companyName?: string;

    quantity: number;
    averagePrice: number;

    currentPrice: number;
    investedValue: number;
    currentValue: number;

    gainAbsolute?: number;
    gainPercentage?: number;
}