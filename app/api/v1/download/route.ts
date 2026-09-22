import { NextResponse } from 'next/server';
import { inboxKey } from '@/lib/storage-keys';
import { storage } from '@/lib/storage';
import { authenticateApiRequest } from '@/lib/api-auth';
import { buildEmlDocument, sanitizeFilename, type EmlEmail } from '@/lib/email-eml';

export const dynamic = 'force-dynamic';

type InboxEmail = EmlEmail;

const parseEmail = (value: unknown): InboxEmail | null => {
  if (!value) return null;
  if (typeof value === 'string') {
    try { return JSON.parse(value) as InboxEmail; } catch { return null; }
  }
  if (typeof value === 'object') return value as InboxEmail;
  return null;
};

export async function GET(req: Request) {
  const auth = await authenticateApiRequest(req);
  if (!auth) {
    return NextResponse.json(
      { error: 'Unauthorized. Provide a valid API key via Authorization: Bearer <key>' },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const address = searchParams.get('address');
  const emailId = searchParams.get('emailId');
  const type = searchParams.get('type');
  const format = searchParams.get('format');
  const indexParam = searchParams.get('index');

  if (!address || !emailId || !type) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  const emails = await storage.lrange(inboxKey(address), 0, -1);
  const selected = (emails || [])
    .map((item) => parseEmail(item))
    .find((email) => email?.id === emailId);

  if (!selected) {
    return NextResponse.json({ error: 'Email not found' }, { status: 404 });
  }

  if (type === 'email') {
    const filename = sanitizeFilename(selected.subject || 'email', 'email');
    if (format === 'eml') {
      const content = buildEmlDocument(selected);
      return new NextResponse(content, {
        headers: {
          'Content-Type': 'message/rfc822;charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}.eml"`,
        },
      });
    }
    const content = JSON.stringify(selected, null, 2);
    return new NextResponse(content, {
      headers: {
        'Content-Type': 'application/json;charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}.json"`
      }
    });
  }

  if (type === 'attachment') {
    const index = Number(indexParam);
    if (Number.isNaN(index)) {
      return NextResponse.json({ error: 'Invalid attachment index' }, { status: 400 });
    }
    const attachment = selected.attachments?.[index];
    if (attachment?.omitted) {
      return NextResponse.json({ error: 'Attachment too large' }, { status: 413 });
    }
    if (!attachment?.contentBase64) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 });
    }
    const filename = sanitizeFilename(attachment.filename || 'attachment', 'attachment');
    const buffer = Buffer.from(attachment.contentBase64, 'base64');
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': attachment.contentType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });
  }

  return NextResponse.json({ error: 'Invalid download type' }, { status: 400 });
}