import { Injectable, Logger, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import axios from 'axios';
import * as FormData from 'form-data';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { IPortfolioParser, ParsedPortfolio, ParsedScheme, ParsedTransaction } from '../interfaces/portfolio-parser.interface';

@Injectable()
export class CasParserAdapter implements IPortfolioParser {
    private readonly logger = new Logger(CasParserAdapter.name);
    private readonly apiUrl: string;
    private readonly apiKey: string;

    constructor() {
        this.apiUrl = process.env.CASPARSER_API_URL || 'https://portfolio-parser.api.casparser.in';
        this.apiKey = process.env.ECAS_KEY || '';

        if (!this.apiKey) {
            this.logger.warn('ECAS_KEY is not set. CAS parsing will fail.');
        }
    }

    async parse(fileBuffer: Buffer, password?: string): Promise<ParsedPortfolio> {
        this.logger.log(`Starting CAS parsing. API URL: ${this.apiUrl}`);

        // Create a temp file to ensure robust file streaming
        const tempFilePath = path.join(os.tmpdir(), `cas-${Date.now()}.pdf`);
        fs.writeFileSync(tempFilePath, fileBuffer);
        this.logger.log(`Created temp file at ${tempFilePath}`);

        const formData = new FormData();
        // Read stream from file system - safest way for FormData in Node
        // Field name must be 'pdf_file' as per CAS Parser API docs
        formData.append('pdf_file', fs.createReadStream(tempFilePath));

        if (password) {
            formData.append('password', password);
        }

        try {
            const requestHeaders = {
                ...formData.getHeaders(),
                'x-api-key': this.apiKey,
                'Accept-Encoding': 'identity', // Prevent compression issues
                'User-Agent': 'curl/7.64.1',   // Mimic curl
            };

            this.logger.log(`Sending request with headers: ${JSON.stringify(requestHeaders)}`);

            const response = await axios.post(`${this.apiUrl}/v4/smart/parse`, formData, {
                headers: requestHeaders,
                maxBodyLength: Infinity,
                maxContentLength: Infinity,
                timeout: 120000,
            });

            this.logger.log('Received response from CAS Parser API');

            const data = response.data;
            // Handle both nested .data and direct response structures
            const payload = data?.data || data;

            if (payload?.schemes || payload?.investor_info) {
                this.logger.log(`Parsing successful. Found ${payload.schemes?.length || 0} schemes.`);
            } else {
                this.logger.warn(`Response received but data structure is unexpected. Keys: ${Object.keys(payload)}`);
            }

            // Clean up temp file
            this.cleanupTempFile(tempFilePath);

            return this.mapResponseToDomain(payload);

        } catch (error) {
            // Clean up temp file
            this.cleanupTempFile(tempFilePath);

            this.logger.error(`Parsing Logic Failed: ${error.message}`, error.stack);

            this.handleError(error);
            if (axios.isAxiosError(error) && error.response?.status === 400) {
                const msg = error.response.data?.msg || 'Invalid CAS File';
                throw new BadRequestException(`CAS Parser Failed: ${msg}`);
            }
            throw new InternalServerErrorException(`Failed to parse CAS file: ${error.message}`);
        }
    }

    private cleanupTempFile(filePath: string) {
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        } catch (e) {
            this.logger.warn(`Failed to cleanup temp file: ${filePath}`);
        }
    }

    private mapResponseToDomain(data: any): ParsedPortfolio {
        this.logger.log('Mapping CAS response to domain model...');

        // Handle variations in API response structure
        const investor = data.investor_info || data.investor || {};
        const period = data.statement_period || data.meta?.statement_period || {};

        let rawSchemes = [];
        if (data.schemes) {
            rawSchemes = data.schemes;
        } else if (data.mutual_funds) {
            // Check if mutual_funds is array of Folios or object with schemes
            if (Array.isArray(data.mutual_funds)) {
                // It's an array of Folios, each having a 'schemes' array
                // We need to extract all schemes and propagate AMC/Folio info
                rawSchemes = data.mutual_funds.flatMap((folio: any) =>
                    (folio.schemes || []).map((scheme: any) => ({
                        ...scheme,
                        amc: scheme.amc || folio.amc,
                        folio: scheme.folio || folio.folio_number
                    }))
                );
            } else if (data.mutual_funds.schemes && Array.isArray(data.mutual_funds.schemes)) {
                rawSchemes = data.mutual_funds.schemes;
            } else {
                this.logger.warn(`Unexpected mutual_funds structure: ${JSON.stringify(data.mutual_funds)}`);
            }
        }

        if (rawSchemes.length > 0) {
            this.logger.log(`Raw Sample Scheme: ${JSON.stringify(rawSchemes[0])}`);
        }

        const schemes: ParsedScheme[] = rawSchemes.map((s: any) => ({
            scheme: s.name || s.scheme, // handle both 'name' and 'scheme' keys
            isin: s.isin,
            amc: s.amc,
            folio: s.folio,
            advisor: s.advisor,
            type: s.type,
            open: parseFloat(s.open) || 0,
            close: parseFloat(s.close) || 0,
            valuation: {
                date: s.valuation?.date ? new Date(s.valuation.date) : new Date(), // Default to now if missing
                nav: parseFloat(s.nav) || parseFloat(s.valuation?.nav) || 0,       // Check top-level then nested
                value: parseFloat(s.value) || parseFloat(s.valuation?.value) || 0, // Check top-level then nested
            },
            transactions: (s.transactions || []).map((t: any) => ({
                date: new Date(t.date),
                description: t.description,
                amount: parseFloat(t.amount) || 0,
                units: parseFloat(t.units) || null,
                nav: parseFloat(t.nav) || null,
                type: t.type,
                balance: parseFloat(t.balance) || null,
            }))
        }));

        this.logger.log(`Mapped ${schemes.length} schemes to domain model.`);
        if (schemes.length > 0) {
            this.logger.log(`Sample Scheme: ${JSON.stringify(schemes[0])}`);
        }

        return {
            investorInfo: {
                name: investor.name,
                email: investor.email,
                mobile: investor.mobile,
                address: investor.address,
            },
            statementPeriod: {
                from: period.from ? new Date(period.from) : null,
                to: period.to ? new Date(period.to) : null,
            },
            schemes
        };
    }

    private handleError(error: any) {
        if (axios.isAxiosError(error)) {
            const status = error.response?.status;
            const data = error.response?.data;
            this.logger.error(`API Error: Status ${status}`);
            this.logger.error(`API Message: ${error.message}`);
            this.logger.error(`API Code: ${error.code}`);
            this.logger.error(`API Error Data: ${JSON.stringify(data)}`);
            this.logger.error(`Request Config: ${JSON.stringify({
                url: error.config?.url,
                method: error.config?.method,
                headers: error.config?.headers
            })}`);
        } else {
            this.logger.error(`Unexpected Error: ${error.message}`, error.stack);
        }
    }
}
