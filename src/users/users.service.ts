import { Injectable, UnauthorizedException, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto';
import { LocalPortfolio } from 'src/common/interfaces/LocalPortfolio';
import { Decimal } from '@prisma/client/runtime/library';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UpdateProfileDto } from './domain/user/update-profile';
import { UpdatePortfolioDto } from './domain/portfolio/update-portfolio';

@Injectable()
export class UsersService {

    private readonly logger = new Logger(UsersService.name);
    private readonly jwtSecret: string;

    constructor(
        private prisma: PrismaService,
        private config: ConfigService,
        private readonly eventEmitter: EventEmitter2
    ) {
        this.jwtSecret = this.config.get<string>('JWT_SECRET') || 'fallback-secret';

    }
    async register(dto: RegisterDto) {
        const existing = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (existing) {
            throw new BadRequestException('Email already registered');
        }

        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                phone: dto.phone,
                profile: {
                    create: { name: dto.name },
                },
                portfolio: {
                    create: {},
                },
            },
            include: { profile: true, portfolio: true },
        });

        const token = this.generateToken(user.id);

        this.logger.log(`User registered: ${user.email}`);

        return {
            user: {
                id: user.id,
                email: user.email,
                profile: user.profile,
            },
            token,
        };
    }

    async signupWithPhone(dto: { name: string; phone: string; email: string }) {
        // Check if user already exists
        const existingUser = await this.prisma.user.findFirst({
            where: {
                OR: [{ email: dto.email }, { phone: dto.phone }],
            },
        });

        if (existingUser) {
            // If user exists, check if it's a placeholder account (created via OTP)
            // If so, update with the provided details
            if (existingUser.email!!.endsWith('@phone.user') && dto.email !== existingUser.email) {
                this.logger.log(`Updating placeholder user ${existingUser.id} with real details`);

                // Update email
                await this.prisma.user.update({
                    where: { id: existingUser.id },
                    data: { email: dto.email },
                });

                // Update profile name
                await this.prisma.userProfile.update({
                    where: { userId: existingUser.id },
                    data: { name: dto.name },
                });
            }

            // Return the updated user
            const token = this.generateToken(existingUser.id);
            const user = await this.prisma.user.findUnique({
                where: { id: existingUser.id },
                include: { profile: true },
            });

            return {
                user: {
                    id: user!.id,
                    email: user!.email,
                    phone: user!.phone,
                    profile: user!.profile,
                    hasEcasData: user!.profile?.hasEcasData || false,
                },
                token,
                isNewUser: false,
            };
        }

        // Create new user
        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                phone: dto.phone,
                profile: {
                    create: { name: dto.name },
                },
                portfolio: {
                    create: {},
                },
            },
            include: { profile: true },
        });

        this.logger.log(`New user created via signup: ${dto.email}`);
        const token = this.generateToken(user.id);

        return {
            user: {
                id: user.id,
                email: user.email,
                phone: user.phone,
                profile: user.profile,
                hasEcasData: user.profile?.hasEcasData || false,
            },
            token,
            isNewUser: true,
        };
    }

    async getProfile(userId: string) {
        const profile = await this.prisma.userProfile.findUnique({
            where: { userId },
        });

        if (!profile) {
            throw new NotFoundException('Profile not found');
        }

        return profile;
    }

    async updateProfile(userId: string, dto: UpdateProfileDto) {
        try {
            this.logger.log(`Updating profile for user: ${userId}`);
            const profile = await this.prisma.userProfile.upsert({
                where: { userId },
                create: {
                    userId,
                    name: dto.name || 'User',
                    ...this.buildProfileData(dto),
                },
                update: this.buildProfileData(dto),
            });

            this.logger.log(`Profile updated for user: ${userId}`);
            // Emit event to trigger insights recalculation
            this.logger.log('About to emit user.updated');
            this.eventEmitter.emit('user.updated', {
                userId,
                changedFields: Object.keys(dto),
            });
            this.logger.log('Emit done');

            return profile;
        } catch (error) {
            this.logger.error(`Failed to update profile for user: ${userId}`, error);
            throw error;
        }
    }

    async getPortfolio(userId: string): Promise<LocalPortfolio> {
        const portfolio = await this.prisma.portfolio.findUnique({
            where: { userId },
            include: {
                mutualFunds: true,
                stocks: true,
            },
        });

        if (!portfolio) {
            throw new NotFoundException('Portfolio not found');
        }

        return {
            id: portfolio.id,
            userId: portfolio.userId,

            totalValue: this.decimalToNumber(portfolio.totalValue),
            totalInvested: this.decimalToNumber(portfolio.totalInvested),

            fixedDeposits: this.decimalToNumber(portfolio.fixedDeposits),
            epf: this.decimalToNumber(portfolio.epf),
            ppf: this.decimalToNumber(portfolio.ppf),
            nps: this.decimalToNumber(portfolio.nps),

            cash: this.decimalToNumber(portfolio.cash),
            gold: this.decimalToNumber(portfolio.gold),
            realEstate: this.decimalToNumber(portfolio.realEstate),

            mutualFunds: portfolio.mutualFunds.map(mf => ({
                id: mf.id,
                schemeName: mf.schemeName,
                isin: mf.isin ?? '',
                amc: mf.amc ?? '',
                folioNumber: mf.folioNumber ?? '',
                category: mf.category ?? 'Other',

                units: this.decimalToNumber(mf.units),
                nav: this.decimalToNumber(mf.nav),
                currentValue: this.decimalToNumber(mf.currentValue),
                investedValue: this.decimalToNumber(mf.investedValue),

                gain: {
                    absolute: this.decimalToNumber(mf.gainAbsolute),
                    percentage: this.decimalToNumber(mf.gainPercentage),
                },

                type: (mf.fundType as any) ?? 'EQUITY',
            })),

            stocks: portfolio.stocks.map(s => ({
                symbol: s.symbol,
                quantity: s.quantity,

                averagePrice: this.decimalToNumber(s.averagePrice),
                investedValue: this.decimalToNumber(s.investedValue),
                currentValue: this.decimalToNumber(s.currentValue),

                currentPrice: this.decimalToNumber(s.currentPrice),
            })),
        };
    }


    decimalToNumber(value: Decimal | number | null | undefined): number {
        if (value === null || value === undefined) return 0;
        if (typeof value === 'number') return value;
        return value.toNumber();
    }

    async updatePortfolio(userId: string, dto: UpdatePortfolioDto) {
        const { mutualFunds, stocks, ...portfolioData } = dto;

        const portfolio = await this.prisma.portfolio.upsert({
            where: { userId },
            create: { userId, ...portfolioData },
            update: portfolioData,
        });

        // Handle mutual funds if provided
        if (mutualFunds && mutualFunds.length > 0) {
            await this.prisma.mutualFundHolding.deleteMany({
                where: { portfolioId: portfolio.id },
            });

            await this.prisma.mutualFundHolding.createMany({
                data: mutualFunds.map(({ id, ...mf }) => ({
                    portfolioId: portfolio.id,
                    ...mf,
                })),
            });
        }

        // Handle stocks if provided
        if (stocks && stocks.length > 0) {
            await this.prisma.stockHolding.deleteMany({
                where: { portfolioId: portfolio.id },
            });

            await this.prisma.stockHolding.createMany({
                data: stocks.map(({ id, ...s }) => ({
                    portfolioId: portfolio.id,
                    ...s,
                })),
            });
        }

        this.logger.log('About to emit portfolio.uploaded');
        this.eventEmitter.emit('portfolio.ecas.uploaded', {
            userId,
        });
        this.logger.log('Emit done');

        return this.getPortfolio(userId);
    }

    async getOnboardingStatus(userId: string) {
        const profile = await this.prisma.userProfile.findUnique({
            where: { userId },
        });

        return {
            onboardingCompleted: profile?.onboardingCompleted || false,
            hasEcasData: profile?.hasEcasData || false,
        };
    }

    async completeOnboarding(userId: string) {
        await this.prisma.userProfile.update({
            where: { userId },
            data: { onboardingCompleted: true },
        });
        this.eventEmitter.emit('user.onboardingCompleted', {
            userId,
        });
        return { success: true };
    }

    async verifyToken(token: string) {
        try {
            const decoded = jwt.verify(token, this.jwtSecret) as { userId: string };
            const user = await this.prisma.user.findUnique({
                where: { id: decoded.userId },
                include: { profile: true },
            });

            if (!user) {
                throw new UnauthorizedException('User not found');
            }

            return {
                id: user.id,
                email: user.email,
                profile: user.profile,
            };
        } catch {
            throw new UnauthorizedException('Invalid token');
        }
    }

    private generateToken(userId: string): string {
        return jwt.sign({ userId }, this.jwtSecret, { expiresIn: '7d' });
    }

    private buildProfileData(dto: UpdateProfileDto) {
        return {
            ...(dto.name && { name: dto.name }),
            ...(dto.dateOfBirth && { dateOfBirth: new Date(dto.dateOfBirth) }),
            ...(dto.age !== undefined && { age: dto.age }),
            ...(dto.occupation && { occupation: dto.occupation }),
            ...(dto.monthlyIncome !== undefined && { monthlyIncome: dto.monthlyIncome }),
            ...(dto.monthlyExpenses !== undefined && { monthlyExpenses: dto.monthlyExpenses }),
            ...(dto.dependents !== undefined && { dependents: dto.dependents }),
            ...(dto.riskProfile && { riskProfile: dto.riskProfile }),
            ...(dto.investmentExperience && { investmentExperience: dto.investmentExperience }),
            ...(dto.retirementAge !== undefined && { retirementAge: dto.retirementAge }),
            ...(dto.retirementTargetAmount !== undefined && { retirementTargetAmount: dto.retirementTargetAmount }),
            ...(dto.liabilities && { liabilities: dto.liabilities }),
            ...(dto.insurance && { insurance: dto.insurance }),
        };
    }

    async updateField(userId: string, field: string, value: any) {
        // Find or create profile
        let profile = await this.prisma.userProfile.findUnique({
            where: { userId },
        });

        if (!profile) {
            profile = await this.prisma.userProfile.create({
                data: { userId, name: '' },
            });
        }

        // Build update data dynamically
        const updateData: Record<string, any> = {};

        // Handle special field mappings
        if (field === 'dateOfBirth') {
            updateData[field] = new Date(value);
        } else {
            updateData[field] = value;
        }

        // Update the profile
        const updatedProfile = await this.prisma.userProfile.update({
            where: { userId },
            data: updateData,
        });

        // Calculate onboarding status
        const requiredFields = ['name', 'age', 'monthlyIncome', 'monthlyExpenses', 'riskProfile'];
        const completedFields = requiredFields.filter(f => (updatedProfile as any)[f] !== null && (updatedProfile as any)[f] !== undefined);
        const completionPercentage = Math.round((completedFields.length / requiredFields.length) * 100);
        const isComplete = completionPercentage === 100;

        // Determine next field
        const missingFields = requiredFields.filter(f => !(updatedProfile as any)[f]);
        const nextField = missingFields.length > 0 ? { name: missingFields[0] } : null;

        return {
            success: true,
            field,
            value,
            onboardingStatus: {
                isComplete,
                completionPercentage,
                nextField,
            },
        };
    }

    async getInsights(userId: string) {
        return this.prisma.insight.findMany({
            where: { userId },
            orderBy: { updatedAt: 'desc' },
        });
    }
}
