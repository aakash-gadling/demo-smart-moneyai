import { Controller, Post, Get, Body, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('/auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly prisma: PrismaService
    ) { }

    @Post('/send-otp')
    async sendOtp(@Body() dto: { phone: string }) {
        const response = await this.authService.requestOtp(dto.phone);
        console.log(response);
        return response;
    }

    @Post('/verify-otp')
    async verifyOtp(@Body() dto: { phone: string; otp: string }) {
        return this.authService.verifyOtp(dto.phone, dto.otp);
    }

    @Post('/request-email-otp')
    async requestEmailOtp(@Body() dto: { email: string }) {
        const response = await this.authService.requestEmailOtp(dto.email);
        console.log(response);
        return response;
    }

    @Post('/verify-email-otp')
    async verifyEmailOtp(@Body() dto: { email: string; otp: string }) {
        return this.authService.verifyEmailOtp(dto.email, dto.otp);
    }

    @Post('refresh')
    async refresh(@Body() dto: { refreshToken: string }) {
        return this.authService.refresh(dto.refreshToken);
    }

    @Get('/me')
    @UseGuards(AuthGuard('jwt'))
    async getCurrentUser(@Req() req) {
        const userId = req.user.userId;

        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                profile: true,
            }
        });

        if (!user) {
            return null;
        }

        return {
            id: user.id,
            email: user.email,
            phone: user.phone,
            profile: user.profile ? {
                id: user.profile.id,
                name: user.profile.name,
                age: user.profile.age,
                monthlyIncome: user.profile.monthlyIncome,
                monthlyExpenses: user.profile.monthlyExpenses,
                riskProfile: user.profile.riskProfile,
                onboardingCompleted: user.profile.onboardingCompleted || false,
                hasEcasData: false, // TODO: implement with actual eCAS model
            } : null,
            hasEcasData: false,
        };
    }
}