import { Injectable, Logger } from '@nestjs/common';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { createHash, createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

@Injectable()
export class TokenStore {
  private readonly logger = new Logger(TokenStore.name);
  private readonly serviceName = 'f-flow-client';
  private readonly fallbackDir = join(homedir(), '.f-flow-license');
  private readonly fallbackFile = join(this.fallbackDir, 'token.json');

  async saveToken(tenantId: string, deviceId: string, token: string): Promise<void> {
    try {
      // Try to use keytar first
      const keytar = await this.loadKeytar();
      if (keytar) {
        const account = `${tenantId}:${deviceId}`;
        await keytar.setPassword(this.serviceName, account, token);
        this.logger.log(`Token saved securely for tenant ${tenantId}`);
        return;
      }
    } catch (error) {
      this.logger.warn('Keytar not available, using fallback storage', error);
    }

    // Fallback to encrypted file storage
    this.saveFallbackToken(tenantId, deviceId, token);
  }

  async getToken(tenantId?: string, deviceId?: string): Promise<string | null> {
    try {
      // Try to use keytar first
      const keytar = await this.loadKeytar();
      if (keytar && tenantId && deviceId) {
        const account = `${tenantId}:${deviceId}`;
        const token = await keytar.getPassword(this.serviceName, account);
        if (token) {
          return token;
        }
      }
    } catch (error) {
      this.logger.warn('Keytar not available, using fallback storage', error);
    }

    // Fallback to encrypted file storage
    return this.getFallbackToken(tenantId, deviceId);
  }

  async deleteToken(tenantId?: string, deviceId?: string): Promise<void> {
    try {
      // Try to use keytar first
      const keytar = await this.loadKeytar();
      if (keytar && tenantId && deviceId) {
        const account = `${tenantId}:${deviceId}`;
        await keytar.deletePassword(this.serviceName, account);
        this.logger.log(`Token deleted for tenant ${tenantId}`);
      }
    } catch (error) {
      this.logger.warn('Keytar not available, using fallback storage', error);
    }

    // Also delete from fallback storage
    this.deleteFallbackToken();
  }

  private async loadKeytar(): Promise<any> {
    try {
      return await import('keytar');
    } catch (error) {
      return null;
    }
  }

  private saveFallbackToken(tenantId: string, deviceId: string, token: string): void {
    try {
      if (!existsSync(this.fallbackDir)) {
        mkdirSync(this.fallbackDir, { recursive: true });
      }

      const data = {
        tenantId,
        deviceId,
        token,
        timestamp: Date.now()
      };

      const key = this.generateKey(deviceId);
      const iv = randomBytes(16);
      const cipher = createCipheriv('aes-256-cbc', Buffer.from(key, 'hex'), iv);
      let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const result = iv.toString('hex') + ':' + encrypted;
      writeFileSync(this.fallbackFile, result, 'utf8');
      this.logger.log(`Token saved to fallback storage for tenant ${tenantId}`);
    } catch (error) {
      this.logger.error('Failed to save token to fallback storage', error);
      throw error;
    }
  }

  private getFallbackToken(tenantId?: string, deviceId?: string): string | null {
    try {
      if (!existsSync(this.fallbackFile)) {
        return null;
      }

      const fileContent = readFileSync(this.fallbackFile, 'utf8');
      
      // Try to decrypt with provided deviceId first
      if (deviceId) {
        try {
          const [ivHex, encrypted] = fileContent.split(':');
          if (!ivHex || !encrypted) {
            return null;
          }

          const key = this.generateKey(deviceId);
          const iv = Buffer.from(ivHex, 'hex');
          const decipher = createDecipheriv('aes-256-cbc', Buffer.from(key, 'hex'), iv);
          let decrypted = decipher.update(encrypted, 'hex', 'utf8');
          decrypted += decipher.final('utf8');
          
          const data = JSON.parse(decrypted);
          if (data.tenantId === tenantId && data.deviceId === deviceId) {
            return data.token;
          }
        } catch (error) {
          // Continue to try without specific deviceId
        }
      }

      // If no specific deviceId or decryption failed, try to read any stored token
      // This is for backward compatibility or when we just need to check if any token exists
      return null;
    } catch (error) {
      this.logger.error('Failed to read token from fallback storage', error);
      return null;
    }
  }

  private deleteFallbackToken(): void {
    try {
      if (existsSync(this.fallbackFile)) {
        const fs = require('fs');
        fs.unlinkSync(this.fallbackFile);
        this.logger.log('Fallback token deleted');
      }
    } catch (error) {
      this.logger.error('Failed to delete fallback token', error);
    }
  }

  private generateKey(deviceId: string): string {
    return createHash('sha256').update(deviceId + 'f-flow-salt').digest('hex');
  }
}