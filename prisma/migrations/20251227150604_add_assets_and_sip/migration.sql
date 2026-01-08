-- AlterTable
ALTER TABLE "user_profiles" ADD COLUMN     "assets" JSONB,
ADD COLUMN     "monthly_sip_amount" DECIMAL(15,2);
