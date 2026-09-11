import { NextResponse } from 'next/server';
import { resolveDomainExpiration } from '@/lib/domain-expiration';
import { authorizeRawApi, unauthorizedResponse } from '@/lib/raw-api-auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  if (!(await authorizeRawApi(req))) {
    return unauthorizedResponse();
  }

  const { searchParams } = new URL(req.url);
  const domain = searchParams.get('domain')?.toLowerCase();

  if (!domain) {
    return NextResponse.json({ error: 'Domain required' }, { status: 400 });
  }

  // resolveDomainExpiration sudah menangani cache 24 jam + retry saat lookup gagal.
  const resolved = await resolveDomainExpiration(domain);
  return NextResponse.json(resolved);
}
