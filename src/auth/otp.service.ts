import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class OtpService {
    async generateOtp(): Promise<string> {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    async hashOtp(otp: string): Promise<string> {
        return bcrypt.hash(otp, 10);
    }

    async verifyOtp(otp: string, hash: string): Promise<boolean> {
        return bcrypt.compare(otp, hash);
    }
}
