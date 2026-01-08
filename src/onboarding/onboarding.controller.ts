import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('onboarding')
@UseGuards(AuthGuard('jwt'))
export class OnboardingController {
    constructor(private readonly onboardingService: OnboardingService) { }

    @Get('questions')
    async getQuestions(@Req() req) {
        return this.onboardingService.getQuestions(req.user.userId);
    }

    @Post('answer')
    async answerQuestion(@Req() req, @Body() body: { questionId: string; value: any }) {
        return this.onboardingService.submitAnswer(req.user.userId, body.questionId, body.value);
    }

    @Post('complete')
    async completeOnboarding(@Req() req) {
        return this.onboardingService.markComplete(req.user.userId);
    }
}
