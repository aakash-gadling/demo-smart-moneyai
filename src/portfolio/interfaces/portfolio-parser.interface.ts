export interface ParsedTransaction {
    date: Date;
    description: string;
    amount: number;
    units: number | null;
    nav: number | null;
    type: string; // 'PURCHASE', 'REDEMPTION', etc.
    balance: number | null;
}

export interface ParsedScheme {
    scheme: string; // Name
    isin: string | null;
    amc: string | null;
    folio: string;
    advisor?: string;
    type?: string; // 'DEBT', 'EQUITY'
    open: number;
    close: number;
    valuation: {
        date: Date | null;
        nav: number;
        value: number;
    };
    transactions: ParsedTransaction[];
}

export interface ParsedPortfolio {
    investorInfo: {
        name: string;
        email: string;
        mobile: string;
        address?: string;
        pan?: string;
    };
    statementPeriod: {
        from: Date | null;
        to: Date | null;
    };
    schemes: ParsedScheme[];
}

export interface IPortfolioParser {
    parse(fileBuffer: Buffer, password?: string): Promise<ParsedPortfolio>;
}
