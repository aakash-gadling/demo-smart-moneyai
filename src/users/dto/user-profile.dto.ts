export class UserProfileDto {

    name: string;
    dateOfBirth?: Date;
    age?: number;
    occupation?: string;

    monthlyIncome?: number;
    monthlyExpenses?: number;
    dependents?: number;

    riskProfile?: 'conservative' | 'moderate' | 'aggressive';
    investmentExperience?: 'beginner' | 'intermediate' | 'expert';

    retirementAge?: number;
    retirementTargetAmount?: number;

    liabilities?: {
        homeLoan?: number;
        carLoan?: number;
        creditCard?: number;
        personalLoan?: number;
        otherEMI?: number;
    };

    insurance?: {
        termCover?: number;
        healthCover?: number;
        criticalIllness?: number;
    };
}
