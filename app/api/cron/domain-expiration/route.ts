import { NextResponse } from 'next/server';
import { refreshDomainExpiration } from '@/lib/domain-expiration';
import { getStoredDomains } from '@/lib/domains';

const getCronSecret = () => process.env.CRON_SECRET?.trim();

const isAuthorized = (req: Request) => {
  const secret = getCronSecret();
  if (!secret) return true;
  const header = req.headers.get('x-cron-secret');
  if (header === secret) return true;
  // Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`
  const authHeader = req.headers.get('authorization');
  return authHeader === `Bearer ${secret}`;
};

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const domains = await getStoredDomains();
  const results = await Promise.all(
    domains.map((domain) => refreshDomainExpiration(domain))
  );

  return NextResponse.json({
    updated: results.length,
    domains: results
  });
}
