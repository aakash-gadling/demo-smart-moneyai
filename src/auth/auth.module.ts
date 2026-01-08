import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { OtpService } from './otp.service';
import { TokenService } from './token.service';
import { HttpClientService } from 'src/common/http/http-client.service';


@Module({
    imports: [
        ConfigModule,
        PassportModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET') || 'change_this_in_prod',
                signOptions: { expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '1h' },
            }),
            inject: [ConfigService],
        }),
    ],
    providers: [AuthService, JwtStrategy, OtpService, TokenService, HttpClientService],
    controllers: [AuthController],
    exports: [AuthService],
})
export class AuthModule { }