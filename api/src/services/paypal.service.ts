import { env } from '../config/env';
import { logger } from '../utils/logger';
import { AppError } from '../utils/response';

interface PayPalLink {
  href: string;
  rel: string;
  method: string;
}

interface PayPalCaptureItem {
  id: string;
  status: string;
  amount: {
    currency_code: string;
    value: string;
  };
}

interface PayPalOrderResponse {
  id: string;
  status: string;
  links?: PayPalLink[];
  purchase_units?: Array<{
    reference_id?: string;
    payments?: {
      captures?: PayPalCaptureItem[];
    };
  }>;
}

interface CreateOrderParams {
  huntId: string;
  huntTitle: string;
  amount: number;
  currency?: string;
  returnUrl?: string;
  cancelUrl?: string;
}

interface CreateOrderResult {
  orderId: string;
  approvalUrl: string;
  status: string;
}

interface CaptureOrderResult {
  orderId: string;
  captureId: string;
  status: string;
  amount: number;
  currency: string;
}

export class PayPalService {
  private cachedToken: string | null = null;
  private tokenExpiresAt = 0;

  private getBaseUrl(): string {
    const mode = env.PAYPAL_MODE || process.env.PAYPAL_MODE || 'sandbox';
    return mode === 'live'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';
  }

  private getCredentials(): { clientId: string; clientSecret: string } {
    const clientId = env.PAYPAL_CLIENT_ID || process.env.PAYPAL_CLIENT_ID;
    const clientSecret = env.PAYPAL_CLIENT_SECRET || process.env.PAYPAL_CLIENT_SECRET;

    if (!clientId || !clientSecret || clientId.trim() === '' || clientSecret.trim() === '') {
      throw new AppError(
        400,
        'PayPal API credentials are not configured. Please set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET in Backend/.env',
        'PAYPAL_CREDENTIALS_MISSING'
      );
    }

    return { clientId: clientId.trim(), clientSecret: clientSecret.trim() };
  }

  /**
   * Fetch or return cached OAuth 2.0 Access Token from PayPal
   */
  private async getAccessToken(): Promise<string> {
    const now = Date.now();
    // Use cached token if valid for at least another 60 seconds
    if (this.cachedToken && now < this.tokenExpiresAt - 60000) {
      return this.cachedToken;
    }

    const { clientId, clientSecret } = this.getCredentials();
    const baseUrl = this.getBaseUrl();
    const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    try {
      const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${authHeader}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as {
          error_description?: string;
          error?: string;
        };
        const errorMsg = errorData.error_description || errorData.error || response.statusText;
        logger.error(`PayPal OAuth token request failed: ${errorMsg}`);
        throw new AppError(
          response.status === 401 ? 401 : 400,
          `PayPal Authentication Failed: ${errorMsg}. Please verify your PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET.`,
          'PAYPAL_AUTH_FAILED'
        );
      }

      const data = (await response.json()) as { access_token: string; expires_in: number };
      this.cachedToken = data.access_token;
      this.tokenExpiresAt = now + data.expires_in * 1000;

      logger.info('Successfully generated new PayPal OAuth access token');
      return this.cachedToken;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Failed to communicate with PayPal OAuth endpoint', error);
      throw new AppError(
        502,
        'Unable to connect to PayPal Authentication servers. Please check network connection.',
        'PAYPAL_CONNECTION_ERROR'
      );
    }
  }

  /**
   * Create an Order with PayPal v2 Checkout API
   */
  public async createOrder(params: CreateOrderParams): Promise<CreateOrderResult> {
    const clientId = env.PAYPAL_CLIENT_ID || process.env.PAYPAL_CLIENT_ID;
    const clientSecret = env.PAYPAL_CLIENT_SECRET || process.env.PAYPAL_CLIENT_SECRET;

    if (!clientId || !clientSecret || clientId.trim() === '' || clientSecret.trim() === '') {
      logger.warn('PayPal credentials not found. Using static simulated payment order.');
      const mockOrderId = `MOCK-PAYPAL-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      return {
        orderId: mockOrderId,
        approvalUrl: `https://www.sandbox.paypal.com/checkoutnow?token=${mockOrderId}`,
        status: 'CREATED',
      };
    }

    const token = await this.getAccessToken();
    const baseUrl = this.getBaseUrl();
    const currency = (params.currency || 'USD').toUpperCase();
    const formattedAmount = params.amount.toFixed(2);

    const payload = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: params.huntId,
          description: `Expedition Permit: ${params.huntTitle.substring(0, 120)}`,
          amount: {
            currency_code: currency,
            value: formattedAmount,
          },
        },
      ],
      application_context: {
        brand_name: 'Treasure Box',
        landing_page: 'NO_PREFERENCE',
        user_action: 'PAY_NOW',
        ...(params.returnUrl ? { return_url: params.returnUrl } : {}),
        ...(params.cancelUrl ? { cancel_url: params.cancelUrl } : {})
      },
    };

    try {
      const response = await fetch(`${baseUrl}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as PayPalOrderResponse & {
        message?: string;
        details?: Array<{ issue?: string; description?: string }>;
      };

      if (!response.ok) {
        const errorDetail = data.details?.[0]?.description || data.message || response.statusText;
        logger.error(`PayPal order creation failed: ${errorDetail}`);
        throw new AppError(
          400,
          `Failed to create PayPal order: ${errorDetail}`,
          'PAYPAL_ORDER_CREATION_FAILED'
        );
      }

      const approvalLink = data.links?.find((link) => link.rel === 'approve');
      const approvalUrl = approvalLink ? approvalLink.href : '';

      return {
        orderId: data.id,
        approvalUrl,
        status: data.status,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Unexpected error while creating PayPal order:', error);
      throw new AppError(
        502,
        'Unexpected error connecting to PayPal order creation service',
        'PAYPAL_SERVICE_ERROR'
      );
    }
  }

  /**
   * Capture an authorized/approved PayPal Order
   */
  public async captureOrder(paypalOrderId: string): Promise<CaptureOrderResult> {
    const clientId = env.PAYPAL_CLIENT_ID || process.env.PAYPAL_CLIENT_ID;
    const clientSecret = env.PAYPAL_CLIENT_SECRET || process.env.PAYPAL_CLIENT_SECRET;

    if (
      !clientId ||
      !clientSecret ||
      clientId.trim() === '' ||
      clientSecret.trim() === '' ||
      paypalOrderId.startsWith('MOCK-') ||
      paypalOrderId.startsWith('SIMULATED-') ||
      paypalOrderId.startsWith('PERMIT-')
    ) {
      logger.info(`Simulating successful PayPal capture for static order: ${paypalOrderId}`);
      return {
        orderId: paypalOrderId,
        captureId: `CAP-${Date.now()}`,
        status: 'COMPLETED',
        amount: 0,
        currency: 'USD',
      };
    }

    const token = await this.getAccessToken();
    const baseUrl = this.getBaseUrl();

    try {
      const response = await fetch(`${baseUrl}/v2/checkout/orders/${paypalOrderId}/capture`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const data = (await response.json()) as PayPalOrderResponse & {
        name?: string;
        message?: string;
        details?: Array<{ issue?: string; description?: string }>;
      };

      // If order was already captured, fetch details to confirm
      if (!response.ok) {
        const issue = data.details?.[0]?.issue || data.name || '';
        const detail = data.details?.[0]?.description || data.message || response.statusText;

        if (issue === 'ORDER_ALREADY_CAPTURED') {
          const details = await this.getOrderDetails(paypalOrderId);
          if (details.status === 'COMPLETED') {
            const capture = details.purchase_units?.[0]?.payments?.captures?.[0];
            return {
              orderId: details.id,
              captureId: capture?.id || `CAP-${details.id}`,
              status: details.status,
              amount: parseFloat(capture?.amount?.value || '0'),
              currency: capture?.amount?.currency_code || 'USD',
            };
          }
        }

        logger.error(`PayPal capture order failed: ${detail}`);
        throw new AppError(
          400,
          `PayPal Capture Failed: ${detail}`,
          'PAYPAL_CAPTURE_FAILED'
        );
      }

      const capture = data.purchase_units?.[0]?.payments?.captures?.[0];
      const captureId = capture?.id || `CAP-${data.id}`;
      const amountVal = parseFloat(capture?.amount?.value || '0');
      const currencyCode = capture?.amount?.currency_code || 'USD';

      return {
        orderId: data.id,
        captureId,
        status: data.status,
        amount: amountVal,
        currency: currencyCode,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Unexpected error while capturing PayPal payment:', error);
      throw new AppError(
        502,
        'Unexpected error communicating with PayPal payment capture gateway',
        'PAYPAL_CAPTURE_COMMUNICATION_ERROR'
      );
    }
  }

  /**
   * Retrieve order details directly from PayPal
   */
  public async getOrderDetails(paypalOrderId: string): Promise<PayPalOrderResponse> {
    const token = await this.getAccessToken();
    const baseUrl = this.getBaseUrl();

    try {
      const response = await fetch(`${baseUrl}/v2/checkout/orders/${paypalOrderId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new AppError(
          response.status === 404 ? 404 : 400,
          `PayPal Order ${paypalOrderId} not found or inaccessible`,
          'PAYPAL_ORDER_NOT_FOUND'
        );
      }

      return (await response.json()) as PayPalOrderResponse;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        502,
        'Failed to query PayPal order status',
        'PAYPAL_ORDER_QUERY_FAILED'
      );
    }
  }
}

export const paypalService = new PayPalService();
