import 'server-only';
import { prisma } from '@/lib/db';

/**
 * Cases matched to a portal account — either self-created (clientMakerId) or
 * a staff-created case matched by KycCase.clientEmail. A self-created DRAFT
 * is the client's own in-progress form and stays visible so they can resume
 * it; a staff-created DRAFT is excluded — front office hasn't submitted it
 * yet, so there's nothing for the client to review, upload against, or sign.
 */
export async function getClientCases(clientUserId: string, email: string) {
  return prisma.kycCase.findMany({
    where: {
      OR: [{ clientMakerId: clientUserId }, { clientEmail: email, status: { not: 'DRAFT' } }],
    },
    select: {
      id: true,
      caseNumber: true,
      clientType: true,
      status: true,
      clientMakerId: true,
      submittedAt: true,
      clientSignedAt: true,
      createdAt: true,
      profile: { select: { fullName: true } },
      corporateProfile: { select: { legalName: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

/** A single matched case (self-created or staff-created), scoped to the requesting client. */
export async function getClientCase(caseId: string, clientUserId: string, email: string) {
  const kase = await prisma.kycCase.findUnique({
    where: { id: caseId },
    include: {
      profile: true,
      corporateProfile: true,
      documents: { orderBy: { createdAt: 'asc' } },
    },
  });
  if (!kase) return null;
  const owns = kase.clientMakerId === clientUserId || kase.clientEmail === email;
  return owns ? kase : null;
}
