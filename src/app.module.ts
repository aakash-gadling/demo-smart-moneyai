import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { FinanceModule } from './finance/finance.module';
import { GoalsModule } from './goals/goals.module';
import { HealthController } from './health.controller';
import { AuthModule } from './auth/auth.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { OnboardingModule } from './onboarding/onboarding.module';
import { PortfolioModule } from './portfolio/portfolio.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ['.env', '../../.env'],
        }),
        EventEmitterModule.forRoot(),
        PrismaModule,
        UsersModule,
        FinanceModule,
        GoalsModule,
        AuthModule,
        OnboardingModule,
        PortfolioModule
    ],
    controllers: [HealthController],
})
export class AppModule { }
