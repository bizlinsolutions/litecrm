import axios from 'axios';
import crypto from 'crypto';
import dbConnect from '@/lib/mongodb';
import Webhook from '@/models/Webhook';

export interface WebhookPayload {
  event: string;
  data: any;
  timestamp: string;
  id: string;
}

export async function triggerWebhooks(event: string, data: any) {
  try {
    await dbConnect();

    const webhooks = await Webhook.find({
      isActive: true,
      events: event,
    });

    const payload: WebhookPayload = {
      event,
      data,
      timestamp: new Date().toISOString(),
      id: crypto.randomUUID(),
    };

    const promises = webhooks.map(webhook => sendWebhook(webhook, payload));
    await Promise.allSettled(promises);
  } catch (error) {
    console.error('Error triggering webhooks:', error);
  }
}

async function sendWebhook(webhook: any, payload: WebhookPayload, attempt = 1): Promise<void> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'LiteCRM-Webhook/1.0',
      ...webhook.headers,
    };

    // Add signature if secret is provided
    if (webhook.secret) {
      const signature = crypto
        .createHmac('sha256', webhook.secret)
        .update(JSON.stringify(payload))
        .digest('hex');
      headers['X-Webhook-Signature'] = `sha256=${signature}`;
    }

    const response = await axios.post(webhook.url, payload, {
      headers,
      timeout: 30000, // 30 seconds
    });

    if (response.status >= 200 && response.status < 300) {
      // Success - reset failure count and update last triggered
      await Webhook.findByIdAndUpdate(webhook._id, {
        failureCount: 0,
        lastTriggered: new Date(),
      });
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    console.error(`Webhook ${webhook._id} failed (attempt ${attempt}):`, error);

    // Increment failure count
    const failureCount = webhook.failureCount + 1;
    await Webhook.findByIdAndUpdate(webhook._id, { failureCount });

    // Retry if we haven't exceeded max retries
    if (attempt < webhook.maxRetries) {
      setTimeout(() => {
        sendWebhook(webhook, payload, attempt + 1);
      }, webhook.retryDelay * attempt); // Exponential backoff
    } else {
      // Max retries exceeded - optionally disable webhook
      if (failureCount >= 10) {
        await Webhook.findByIdAndUpdate(webhook._id, { isActive: false });
        console.error(`Webhook ${webhook._id} disabled after ${failureCount} failures`);
      }
    }
  }
}

// Webhook event constants
export const WEBHOOK_EVENTS = {
  CUSTOMER_CREATED: 'customer.created',
  CUSTOMER_UPDATED: 'customer.updated',
  CUSTOMER_DELETED: 'customer.deleted',
  INVOICE_CREATED: 'invoice.created',
  INVOICE_UPDATED: 'invoice.updated',
  INVOICE_PAID: 'invoice.paid',
  TASK_CREATED: 'task.created',
  TASK_UPDATED: 'task.updated',
  TASK_COMPLETED: 'task.completed',
  TICKET_CREATED: 'ticket.created',
  TICKET_UPDATED: 'ticket.updated',
  TICKET_RESOLVED: 'ticket.resolved',
  USER_CREATED: 'user.created',
  USER_UPDATED: 'user.updated',
} as const;
