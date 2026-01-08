-- CreateEnum
CREATE TYPE "OnboardingStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'COMPLETE');

-- CreateTable
CREATE TABLE "phone_otps" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "otp_hash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verified_at" TIMESTAMP(3),

    CONSTRAINT "phone_otps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "refresh_token_hash" TEXT,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_onboarding_states" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "profile_completed" BOOLEAN NOT NULL DEFAULT false,
    "accounts_completed" BOOLEAN NOT NULL DEFAULT false,
    "portfolio_completed" BOOLEAN NOT NULL DEFAULT false,
    "onboarding_status" "OnboardingStatus" NOT NULL DEFAULT 'NEW',
    "last_updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_onboarding_states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date_of_birth" TIMESTAMP(3),
    "age" INTEGER,
    "occupation" TEXT,
    "monthly_income" DECIMAL(15,2),
    "monthly_expenses" DECIMAL(15,2),
    "dependents" INTEGER NOT NULL DEFAULT 0,
    "risk_profile" TEXT,
    "investment_experience" TEXT,
    "retirement_age" INTEGER,
    "retirement_target_amount" DECIMAL(15,2),
    "liabilities" JSONB,
    "insurance" JSONB,
    "onboarding_completed" BOOLEAN NOT NULL DEFAULT false,
    "has_ecas_data" BOOLEAN NOT NULL DEFAULT false,
    "marital_status" TEXT,
    "children" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "onboarding_questions" (
    "id" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "field_mapping" TEXT NOT NULL,
    "options" JSONB,
    "min" DOUBLE PRECISION,
    "max" DOUBLE PRECISION,
    "step" DOUBLE PRECISION,
    "unit" TEXT,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "onboarding_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "account_name" TEXT NOT NULL,
    "institution_name" TEXT NOT NULL,
    "account_type" TEXT NOT NULL,
    "current_balance" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "aggregator_id" TEXT,
    "last_synced_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "account_id" TEXT,
    "amount" DECIMAL(15,2) NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subcategory" TEXT,
    "merchant_name" TEXT,
    "description" TEXT,
    "is_recurring" BOOLEAN NOT NULL DEFAULT false,
    "transaction_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budgets" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "budget_amount" DECIMAL(15,2) NOT NULL,
    "spent_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "period" TEXT NOT NULL DEFAULT 'monthly',
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "alert_threshold" INTEGER NOT NULL DEFAULT 80,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "budgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portfolios" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "total_value" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total_invested" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "fixed_deposits" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "epf" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "ppf" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "nps" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "cash" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "gold" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "real_estate" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "portfolios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mutual_fund_holdings" (
    "id" TEXT NOT NULL,
    "portfolio_id" TEXT NOT NULL,
    "scheme_name" TEXT NOT NULL,
    "isin" TEXT,
    "amc" TEXT,
    "folio_number" TEXT,
    "category" TEXT,
    "units" DECIMAL(15,4) NOT NULL DEFAULT 0,
    "nav" DECIMAL(15,4) NOT NULL DEFAULT 0,
    "current_value" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "invested_value" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "gain_absolute" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "gain_percentage" DECIMAL(8,4) NOT NULL DEFAULT 0,
    "fund_type" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mutual_fund_holdings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_holdings" (
    "id" TEXT NOT NULL,
    "portfolio_id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "company_name" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "average_price" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "current_price" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "invested_value" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "current_value" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "gain_absolute" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "gain_percentage" DECIMAL(8,4) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_holdings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sips" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fund_isin" TEXT,
    "fund_name" TEXT,
    "amount" DECIMAL(15,2) NOT NULL,
    "frequency" TEXT NOT NULL DEFAULT 'monthly',
    "day_of_month" INTEGER NOT NULL,
    "total_invested" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "installments_paid" INTEGER NOT NULL DEFAULT 0,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "next_date" TIMESTAMP(3) NOT NULL,
    "goal_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goals" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "image_url" TEXT,
    "category" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "target_amount" DECIMAL(15,2) NOT NULL,
    "current_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "deadline" TIMESTAMP(3) NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inflation_rate" DECIMAL(5,2) NOT NULL DEFAULT 6,
    "future_value" DECIMAL(15,2),
    "required_monthly" DECIMAL(15,2),
    "progress_percent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "linked_investments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "linked_sip_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "is_shared" BOOLEAN NOT NULL DEFAULT false,
    "shared_with" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goal_progress" (
    "id" TEXT NOT NULL,
    "goal_id" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "change" DECIMAL(15,2) NOT NULL,
    "change_type" TEXT NOT NULL,
    "progress_percent" DECIMAL(5,2) NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "transaction_id" TEXT,
    "note" TEXT,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "goal_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goal_milestones" (
    "id" TEXT NOT NULL,
    "goal_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "percentage" INTEGER NOT NULL,
    "target_amount" DECIMAL(15,2) NOT NULL,
    "reached" BOOLEAN NOT NULL DEFAULT false,
    "reached_at" TIMESTAMP(3),
    "celebration_shown" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "goal_milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goal_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "icon_url" TEXT,
    "default_amount" DECIMAL(15,2),
    "default_timeline_years" INTEGER,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goal_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "phone_otps_phone_idx" ON "phone_otps"("phone");

-- CreateIndex
CREATE INDEX "phone_otps_phone_expires_at_idx" ON "phone_otps"("phone", "expires_at");

-- CreateIndex
CREATE INDEX "phone_otps_expires_at_idx" ON "phone_otps"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_deleted_at_idx" ON "users"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "user_onboarding_states_user_id_key" ON "user_onboarding_states"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_user_id_key" ON "user_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "onboarding_questions_order_key" ON "onboarding_questions"("order");

-- CreateIndex
CREATE INDEX "accounts_user_id_idx" ON "accounts"("user_id");

-- CreateIndex
CREATE INDEX "transactions_user_id_transaction_date_idx" ON "transactions"("user_id", "transaction_date");

-- CreateIndex
CREATE INDEX "transactions_user_id_category_idx" ON "transactions"("user_id", "category");

-- CreateIndex
CREATE INDEX "budgets_user_id_is_active_idx" ON "budgets"("user_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "portfolios_user_id_key" ON "portfolios"("user_id");

-- CreateIndex
CREATE INDEX "mutual_fund_holdings_portfolio_id_idx" ON "mutual_fund_holdings"("portfolio_id");

-- CreateIndex
CREATE INDEX "mutual_fund_holdings_isin_idx" ON "mutual_fund_holdings"("isin");

-- CreateIndex
CREATE INDEX "stock_holdings_portfolio_id_idx" ON "stock_holdings"("portfolio_id");

-- CreateIndex
CREATE INDEX "stock_holdings_symbol_idx" ON "stock_holdings"("symbol");

-- CreateIndex
CREATE INDEX "sips_user_id_status_idx" ON "sips"("user_id", "status");

-- CreateIndex
CREATE INDEX "goals_user_id_status_idx" ON "goals"("user_id", "status");

-- CreateIndex
CREATE INDEX "goals_user_id_category_idx" ON "goals"("user_id", "category");

-- CreateIndex
CREATE INDEX "goals_deadline_idx" ON "goals"("deadline");

-- CreateIndex
CREATE INDEX "goal_progress_goal_id_recorded_at_idx" ON "goal_progress"("goal_id", "recorded_at");

-- CreateIndex
CREATE UNIQUE INDEX "goal_milestones_goal_id_percentage_key" ON "goal_milestones"("goal_id", "percentage");

-- AddForeignKey
ALTER TABLE "user_onboarding_states" ADD CONSTRAINT "user_onboarding_states_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolios" ADD CONSTRAINT "portfolios_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mutual_fund_holdings" ADD CONSTRAINT "mutual_fund_holdings_portfolio_id_fkey" FOREIGN KEY ("portfolio_id") REFERENCES "portfolios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_holdings" ADD CONSTRAINT "stock_holdings_portfolio_id_fkey" FOREIGN KEY ("portfolio_id") REFERENCES "portfolios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sips" ADD CONSTRAINT "sips_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goals" ADD CONSTRAINT "goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_progress" ADD CONSTRAINT "goal_progress_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_milestones" ADD CONSTRAINT "goal_milestones_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
