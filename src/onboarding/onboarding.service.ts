import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OnboardingQuestion, UserProfile } from '../../prisma/generated/client';

@Injectable()
export class OnboardingService {
    constructor(private prisma: PrismaService) { }

    async getQuestions(userId: string) {
        // We could filter questions based on user state if needed
        // For now, return all active questions sorted by order
        return this.prisma.onboardingQuestion.findMany({
            where: { isActive: true },
            orderBy: { order: 'asc' },
        });
    }

    async submitAnswer(userId: string, questionId: string, value: any) {
        const question = await this.prisma.onboardingQuestion.findUnique({
            where: { id: questionId },
        });

        if (!question) {
            throw new NotFoundException('Question not found');
        }

        const { fieldMapping, type } = question;

        // Fetch current profile
        const profile = await this.prisma.userProfile.findUnique({
            where: { userId },
        });

        if (!profile) {
            // Should create profile if not exists? Usually created at auth.
            throw new NotFoundException('User profile not found');
        }

        // Prepare update data
        const updateData: any = {};

        // Helper to parse numeric value
        const parseNumber = (val: any) => parseFloat(String(val).replace(/[^0-9.]/g, '')) || 0;

        if (fieldMapping.startsWith('liabilities.')) {
            const field = fieldMapping.split('.')[1];
            const currentLiabilities = (profile.liabilities as any) || {};
            updateData.liabilities = { ...currentLiabilities, [field]: value };
        } else if (fieldMapping.startsWith('assets.')) {
            const field = fieldMapping.split('.')[1];
            const currentAssets = (profile.assets as any) || {};
            updateData.assets = { ...currentAssets, [field]: value };
        } else if (fieldMapping.startsWith('insurance.')) {
            const field = fieldMapping.split('.')[1];
            const currentInsurance = (profile.insurance as any) || {};
            updateData.insurance = { ...currentInsurance, [field]: value };
        } else {
            // Direct field mapping
            // Handle type conversions
            if (type === 'slider' || type === 'currency' || type === 'input') {
                // If the field expects a number/decimal in schema
                if (['age', 'children', 'monthlyIncome', 'monthlyExpenses', 'monthlySipAmount', 'retirementAge', 'retirementTargetAmount'].includes(fieldMapping)) {
                    updateData[fieldMapping] = parseNumber(value);
                } else {
                    updateData[fieldMapping] = value;
                }
            } else {
                updateData[fieldMapping] = value;
            }
        }

        // Update profile
        await this.prisma.userProfile.update({
            where: { userId },
            data: updateData,
        });

        return { success: true };
    }

    async markComplete(userId: string) {
        await this.prisma.userProfile.update({
            where: { userId },
            data: { onboardingCompleted: true }
        });
        return { success: true };
    }
}
