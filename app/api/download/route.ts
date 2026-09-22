import { NextResponse } from 'next/server';
import { inboxKey } from '@/lib/storage-keys';
import { storage } from '@/lib/storage';
import { buildEmlDocument, sanitizeFilename, type EmlEmail } from '@/lib/email-eml';

type InboxEmail = EmlEmail;

const parseEmail = (value: unknown): InboxEmail | null => {
  if (!value) return null;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as InboxEmail;
    } catch {
      return null;
    }
  }
  if (typeof value === 'object') {
    return value as InboxEmail;
  }
  return null;
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get('address');
  const emailId = searchParams.get('emailId');
  const type = searchParams.get('type');
  const indexParam = searchParams.get('index');

  if (!(await (await import('@/lib/raw-api-auth')).authorizeRawApi(req))) {
    return (await import('@/lib/raw-api-auth')).unauthorizedResponse();
  }

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
    const content = buildEmlDocument(selected);
    const filename = sanitizeFilename(selected.subject || 'email', 'email');
    return new NextResponse(content, {
      headers: {
        'Content-Type': 'message/rfc822;charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}.eml"`
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
      return NextResponse.json(
        { error: 'Attachment too large to download' },
        { status: 413 }
      );
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
