import { Controller, Post, UseInterceptors, UploadedFile, Body, UseGuards, Req, BadRequestException, Logger } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { PortfolioService } from './portfolio.service';

@Controller('portfolio')
@UseGuards(AuthGuard('jwt'))
export class PortfolioController {
    private readonly logger = new Logger(PortfolioController.name);

    constructor(private readonly portfolioService: PortfolioService) { }

    @Post('upload-ecas')
    @UseInterceptors(FileInterceptor('file'))
    async uploadEcas(
        @Req() req,
        @UploadedFile() file: Express.Multer.File,
        @Body('password') password?: string
    ) {
        this.logger.log(`Received eCAS upload request. User ID: ${req.user.userId}`);

        if (!file) {
            this.logger.error('No file uploaded in request');
            throw new BadRequestException('No file uploaded');
        }

        this.logger.log(`File received: ${file.originalname} (Size: ${file.size} bytes, Type: ${file.mimetype})`);
        this.logger.log(`Password proivded: ${password ? 'YES' : 'NO'}`);

        try {
            const result = await this.portfolioService.uploadAndParseEcas(
                req.user.userId,
                file.buffer,
                password
            );
            this.logger.log(`eCAS upload completed successfully for user ${req.user.userId}`);
            return result;
        } catch (error) {
            this.logger.error(`Error processing eCAS upload: ${error.message}`, error.stack);
            throw error;
        }
    }
}
