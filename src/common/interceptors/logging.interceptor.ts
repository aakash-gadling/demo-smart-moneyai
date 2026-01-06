import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { WinstonLogger } from '../logger/winston.logger';


@Injectable()
export class LoggingInterceptor implements NestInterceptor {

    constructor(private readonly logger: WinstonLogger) { }


    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const req = context.switchToHttp().getRequest();
        const method = req.method;
        const url = req.url;
        const now = Date.now();


        return next.handle().pipe(
            tap(() =>
                this.logger.debug(`${method} ${url} - ${Date.now() - now}ms`, {
                    method,
                    url,
                }),
            ),
        );
    }
}