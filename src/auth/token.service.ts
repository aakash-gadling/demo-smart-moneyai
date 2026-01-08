import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TokenService {
    constructor(
        private jwt: JwtService,
        private prisma: PrismaService,
    ) { }

    async generateTokens(userId: string) {
        const payload = { sub: userId };

        const accessToken = this.jwt.sign(payload, {
            expiresIn: '15m',
        });

        const refreshToken = this.jwt.sign(payload, {
            expiresIn: '30d',
        });

        const refreshHash = await bcrypt.hash(refreshToken, 10);

        await this.prisma.user.update({
            where: { id: userId },
            data: { refreshTokenHash: refreshHash },
        });

        return { accessToken, refreshToken };
    }
}
