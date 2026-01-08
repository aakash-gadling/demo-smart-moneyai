import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { EvaluateOnboardingService } from './evaluate-onboarding/evaluate-onboarding.service';

@Module({
    controllers: [UsersController],
    providers: [UsersService, EvaluateOnboardingService],
    exports: [UsersService],
})
export class UsersModule { }
