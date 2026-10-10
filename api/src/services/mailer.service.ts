import nodemailer, { Transporter } from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../utils/logger';

interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class MailerService {
  private transporter: Transporter | null = null;

  constructor() {
    this.initTransporter();
  }

  private initTransporter() {
    try {
      const host = process.env.SMTP_HOST || 'smtp.gmail.com';
      const port = parseInt(process.env.SMTP_PORT || '465', 10);
      const user = process.env.SMTP_USER;
      const pass = process.env.SMTP_PASS;

      if (user && pass && user !== 'dummy_user') {
        this.transporter = nodemailer.createTransport({
          host,
          port,
          secure: port === 465,
          auth: { user, pass },
        });
        logger.info(`SMTP Transporter initialized successfully via ${host}:${port}`);
      } else {
        logger.info('SMTP credentials in dev/dummy mode. OTP codes will be logged to console.');
      }
    } catch (error) {
      logger.warn('Failed to initialize SMTP transporter. Falling back to dev logger:', error);
    }
  }

  public async sendMail(options: SendMailOptions): Promise<boolean> {
    const senderEmail = process.env.SMTP_USER || process.env.FROM_EMAIL || 'ahteshamulhasan18@gmail.com';
    const plainText =
      options.text ||
      options.html
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: `"TreasureBox Security" <${senderEmail}>`,
          to: options.to,
          replyTo: senderEmail,
          subject: options.subject,
          text: plainText,
          html: options.html,
          headers: {
            'X-Priority': '1',
            'X-MSMail-Priority': 'High',
            'Importance': 'high',
            'X-Mailer': 'TreasureBox Core Mailer',
          },
        });
        logger.info(`Email successfully dispatched to ${options.to}`);
        return true;
      } catch (error) {
        logger.error(`Error sending email to ${options.to}:`, error);
        throw error;
      }
    }

    // Dev Fallback Logging
    logger.info(`[DEV EMAIL SENDER] To: ${options.to} | Subject: "${options.subject}"`);
    return true;
  }
}

export const mailerService = new MailerService();
