
export class CreateAccountDto {
    accountName: string;
    institutionName: string;
    accountType: 'savings' | 'current' | 'credit_card' | 'wallet';

    currentBalance?: number;
    isPrimary?: boolean;
}