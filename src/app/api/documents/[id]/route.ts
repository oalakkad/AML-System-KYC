import { readFile } from 'fs/promises';
import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth/session';
import { getClientSession } from '@/lib/auth/client-session';
import { decryptBuffer } from '@/lib/crypto';
import { logAudit } from '@/lib/audit';

// Decrypts and streams a stored document to an authorized user — either
// staff (maker/reviewer) or the portal client the case is matched to.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const [session, clientSession] = await Promise.all([getSession(), getClientSession()]);
  if (!session && !clientSession) return new NextResponse('Unauthorized', { status: 401 });

  const { id } = await params;
  const doc = await prisma.document.findUnique({
    where: { id },
    include: { case: { select: { makerId: true, clientEmail: true } } },
  });
  if (!doc || !doc.storagePath) return new NextResponse('Not found', { status: 404 });

  let actorId: string | null = null;
  let clientActorId: string | null = null;
  if (session) {
    const isMaker = doc.case.makerId === session.userId;
    const isReviewer = ['COMPLIANCE_OFFICER', 'SENIOR_MANAGER', 'ADMIN'].includes(session.role);
    if (!isMaker && !isReviewer) return new NextResponse('Forbidden', { status: 403 });
    actorId = session.userId;
  } else if (clientSession) {
    if (!doc.case.clientEmail || doc.case.clientEmail !== clientSession.email) {
      return new NextResponse('Forbidden', { status: 403 });
    }
    clientActorId = clientSession.clientUserId;
  }

  let plain: Buffer;
  try {
    plain = decryptBuffer(await readFile(doc.storagePath));
  } catch {
    return new NextResponse('Document unavailable', { status: 500 });
  }

  await logAudit({
    action: 'DOC_DOWNLOADED',
    caseId: doc.caseId,
    actorId,
    clientActorId,
    details: { docType: doc.docType, fileName: doc.fileName },
  });

  return new NextResponse(new Uint8Array(plain), {
    headers: {
      'Content-Type': doc.mimeType,
      'Content-Length': String(plain.length),
      'Content-Disposition': `attachment; filename="${encodeURIComponent(doc.fileName)}"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
