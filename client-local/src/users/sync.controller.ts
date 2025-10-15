import { Controller, Post, Body, Get } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersSyncController {
  constructor(private readonly usersService: UsersService) {}

  @Post('sync')
  async syncUser(@Body() syncData: {
    userId: string;
    email: string;
    displayName?: string;
    tenantId: string;
  }) {
    try {
      // Verificar se o usuário já existe
      const existingUser = await this.usersService.findByEmail(syncData.email);
      
      if (existingUser) {
        // Atualizar usuário existente
        return await this.usersService.update(existingUser.id, {
          displayName: syncData.displayName || syncData.email.split('@')[0],
          email: syncData.email,
          tenantId: syncData.tenantId,
          hubUserId: syncData.userId,
        });
      } else {
        // Criar novo usuário
        return await this.usersService.create({
          displayName: syncData.displayName || syncData.email.split('@')[0],
          email: syncData.email,
          tenantId: syncData.tenantId,
          hubUserId: syncData.userId,
          role: 'admin', // Usuário que faz login via Hub é admin por padrão
          active: true,
        });
      }
    } catch (error) {
      console.error('Erro na sincronização do usuário:', error);
      throw error;
    }
  }

  @Get('has-users')
  async hasUsers() {
    const users = await this.usersService.findAll();
    return { hasUsers: users.length > 0 };
  }
}