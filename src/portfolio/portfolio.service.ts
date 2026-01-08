import { Injectable, Logger, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IPortfolioParser, ParsedPortfolio } from './interfaces/portfolio-parser.interface';
import { CasParserAdapter } from './adapters/casparser.adapter';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class PortfolioService {
    private readonly logger = new Logger(PortfolioService.name);

    constructor(
        private readonly prisma: PrismaService,
        @Inject(CasParserAdapter) private readonly parser: IPortfolioParser,
        private readonly eventEmitter: EventEmitter2
    ) { }

    async uploadAndParseEcas(userId: string, fileBuffer: Buffer, password?: string) {
        this.logger.log(`Starting eCAS upload for user: ${userId}`);

        // 1. Parse the file
        const parsedData: ParsedPortfolio = await this.parser.parse(fileBuffer, password);

        // 2. Clear existing portfolio data for this user to avoid duplicates (Simplification strategy)
        // In a real prod environment, we might want to merge or track history. 
        // For now, we wipe and recreate linked holdings.
        await this.clearUserPortfolio(userId);

        // 3. Create/Get Portfolio
        const portfolio = await this.prisma.portfolio.upsert({
            where: { userId },
            create: { userId },
            update: {},
        });

        // 4. Save Mutual Fund Holdings
        let totalValue = 0;
        let totalInvested = 0;
        let mfCount = 0;

        for (const scheme of parsedData.schemes) {
            // Only process valid mutual funds with current valuation
            if (scheme.valuation.value > 0) {
                const invested = this.calculateInvestedValue(scheme);
                const current = scheme.valuation.value;
                const gainAbs = current - invested;
                const gainPerc = invested > 0 ? (gainAbs / invested) * 100 : 0;

                await this.prisma.mutualFundHolding.create({
                    data: {
                        portfolioId: portfolio.id,
                        schemeName: scheme.scheme,
                        isin: scheme.isin,
                        amc: scheme.amc,
                        folioNumber: scheme.folio,
                        category: scheme.type,
                        units: this.calculateTotalUnits(scheme), // Need to sum units from transactions or take balance
                        nav: scheme.valuation.nav,
                        currentValue: current,
                        investedValue: invested,
                        gainAbsolute: gainAbs,
                        gainPercentage: gainPerc,
                        fundType: scheme.type // e.g EQUITY / DEBT
                    }
                });

                totalValue += current;
                totalInvested += invested;
                mfCount++;
            }
        }

        // 5. Update Portfolio Totals
        await this.prisma.portfolio.update({
            where: { id: portfolio.id },
            data: {
                totalValue: totalValue,
                totalInvested: totalInvested,
            }
        });

        // 6. Mark User as having eCAS data
        await this.prisma.userProfile.update({
            where: { userId },
            data: { hasEcasData: true }
        });

        this.logger.log(`eCAS processing completed for user: ${userId}. Imported ${mfCount} funds.`);

        // 7. Emit event
        this.logger.log('About to emit portfolio.ecas.uploaded');
        this.eventEmitter.emit('portfolio.ecas.uploaded', { userId });
        this.logger.log('Emitted portfolio.ecas.uploaded');
        return {
            success: true,
            portfolio: {
                totalValue,
                totalInvested,
                totalGain: totalValue - totalInvested,
                gainPercentage: totalInvested > 0 ? ((totalValue - totalInvested) / totalInvested) * 100 : 0,
                mutualFundsCount: mfCount
            }
        };
    }

    private async clearUserPortfolio(userId: string) {
        const portfolio = await this.prisma.portfolio.findUnique({ where: { userId } });
        if (portfolio) {
            await this.prisma.mutualFundHolding.deleteMany({ where: { portfolioId: portfolio.id } });
            await this.prisma.stockHolding.deleteMany({ where: { portfolioId: portfolio.id } });
        }
    }

    private calculateInvestedValue(scheme: any): number {
        // Simple logic: Sum of all purchase transactions (approximate if not provided directly)
        // If data has invested value, use it. Otherwise compute.
        // CAS Parser output usually has transactions. 
        // Detailed computation is complex (FIFO for redemptions). 
        // For MVP, we'll try to deduce or fallback to 0 if not present.

        // This logic needs refinement based on exact CAS Parser JSON structure for invested value.
        // Assuming transactions array has type 'PURCHASE' or 'SIP'.

        let invested = 0;
        let units = 0;

        for (const t of scheme.transactions) {
            if (t.amount > 0 && t.units > 0) {
                // Buying
                invested += t.amount;
                units += t.units;
            } else if (t.units < 0) {
                // Selling - reduce invested proportional to units sold?
                // This is hard without FIFO.
            }
        }

        // Fallback: if we can't calculate easily, use unit * avg_price if available, or just 0 for now
        // A better approach for MVP might be: Invested = Current Value (if we assume 0 gain) - safe fallback
        // OR better: Parse open balance + purchases.

        return invested || scheme.valuation.value; // Temporary fallback to avoid division by zero or negative
    }

    private calculateTotalUnits(scheme: any): number {
        // Usually the last transaction balance or valuation units
        // Checking Scheme Valuation object first
        // If CAS Parser provides balance in valuation, use that.
        // The interface defines transactions[].balance. 
        if (scheme.transactions && scheme.transactions.length > 0) {
            const lastTx = scheme.transactions[scheme.transactions.length - 1];
            if (lastTx.balance !== null) return lastTx.balance;
        }
        return 0;
    }
}
