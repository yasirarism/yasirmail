import type { ParsedAttachment } from '@/lib/email-mime';

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const normalizeCid = (value?: string) => {
  if (!value) return '';
  let normalized = value.replace(/^cid:/i, '').replace(/[<>]/g, '').trim();
  try {
    normalized = decodeURIComponent(normalized);
  } catch {
    // Keep original token if it is not URI-encoded.
  }
  return normalized.toLowerCase();
};

export const resolveCidImages = (html: string, attachments: ParsedAttachment[] = []) => {
  if (!html || attachments.length === 0) return html;
  return html.replace(/src=["']cid:([^"']+)["']/gi, (match, cid) => {
    const needle = normalizeCid(cid);
    const attachment = attachments.find((item) => normalizeCid(item.contentId) === needle);
    if (!attachment?.contentBase64) return match;
    const contentType = attachment.contentType || 'image/png';
    const base64 = attachment.contentBase64.trim().replace(/\s+/g, '');
    if (!base64) return match;
    const dataUrl = base64.startsWith('data:') ? base64 : `data:${contentType};base64,${base64}`;
    return `src="${dataUrl}"`;
  });
};

const sanitizeEmailHtml = (html: string) => {
  if (typeof window === 'undefined') {
    return html.replace(/<script[\s\S]*?<\/script>/gi, '');
  }
  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.querySelectorAll('script, iframe, object, embed, form').forEach((node) => node.remove());
  doc.querySelectorAll('*').forEach((node) => {
    [...node.attributes].forEach((attr) => {
      if (/^on/i.test(attr.name) || /javascript:/i.test(attr.value)) {
        node.removeAttribute(attr.name);
      }
    });
  });
  return doc;
};

const GMAIL_RESET = `
  html, body { margin: 0; padding: 0; background: #ffffff; }
  body {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 14.5px;
    line-height: 1.5;
    color: #222222;
    word-wrap: break-word;
  }
  img { max-width: 100%; height: auto; border: 0; }
  a { color: #1a73e8; }
  pre, code { white-space: pre-wrap; word-break: break-word; }
  mark[data-copy-code] {
    background: #fde68a;
    color: #111827;
    padding: 0 4px;
    border-radius: 4px;
    cursor: pointer;
  }
`;

const highlightOtpCodes = (html: string) => {
  if (typeof window === 'undefined') return html;
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const codeRegex = /\b(\d{4,8})\b/g;
  const keywordRegex =
    /(otp|one[-\s]?time|verification|verifikasi|security|passcode|kode|auth(?:entication)?)/i;
  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    if (node.parentElement?.closest('a, button, script, style, pre, code, mark')) {
      continue;
    }
    const rawText = node.nodeValue || '';
    const textWithoutUrls = rawText.replace(/https?:\/\/[^\s<>"')]+/gi, ' ').trim();
    const standalone = /^\d{4,8}$/.test(textWithoutUrls);
    if ((standalone || keywordRegex.test(textWithoutUrls)) && codeRegex.test(textWithoutUrls)) {
      nodes.push(node);
    }
    codeRegex.lastIndex = 0;
  }
  nodes.forEach((node) => {
    const rawVal = node.nodeValue || '';
    const urls: string[] = [];
    const masked = rawVal.replace(/https?:\/\/[^\s<>"')]+/gi, (url) => {
      urls.push(url);
      return `__URL_MASK_${urls.length - 1}__`;
    });

    const replaced = masked.replace(
      codeRegex,
      '<mark data-copy-code="$1" title="Copy code">$1</mark>'
    );
    if (replaced === masked) return;

    const restored = replaced.replace(/__URL_MASK_(\d+)__/g, (_, idx) => urls[Number(idx)] || '');
    const wrap = doc.createElement('span');
    wrap.innerHTML = restored;
    node.parentNode?.replaceChild(wrap, node);
  });
  return `<!doctype html>${doc.documentElement.outerHTML}`;
};

export const buildGmailPreviewDocument = (
  html: string,
  text: string,
  attachments: ParsedAttachment[] = []
) => {
  const source = html?.trim()
    ? resolveCidImages(html, attachments)
    : `<pre style="white-space:pre-wrap;font-family:Arial,Helvetica,sans-serif;font-size:14.5px;color:#222;margin:0">${escapeHtml(text || '')}</pre>`;
  const parsed = sanitizeEmailHtml(source);
  if (typeof window === 'undefined' || typeof parsed === 'string') {
    return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>${GMAIL_RESET}</style></head><body>${
      typeof parsed === 'string' ? parsed : source
    }</body></html>`;
  }

  const style = parsed.createElement('style');
  style.textContent = GMAIL_RESET;
  parsed.head.prepend(style);
  if (!parsed.querySelector('meta[charset]')) {
    const charset = parsed.createElement('meta');
    charset.setAttribute('charset', 'utf-8');
    parsed.head.prepend(charset);
  }
  if (!parsed.querySelector('meta[name="viewport"]')) {
    const viewport = parsed.createElement('meta');
    viewport.setAttribute('name', 'viewport');
    viewport.setAttribute('content', 'width=device-width, initial-scale=1');
    parsed.head.append(viewport);
  }
  if (!parsed.body.getAttribute('style') && !parsed.body.getAttribute('bgcolor')) {
    parsed.body.setAttribute('style', 'margin:0;padding:16px;background:#ffffff;color:#222222;');
  }
  return highlightOtpCodes(`<!doctype html>${parsed.documentElement.outerHTML}`);
};
