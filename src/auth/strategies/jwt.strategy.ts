import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';


@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private readonly configService: ConfigService) {
        const secret = configService.get<string>('JWT_SECRET') || 'change_this_in_prod';
        console.log(`[JwtStrategy] Using JWT_SECRET: ${secret.substring(0, 10)}...`);
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: secret,
        });
    }


    async validate(payload: any) {
        // Attach any info you want on request.user
        return { userId: payload.sub, email: payload.email };
    }
}