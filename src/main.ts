import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
    Logger.overrideLogger(['log', 'error', 'warn', 'debug', 'verbose']);

    const app = await NestFactory.create(AppModule, {
        logger: ['log', 'error', 'warn', 'debug', 'verbose'],
    });

    const logger = new Logger('Bootstrap');

    logger.log('Logger initialized');

    app.enableCors();
    app.setGlobalPrefix('api/v1');

    app.useGlobalPipes(
        new ValidationPipe({
            transform: true,
            whitelist: true,
            forbidNonWhitelisted: true,
        }),
    );

    const port = process.env.CORE_SERVICE_PORT || process.env.PORT || 3001;
    app.useGlobalFilters(new AllExceptionsFilter());

    await app.listen(port);

    logger.log(`Core Service running on port ${port}`);
    logger.log('Modules loaded: users, finance, goals');
}
bootstrap();
