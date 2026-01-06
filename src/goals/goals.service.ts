import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGoalDto, UpdateGoalDto, AddProgressDto } from './dto';

@Injectable()
export class GoalsService {
    private readonly logger = new Logger(GoalsService.name);

    constructor(private prisma: PrismaService) { }

    async findAllByUser(userId: string) {
        return this.prisma.goal.findMany({
            where: { userId },
            include: { progressHistory: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string) {
        const goal = await this.prisma.goal.findUnique({
            where: { id },
            include: { progressHistory: true },
        });

        if (!goal) {
            throw new NotFoundException('Goal not found');
        }

        return goal;
    }

    async create(dto: CreateGoalDto) {
        const goal = await this.prisma.goal.create({
            data: {
                userId: dto.userId,
                name: dto.name,
                category: dto.category,
                targetAmount: dto.targetAmount,
                currentAmount: dto.currentAmount || 0,
                deadline: new Date(dto.deadline),
                priority: dto.priority || 'medium',
            },
        });

        this.logger.log(`Goal created: ${goal.name} for user ${dto.userId}`);
        return goal;
    }

    async update(id: string, dto: UpdateGoalDto) {
        const goal = await this.prisma.goal.update({
            where: { id },
            data: {
                ...dto,
                deadline: dto.deadline ? new Date(dto.deadline) : undefined,
            },
        });

        return goal;
    }

    async remove(id: string) {
        await this.prisma.goal.delete({ where: { id } });
        return { deleted: true };
    }

    async addProgress(id: string, dto: AddProgressDto) {
        const goal = await this.prisma.goal.findUnique({ where: { id } });

        if (!goal) {
            throw new NotFoundException('Goal not found');
        }

        const currentProgress = Number(goal.currentAmount);
        const newAmount = currentProgress + dto.amount;
        const targetAmount = Number(goal.targetAmount);
        const progressPercent = (newAmount / targetAmount) * 100;

        await this.prisma.goalProgress.create({
            data: {
                goalId: id,
                amount: newAmount,
                change: dto.amount,
                changeType: 'contribution',
                progressPercent: Math.min(progressPercent, 100),
                source: 'manual',
                note: dto.note,
            },
        });

        const updatedGoal = await this.prisma.goal.update({
            where: { id },
            data: {
                currentAmount: newAmount,
                progressPercent: Math.min(progressPercent, 100),
                status: newAmount >= targetAmount ? 'completed' : goal.status,
            },
            include: { progressHistory: true },
        });

        const milestones = [
            { percentage: 25, label: 'Quarter Way', reached: progressPercent >= 25 },
            { percentage: 50, label: 'Halfway There', reached: progressPercent >= 50 },
            { percentage: 75, label: 'Almost Done', reached: progressPercent >= 75 },
            { percentage: 100, label: 'Goal Reached!', reached: progressPercent >= 100 },
        ];

        const previousProgress = (currentProgress / targetAmount) * 100;
        const newMilestones = milestones.filter(
            (m) => m.reached && previousProgress < m.percentage,
        );

        return {
            goal: updatedGoal,
            newMilestones,
            progress: progressPercent,
        };
    }

    async getStats(userId: string) {
        const goals = await this.prisma.goal.findMany({ where: { userId } });

        const stats = {
            total: goals.length,
            active: goals.filter((g) => g.status === 'active').length,
            completed: goals.filter((g) => g.status === 'completed').length,
            paused: goals.filter((g) => g.status === 'paused').length,
            totalTarget: goals.reduce((sum, g) => sum + Number(g.targetAmount), 0),
            totalSaved: goals.reduce((sum, g) => sum + Number(g.currentAmount), 0),
            overallProgress: 0,
        };

        if (stats.totalTarget > 0) {
            stats.overallProgress = (stats.totalSaved / stats.totalTarget) * 100;
        }

        return stats;
    }


    private autoGoalGenerations() {

    }

    private emergencyFund() {

    }

    private termInsuranceGoal() {

    }

    private retirementGoal() {

    }

    private childrenEducationGoal() {

    }

    private homeLoanGoal() {

    }
    private healthInsuranceGoal() {

    }

    private wealthManagementGoal() {

    }
}
