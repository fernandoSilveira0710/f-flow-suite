import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { type SentMessageInfo } from 'nodemailer';

interface SendEmailPayload {
  to: string;
  subject: string;
  html: string;
}

interface WelcomeEmailData {
  to: string;
  name: string;
  email: string;
  tenantId: string;
  planName?: string;
  planPrice?: number;
  planCurrency?: string;
  downloadUrl?: string;
}

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private readonly enabled: boolean;
  private readonly provider: 'resend' | 'smtp' | 'none';
  private readonly fromEmail: string;
  private readonly resendApiKey?: string;
  private readonly contactEmail: string;
  private readonly defaultDownloadUrl?: string;

  // SMTP config
  private readonly smtpHost?: string;
  private readonly smtpPort?: number;
  private readonly smtpSecure?: boolean;
  private readonly smtpUser?: string;
  private readonly smtpPass?: string;

  constructor(private readonly config: ConfigService) {
    this.enabled = this.config.get<boolean>('MAIL_ENABLE') ?? false;
    const provider = (this.config.get<string>('MAIL_PROVIDER') || 'none').toLowerCase();
    this.provider = provider === 'resend' ? 'resend' : provider === 'smtp' ? 'smtp' : 'none';
    this.fromEmail = this.config.get<string>('MAIL_FROM') || 'no-reply@fflow.local';
    this.resendApiKey = this.config.get<string>('RESEND_API_KEY');
    this.contactEmail = this.config.get<string>('CONTACT_EMAIL') || 'contato@2fsolution.online';
    this.defaultDownloadUrl = this.config.get<string>('DOWNLOAD_URL');

    // Load SMTP configuration
    this.smtpHost = this.config.get<string>('SMTP_HOST');
    this.smtpPort = this.config.get<number>('SMTP_PORT');
    // Accept boolean (true/false) or string ('true'/'false')
    const secureVal = this.config.get<string>('SMTP_SECURE');
    this.smtpSecure = typeof secureVal === 'string' ? secureVal.toLowerCase() === 'true' : (this.config.get<boolean>('SMTP_SECURE') ?? undefined);
    this.smtpUser = this.config.get<string>('SMTP_USER');
    this.smtpPass = this.config.get<string>('SMTP_PASS');
  }

  async sendWelcomeEmail(data: WelcomeEmailData): Promise<void> {
    if (!this.enabled) {
      this.logger.log('[Mailer] MAIL_ENABLE=false, pulando envio de email.');
      return;
    }

    const downloadUrl = data.downloadUrl || this.defaultDownloadUrl;
    const subject = 'Bem-vindo ao F-Flow Suite - Download e detalhes da conta';
    const html = this.renderWelcomeTemplate({ ...data, downloadUrl });

    this.logger.log(`[Mailer] Preparando envio de boas-vindas: to=${data.to} tenantId=${data.tenantId} provider=${this.provider} from=${this.fromEmail}`);

    await this.send({ to: data.to, subject, html });
  }

  async sendContactEmail(data: {
    fromName?: string;
    fromEmail: string;
    phone?: string;
    subject?: string;
    message: string;
  }): Promise<void> {
    if (!this.enabled) {
      this.logger.log('[Mailer] MAIL_ENABLE=false, pulando envio de email de contato.');
      return;
    }

    const subject = `[Contato] ${escapeHtml(data.subject || 'Mensagem do site')}`;
    const html = `
      <div style="font-family:Arial, Helvetica, sans-serif; color:#111;">
        <h2>Nova mensagem de contato</h2>
        <p>Você recebeu uma nova mensagem pelo site.</p>
        <h3>Detalhes</h3>
        <ul>
          ${data.fromName ? `<li><strong>Nome:</strong> ${escapeHtml(data.fromName)}</li>` : ''}
          <li><strong>Email:</strong> ${escapeHtml(data.fromEmail)}</li>
          ${data.phone ? `<li><strong>Telefone:</strong> ${escapeHtml(data.phone)}</li>` : ''}
          ${data.subject ? `<li><strong>Assunto:</strong> ${escapeHtml(data.subject)}</li>` : ''}
        </ul>
        <h3>Mensagem</h3>
        <div style="white-space:pre-wrap;">${escapeHtml(data.message)}</div>
        <hr />
        <p style="font-size:12px;color:#555;">Este email foi enviado automaticamente pelo site (formulário de contato).</p>
      </div>
    `;

    this.logger.log(`[Mailer] Preparando envio de contato: to=${this.contactEmail} from=${this.fromEmail}`);
    await this.send({ to: this.contactEmail, subject, html });
  }

  private renderWelcomeTemplate(data: WelcomeEmailData): string {
    const priceText = data.planPrice && data.planCurrency
      ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: data.planCurrency }).format(data.planPrice)
      : undefined;

    return `
      <div style="font-family:Arial, Helvetica, sans-serif; color:#111;">
        <h2>Olá, ${escapeHtml(data.name || data.email)}!</h2>
        <p>Seu cadastro no <strong>F-Flow Suite</strong> foi concluído com sucesso.</p>
        <h3>Detalhes da Conta</h3>
        <ul>
          <li><strong>Email:</strong> ${escapeHtml(data.email)}</li>
          <li><strong>Tenant ID:</strong> ${escapeHtml(data.tenantId)}</li>
          ${data.planName ? `<li><strong>Plano:</strong> ${escapeHtml(data.planName)}${priceText ? ` (${priceText}/mês)` : ''}</li>` : ''}
        </ul>
        ${data.downloadUrl ? `
        <p>
          Baixe o sistema desktop pelo link abaixo:
        </p>
        <p>
          <a href="${escapeAttr(data.downloadUrl)}" style="display:inline-block;padding:10px 16px;background:#0ea5e9;color:#fff;text-decoration:none;border-radius:6px;">Baixar F-Flow Client</a>
        </p>
        <p>Se o botão não funcionar, copie e cole este link no navegador:<br />
          <code>${escapeHtml(data.downloadUrl)}</code>
        </p>
        ` : ''}
        <hr />
        <p style="font-size:12px;color:#555;">Este email foi enviado automaticamente. Não responda.</p>
      </div>
    `;
  }

  private async send(payload: SendEmailPayload): Promise<void> {
    if (this.provider === 'resend') {
      await this.sendViaResend(payload);
      return;
    }

    if (this.provider === 'smtp') {
      await this.sendViaSMTP(payload);
      return;
    }

    this.logger.warn('[Mailer] Nenhum provider configurado (MAIL_PROVIDER=none). Email não foi enviado.');
  }

  private async sendViaResend(payload: SendEmailPayload): Promise<void> {
    if (!this.resendApiKey) {
      this.logger.warn('[Mailer] RESEND_API_KEY não definido. Email não foi enviado.');
      return;
    }
    const fallbackFrom = 'onboarding@resend.dev';
    const primaryFrom = this.fromEmail;

    const sendWithFrom = async (fromAddr: string) => {
      this.logger.log(`[Mailer] Resend: tentando envio. from=${fromAddr} to=${payload.to}`);
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromAddr,
          to: payload.to,
          subject: payload.subject,
          html: payload.html,
        }),
      });
      return res;
    };

    try {
      // Primeiro tenta com MAIL_FROM
      const resPrimary = await sendWithFrom(primaryFrom);
      if (resPrimary.ok) {
        let id: string | undefined;
        try {
          const json = await resPrimary.json();
          id = (json as { id?: string })?.id;
        } catch (e) {
          this.logger.debug('[Mailer] Resend: corpo da resposta não é JSON válido para primary');
        }
        this.logger.log(`[Mailer] Email enviado via Resend com sucesso${id ? ` (id=${id})` : ''}. to=${payload.to} from=${primaryFrom}`);
        return;
      }

      const primaryText = await resPrimary.text();
      this.logger.error(`[Mailer] Falha ao enviar via Resend com from=${primaryFrom}: status=${resPrimary.status} response=${primaryText}`);

      // Se falhou e não estamos usando o domínio padrão, tenta fallback
      if (primaryFrom.toLowerCase() !== fallbackFrom) {
        this.logger.warn(`[Mailer] Tentando fallback de remetente via Resend: from=${fallbackFrom}`);
        const resFallback = await sendWithFrom(fallbackFrom);
        if (resFallback.ok) {
          let fid: string | undefined;
          try {
            const json = await resFallback.json();
            fid = (json as { id?: string })?.id;
          } catch (e) {
            this.logger.debug('[Mailer] Resend: corpo da resposta não é JSON válido para fallback');
          }
          this.logger.log(`[Mailer] Fallback bem-sucedido via Resend${fid ? ` (id=${fid})` : ''}. to=${payload.to} from=${fallbackFrom}`);
          return;
        }
        const fbText = await resFallback.text();
        this.logger.error(`[Mailer] Fallback falhou via Resend: status=${resFallback.status} response=${fbText}`);
      }
    } catch (err) {
      const stack = err instanceof Error ? err.stack : undefined;
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`[Mailer] Erro ao enviar via Resend: ${msg}`, stack);
    }
  }

  private async sendViaSMTP(payload: SendEmailPayload): Promise<void> {
    const host = this.smtpHost;
    const port = this.smtpPort;
    const secure = this.smtpSecure;
    const user = this.smtpUser;
    const pass = this.smtpPass;

    if (!host || !port || secure === undefined || !user || !pass) {
      this.logger.warn('[Mailer] SMTP não configurado corretamente. Verifique SMTP_HOST/PORT/SECURE/USER/PASS.');
      return;
    }

    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
        // Evita ficar travado indefinidamente em conexões problemáticas
        connectionTimeout: 10_000,
        socketTimeout: 10_000,
      });

      const fromAddress = this.fromEmail && this.fromEmail.includes('@') ? this.fromEmail : user || this.fromEmail;
      if (!this.fromEmail.includes('@')) {
        this.logger.warn(`[Mailer] MAIL_FROM parece inválido ('${this.fromEmail}'). Usando fallback do usuário SMTP: '${fromAddress}'.`);
      }

      this.logger.log(`[Mailer] SMTP: tentando envio. host=${host} port=${port} secure=${secure} from=${fromAddress} to=${payload.to}`);

      const info: SentMessageInfo = await transporter.sendMail({
        from: fromAddress,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
      });

      const msgId = info.messageId;
      this.logger.log(`[Mailer] Email enviado via SMTP com sucesso${msgId ? ` (messageId=${msgId})` : ''}. to=${payload.to}`);
    } catch (err) {
      const stack = err instanceof Error ? err.stack : undefined;
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`[Mailer] Falha ao enviar via SMTP: ${msg}`, stack);
    }
}
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeAttr(input: string): string {
  // basic attribute escaping
  return escapeHtml(input).replace(/`/g, '&#x60;');
}
