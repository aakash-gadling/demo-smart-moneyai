/**
 * Financial Engine - Core calculation engine
 * Migrated from client/src/services/financialEngine.ts
 * Implements all formulas for health scoring, ratio analysis, and insights
 */

import type {
    UserProfile,
    Portfolio,
    FinancialRatios,
    FinancialHealthScore,
    Insight,
    AssetAllocation,
    AllocationRecommendation,
    MutualFundHolding
} from '@smartyai/shared';

// Legacy Goal type for backward compatibility
interface LegacyGoal {
    id: string;
    name: string;
    category: 'life-essential' | 'lifestyle' | 'wealth';
    targetAmountToday: number;
    futureValue: number;
    currentValue: number;
    timeHorizonYears: number;
    inflationRate: number;
    monthlyRequired: number;
    priority: number;
    status: 'on-track' | 'behind' | 'ahead';
    linkedInvestments: string[];
    gap: number;
}

export class FinancialEngine {

    // ==================== 1. KEY RATIOS & FORMULAS ====================

    /**
     * Calculate all financial ratios
     */
    calculateRatios(profile: UserProfile, portfolio: Portfolio): FinancialRatios {
        const monthlySavings = profile.monthlyIncome - profile.monthlyExpenses;
        const savingsRatio = monthlySavings / profile.monthlyIncome;

        // Estimate monthly investments (simplified: assume 70% of savings go to investments)
        const monthlyInvestments = monthlySavings * 0.7;
        const investmentRatio = monthlySavings > 0 ? monthlyInvestments / monthlySavings : 0;

        // DTI - Debt to Income
        const totalEMI = (profile.liabilities?.homeLoan || 0) +
            (profile.liabilities?.carLoan || 0) +
            (profile.liabilities?.creditCard || 0) +
            (profile.liabilities?.otherEMI || 0);
        const dti = totalEMI / profile.monthlyIncome;

        // Emergency Fund Ratio
        const liquidAssets = (portfolio.cash || 0) + (portfolio.fixedDeposits || 0);
        const requiredEF = profile.monthlyExpenses * 6;
        const emergencyFundRatio = liquidAssets / requiredEF;

        // Insurance Cover Ratio
        const minRequiredCover = profile.monthlyIncome * 12 * 12; // 12x annual income
        const currentCover = profile.insurance?.termCover || 0;
        const insuranceCoverRatio = currentCover / minRequiredCover;

        // Diversification Score
        const diversificationScore = this.calculateDiversificationScore(portfolio);

        return {
            savingsRatio,
            investmentRatio,
            dti,
            emergencyFundRatio,
            insuranceCoverRatio,
            diversificationScore
        };
    }

    /**
     * Calculate diversification score based on asset allocation
     */
    private calculateDiversificationScore(portfolio: Portfolio): number {
        const allocation = this.getCurrentAllocation(portfolio);

        // Ideal allocation (moderate risk)
        const ideal = { equity: 55, debt: 30, gold: 10, liquid: 5 };

        // Calculate deviation from ideal
        const deviations = [
            Math.abs(allocation.equity - ideal.equity),
            Math.abs(allocation.debt - ideal.debt),
            Math.abs(allocation.gold - ideal.gold),
            Math.abs(allocation.liquid - ideal.liquid)
        ];

        const totalDeviation = deviations.reduce((sum, d) => sum + d, 0);

        // Score: 100 - (total deviation / 2)
        return Math.max(0, 100 - (totalDeviation / 2));
    }

    // ==================== 2. FINANCIAL HEALTH SCORE ====================

    /**
     * Calculate overall financial health score (0-100)
     * Weighted model:
     * - Savings ratio: 20%
     * - DTI: 20%
     * - Emergency fund: 15%
     * - Insurance cover: 15%
     * - Investment ratio: 20%
     * - Diversification: 10%
     */
    calculateHealthScore(profile: UserProfile, portfolio: Portfolio): FinancialHealthScore {
        const ratios = this.calculateRatios(profile, portfolio);

        // Score each component (0-100)
        const savingsScore = this.scoreSavingsRatio(ratios.savingsRatio);
        const dtiScore = this.scoreDTI(ratios.dti);
        const efScore = this.scoreEmergencyFund(ratios.emergencyFundRatio);
        const insuranceScore = this.scoreInsurance(ratios.insuranceCoverRatio);
        const investmentScore = this.scoreInvestmentRatio(ratios.investmentRatio);
        const diversificationScore = ratios.diversificationScore;

        // Weighted total
        const totalScore =
            savingsScore * 0.20 +
            dtiScore * 0.20 +
            efScore * 0.15 +
            insuranceScore * 0.15 +
            investmentScore * 0.20 +
            diversificationScore * 0.10;

        const grade = this.getGrade(totalScore);
        const status = this.getStatus(totalScore);
        const topActions = this.generateTopActions(ratios, profile, portfolio);

        return {
            score: Math.round(totalScore),
            grade,
            status,
            breakdown: {
                savingsRatio: { score: savingsScore, weight: 20, value: ratios.savingsRatio },
                dti: { score: dtiScore, weight: 20, value: ratios.dti },
                emergencyFund: { score: efScore, weight: 15, value: ratios.emergencyFundRatio },
                insuranceCover: { score: insuranceScore, weight: 15, value: ratios.insuranceCoverRatio },
                investmentRatio: { score: investmentScore, weight: 20, value: ratios.investmentRatio },
                diversification: { score: diversificationScore, weight: 10, value: diversificationScore }
            },
            topActions
        };
    }

    private scoreSavingsRatio(ratio: number): number {
        const percentage = ratio * 100;
        if (percentage >= 30) return 100;
        if (percentage >= 15) return 50 + ((percentage - 15) / 15) * 50;
        return (percentage / 15) * 50;
    }

    private scoreDTI(dti: number): number {
        const percentage = dti * 100;
        if (percentage <= 25) return 100;
        if (percentage <= 40) return 100 - ((percentage - 25) / 15) * 50;
        return Math.max(0, 50 - ((percentage - 40) / 40) * 50);
    }

    private scoreEmergencyFund(ratio: number): number {
        if (ratio >= 1.0) return 100;
        if (ratio >= 0.5) return 50 + (ratio - 0.5) * 100;
        return ratio * 100;
    }

    private scoreInsurance(ratio: number): number {
        if (ratio >= 1.0) return 100;
        if (ratio >= 0.5) return 50 + (ratio - 0.5) * 100;
        return ratio * 100;
    }

    private scoreInvestmentRatio(ratio: number): number {
        const percentage = ratio * 100;
        if (percentage >= 70) return 100;
        if (percentage >= 40) return 50 + ((percentage - 40) / 30) * 50;
        return (percentage / 40) * 50;
    }

    private getGrade(score: number): 'A' | 'B' | 'C' | 'D' {
        if (score >= 80) return 'A';
        if (score >= 60) return 'B';
        if (score >= 40) return 'C';
        return 'D';
    }

    private getStatus(score: number): 'Healthy' | 'Moderate' | 'Needs Fix' {
        if (score >= 80) return 'Healthy';
        if (score >= 60) return 'Moderate';
        return 'Needs Fix';
    }

    private generateTopActions(ratios: FinancialRatios, profile: UserProfile, portfolio: Portfolio): string[] {
        const actions: { priority: number; action: string }[] = [];

        if (ratios.savingsRatio < 0.15) {
            actions.push({ priority: 90, action: `Increase savings rate to at least 15% (currently ${(ratios.savingsRatio * 100).toFixed(1)}%)` });
        }

        if (ratios.dti > 0.40) {
            actions.push({ priority: 95, action: `Reduce debt burden - DTI is ${(ratios.dti * 100).toFixed(1)}% (should be < 40%)` });
        }

        if (ratios.emergencyFundRatio < 0.5) {
            const needed = profile.monthlyExpenses * 6;
            const current = (portfolio.cash || 0) + (portfolio.fixedDeposits || 0);
            actions.push({ priority: 85, action: `Build emergency fund to ₹${needed.toLocaleString()} (currently ₹${current.toLocaleString()})` });
        }

        if (ratios.insuranceCoverRatio < 0.5) {
            const needed = profile.monthlyIncome * 12 * 12;
            actions.push({ priority: 80, action: `Get term insurance of at least ₹${(needed / 100000).toFixed(1)}L` });
        }

        if (ratios.investmentRatio < 0.4) {
            actions.push({ priority: 70, action: `Invest more of your savings (currently only ${(ratios.investmentRatio * 100).toFixed(1)}% invested)` });
        }

        if (ratios.diversificationScore < 60) {
            actions.push({ priority: 65, action: 'Diversify portfolio across asset classes' });
        }

        return actions
            .sort((a, b) => b.priority - a.priority)
            .slice(0, 3)
            .map(a => a.action);
    }

    // ==================== 3. ASSET ALLOCATION ====================

    getCurrentAllocation(portfolio: Portfolio): AssetAllocation {
        const total = portfolio.totalValue;

        if (total === 0) {
            return { equity: 0, debt: 0, gold: 0, liquid: 0 };
        }

        const equityValue = portfolio.mutualFunds
            .filter(mf => mf.type === 'EQUITY')
            .reduce((sum, mf) => sum + mf.currentValue, 0);

        const debtValue = portfolio.mutualFunds
            .filter(mf => mf.type === 'DEBT')
            .reduce((sum, mf) => sum + mf.currentValue, 0) +
            (portfolio.fixedDeposits || 0) +
            (portfolio.epf || 0) +
            (portfolio.ppf || 0);

        const goldValue = portfolio.gold || 0;
        const liquidValue = portfolio.cash || 0;

        return {
            equity: (equityValue / total) * 100,
            debt: (debtValue / total) * 100,
            gold: (goldValue / total) * 100,
            liquid: (liquidValue / total) * 100
        };
    }

    getRecommendedAllocation(profile: UserProfile): AssetAllocation {
        const { age, riskProfile } = profile;

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

    getRebalanceRecommendations(profile: UserProfile, portfolio: Portfolio): AllocationRecommendation {
        const current = this.getCurrentAllocation(portfolio);
        const recommended = this.getRecommendedAllocation(profile);

        const rebalanceActions: AllocationRecommendation['rebalanceActions'] = [];

        const assets: (keyof AssetAllocation)[] = ['equity', 'debt', 'gold', 'liquid'];

        assets.forEach(asset => {
            const recommendedValue = recommended[asset] || 0;
            const currentValue = current[asset] || 0;
            const diff = recommendedValue - currentValue;

            if (Math.abs(diff) > 5) {
                const amount = (portfolio.totalValue * Math.abs(diff)) / 100;
                rebalanceActions.push({
                    asset: asset.charAt(0).toUpperCase() + asset.slice(1),
                    action: diff > 0 ? 'increase' : 'decrease',
                    amount,
                    percentage: Math.abs(diff)
                });
            }
        });

        return {
            current,
            recommended,
            rebalanceActions
        };
    }

    // ==================== 4. INSIGHTS GENERATION ====================

    generateInsights(profile: UserProfile, portfolio: Portfolio): Insight[] {
        const insights: Insight[] = [];

        const concentrationInsight = this.checkConcentrationRisk(portfolio);
        if (concentrationInsight) insights.push(concentrationInsight);

        const underperformanceInsight = this.checkUnderperformance(portfolio);
        if (underperformanceInsight) insights.push(underperformanceInsight);

        const expenseInsight = this.checkExpenseRatios(portfolio);
        if (expenseInsight) insights.push(expenseInsight);

        const allocationInsight = this.checkAllocationMismatch(profile, portfolio);
        if (allocationInsight) insights.push(allocationInsight);

        const efInsight = this.checkEmergencyFund(profile, portfolio);
        if (efInsight) insights.push(efInsight);

        return insights;
    }

    private checkConcentrationRisk(portfolio: Portfolio): Insight | null {
        const threshold = 0.20;

        for (const fund of portfolio.mutualFunds) {
            const percentage = fund.currentValue / portfolio.totalValue;
            if (percentage > threshold) {
                return {
                    id: 'concentration_risk',
                    category: 'risk',
                    severity: 'high',
                    tone: 'warning',
                    title: 'Portfolio Concentration Risk',
                    message: `You have ₹${(fund.currentValue / 100000).toFixed(2)}L (${(percentage * 100).toFixed(1)}%) in ${fund.schemeName}. This is risky - diversify!`,
                    data: { fund, percentage },
                    action: 'show_diversification_options'
                };
            }
        }

        return null;
    }

    private checkUnderperformance(portfolio: Portfolio): Insight | null {
        const underperformers = portfolio.mutualFunds.filter(f => f.gain.percentage < 0);

        if (underperformers.length > 0) {
            const worst = underperformers.sort((a, b) => a.gain.percentage - b.gain.percentage)[0];
            return {
                id: 'underperforming_funds',
                category: 'portfolio',
                severity: 'medium',
                tone: 'warning',
                title: `${underperformers.length} fund${underperformers.length > 1 ? 's' : ''} underperforming`,
                message: `${worst.schemeName} is down ${Math.abs(worst.gain.percentage).toFixed(2)}%. Consider reviewing.`,
                data: underperformers,
                action: 'show_alternatives'
            };
        }

        return null;
    }

    private checkExpenseRatios(portfolio: Portfolio): Insight | null {
        const regularPlans = portfolio.mutualFunds.filter(f =>
            f.schemeName.toLowerCase().includes('regular')
        );

        if (regularPlans.length > 0) {
            const totalValue = regularPlans.reduce((sum, f) => sum + f.currentValue, 0);
            const annualExtraCost = totalValue * 0.01;

            return {
                id: 'high_expense_ratio',
                category: 'portfolio',
                severity: 'medium',
                tone: 'warning',
                title: 'High expense ratios detected',
                message: `You're in regular plans worth ₹${(totalValue / 100000).toFixed(2)}L. Switching to direct plans could save ₹${(annualExtraCost / 1000).toFixed(1)}k/year!`,
                data: { regularPlans, annualSavings: annualExtraCost },
                action: 'show_direct_plans'
            };
        }

        return null;
    }

    private checkAllocationMismatch(profile: UserProfile, portfolio: Portfolio): Insight | null {
        const current = this.getCurrentAllocation(portfolio);
        const recommended = this.getRecommendedAllocation(profile);

        const equityDiff = Math.abs(current.equity - recommended.equity);

        if (equityDiff > 15) {
            const action = current.equity > recommended.equity ? 'reduce' : 'increase';
            return {
                id: 'allocation_mismatch',
                category: 'risk',
                severity: 'medium',
                tone: 'warning',
                title: 'Asset allocation needs rebalancing',
                message: `Your equity allocation is ${current.equity.toFixed(1)}% (recommended: ${recommended.equity.toFixed(1)}%). ${action === 'reduce' ? 'Too risky' : 'Missing growth potential'}!`,
                data: { current, recommended },
                action: 'show_rebalance_plan'
            };
        }

        return null;
    }

    private checkEmergencyFund(profile: UserProfile, portfolio: Portfolio): Insight | null {
        const liquidAssets = (portfolio.cash || 0) + (portfolio.fixedDeposits || 0);
        const required = profile.monthlyExpenses * 6;
        const ratio = liquidAssets / required;

        if (ratio < 0.5) {
            return {
                id: 'emergency_fund_low',
                category: 'cashflow',
                severity: 'high',
                tone: 'danger',
                title: 'Emergency fund critically low',
                message: `You need ₹${(required / 100000).toFixed(2)}L for 6 months of expenses. You only have ₹${(liquidAssets / 100000).toFixed(2)}L. Build this ASAP!`,
                data: { current: liquidAssets, required, gap: required - liquidAssets },
                action: 'create_ef_plan'
            };
        } else if (ratio < 1.0) {
            return {
                id: 'emergency_fund_low',
                category: 'cashflow',
                severity: 'medium',
                tone: 'warning',
                title: 'Emergency fund needs topping up',
                message: `You're ${(ratio * 100).toFixed(0)}% of the way to your 6-month emergency fund. Keep going!`,
                data: { current: liquidAssets, required, gap: required - liquidAssets },
                action: 'create_ef_plan'
            };
        }

        return null;
    }

    // ==================== 5. AUTO GOAL GENERATION ====================

    autoGenerateGoals(profile: UserProfile, portfolio: Portfolio): LegacyGoal[] {
        const goals: LegacyGoal[] = [];

        // Emergency Fund
        goals.push(this.generateEmergencyFundGoal(profile, portfolio));

        // Retirement (if age < 45)
        if (profile.age < 45) {
            goals.push(this.generateRetirementGoal(profile, portfolio));
        }

        // Child Education (if dependents > 0)
        if (profile.dependents > 0) {
            goals.push(this.generateEducationGoal(profile, portfolio));
        }

        // Home Purchase (if age < 40 and no real estate)
        if (profile.age < 40 && !portfolio.realEstate) {
            goals.push(this.generateHomeGoal(profile, portfolio));
        }

        // Dream Vacation (if monthly savings > 5000)
        const monthlySavings = profile.monthlyIncome - profile.monthlyExpenses;
        if (monthlySavings > 5000) {
            goals.push(this.generateVacationGoal(profile, portfolio));
        }

        // Wealth Creation
        goals.push(this.generateWealthGoal(profile, portfolio));

        return goals;
    }

    private generateEmergencyFundGoal(profile: UserProfile, portfolio: Portfolio): LegacyGoal {
        const targetAmount = profile.monthlyExpenses * 6;
        const currentValue = (portfolio.cash || 0) + (portfolio.fixedDeposits || 0);
        const gap = Math.max(0, targetAmount - currentValue);
        const monthlyRequired = gap / 12;

        return {
            id: 'emergency_fund',
            name: 'Emergency Fund',
            category: 'life-essential',
            targetAmountToday: targetAmount,
            futureValue: targetAmount,
            currentValue,
            timeHorizonYears: 1,
            inflationRate: 0,
            monthlyRequired,
            priority: 1.0,
            status: currentValue >= targetAmount ? 'on-track' : 'behind',
            linkedInvestments: [],
            gap
        };
    }

    private generateRetirementGoal(profile: UserProfile, portfolio: Portfolio): LegacyGoal {
        const retirementAge = 60;
        const yearsToRetirement = retirementAge - profile.age;
        const replacementRate = 0.7;
        const annualIncomeNeeded = profile.monthlyIncome * 12 * replacementRate;
        const corpusNeeded = annualIncomeNeeded / 0.04;
        const inflationRate = 0.06;
        const futureValue = corpusNeeded * Math.pow(1 + inflationRate, yearsToRetirement);
        const currentValue = (portfolio.epf || 0) + (portfolio.nps || 0) + portfolio.totalValue * 0.5;
        const monthlyRequired = this.calculateSIP(futureValue - currentValue, yearsToRetirement, 0.12);

        return {
            id: 'retirement',
            name: 'Retirement',
            category: 'life-essential',
            targetAmountToday: corpusNeeded,
            futureValue,
            currentValue,
            timeHorizonYears: yearsToRetirement,
            inflationRate,
            monthlyRequired,
            priority: 0.9,
            status: this.getGoalStatus(currentValue, futureValue, yearsToRetirement),
            linkedInvestments: [],
            gap: futureValue - currentValue
        };
    }

    private generateEducationGoal(profile: UserProfile, portfolio: Portfolio): LegacyGoal {
        const targetAmountToday = 2500000;
        const timeHorizon = 10;
        const inflationRate = 0.06;
        const futureValue = targetAmountToday * Math.pow(1 + inflationRate, timeHorizon);
        const currentValue = 0;
        const monthlyRequired = this.calculateSIP(futureValue, timeHorizon, 0.12);

        return {
            id: 'child_education',
            name: 'Child Education',
            category: 'life-essential',
            targetAmountToday,
            futureValue,
            currentValue,
            timeHorizonYears: timeHorizon,
            inflationRate,
            monthlyRequired,
            priority: 0.85,
            status: 'behind',
            linkedInvestments: [],
            gap: futureValue
        };
    }

    private generateHomeGoal(profile: UserProfile, portfolio: Portfolio): LegacyGoal {
        const targetAmountToday = profile.monthlyIncome * 12 * 5;
        const timeHorizon = 5;
        const inflationRate = 0.05;
        const futureValue = targetAmountToday * Math.pow(1 + inflationRate, timeHorizon);
        const currentValue = 0;
        const monthlyRequired = this.calculateSIP(futureValue, timeHorizon, 0.10);

        return {
            id: 'home_purchase',
            name: 'Home Purchase',
            category: 'lifestyle',
            targetAmountToday,
            futureValue,
            currentValue,
            timeHorizonYears: timeHorizon,
            inflationRate,
            monthlyRequired,
            priority: 0.7,
            status: 'behind',
            linkedInvestments: [],
            gap: futureValue
        };
    }

    private generateVacationGoal(profile: UserProfile, portfolio: Portfolio): LegacyGoal {
        const targetAmountToday = 100000; // ₹1L
        const timeHorizon = 1; // 1 year
        const inflationRate = 0.06;
        const futureValue = targetAmountToday * Math.pow(1 + inflationRate, timeHorizon);
        const currentValue = 0;
        const monthlyRequired = this.calculateSIP(futureValue, timeHorizon, 0.06); // Low risk return

        return {
            id: 'dream_vacation',
            name: 'Dream Vacation',
            category: 'lifestyle',
            targetAmountToday,
            futureValue,
            currentValue,
            timeHorizonYears: timeHorizon,
            inflationRate,
            monthlyRequired,
            priority: 0.5,
            status: 'behind',
            linkedInvestments: [],
            gap: futureValue
        };
    }

    private generateWealthGoal(profile: UserProfile, portfolio: Portfolio): LegacyGoal {
        const targetAmountToday = 10000000;
        const timeHorizon = 15;
        const inflationRate = 0.06;
        const futureValue = targetAmountToday * Math.pow(1 + inflationRate, timeHorizon);
        const currentValue = portfolio.totalValue;
        const monthlyRequired = this.calculateSIP(futureValue - currentValue, timeHorizon, 0.12);

        return {
            id: 'wealth_creation',
            name: 'Wealth Creation',
            category: 'wealth',
            targetAmountToday,
            futureValue,
            currentValue,
            timeHorizonYears: timeHorizon,
            inflationRate,
            monthlyRequired,
            priority: 0.6,
            status: this.getGoalStatus(currentValue, futureValue, timeHorizon),
            linkedInvestments: [],
            gap: futureValue - currentValue
        };
    }

    private calculateSIP(futureValue: number, years: number, annualReturn: number): number {
        const monthlyRate = annualReturn / 12;
        const months = years * 12;

        if (monthlyRate === 0) return futureValue / months;

        const numerator = futureValue;
        const denominator = (Math.pow(1 + monthlyRate, months) - 1) / monthlyRate * (1 + monthlyRate);

        return numerator / denominator;
    }

    private getGoalStatus(current: number, target: number, years: number): 'on-track' | 'behind' | 'ahead' {
        const progress = current / target;
        const expectedProgress = 1 / years;

        if (progress >= expectedProgress * 1.2) return 'ahead';
        if (progress >= expectedProgress * 0.8) return 'on-track';
        return 'behind';
    }
}

export const financialEngine = new FinancialEngine();
