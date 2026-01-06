import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { OtpService } from './otp.service';
import { TokenService } from './token.service';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from 'src/prisma/prisma.service';
import { HttpClientService } from 'src/common/http/http-client.service';
import { normalizePhone } from 'src/common/phone.util';


@Injectable()
export class AuthService {
    constructor(private jwtService: JwtService, private otpService: OtpService,
        private tokenService: TokenService, private prisma: PrismaService, private httpService: HttpClientService) { }


    async validateUser(email: string, pass: string) {
        // Dummy authentication
        if (email === 'admin@example.com' && pass === 'admin123') {
            return { id: 1, email: 'admin@example.com', role: 'admin' };
        }
        return null;
    }

    async requestOtp(phone: string) {
        try {
            const normalizedPhone = normalizePhone(phone);

            // Rate limit (simplified)
            const existingOtp = await this.prisma.phoneOtp.findFirst({
                where: {
                    phone: normalizedPhone,
                    used: false,
                    expiresAt: { gt: new Date() },
                },
            });

            if (existingOtp) {
                // Reuse OTP (avoid spam)
                return { message: 'OTP already sent. Please check your phone or wait for expiry.' };
            }

            const otp = await this.otpService.generateOtp();
            const otpHash = await this.otpService.hashOtp(otp);

            await this.prisma.phoneOtp.create({
                data: {
                    phone: normalizedPhone,
                    otpHash,
                    expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 min
                },
            });

            // TODO - Replace with Notification service
            // Send OTP via Notification service
            // await this.httpService.post('http://localhost:8080/api/v1/otp/generate', { phone: normalizedPhone, otp });
            return {
                message: 'OTP sent if phone number is valid',
                otp: otp,
            }
        } catch (error) {
            console.log(error);
            throw error;
        }
    }
    async login(user: any) {
        const payload = { sub: user.id, email: user.email };
        return {
            access_token: this.jwtService.sign(payload),
        };
    }

    async verifyOtp(phone: string, otp: string) {

        const normalizedPhone = normalizePhone(phone);

        const otpRecord = await this.prisma.phoneOtp.findFirst({
            where: {
                phone: normalizedPhone,
                used: false,
                expiresAt: { gt: new Date() },
            },
        });

        if (!otpRecord) {
            throw new UnauthorizedException('Invalid or expired OTP');
        }

        if (otpRecord.attempts >= 5) {
            throw new UnauthorizedException('Too many attempts');
        }

        // Dev bypass: 123456 always works in development
        const isDev = process.env.NODE_ENV !== 'production';
        const isDevOtp = otp === '123456' && isDev;

        const isValid = isDevOtp || await this.otpService.verifyOtp(
            otp,
            otpRecord.otpHash,
        );

        if (!isValid) {
            await this.prisma.phoneOtp.update({
                where: { id: otpRecord.id },
                data: { attempts: { increment: 1 } },
            });
            throw new UnauthorizedException('Invalid OTP');
        }

        // Mark OTP as used
        await this.prisma.phoneOtp.update({
            where: { id: otpRecord.id },
            data: { used: true },
        });

        // User logic starts HERE
        let user = await this.prisma.user.findUnique({
            where: { phone: normalizedPhone },
            include: { profile: true },
        });

        let isNewUser = false;

        if (!user) {
            user = await this.prisma.user.create({
                data: {
                    phone: normalizedPhone,
                    isVerified: true,
                    // Create dummy email
                    email: `user_${normalizedPhone.replace(/\+/g, '')}@smartmoney.app`,
                },
                include: { profile: true },
            });
            isNewUser = true;
        }

        await this.prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });

        const tokens = await this.tokenService.generateTokens(user.id);

        return {
            ...tokens,
            user: {
                id: user.id,
                phone: user.phone,
                profile: user.profile,
                hasEcasData: user.profile?.hasEcasData || false,
                isNewUser,
            },
        };
    }

    async requestEmailOtp(email: string) {
        try {
            // Rate limit (simplified)
            const existingOtp = await this.prisma.emailOtp.findFirst({
                where: {
                    email: email,
                    used: false,
                    expiresAt: { gt: new Date() },
                },
            });

            if (existingOtp) {
                return { message: 'OTP already sent. Please check your email or wait for expiry.' };
            }

            const otp = await this.otpService.generateOtp();
            const otpHash = await this.otpService.hashOtp(otp);

            await this.prisma.emailOtp.create({
                data: {
                    email: email,
                    otpHash,
                    expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 min
                },
            });

            // TODO: Send via Email Provider
            console.log(`[DEV] Email OTP for ${email}: ${otp}`);

            return {
                message: 'OTP sent if email is valid',
                otp: otp, // Return in dev response for ease
            }
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    async verifyEmailOtp(email: string, otp: string) {
        const otpRecord = await this.prisma.emailOtp.findFirst({
            where: {
                email: email,
                used: false,
                expiresAt: { gt: new Date() },
            },
        });

        if (!otpRecord) {
            throw new UnauthorizedException('Invalid or expired OTP');
        }

        if (otpRecord.attempts >= 5) {
            throw new UnauthorizedException('Too many attempts');
        }

        const isDev = process.env.NODE_ENV !== 'production';
        const isDevOtp = otp === '123456' && isDev;

        const isValid = isDevOtp || await this.otpService.verifyOtp(otp, otpRecord.otpHash);

        if (!isValid) {
            await this.prisma.emailOtp.update({
                where: { id: otpRecord.id },
                data: { attempts: { increment: 1 } },
            });
            throw new UnauthorizedException('Invalid OTP');
        }

        await this.prisma.emailOtp.update({
            where: { id: otpRecord.id },
            data: { used: true },
        });

        let user = await this.prisma.user.findUnique({
            where: { email: email },
            include: { profile: true },
        });

        let isNewUser = false;

        if (!user) {
            user = await this.prisma.user.create({
                data: {
                    email: email,
                    isVerified: true,
                    // No phone initially
                },
                include: { profile: true },
            });
            isNewUser = true;

            // Create empty profile
            await this.prisma.userProfile.create({
                data: {
                    userId: user.id,
                    name: 'New User',
                }
            });
            // Re-fetch to get the profile
            user = await this.prisma.user.findUnique({
                where: { id: user.id },
                include: { profile: true },
            }) as any;
        }

        await this.prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });

        const tokens = await this.tokenService.generateTokens(user.id);

        return {
            ...tokens,
            user: {
                id: user.id,
                email: user.email,
                profile: user.profile,
                hasEcasData: user.profile?.hasEcasData || false,
                isNewUser,
            },
        };
    }

    async refresh(refreshToken: string) {
        const payload = this.jwtService.verify(refreshToken);

        const user = await this.prisma.user.findUnique({
            where: { id: payload.sub },
        });

        if (!user || !user.refreshTokenHash) {
            throw new UnauthorizedException();
        }

        const valid = await bcrypt.compare(
            refreshToken,
            user.refreshTokenHash,
        );

        if (!valid) throw new UnauthorizedException();

        return this.tokenService.generateTokens(user.id);
    }


}