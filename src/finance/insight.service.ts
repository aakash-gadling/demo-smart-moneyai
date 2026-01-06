import { Injectable, Logger } from "@nestjs/common";
import { AssetAllocation, Insight, UserProfile } from "@smartyai/shared";
import { Prisma } from "prisma/generated/client";
import { LocalPortfolio } from "src/common/interfaces/LocalPortfolio";
import { PrismaService } from "src/prisma/prisma.service";
import { UsersService } from "src/users/users.service";
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class InsightService {
    private readonly logger = new Logger(UsersService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly userService: UsersService,
    ) { }

    private toNumber(
        value: Decimal | number | null | undefined,
    ): number {
        if (value == null) return 0;
        if (typeof value === 'number') return value;
        return value.toNumber();
    }

    private mapDbUserProfileToDomain(
        db: {
            id: string;
            userId: string;
            name: string;
            age: number;
            occupation: string;
            riskProfile: string;
            monthlyIncome: Decimal;
            monthlyExpenses: Decimal | null;
            dependents: number;
            retirementTargetAmount: Decimal | null;
            liabilities: Prisma.JsonValue | null;
            insurance: Prisma.JsonValue | null;
            createdAt: Date;
        },
    ): UserProfile {
        return {
            id: db.id,
            userId: db.userId,
            name: db.name,
            age: db.age,
            occupation: db.occupation,

            riskProfile: db.riskProfile as UserProfile['riskProfile'],

            monthlyIncome: this.toNumber(db.monthlyIncome),
            monthlyExpenses: this.toNumber(db.monthlyExpenses),

            dependents: db.dependents,
            retirementTargetAmount: this.toNumber(db.retirementTargetAmount),
            liabilities: (db.liabilities ?? undefined) as UserProfile['liabilities'],
            insurance: (db.insurance ?? undefined) as UserProfile['insurance'],

            createdAt: db.createdAt,
        };
    }

    // ==================== 1. INSIGHTS GENERATION ====================
    async calculateInsights(userId: string) {
        const profile = await this.userService.getProfile(userId);
        const portfolio = await this.userService.getPortfolio(userId);
        this.logger.log('Generating insights for user ' + profile.userId + ' And Portfolio Name' + profile.name);
        const insights: Insight[] = [];

        const concentrationInsight = this.checkConcentrationRisk(portfolio);
        this.logger.log('Concentration Insight: ' + JSON.stringify(concentrationInsight));
        if (concentrationInsight) insights.push(concentrationInsight);

        const underperformanceInsight = this.checkUnderperformance(portfolio);
        this.logger.log('underperformanceInsight: ' + JSON.stringify(underperformanceInsight));
        if (underperformanceInsight) insights.push(underperformanceInsight);

        const expenseInsight = this.checkExpenseRatio(this.mapDbUserProfileToDomain(profile));
        this.logger.log('expenseInsight: ' + JSON.stringify(expenseInsight));
        if (expenseInsight) insights.push(expenseInsight);

        const allocationInsight = this.checkAllocationMismatch(this.mapDbUserProfileToDomain(profile), portfolio);
        this.logger.log('allocationInsight: ' + JSON.stringify(allocationInsight));
        if (allocationInsight) insights.push(allocationInsight);

        const efInsight = this.checkEmergencyFund(this.mapDbUserProfileToDomain(profile), portfolio);
        this.logger.log('efInsight: ' + JSON.stringify(efInsight));
        if (efInsight) insights.push(efInsight);
        this.logger.log('Insights generated for user ' + profile.userId + ' And Portfolio Name' + profile.name);

        // Save insights but don't wait for it to complete
        void this.saveInsights(profile.userId, insights).catch((error) => {
            this.logger.error('Failed to save insights for user ' + profile.userId + ' And Portfolio Name' + profile.name, error);
        });
    }

    async saveInsights(userId: string, insights: Insight[]) {
        await this.prisma.$transaction(async (tx) => {
            for (const insight of insights) {
                await tx.insight.upsert({
                    where: { userId_id: { userId, id: insight.id } },
                    update: {
                        category: insight.category,
                        severity: insight.severity,
                        tone: insight.tone,
                        title: insight.title,
                        message: insight.message,
                        data: insight.data as Prisma.InputJsonValue,
                        action: insight.action,
                        isActive: true,
                    },
                    create: {
                        userId,
                        id: insight.id,
                        category: insight.category,
                        severity: insight.severity,
                        tone: insight.tone,
                        title: insight.title,
                        message: insight.message,
                        data: insight.data as Prisma.InputJsonValue,
                        action: insight.action,
                    },
                });
            }

            await tx.insight.updateMany({
                where: { userId, id: { notIn: insights.map(i => i.id) } },
                data: { isActive: false },
            });
        });

    }

    private checkConcentrationRisk(portfolio: LocalPortfolio): Insight | null {
        const threshold = 0.2;
        const total = portfolio.totalValue || 0;
        if (!total) return null;

        const riskyFund = portfolio.mutualFunds.find(f =>
            f.currentValue / total > threshold,
        );

        // ✅ No concentration risk
        if (!riskyFund) {
            return {
                id: 'concentration_risk',
                category: 'risk',
                severity: 'low',
                tone: 'success',
                title: 'Well-diversified portfolio',
                message:
                    'Your investments are well distributed across funds, reducing concentration risk.',
            };
        }

        const percentage = riskyFund.currentValue / total;

        // ⚠️ Concentration risk
        return {
            id: 'concentration_risk',
            category: 'risk',
            severity: 'high',
            tone: 'warning',
            title: 'Portfolio concentration risk',
            message: `₹${(riskyFund.currentValue / 1e5).toFixed(2)}L (${(
                percentage * 100
            ).toFixed(1)}%) is invested in ${riskyFund.schemeName}. Consider diversifying.`,
            data: {
                schemeName: riskyFund.schemeName,
                percentage,
            },
            action: 'show_diversification_options',
        };
    }


    private checkUnderperformance(portfolio: LocalPortfolio): Insight | null {
        const underperformers = portfolio.mutualFunds.filter(
            f => (f.gainPercentage ?? 0) < 0,
        );

        // ✅ No underperformance
        if (!underperformers.length) {
            return {
                id: 'underperforming_funds',
                category: 'portfolio',
                severity: 'low',
                tone: 'success',
                title: 'Funds performing well',
                message:
                    'All your mutual fund investments are currently in positive territory.',
            };
        }

        const worst = underperformers.reduce((min, f) =>
            f.gainPercentage < min.gainPercentage ? f : min,
        );

        return {
            id: 'underperforming_funds',
            category: 'portfolio',
            severity: 'medium',
            tone: 'warning',
            title: `${underperformers.length} fund${underperformers.length > 1 ? 's are' : ' is'
                } underperforming`,
            message: `${worst.schemeName} is down ${Math.abs(
                worst.gainPercentage,
            ).toFixed(2)}%. Consider reviewing your allocation.`,
            data: {
                count: underperformers.length,
                worstFund: {
                    schemeName: worst.schemeName,
                    gainPercentage: worst.gainPercentage,
                },
            },
            action: 'show_alternatives',
        };
    }


    private checkExpenseRatio(profile: UserProfile): Insight | null {
        const income = profile.monthlyIncome;
        const expenses = profile.monthlyExpenses;

        if (!income || !expenses) return null;

        const ratio = expenses / income;

        // 🚨 Very high expense ratio
        if (ratio >= 0.75) {
            return {
                id: 'expense_ratio_status',
                category: 'cashflow',
                severity: 'high',
                tone: 'danger',
                title: 'Expenses consuming most of your income',
                message: `Your monthly expenses are ${(ratio * 100).toFixed(
                    0,
                )}% of your income. This leaves very little room for savings.`,
                data: { income, expenses, ratio },
                action: 'review_expenses',
            };
        }

        // High expense ratio
        if (ratio >= 0.5) {
            return {
                id: 'expense_ratio_status',
                category: 'cashflow',
                severity: 'medium',
                tone: 'warning',
                title: 'High expense ratio',
                message: `You spend ${(ratio * 100).toFixed(
                    0,
                )}% of your income every month. Reducing expenses can improve savings.`,
                data: { income, expenses, ratio },
                action: 'review_expenses',
            };
        }

        // ✅ Healthy
        return {
            id: 'expense_ratio_status',
            category: 'cashflow',
            severity: 'low',
            tone: 'success',
            title: 'Healthy expense ratio',
            message: `You spend only ${(ratio * 100).toFixed(
                0,
            )}% of your income. This gives you strong savings potential.`,
            data: { income, expenses, ratio },
        };
    }


    private checkAllocationMismatch(
        profile: UserProfile,
        portfolio: LocalPortfolio,
    ): Insight | null {
        const total = portfolio.totalValue || 0;
        if (!total) return null;

        const current = this.getCurrentAllocation(portfolio);
        const recommended = this.getRecommendedAllocation(profile);

        const diffPct = current.equity - recommended.equity;
        const absDiff = Math.abs(diffPct);

        // ✅ Allocation OK
        if (absDiff <= 15) {
            return {
                id: 'allocation_mismatch',
                category: 'risk',
                severity: 'low',
                tone: 'success',
                title: 'Asset allocation on track',
                message: `Your equity allocation (${current.equity.toFixed(
                    1,
                )}%) is aligned with your risk profile.`,
            };
        }

        const currentEquityValue = (current.equity / 100) * total;
        const targetEquityValue = (recommended.equity / 100) * total;
        const rebalanceAmount = Math.abs(targetEquityValue - currentEquityValue);

        const actionText =
            diffPct > 0
                ? `Move ~₹${(rebalanceAmount / 1e5).toFixed(
                    2,
                )}L from equity to debt/liquid assets`
                : `Add ~₹${(rebalanceAmount / 1e5).toFixed(
                    2,
                )}L more to equity investments`;

        return {
            id: 'allocation_mismatch',
            category: 'risk',
            severity: 'medium',
            tone: 'warning',
            title: 'Asset allocation needs rebalancing',
            message: `Your equity allocation is ${current.equity.toFixed(
                1,
            )}% vs recommended ${recommended.equity.toFixed(
                1,
            )}%. ${actionText}.`,
            data: {
                currentEquityPct: current.equity,
                recommendedEquityPct: recommended.equity,
                currentEquityValue,
                targetEquityValue,
                rebalanceAmount,
            },
            action: 'show_rebalance_plan',
        };
    }



    private checkEmergencyFund(profile: UserProfile, portfolio: LocalPortfolio): Insight | null {
        const liquidAssets =
            (portfolio.cash ?? 0) +
            (portfolio.fixedDeposits ?? 0);

        const required = profile.monthlyExpenses * 6;
        const ratio = required > 0 ? liquidAssets / required : 0;

        this.logger.debug(
            `Emergency fund check | liquid=${liquidAssets}, required=${required}, ratio=${ratio.toFixed(2)}`,
        );

        const commonData = {
            current: liquidAssets,
            required,
            gap: Math.max(required - liquidAssets, 0),
            coverageMonths: (liquidAssets / profile.monthlyExpenses).toFixed(1),
        };

        // Critical
        if (ratio < 0.5) {
            return {
                id: 'emergency_fund_status',
                category: 'cashflow',
                severity: 'high',
                tone: 'danger',
                title: 'Emergency fund critically low',
                message: `You have only ${(ratio * 100).toFixed(
                    0,
                )}% of your recommended emergency fund. Aim to cover at least 6 months of expenses as soon as possible.`,
                data: commonData,
                action: 'create_ef_plan',
            };
        }

        // Needs improvement
        if (ratio < 1.0) {
            return {
                id: 'emergency_fund_status',
                category: 'cashflow',
                severity: 'medium',
                tone: 'warning',
                title: 'Emergency fund needs topping up',
                message: `Good progress! You currently cover ${commonData.coverageMonths} months of expenses. Try to reach the 6-month mark for better safety.`,
                data: commonData,
                action: 'create_ef_plan',
            };
        }

        // Healthy — SAVE AS GOOD INSIGHT
        return {
            id: 'emergency_fund_status',
            category: 'cashflow',
            severity: 'low',
            tone: 'success',
            title: 'Emergency fund is healthy',
            message: `Great job! You have an emergency fund covering ${commonData.coverageMonths} months of expenses. This gives you strong financial stability.`,
            data: commonData,
        };
    }

    // ==================== 3. ASSET ALLOCATION ====================

    private getCurrentAllocation(portfolio: LocalPortfolio): AssetAllocation {
        const investibleTotal =
            (portfolio.totalValue ?? 0) - (portfolio.realEstate ?? 0);

        if (investibleTotal <= 0)
            return { equity: 0, debt: 0, gold: 0, liquid: 0 };
        const isEquityFund = (mf: any) =>
            mf.fundType === 'EQUITY' ||
            mf.category?.toLowerCase().includes('equity') ||
            mf.category?.toLowerCase().includes('flexi') ||
            mf.category?.toLowerCase().includes('large') ||
            mf.category?.toLowerCase().includes('mid') ||
            mf.category?.toLowerCase().includes('small');
        const equityMF = portfolio.mutualFunds.reduce(
            (sum, mf) => isEquityFund(mf) ? sum + mf.currentValue : sum,
            0,
        );

        const equityStocks = portfolio.stocks?.reduce(
            (sum, st) => sum + (st.currentValue ?? 0),
            0,
        ) ?? 0;

        const equity = equityMF + equityStocks;

        const debt =
            portfolio.mutualFunds.reduce(
                (sum, mf) => mf.fundType === 'DEBT' ? sum + mf.currentValue : sum,
                0,
            ) +
            (portfolio.fixedDeposits ?? 0) +
            (portfolio.epf ?? 0) +
            (portfolio.ppf ?? 0) +
            (portfolio.nps ?? 0);

        const gold = portfolio.gold ?? 0;
        const liquid = portfolio.cash ?? 0;

        return {
            equity: (equity / investibleTotal) * 100,
            debt: (debt / investibleTotal) * 100,
            gold: (gold / investibleTotal) * 100,
            liquid: (liquid / investibleTotal) * 100,
        };
    }

    private getRecommendedAllocation(profile: UserProfile): AssetAllocation {
        this.logger.log('Checking recommended allocation for profile ' + profile.id);
        const { age, riskProfile } = profile;
        this.logger.log('Age: ' + age);
        this.logger.log('Risk profile: ' + riskProfile);
        let baseEquity = 100 - age;

        if (riskProfile === 'aggressive') {
            baseEquity = Math.min(80, baseEquity + 10);
        } else if (riskProfile === 'conservative') {
            baseEquity = Math.max(35, baseEquity - 10);
        }

        baseEquity = Math.max(35, Math.min(80, baseEquity));

        const remaining = 100 - baseEquity;

        return {
            equity: baseEquity,
            debt: remaining * 0.6,
            gold: remaining * 0.25,
            liquid: remaining * 0.15
        };
    }

}