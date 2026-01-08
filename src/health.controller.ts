import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class HealthController {
    constructor(private prisma: PrismaService) { }

    @Get('health')
    async health() {
        let dbStatus = 'disconnected';
        try {
            await this.prisma.$queryRaw`SELECT 1`;
            dbStatus = 'connected';
        } catch {
            dbStatus = 'error';
        }

        return {
            status: 'ok',
            service: 'core-service',
            database: dbStatus,
            modules: ['users', 'finance', 'goals'],
            timestamp: new Date().toISOString(),
        };
    }
}
