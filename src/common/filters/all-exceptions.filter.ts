import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';


@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    constructor() { }
    private readonly logger = new Logger(AllExceptionsFilter.name);


    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();


        const status =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;


        const message = exception instanceof HttpException ? exception.getResponse() : exception;


        // Log with stack if available
        if (exception instanceof Error) {
            this.logger.error((exception as Error).message, (exception as Error).stack);
        } else {
            this.logger.error('UnknownException', JSON.stringify(exception));
        }


        response.status(status).json({
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            error: message,
        });
    }
}