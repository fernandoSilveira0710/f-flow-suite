/**
 * Serviço para sincronização de planos entre Hub, client-local e cache local
 */

interface SyncPlanData {
  tenantId: string;
  userId: string;
  planKey: string;
  expiresAt?: string;
  isValid: boolean;
  licensed: boolean;
}

interface SyncResult {
  success: boolean;
  message: string;
  planKey?: string;
  errors?: string[];
}

export class PlanSyncService {
  private static readonly HUB_BASE_URL = 'http://localhost:8081';
  private static readonly CLIENT_LOCAL_BASE_URL = 'http://localhost:3001';

  /**
   * Sincroniza planos em todas as fontes após login ou alteração de plano
   */
  static async syncPlansAfterLogin(tenantId: string, userId: string): Promise<SyncResult> {
    console.log('🔄 Iniciando sincronização de planos após login...', { tenantId, userId });
    
    const errors: string[] = [];
    let finalPlanKey: string | undefined;

    try {
      // 1. Obter plano atual do Hub (fonte da verdade)
      const hubPlan = await this.getHubPlan(tenantId);
      if (hubPlan.success && hubPlan.planKey) {
        finalPlanKey = hubPlan.planKey;
        console.log('✅ Plano obtido do Hub:', finalPlanKey);
      } else {
        errors.push('Falha ao obter plano do Hub: ' + hubPlan.message);
        console.warn('⚠️ Falha ao obter plano do Hub:', hubPlan.message);
      }

      // 2. Sincronizar com client-local
      if (finalPlanKey) {
        const clientLocalSync = await this.syncClientLocal(tenantId, userId, finalPlanKey);
        if (!clientLocalSync.success) {
          errors.push('Falha na sincronização com client-local: ' + clientLocalSync.message);
          console.warn('⚠️ Falha na sincronização com client-local:', clientLocalSync.message);
        } else {
          console.log('✅ Client-local sincronizado com sucesso');
        }
      }

      // 3. Atualizar cache local do client-local
      if (finalPlanKey) {
        const cacheSync = await this.updateClientLocalCache(tenantId, finalPlanKey);
        if (!cacheSync.success) {
          errors.push('Falha na atualização do cache: ' + cacheSync.message);
          console.warn('⚠️ Falha na atualização do cache:', cacheSync.message);
        } else {
          console.log('✅ Cache do client-local atualizado com sucesso');
        }
      }

      const success = errors.length === 0;
      const message = success 
        ? `Sincronização concluída com sucesso. Plano: ${finalPlanKey}`
        : `Sincronização parcial. ${errors.length} erro(s) encontrado(s)`;

      console.log(success ? '🎉' : '⚠️', message);

      return {
        success,
        message,
        planKey: finalPlanKey,
        errors: errors.length > 0 ? errors : undefined
      };

    } catch (error) {
      const errorMessage = `Erro geral na sincronização: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
      console.error('❌', errorMessage, error);
      
      return {
        success: false,
        message: errorMessage,
        errors: [errorMessage]
      };
    }
  }

  /**
   * Obtém o plano atual do Hub
   */
  private static async getHubPlan(tenantId: string): Promise<{ success: boolean; message: string; planKey?: string }> {
    try {
      const response = await fetch(`${this.HUB_BASE_URL}/licenses/validate?tenantId=${tenantId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) {
        return {
          success: false,
          message: `HTTP ${response.status}: ${response.statusText}`
        };
      }

      const data = await response.json();
      
      // Verificar se a licença é válida e licenciada
      if (data.valid && data.licensed) {
        // O planKey pode estar em data.license.planKey (quando válida) ou data.planKey (quando inválida)
        const planKey = data.license?.planKey || data.planKey;
        
        if (planKey) {
          return {
            success: true,
            message: 'Plano obtido com sucesso',
            planKey: planKey
          };
        } else {
          return {
            success: false,
            message: 'Licença válida mas planKey não encontrado'
          };
        }
      } else {
        // Mesmo se a licença não for válida, pode ter planKey para sincronização
        const planKey = data.license?.planKey || data.planKey;
        return {
          success: false,
          message: `Licença inválida ou não licenciada${planKey ? ` (planKey: ${planKey})` : ''}`
        };
      }

    } catch (error) {
      return {
        success: false,
        message: `Erro de conexão com Hub: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      };
    }
  }

  /**
   * Sincroniza dados com client-local
   */
  private static async syncClientLocal(tenantId: string, userId: string, planKey: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.CLIENT_LOCAL_BASE_URL}/plans/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tenantId,
          userId,
          planKey,
          syncedAt: new Date().toISOString()
        })
      });

      if (!response.ok) {
        return {
          success: false,
          message: `HTTP ${response.status}: ${response.statusText}`
        };
      }

      return {
        success: true,
        message: 'Client-local sincronizado com sucesso'
      };

    } catch (error) {
      return {
        success: false,
        message: `Erro de conexão com client-local: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      };
    }
  }

  /**
   * Atualiza o cache local do client-local
   */
  private static async updateClientLocalCache(tenantId: string, planKey: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.CLIENT_LOCAL_BASE_URL}/licensing/update-cache`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tenantId,
          planKey,
          lastChecked: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
      });

      if (!response.ok) {
        return {
          success: false,
          message: `HTTP ${response.status}: ${response.statusText}`
        };
      }

      return {
        success: true,
        message: 'Cache atualizado com sucesso'
      };

    } catch (error) {
      return {
        success: false,
        message: `Erro ao atualizar cache: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      };
    }
  }

  /**
   * Sincroniza planos após alteração de plano (para uso futuro)
   */
  static async syncPlansAfterPlanChange(tenantId: string, userId: string, newPlanKey: string): Promise<SyncResult> {
    console.log('🔄 Iniciando sincronização após alteração de plano...', { tenantId, userId, newPlanKey });
    
    const errors: string[] = [];

    try {
      // 1. Atualizar Hub (se disponível)
      const hubUpdate = await this.updateHubPlan(tenantId, newPlanKey);
      if (!hubUpdate.success) {
        errors.push('Falha ao atualizar Hub: ' + hubUpdate.message);
        console.warn('⚠️ Falha ao atualizar Hub:', hubUpdate.message);
      }

      // 2. Sincronizar com client-local
      const clientLocalSync = await this.syncClientLocal(tenantId, userId, newPlanKey);
      if (!clientLocalSync.success) {
        errors.push('Falha na sincronização com client-local: ' + clientLocalSync.message);
        console.warn('⚠️ Falha na sincronização com client-local:', clientLocalSync.message);
      }

      // 3. Atualizar cache local
      const cacheSync = await this.updateClientLocalCache(tenantId, newPlanKey);
      if (!cacheSync.success) {
        errors.push('Falha na atualização do cache: ' + cacheSync.message);
        console.warn('⚠️ Falha na atualização do cache:', cacheSync.message);
      }

      const success = errors.length === 0;
      const message = success 
        ? `Plano alterado e sincronizado com sucesso: ${newPlanKey}`
        : `Alteração parcial. ${errors.length} erro(s) encontrado(s)`;

      return {
        success,
        message,
        planKey: newPlanKey,
        errors: errors.length > 0 ? errors : undefined
      };

    } catch (error) {
      const errorMessage = `Erro geral na sincronização: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
      console.error('❌', errorMessage, error);
      
      return {
        success: false,
        message: errorMessage,
        errors: [errorMessage]
      };
    }
  }

  /**
   * Atualiza plano no Hub (para uso futuro)
   */
  private static async updateHubPlan(tenantId: string, planKey: string): Promise<{ success: boolean; message: string }> {
    try {
      // Este endpoint seria implementado no Hub para atualizar planos
      const response = await fetch(`${this.HUB_BASE_URL}/plans/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tenantId,
          planKey,
          updatedAt: new Date().toISOString()
        }),
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) {
        return {
          success: false,
          message: `HTTP ${response.status}: ${response.statusText}`
        };
      }

      return {
        success: true,
        message: 'Hub atualizado com sucesso'
      };

    } catch (error) {
      return {
        success: false,
        message: `Erro de conexão com Hub: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      };
    }
  }

  /**
   * Sincroniza planos após alteração de plano via client-local
   */
  static async syncPlansAfterPlanChange(tenantId: string, userId: string, newPlanKey: string): Promise<SyncResult> {
    console.log('🔄 Iniciando sincronização após alteração de plano...', { tenantId, userId, newPlanKey });
    
    const errors: string[] = [];

    try {
      // 1. Atualizar plano no Hub primeiro
      const hubUpdate = await this.updateHubPlan(tenantId, newPlanKey);
      if (!hubUpdate.success) {
        errors.push('Falha ao atualizar plano no Hub: ' + hubUpdate.message);
        console.warn('⚠️ Falha ao atualizar plano no Hub:', hubUpdate.message);
      } else {
        console.log('✅ Plano atualizado no Hub com sucesso');
      }

      // 2. Sincronizar com client-local
      const clientLocalSync = await this.syncClientLocal(tenantId, userId, newPlanKey);
      if (!clientLocalSync.success) {
        errors.push('Falha na sincronização com client-local: ' + clientLocalSync.message);
        console.warn('⚠️ Falha na sincronização com client-local:', clientLocalSync.message);
      } else {
        console.log('✅ Client-local sincronizado com sucesso');
      }

      // 3. Atualizar cache local do client-local
      const cacheSync = await this.updateClientLocalCache(tenantId, newPlanKey);
      if (!cacheSync.success) {
        errors.push('Falha na atualização do cache: ' + cacheSync.message);
        console.warn('⚠️ Falha na atualização do cache:', cacheSync.message);
      } else {
        console.log('✅ Cache do client-local atualizado com sucesso');
      }

      // 4. Atualizar localStorage como fallback
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('selectedPlan', newPlanKey);
        console.log('✅ localStorage atualizado com sucesso');
      }

      const success = errors.length === 0;
      const message = success 
        ? `Plano alterado e sincronizado com sucesso: ${newPlanKey}`
        : `Alteração de plano parcial. ${errors.length} erro(s) encontrado(s)`;

      console.log(success ? '🎉' : '⚠️', message);

      return {
        success,
        message,
        planKey: newPlanKey,
        errors: errors.length > 0 ? errors : undefined
      };

    } catch (error) {
      const errorMessage = `Erro geral na alteração de plano: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
      console.error('❌', errorMessage, error);
      
      return {
        success: false,
        message: errorMessage,
        errors: [errorMessage]
      };
    }
  }
}