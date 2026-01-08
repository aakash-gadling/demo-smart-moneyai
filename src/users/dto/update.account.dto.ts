
export class UpdateAccountDto {
    accountName?: string;
    institutionName?: string;
    accountType?: 'savings' | 'current' | 'credit_card' | 'wallet';

    currentBalance?: number;
    isActive?: boolean;
    isPrimary?: boolean;
}
