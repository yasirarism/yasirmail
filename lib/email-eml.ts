export type EmlAttachment = {
  filename?: string;
  contentType?: string;
  contentBase64?: string;
  omitted?: boolean;
  size?: number;
  contentId?: string;
};

export type EmlEmail = {
  id?: string;
  from?: string;
  to?: string;
  subject?: string;
  text?: string;
  html?: string;
  receivedAt?: string;
  attachments?: EmlAttachment[];
};

export const sanitizeFilename = (value?: string, fallback = 'email'): string => {
  const safe = (value || '')
    .replace(/[^a-z0-9-_.]+/gi, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 60);
  return safe || fallback;
};

const wrapBase64 = (base64: string): string => {
  const clean = base64.replace(/\s+/g, '');
  const chunks = clean.match(/.{1,76}/g);
  return chunks ? chunks.join('\r\n') : clean;
};

export const buildEmlDocument = (email: EmlEmail): string => {
  const subject = email.subject || '(No Subject)';
  const dateStr = email.receivedAt ? new Date(email.receivedAt).toUTCString() : new Date().toUTCString();
  const validAttachments = (email.attachments || []).filter(
    (att) => att && !att.omitted && att.contentBase64
  );

  const lines: string[] = [
    `From: ${email.from || ''}`,
    `To: ${email.to || ''}`,
    `Subject: ${subject}`,
    `Date: ${dateStr}`,
    'MIME-Version: 1.0',
  ];

  if (email.id) {
    lines.push(`Message-ID: <${email.id}@vaultmail>`);
  }

  const textBody = email.text || '';
  const htmlBody = email.html || '';
  const hasText = Boolean(textBody.trim());
  const hasHtml = Boolean(htmlBody.trim());

  const makeBodySection = (boundaryPrefix: string): string[] => {
    if (hasText && hasHtml) {
      const altBoundary = `----=_Part_Alt_${boundaryPrefix}_${Date.now().toString(36)}`;
      return [
        `Content-Type: multipart/alternative; boundary="${altBoundary}"`,
        '',
        `--${altBoundary}`,
        'Content-Type: text/plain; charset=utf-8',
        'Content-Transfer-Encoding: 8bit',
        '',
        textBody,
        '',
        `--${altBoundary}`,
        'Content-Type: text/html; charset=utf-8',
        'Content-Transfer-Encoding: 8bit',
        '',
        htmlBody,
        '',
        `--${altBoundary}--`,
      ];
    }
    if (hasHtml) {
      return [
        'Content-Type: text/html; charset=utf-8',
        'Content-Transfer-Encoding: 8bit',
        '',
        htmlBody,
      ];
    }
    return [
      'Content-Type: text/plain; charset=utf-8',
      'Content-Transfer-Encoding: 8bit',
      '',
      textBody,
    ];
  };

  if (validAttachments.length > 0) {
    const mixedBoundary = `----=_Part_Mixed_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    lines.push(`Content-Type: multipart/mixed; boundary="${mixedBoundary}"`, '');
    lines.push(`--${mixedBoundary}`);
    lines.push(...makeBodySection('mixed'));
    lines.push('');

    for (const att of validAttachments) {
      const filename = sanitizeFilename(att.filename, 'attachment');
      const contentType = att.contentType || 'application/octet-stream';
      const disposition = `attachment; filename="${filename}"`;
      lines.push(
        `--${mixedBoundary}`,
        `Content-Type: ${contentType}; name="${filename}"`,
        `Content-Disposition: ${disposition}`,
        'Content-Transfer-Encoding: base64'
      );
      if (att.contentId) {
        lines.push(`Content-ID: <${att.contentId.replace(/[<>]/g, '')}>`);
      }
      lines.push('', wrapBase64(att.contentBase64 || ''), '');
    }
    lines.push(`--${mixedBoundary}--`);
  } else {
    lines.push(...makeBodySection('root'));
  }

  return lines.join('\r\n');
};
