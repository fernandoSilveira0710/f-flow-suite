import { Injectable, Logger } from '@nestjs/common';
import { readFileSync } from 'node:fs';

@Injectable()
export class LicensingService {
  private readonly logger = new Logger(LicensingService.name);

  loadLicenseFromFile(path: string) {
    try {
      const contents = readFileSync(path, 'utf-8');
      return contents.trim();
    } catch (error) {
      this.logger.error(`Unable to read license file at ${path}`, error as Error);
      return null;
    }
  }
}
