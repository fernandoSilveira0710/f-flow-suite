import { Controller, Get } from '@nestjs/common';
import { exportJWK, importSPKI } from 'jose';

@Controller('.well-known')
export class JwksController {
  @Get('jwks.json')
  async getJwks() {
    try {
      const publicKeyPem = process.env.LICENSE_PUBLIC_KEY_PEM;
      
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