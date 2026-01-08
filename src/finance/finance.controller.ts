import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { Portfolio, UserProfile } from '@smartyai/shared';

interface ProfilePortfolioBody {
    profile: UserProfile;
    portfolio: Portfolio;
}

interface ProfileOnlyBody {
    profile: UserProfile;
}

interface PortfolioOnlyBody {
    portfolio: Portfolio;
}

@Controller()
export class FinanceController {
    constructor(private readonly financeService: FinanceService) { }

    @Post('ratios')
    calculateRatios(@Body() body: ProfilePortfolioBody) {
        if (!body.profile || !body.portfolio) {
            throw new BadRequestException('profile and portfolio required');
        }
        return this.financeService.calculateRatios(body.profile, body.portfolio);
    }

    @Post('health-score')
    calculateHealthScore(@Body() body: ProfilePortfolioBody) {
        if (!body.profile || !body.portfolio) {
            throw new BadRequestException('profile and portfolio required');
        }
        return this.financeService.calculateHealthScore(body.profile, body.portfolio);
    }

    @Post('allocation/current')
    getCurrentAllocation(@Body() body: PortfolioOnlyBody) {
        if (!body.portfolio) {
            throw new BadRequestException('portfolio required');
        }
        return this.financeService.getCurrentAllocation(body.portfolio);
    }

    @Post('allocation/recommended')
    getRecommendedAllocation(@Body() body: ProfileOnlyBody) {
        if (!body.profile) {
            throw new BadRequestException('profile required');
        }
        return this.financeService.getRecommendedAllocation(body.profile);
    }

    @Post('allocation/rebalance')
    getRebalanceRecommendations(@Body() body: ProfilePortfolioBody) {
        if (!body.profile || !body.portfolio) {
            throw new BadRequestException('profile and portfolio required');
        }
        return this.financeService.getRebalanceRecommendations(body.profile, body.portfolio);
    }

    @Post('insights')
    generateInsights(@Body() body: ProfilePortfolioBody) {
        if (!body.profile || !body.portfolio) {
            throw new BadRequestException('profile and portfolio required');
        }
        return this.financeService.generateInsights(body.profile, body.portfolio);
    }

    @Post('goals/auto-generate')
    autoGenerateGoals(@Body() body: ProfilePortfolioBody): any {
        if (!body.profile || !body.portfolio) {
            throw new BadRequestException('profile and portfolio required');
        }
        return this.financeService.autoGenerateGoals(body.profile, body.portfolio);
    }

    @Post('analyze')
    comprehensiveAnalysis(@Body() body: ProfilePortfolioBody): any {
        if (!body.profile || !body.portfolio) {
            throw new BadRequestException('profile and portfolio required');
        }
        return this.financeService.comprehensiveAnalysis(body.profile, body.portfolio);
    }
}
