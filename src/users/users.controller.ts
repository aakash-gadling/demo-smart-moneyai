import {
    Controller,
    Get,
    Post,
    Put,
    Patch,
    Body,
    Param,
    Headers,
    UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import {
    SignupDto,
    UpdateFieldDto,
} from './dto';
import { UpdateProfileDto } from './domain/user/update-profile';
import { UpdatePortfolioDto } from './domain/portfolio/update-portfolio';

@Controller()
export class UsersController {

    constructor(private readonly usersService: UsersService) { }

    /* -------------------------------------------------------------------------- */
    /*                              AUTH ROUTES                                    */
    /* -------------------------------------------------------------------------- */

    @Post('users/onboarding/profile/:userId')
    register(@Param('userId') userId: string, @Body() dto: UpdateProfileDto) {
        return { userId, dto }; //TODO
    }

    @Post('auth/signup')
    async signup(@Body() dto: SignupDto) {
        // Create user with name, phone, email
        return this.usersService.signupWithPhone(dto);
    }

    // Note: /auth/me is now handled by AuthController with proper JWT guard

    /* -------------------------------------------------------------------------- */
    /*                              PROFILE ROUTES                                 */
    /* -------------------------------------------------------------------------- */

    @Get('profiles/:userId')
    getProfile(@Param('userId') userId: string) {
        return this.usersService.getProfile(userId);
    }

    @Put('profiles/:userId')
    updateProfile(@Param('userId') userId: string, @Body() dto: UpdateProfileDto) {
        return this.usersService.updateProfile(userId, dto);
    }

    @Patch('profiles/:userId/field')
    updateField(@Param('userId') userId: string, @Body() dto: UpdateFieldDto) {
        return this.usersService.updateField(userId, dto.field, dto.value);
    }

    /* -------------------------------------------------------------------------- */
    /*                              PORTFOLIO ROUTES                               */
    /* -------------------------------------------------------------------------- */

    @Get('portfolios/:userId')
    getPortfolio(@Param('userId') userId: string) {
        return this.usersService.getPortfolio(userId);
    }

    @Put('portfolios/:userId')
    updatePortfolio(@Param('userId') userId: string, @Body() dto: UpdatePortfolioDto) {
        return this.usersService.updatePortfolio(userId, dto);
    }

    /* -------------------------------------------------------------------------- */
    /*                              ONBOARDING ROUTES (Legacy)                    */
    /* -------------------------------------------------------------------------- */

    @Get('users/:userId/onboarding-status')
    getOnboardingStatus(@Param('userId') userId: string) {
        return this.usersService.getOnboardingStatus(userId);
    }

    @Post('users/:userId/onboarding-complete')
    completeOnboarding(@Param('userId') userId: string) {
        return this.usersService.completeOnboarding(userId);
    }

    /* -------------------------------------------------------------------------- */
    /*                              Insight ROUTES                              */
    /* -------------------------------------------------------------------------- */
    @Get('insights/:userId')
    getInsights(@Param('userId') userId: string) {
        return this.usersService.getInsights(userId);
    }


    /* -------------------------------------------------------------------------- */
    /*                              ECAS ROUTES (MOCK)                             */
    /* -------------------------------------------------------------------------- */

    @Post('ecas/upload')
    uploadEcas(@Body() body: any) {
        // Mock eCAS upload
        return {
            success: true,
            message: 'eCAS data processed successfully',
            portfolioValue: 1250000,
            fundsImported: 5,
        };
    }
}
