import { Module } from '@nestjs/common';
import { PortfolioController } from './portfolio.controller';
import { PortfolioService } from './portfolio.service';
import { CasParserAdapter } from './adapters/casparser.adapter';
import { PrismaService } from '../prisma/prisma.service';

@Module({
    controllers: [PortfolioController],
    providers: [
        PortfolioService,
        CasParserAdapter,
        PrismaService
    ],
})
export class PortfolioModule { }
