import { Controller, Get } from '@nestjs/common';
import { exportJWK, importSPKI } from 'jose';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

@Controller('.well-known')
export class JwksController {
  @Get('jwks.json')
  async getJwks() {
    try {
      let publicKeyPem = process.env.LICENSE_PUBLIC_KEY_PEM;

      // Fallback to file if env var not set
      if (!publicKeyPem) {
        const keyPathEnv = process.env.LICENSE_PUBLIC_KEY_PATH;
        const candidatePaths = [
          keyPathEnv && join(process.cwd(), keyPathEnv),
          join(process.cwd(), 'license_public.pem'),
        ].filter(Boolean) as string[];

        for (const path of candidatePaths) {
          if (existsSync(path)) {
            publicKeyPem = readFileSync(path, 'utf8');
            break;
          }
        }
      }
      
      if (!publicKeyPem) {
        throw new Error('LICENSE_PUBLIC_KEY_PEM not configured');
      }

      // Importar a chave pública PEM
      const pubKey = await importSPKI(publicKeyPem, 'RS256');
      
      // Converter para JWK
      const jwk = await exportJWK(pubKey);
      
      // Adicionar metadados necessários
      jwk.use = 'sig';
      jwk.alg = 'RS256';
      jwk.kid = 'license-key';

      return {
        keys: [jwk]
      };
    } catch (error) {
      throw new Error(`Failed to generate JWKS: ${(error as Error).message}`);
    }
  }
}