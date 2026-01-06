import { Module } from '@nestjs/common';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';
import { InsightListener } from './insight.listener';
import { InsightService } from './insight.service';
import { UsersModule } from 'src/users/users.module';

@Module({
    controllers: [FinanceController],
    imports: [UsersModule],
    providers: [FinanceService, InsightListener, InsightService],
    exports: [FinanceService],
})
export class FinanceModule { }
