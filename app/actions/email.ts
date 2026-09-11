'use server';

import { getInboxEmails } from '@/lib/inbox-service';
import { storage } from '@/lib/storage';
import { inboxKey } from '@/lib/storage-keys';

/**
 * Server-side data fetching for the web UI.
 *
 * Security model:
 * - These run on the server with Next.js server-action CSRF protection
 *   (POST-only, Next-Action header, same-origin), so they can't be
 *   replayed by an external script the way a plain GET /api/* could.
 * - The data they serve (temp-mail inbox for a known address) is public
 *   by design — anyone who knows the address can read it.
 * - The RAW API endpoints (/api/*, /api/v1/*) are the protected surface
 *   for external developers (require GitHub session / API key).
 */

export async function getInboxData(address: string, forceResync = false) {
  if (!address) return { error: 'Address required' };
  try {
    const result = await getInboxEmails(address, forceResync);
    return { emails: result.emails, imapDebug: result.imapDebug };
  } catch (error) {
    console.error('Inbox action error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { error: message, emails: [], checkedAt: new Date().toISOString() };
  }
}

export async function deleteInboxEmail(address: string, emailId: string) {
  if (!address || !emailId) return { error: 'Address and emailId required' };
  try {
    const deleted = await storage.ldeleteByIds(inboxKey(address), [emailId]);
    return { success: true, deleted };
  } catch (error) {
    console.error('Delete action error:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function getDomainsData() {
  try {
    const { DOMAINS_SETTINGS_KEY } = await import('@/lib/admin-auth');
    const raw = await storage.get(DOMAINS_SETTINGS_KEY);
    const domains = (raw && typeof raw === 'object' ? (raw as { domains?: string[] }).domains : null) || [];
    return { domains };
  } catch (error) {
    console.error('Domains action error:', error);
    return { error: 'Failed to load domains', domains: [] };
  }
}

export async function getDomainExpiration(domain: string) {
  if (!domain) return { expiresAt: null, checkedAt: new Date().toISOString(), stale: false };
  try {
    const { resolveDomainExpiration } = await import('@/lib/domain-expiration');
    const record = await resolveDomainExpiration(domain);
    return {
      expiresAt: record.expiresAt,
      checkedAt: record.checkedAt,
      stale: record.stale,
    };
  } catch (error) {
    console.error('Domain expiration action error:', error);
    return { expiresAt: null, checkedAt: new Date().toISOString(), stale: false };
  }
}

export async function getRetentionSettings() {
  try {
    const { RETENTION_SETTINGS_KEY } = await import('@/lib/admin-auth');
    const raw = await storage.get(RETENTION_SETTINGS_KEY);
    const settings = (raw && typeof raw === 'object' ? raw : {}) as { seconds: number };
    return { seconds: settings.seconds || 86400 };
  } catch {
    return { seconds: 86400 };
  }
}

export async function getBrandingSettings() {
  try {
    const { BRANDING_SETTINGS_KEY } = await import('@/lib/admin-auth');
    const raw = await storage.get(BRANDING_SETTINGS_KEY);
    const settings = (raw && typeof raw === 'object' ? raw : {}) as Record<string, string>;
    return settings;
  } catch {
    return {};
  }
}

export async function downloadEmailContent(address: string, emailId: string) {
  try {
    const emails = await storage.lrange(inboxKey(address), 0, -1);
    const email = (emails || []).find((e: unknown) => {
      const item = e as { id?: string };
      return item.id === emailId;
    });
    if (!email) return { error: 'Email not found' };
    const content = JSON.stringify(email, null, 2);
    const subject = (email as { subject?: string }).subject || 'email';
    const filename = subject.replace(/[^a-z0-9-_.]+/gi, '_').replace(/^_+|_+$/g, '') || 'email';
    return { content, filename: `${filename}.json`, type: 'application/json' };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Download failed' };
  }
}

export async function downloadAttachmentContent(address: string, emailId: string, index: number) {
  try {
    const emails = await storage.lrange(inboxKey(address), 0, -1);
    const email = (emails || []).find((e: unknown) => {
      const item = e as { id?: string };
      return item.id === emailId;
    });
    if (!email) return { error: 'Email not found' };
    const attachment = (email as { attachments?: Array<{ contentBase64?: string; filename?: string; contentType?: string }> }).attachments?.[index];
    if (!attachment?.contentBase64) return { error: 'Attachment not found' };
    const filename = attachment.filename?.replace(/[^a-z0-9-_.]+/gi, '_').replace(/^_+|_+$/g, '') || 'attachment';
    return {
      content: attachment.contentBase64,
      filename,
      type: attachment.contentType || 'application/octet-stream',
      isBase64: true,
    };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Download failed' };
  }
}

export async function getBreachCheck(email: string) {
  try {
    const res = await fetch(`https://api.xposedornot.com/v1/breach-analytics?email=${encodeURIComponent(email)}`);
    if (!res.ok) return { error: 'Breach check failed' };
    const data = await res.json();
    return data;
  } catch {
    return { error: 'Breach check failed' };
  }
}
