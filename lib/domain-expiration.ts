import { domainExpirationKey } from '@/lib/storage-keys';
import { storage } from '@/lib/storage';

/** Data dianggap segar (tidak perlu lookup ulang) selama ini. */
const SUCCESS_TTL_MS = 24 * 60 * 60 * 1000;
/** Kalau lookup GAGAL, tunggu ini sebelum coba lagi (biar tidak hammer upstream). */
const FAILURE_RETRY_MS = 10 * 60 * 1000;
/** Batas simpan record — lebih panjang dari TTL supaya data lama masih bisa dipakai. */
const RECORD_TTL_SECONDS = 48 * 60 * 60;
/** Timeout per sumber lookup. */
const LOOKUP_TIMEOUT_MS = 12 * 1000;

const WHOIS_SEARCH_API_BASE_URL = 'https://whois-search.vercel.app/api/lookup';
const WHOIS_SEARCH_API_HEADERS = {
  accept: 'application/json',
  'user-agent': 'VaultMail/1.0 (domain-expiration-check)',
};
const RDAP_BASE_URL = 'https://rdap.org/domain/';

export type DomainExpirationRecord = {
  domain: string;
  expiresAt: string | null;
  /** Waktu (ISO) nilai expiresAt terakhir berhasil didapat. */
  checkedAt: string;
  /** Waktu (ISO) percobaan lookup terakhir — dipakai untuk backoff saat gagal. */
  attemptedAt?: string;
  lastError?: string | null;
};

export type ResolvedDomainExpiration = DomainExpirationRecord & {
  /** true bila data berasal dari cache lama karena lookup terbaru gagal. */
  stale: boolean;
};

/** fetch dengan timeout eksplisit (AbortSignal.timeout tidak ada di semua runtime). */
const fetchWithTimeout = async (url: string, init: RequestInit = {}) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LOOKUP_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
};

const toIsoOrNull = (value: unknown): string | null => {
  if (!value || typeof value !== 'string') return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
};

/** Sumber 1: RDAP (cepat, tanpa port 43). */
const fetchExpirationFromRdap = async (domain: string): Promise<string | null> => {
  try {
    const response = await fetchWithTimeout(`${RDAP_BASE_URL}${encodeURIComponent(domain)}`, {
      redirect: 'follow',
      headers: { accept: 'application/rdap+json' },
    });
    if (!response.ok) return null;
    const data = (await response.json()) as {
      events?: Array<{ eventAction?: string; eventDate?: string }>;
    };
    const expiration = data.events?.find((event) => event.eventAction === 'expiration');
    return toIsoOrNull(expiration?.eventDate);
  } catch (error) {
    console.warn(`RDAP lookup failed for ${domain}:`, error);
    return null;
  }
};

/** Sumber 2: whois-search API (fallback, termasuk TLD yang tak punya RDAP). */
const fetchExpirationFromWhoisSearch = async (domain: string): Promise<string | null> => {
  try {
    const requestUrl = new URL(WHOIS_SEARCH_API_BASE_URL);
    requestUrl.searchParams.set('query', domain);
    const response = await fetchWithTimeout(requestUrl.toString(), {
      redirect: 'follow',
      headers: { ...WHOIS_SEARCH_API_HEADERS },
    });
    if (!response.ok) return null;
    const data = (await response.json()) as {
      status?: boolean;
      result?: { expirationDate?: string | null };
    };
    return toIsoOrNull(data.result?.expirationDate);
  } catch (error) {
    console.warn(`WHOIS Search API lookup failed for ${domain}:`, error);
    return null;
  }
};

/** Coba semua sumber, urut dari yang paling cepat. */
const fetchExpiration = async (domain: string): Promise<string | null> => {
  const rdap = await fetchExpirationFromRdap(domain);
  if (rdap) return rdap;
  return fetchExpirationFromWhoisSearch(domain);
};

const parseRecord = (value: unknown): DomainExpirationRecord | null => {
  if (!value) return null;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as DomainExpirationRecord;
    } catch {
      return null;
    }
  }
  if (typeof value === 'object') {
    return value as DomainExpirationRecord;
  }
  return null;
};

export const getStoredDomainExpiration = async (domain: string) => {
  const key = domainExpirationKey(domain);
  try {
    return parseRecord(await storage.get(key));
  } catch (error) {
    console.error('Domain expiration cache read failed:', error);
    return null;
  }
};

const ageMs = (iso?: string) => {
  const time = iso ? new Date(iso).getTime() : NaN;
  if (!Number.isFinite(time)) return Number.POSITIVE_INFINITY;
  return Date.now() - time;
};

const needsLookup = (record: DomainExpirationRecord | null) => {
  if (!record) return true;
  const ttl = record.expiresAt ? SUCCESS_TTL_MS : FAILURE_RETRY_MS;
  return ageMs(record.attemptedAt ?? record.checkedAt) > ttl;
};

const writeRecord = async (record: DomainExpirationRecord) => {
  try {
    await storage.set(domainExpirationKey(record.domain), record, { ex: RECORD_TTL_SECONDS });
  } catch (error) {
    console.error('Domain expiration cache write failed:', error);
  }
};

const toResolved = (record: DomainExpirationRecord): ResolvedDomainExpiration => ({
  ...record,
  stale: Boolean(record.expiresAt) && ageMs(record.checkedAt) > SUCCESS_TTL_MS,
});

/**
 * Sumber tunggal untuk status expiration domain.
 *
 * - Data sukses dipakai 24 jam sebelum lookup ulang.
 * - Lookup gagal TIDAK menghapus nilai lama (dulu `storage.del` → UI kosong permanen);
 *   nilai lama tetap disajikan (ditandai `stale`) dan lookup diulang tiap 10 menit.
 */
export const resolveDomainExpiration = async (
  domain: string
): Promise<ResolvedDomainExpiration> => {
  const normalized = domain.toLowerCase().trim();
  const stored = await getStoredDomainExpiration(normalized);
  if (stored && !needsLookup(stored)) {
    return toResolved(stored);
  }

  const nowIso = new Date().toISOString();
  const expiresAt = await fetchExpiration(normalized);

  if (expiresAt) {
    const record: DomainExpirationRecord = {
      domain: normalized,
      expiresAt,
      checkedAt: nowIso,
      attemptedAt: nowIso,
      lastError: null,
    };
    await writeRecord(record);
    return toResolved(record);
  }

  // Lookup gagal: pertahankan nilai lama bila ada.
  const fallback: DomainExpirationRecord = stored
    ? { ...stored, attemptedAt: nowIso, lastError: 'lookup failed' }
    : { domain: normalized, expiresAt: null, checkedAt: nowIso, attemptedAt: nowIso, lastError: 'lookup failed' };
  await writeRecord(fallback);
  return toResolved(fallback);
};

/**
 * Paksa lookup ulang (dipakai cron harian / API) dan simpan hasilnya.
 * Sama seperti resolveDomainExpiration tanpa memakai masa segar 24 jam.
 */
export const refreshDomainExpiration = async (domain: string) => {
  const normalized = domain.toLowerCase().trim();
  const stored = await getStoredDomainExpiration(normalized);
  const nowIso = new Date().toISOString();
  const expiresAt = await fetchExpiration(normalized);

  if (expiresAt) {
    const record: DomainExpirationRecord = {
      domain: normalized,
      expiresAt,
      checkedAt: nowIso,
      attemptedAt: nowIso,
      lastError: null,
    };
    await writeRecord(record);
    return record;
  }

  const fallback: DomainExpirationRecord = stored
    ? { ...stored, attemptedAt: nowIso, lastError: 'lookup failed' }
    : { domain: normalized, expiresAt: null, checkedAt: nowIso, attemptedAt: nowIso, lastError: 'lookup failed' };
  await writeRecord(fallback);
  return fallback;
};
