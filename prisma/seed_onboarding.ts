import { PrismaClient } from './generated/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Start seeding onboarding questions...');

    // Clear existing questions to avoid duplicates/conflicts on re-seed
    await prisma.onboardingQuestion.deleteMany({});

    const questions = [
        {
            order: 1,
            text: "Let's start with your name",
            type: "input",
            fieldMapping: "name",
            description: "We'll use this to personalize your experience."
        },
        {
            order: 2,
            text: "How old are you?",
            type: "slider",
            fieldMapping: "age",
            min: 18,
            max: 100,
            step: 1,
            unit: "years"
        },
        {
            order: 3,
            text: "What is your marital status?",
            type: "choice",
            fieldMapping: "maritalStatus",
            options: ["Single", "Married", "Divorced", "Widowed"]
        },
        {
            order: 4,
            text: "Do you have children?",
            type: "counter", // Custom type for simple number increment
            fieldMapping: "children",
            description: "Number of dependent children",
            min: 0,
            max: 10
        },
        {
            order: 5,
            text: "What do you do?",
            type: "choice",
            fieldMapping: "occupation",
            options: ["Salaried", "Self-employed", "Business Owner", "Student", "Retired", "Homemaker"]
        },
        {
            order: 6,
            text: "Monthly Income (Take home)",
            type: "input", // currency input
            fieldMapping: "monthlyIncome",
            unit: "₹",
            description: "Approximate monthly earnings after tax"
        },
        {
            order: 7,
            text: "Monthly Expenses",
            type: "input",
            fieldMapping: "monthlyExpenses",
            unit: "₹",
            description: "Average monthly spending including rent/EMI"
        },
        {
            order: 8,
            text: "Total Loans & Liabilities",
            type: "input",
            fieldMapping: "liabilities.total",
            unit: "₹",
            description: "Personal loans, car loans, credit card debt, etc."
        },
        {
            order: 9,
            text: "Savings & FD Balance",
            type: "input",
            fieldMapping: "assets.savings",
            unit: "₹",
            description: "Money in savings accounts and fixed deposits"
        },
        {
            order: 10,
            text: "How would you describe your risk appetite?",
            type: "choice",
            fieldMapping: "riskProfile",
            options: ["Conservative", "Balanced", "Aggressive"],
            description: "Conservative: Capital protection first. Aggressive: High growth."
        },
        {
            order: 11,
            text: "Real Estate Value",
            type: "input",
            fieldMapping: "assets.realEstate",
            unit: "₹",
            description: "Current market value of properties you own (excluding primary home if you prefer)"
        },
        {
            order: 12,
            text: "Mutual Fund Portfolio",
            type: "input",
            fieldMapping: "assets.mutualFunds",
            unit: "₹",
            description: "Current total value of your mutual fund investments"
        },
        {
            order: 13,
            text: "Monthly SIP Amount",
            type: "input",
            fieldMapping: "monthlySipAmount",
            unit: "₹",
            description: "Total amount you invest in SIPs every month"
        },
        {
            order: 14,
            text: "Insurance Cover (Life & Health)",
            type: "input",
            fieldMapping: "insurance.totalCover",
            unit: "₹",
            description: "Total sum assured across all your insurance policies"
        }
    ];

    for (const q of questions) {
        await prisma.onboardingQuestion.create({
            data: q
        });
    }

    console.log(`Seeding finished. Created ${questions.length} questions.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
