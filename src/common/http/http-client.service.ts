import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosRequestConfig } from 'axios';

@Injectable()
export class HttpClientService {

  private readonly logger = new Logger(HttpClientService.name);

  async post(url: string, body: any, config?: AxiosRequestConfig) {
    this.logger.log(`Post: ${url}`);
    this.logger.debug(`Payload: ${JSON.stringify(body)}`);

    try {
      const response = await axios.post(url, body, config);
      this.logger.log(`Post Success → ${url}`);
      return response.data;
    } catch (err: any) {
      this.logger.error(`Post Failed: ${url}`);
      this.logger.error(err?.response?.data || err.message);
      throw err;
    }
  }
}
