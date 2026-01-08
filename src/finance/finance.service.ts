import { Injectable } from '@nestjs/common';
import { FinancialEngine } from './engine/FinancialEngine';
import { Portfolio, UserProfile } from '@smartyai/shared';

@Injectable()
export class FinanceService {

    private readonly engine = new FinancialEngine();

    calculateRatios(profile: UserProfile, portfolio: Portfolio) {
        return this.engine.calculateRatios(profile, portfolio);
    }

    calculateHealthScore(profile: UserProfile, portfolio: Portfolio) {
        return this.engine.calculateHealthScore(profile, portfolio);
    }

    getCurrentAllocation(portfolio: Portfolio) {
        return this.engine.getCurrentAllocation(portfolio);
    }

    getRecommendedAllocation(profile: UserProfile) {
        return this.engine.getRecommendedAllocation(profile);
    }

    getRebalanceRecommendations(profile: UserProfile, portfolio: Portfolio) {
        return this.engine.getRebalanceRecommendations(profile, portfolio);
    }

    generateInsights(profile: UserProfile, portfolio: Portfolio) {
        return this.engine.generateInsights(profile, portfolio);
    }

    autoGenerateGoals(profile: UserProfile, portfolio: Portfolio): any {
        return this.engine.autoGenerateGoals(profile, portfolio);
    }

    comprehensiveAnalysis(profile: UserProfile, portfolio: Portfolio): any {
        const ratios = this.engine.calculateRatios(profile, portfolio);
        const healthScore = this.engine.calculateHealthScore(profile, portfolio);
        const currentAllocation = this.engine.getCurrentAllocation(portfolio);
        const recommendedAllocation = this.engine.getRecommendedAllocation(profile);
        const rebalanceRecommendations = this.engine.getRebalanceRecommendations(profile, portfolio);
        const insights = this.engine.generateInsights(profile, portfolio);
        const autoGoals = this.engine.autoGenerateGoals(profile, portfolio);

        return {
            ratios,
            healthScore,
            allocation: {
                current: currentAllocation,
                recommended: recommendedAllocation,
                rebalance: rebalanceRecommendations,
            },
            insights,
            suggestedGoals: autoGoals,
        };
    }
}
