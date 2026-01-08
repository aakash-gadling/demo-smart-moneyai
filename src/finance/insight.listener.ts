// goal.listener.ts (INSIDE GoalModule)
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InsightService } from './insight.service';

@Injectable()
export class InsightListener {
    private readonly logger = new Logger(InsightListener.name);

    constructor(
        private readonly insightService: InsightService,
    ) { }

    @OnEvent('user.updated')
    async handleUserUpdated(event: {
        userId: string;
    }) {
        this.logger.log(`User updated: ${event.userId}`);
        await this.insightService.calculateInsights(event.userId);
    }

    @OnEvent('user.onboardingCompleted')
    async handleUserOnboardingCompleted(event: { userId: string }) {
        this.logger.log(`User onboarding completed: ${event.userId}`);
        await this.insightService.calculateInsights(event.userId);
    }

    @OnEvent('portfolio.ecas.uploaded')
    async handlePortfolioEcasUploaded(event: { userId: string }) {
        this.logger.log(`Portfolio eCAS uploaded: ${event.userId}`);
        await this.insightService.calculateInsights(event.userId);
    }
}
