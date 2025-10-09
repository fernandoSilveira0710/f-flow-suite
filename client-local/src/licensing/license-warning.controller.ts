import { Controller, Get, Query, Render, Res } from '@nestjs/common';
import { Response } from 'express';
import { LicensingService } from './licensing.service';

@Controller('license-warning')
export class LicenseWarningController {
  constructor(private readonly licensingService: LicensingService) {}

  @Get()
  async showLicenseWarning(@Query('tenantId') tenantId?: string, @Res() res?: Response) {
    try {
      const result = await this.licensingService.checkLicenseStatus(tenantId || '');
      
      // Se a licença está ativa, redireciona para a aplicação principal
      if (result.status === 'active') {
        return res?.redirect('/');
      }

      const warningData = {
        status: result.status,
        message: result.reason || 'Status de licença desconhecido',
        showWarning: !result.valid,
        requiresSetup: !result.valid,
        canStart: result.valid,
        planKey: result.planKey,
        expiresAt: result.expiresAt,
        hubUrl: process.env.HUB_BASE_URL || 'https://hub.f-flow.com.br',
        supportEmail: 'suporte@2fsolutions.com.br'
      };

      // Retorna HTML simples para exibir o aviso
      const html = this.generateWarningHTML(warningData);
      
      if (res) {
        res.setHeader('Content-Type', 'text/html');
        return res.send(html);
      }
      
      return { html, data: warningData };
      
    } catch (error: any) {
      const errorHtml = this.generateErrorHTML(error.message);
      
      if (res) {
        res.setHeader('Content-Type', 'text/html');
        return res.status(500).send(errorHtml);
      }
      
      return { error: error.message };
    }
  }

  private generateWarningHTML(data: any): string {
    const statusMessages = {
      'not_registered': {
        title: 'Licença Não Registrada',
        description: 'Sua instalação não está registrada no sistema.',
        action: 'Registre sua instalação no Hub para continuar usando o F-Flow.'
      },
      'not_licensed': {
        title: 'Licença Não Encontrada',
        description: 'Não foi encontrada uma licença válida para este tenant.',
        action: 'Adquira uma licença no Hub ou entre em contato com o suporte.'
      },
      'offline_grace': {
        title: 'Modo Offline - Período de Graça',
        description: 'Você está operando no período de graça offline.',
        action: 'Conecte-se à internet para validar sua licença.'
      },
      'expired': {
        title: 'Licença Expirada',
        description: 'Sua licença expirou e precisa ser renovada.',
        action: 'Renove sua licença no Hub para continuar usando o F-Flow.'
      }
    };

    const statusInfo = (statusMessages as any)[data.status] || {
      title: 'Problema com a Licença',
      description: data.message,
      action: 'Entre em contato com o suporte para resolver este problema.'
    };

    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>F-Flow - ${statusInfo.title}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .warning-container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            max-width: 500px;
            width: 100%;
            padding: 40px;
            text-align: center;
        }
        
        .warning-icon {
            width: 80px;
            height: 80px;
            margin: 0 auto 20px;
            background: ${data.status === 'expired' ? '#ff6b6b' : data.status === 'offline_grace' ? '#ffa726' : '#4ecdc4'};
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 40px;
            color: white;
        }
        
        .warning-title {
            font-size: 24px;
            font-weight: 600;
            color: #2c3e50;
            margin-bottom: 16px;
        }
        
        .warning-description {
            font-size: 16px;
            color: #7f8c8d;
            line-height: 1.6;
            margin-bottom: 24px;
        }
        
        .warning-action {
            font-size: 14px;
            color: #34495e;
            background: #f8f9fa;
            padding: 16px;
            border-radius: 8px;
            margin-bottom: 24px;
            border-left: 4px solid #3498db;
        }
        
        .license-details {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 24px;
            text-align: left;
        }
        
        .license-details h4 {
            color: #2c3e50;
            margin-bottom: 12px;
            font-size: 14px;
            font-weight: 600;
        }
        
        .license-detail {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 13px;
        }
        
        .license-detail strong {
            color: #2c3e50;
        }
        
        .license-detail span {
            color: #7f8c8d;
        }
        
        .action-buttons {
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
        }
        
        .btn {
            flex: 1;
            padding: 12px 24px;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            text-align: center;
            transition: all 0.2s;
        }
        
        .btn-primary {
            background: #3498db;
            color: white;
        }
        
        .btn-primary:hover {
            background: #2980b9;
        }
        
        .btn-secondary {
            background: #95a5a6;
            color: white;
        }
        
        .btn-secondary:hover {
            background: #7f8c8d;
        }
        
        .refresh-info {
            margin-top: 20px;
            font-size: 12px;
            color: #95a5a6;
        }
        
        @media (max-width: 480px) {
            .warning-container {
                padding: 30px 20px;
            }
            
            .action-buttons {
                flex-direction: column;
            }
        }
    </style>
</head>
<body>
    <div class="warning-container">
        <div class="warning-icon">
            ${data.status === 'expired' ? '⚠️' : data.status === 'offline_grace' ? '🔄' : '📋'}
        </div>
        
        <h1 class="warning-title">${statusInfo.title}</h1>
        <p class="warning-description">${statusInfo.description}</p>
        
        <div class="warning-action">
            <strong>Ação Necessária:</strong> ${statusInfo.action}
        </div>
        
        ${data.license ? `
        <div class="license-details">
            <h4>Detalhes da Licença</h4>
            <div class="license-detail">
                <strong>Tenant ID:</strong>
                <span>${data.license.tenantId}</span>
            </div>
            ${data.license.planKey ? `
            <div class="license-detail">
                <strong>Plano:</strong>
                <span>${data.license.planKey.toUpperCase()}</span>
            </div>
            ` : ''}
            ${data.license.expiresAt ? `
            <div class="license-detail">
                <strong>Expira em:</strong>
                <span>${new Date(data.license.expiresAt).toLocaleDateString('pt-BR')}</span>
            </div>
            ` : ''}
            ${data.license.lastChecked ? `
            <div class="license-detail">
                <strong>Última verificação:</strong>
                <span>${new Date(data.license.lastChecked).toLocaleString('pt-BR')}</span>
            </div>
            ` : ''}
        </div>
        ` : ''}
        
        <div class="action-buttons">
            <a href="${data.hubUrl}" class="btn btn-primary" target="_blank">
                Acessar Hub F-Flow
            </a>
            <button onclick="window.location.reload()" class="btn btn-secondary">
                Tentar Novamente
            </button>
        </div>
        
        <div class="refresh-info">
            Esta página será atualizada automaticamente a cada 30 segundos
        </div>
    </div>
    
    <script>
        // Auto-refresh a cada 30 segundos
        setTimeout(() => {
            window.location.reload();
        }, 30000);
        
        // Verifica o status da licença a cada 10 segundos
        setInterval(async () => {
            try {
                const response = await fetch('/licensing/status${data.license?.tenantId ? '?tenantId=' + data.license.tenantId : ''}');
                const status = await response.json();
                
                if (status.status === 'active') {
                    window.location.href = '/';
                }
            } catch (error) {
                console.log('Erro ao verificar status da licença:', error);
            }
        }, 10000);
    </script>
</body>
</html>
    `;
  }

  private generateErrorHTML(errorMessage: string): string {
    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>F-Flow - Erro na Verificação de Licença</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f8f9fa;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .error-container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            max-width: 400px;
            width: 100%;
            padding: 40px;
            text-align: center;
        }
        
        .error-icon {
            font-size: 48px;
            margin-bottom: 20px;
        }
        
        .error-title {
            font-size: 20px;
            font-weight: 600;
            color: #e74c3c;
            margin-bottom: 16px;
        }
        
        .error-message {
            font-size: 14px;
            color: #7f8c8d;
            margin-bottom: 24px;
        }
        
        .btn {
            background: #3498db;
            color: white;
            padding: 12px 24px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
        }
    </style>
</head>
<body>
    <div class="error-container">
        <div class="error-icon">❌</div>
        <h1 class="error-title">Erro na Verificação</h1>
        <p class="error-message">${errorMessage}</p>
        <button onclick="window.location.reload()" class="btn">
            Tentar Novamente
        </button>
    </div>
</body>
</html>
    `;
  }
}