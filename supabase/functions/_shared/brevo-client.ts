interface BrevoEmailParams {
  to: Array<{ email: string; name?: string }>;
  sender: { email: string; name: string };
  subject: string;
  htmlContent: string;
  textContent?: string;
  params?: Record<string, any>;
  tags?: string[];
}

interface BrevoResponse {
  messageId: string;
}

export class BrevoClient {
  private apiKey: string;
  private baseUrl = 'https://api.brevo.com/v3';

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Brevo API key is required');
    }
    this.apiKey = apiKey;
  }

  async sendTransactionalEmail(params: BrevoEmailParams): Promise<BrevoResponse> {
    const response = await fetch(`${this.baseUrl}/smtp/email`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': this.apiKey,
      },
      body: JSON.stringify({
        to: params.to,
        sender: params.sender,
        subject: params.subject,
        htmlContent: params.htmlContent,
        textContent: params.textContent,
        params: params.params,
        tags: params.tags,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Brevo API error: ${error.message || response.statusText}`);
    }

    const data = await response.json();
    return { messageId: data.messageId };
  }

  // Template-based email sending
  async sendTemplateEmail(params: {
    to: Array<{ email: string; name?: string }>;
    templateId: number;
    params: Record<string, any>;
    tags?: string[];
  }): Promise<BrevoResponse> {
    const response = await fetch(`${this.baseUrl}/smtp/email`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': this.apiKey,
      },
      body: JSON.stringify({
        to: params.to,
        templateId: params.templateId,
        params: params.params,
        tags: params.tags,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Brevo API error: ${error.message || response.statusText}`);
    }

    const data = await response.json();
    return { messageId: data.messageId };
  }

  // Batch email sending
  async sendBatchEmails(emails: BrevoEmailParams[]): Promise<BrevoResponse[]> {
    const results: BrevoResponse[] = [];
    
    // Process emails in batches to avoid rate limits
    for (const email of emails) {
      try {
        const result = await this.sendTransactionalEmail(email);
        results.push(result);
        
        // Add small delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error('Failed to send email:', error);
        // Continue with other emails even if one fails
        results.push({ messageId: '' });
      }
    }
    
    return results;
  }
}