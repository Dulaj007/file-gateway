import { db } from "@/lib/db";
import { articleSiteForStep, pickRandomActiveArticleSlug } from "@/lib/articles";
import { getSettings } from "@/lib/settings";
import { randomSlug } from "@/lib/slug";
import {
  signDownloadToken,
  signStepToken,
  verifyDownloadToken,
  verifyStepToken,
  type StepTokenPayload,
} from "@/lib/tokens";
import type { DownloadSession, FileItem, Setting } from "@/generated/prisma/client";

const SESSION_TTL_MS = 20 * 60 * 1000; // SDD §6: "short TTL, e.g. now + 20 min"

export function isFileDownloadable(file: FileItem): boolean {
  if (file.status !== "active" || !file.downloadEnabled) return false;
  if (file.expiresAt && file.expiresAt.getTime() < Date.now()) return false;
  return true;
}

function totalSteps(settings: Setting): number {
  return 2 + settings.articleHops;
}

// Hop/final/file URLs are all built from the *configured* domain (Setting
// row), not the host the current request happened to arrive on — the article
// hops in particular must cross to a genuinely different domain.
function originFor(protocol: string, domain: string): string {
  return `${protocol}://${domain}`;
}

// Mints the token + URL for whatever comes after `newStep` was just written
// to the session row. Shared by startSession's initial 1->2 bootstrap and
// advanceSession's normal N->N+1 transitions.
async function issueNextHop(
  protocol: string,
  session: DownloadSession,
  newStep: number,
  newNonce: string
): Promise<{ ok: true; url: string } | { ok: false; reason: string }> {
  const settings = await getSettings();
  const total = totalSteps(settings);
  const token = await signStepToken({ sid: session.id, step: newStep, nonce: newNonce });

  if (newStep >= total) {
    const file = await db.fileItem.findUniqueOrThrow({ where: { id: session.fileId } });
    // The final page lives on the middle site (e.g. upTimer), not MAIN — MAIN
    // is upload/admin only and isn't part of the visible flow. Falls back to
    // mainDomain if middleDomain isn't configured yet.
    const origin = originFor(protocol, settings.middleDomain || settings.mainDomain);
    return { ok: true, url: `${origin}/dl/${file.finalSlug}?g=${token}` };
  }

  const siteKey = articleSiteForStep(newStep);
  const articleSlug = await pickRandomActiveArticleSlug(siteKey);
  if (!articleSlug) {
    // Misconfiguration (no active articles for this site) — not something a
    // visitor caused, but the flow genuinely cannot continue.
    return { ok: false, reason: "This link is temporarily unavailable. Please try again later." };
  }

  const domain = siteKey === "article1" ? settings.article1Domain : settings.article2Domain;
  const origin = originFor(protocol, domain);
  return { ok: true, url: `${origin}/article/${articleSlug}?g=${token}` };
}

export type PeekResult =
  | { ok: true; session: DownloadSession; payload: StepTokenPayload }
  | { ok: false };

// Read-only validation: does this token currently, exactly match the live
// session state? Used to decide what a hop/final page should render, without
// mutating anything (mutation only happens in advanceSession/completeSession
// via an explicit user action).
//
// `expectedStep`, when given, additionally requires the token to be for that
// specific step — this is what stops someone pasting a valid step-2 token
// into the /dl/{finalSlug} URL (or a step-3 URL, etc.): the token could pass
// every other check yet still not be for the step the page actually is.
export async function peekSession(token: string, expectedStep?: number): Promise<PeekResult> {
  const payload = await verifyStepToken(token);
  if (!payload) return { ok: false };

  const session = await db.downloadSession.findUnique({ where: { id: payload.sid } });
  if (!session) return { ok: false };
  if (session.completed) return { ok: false };
  if (session.expiresAt.getTime() < Date.now()) return { ok: false };
  // The two checks that make replay/skip impossible: the token must match
  // BOTH the step the session is currently on AND its current nonce. Every
  // advance rotates the nonce, so a stale or replayed token fails here even
  // if its step number would otherwise look plausible.
  if (session.currentStep !== payload.step) return { ok: false };
  if (session.nonce !== payload.nonce) return { ok: false };
  if (expectedStep !== undefined && payload.step !== expectedStep) return { ok: false };

  const file = await db.fileItem.findUnique({ where: { id: session.fileId } });
  if (!file || !isFileDownloadable(file)) return { ok: false };

  return { ok: true, session, payload };
}

export async function startSession(
  protocol: string,
  publicSlug: string,
  visitorIp: string | null
): Promise<{ ok: true; nextUrl: string } | { ok: false; reason: string }> {
  const file = await db.fileItem.findUnique({ where: { publicSlug } });
  if (!file || !isFileDownloadable(file)) {
    return { ok: false, reason: "This link is invalid or has expired." };
  }

  const session = await db.downloadSession.create({
    data: {
      fileId: file.id,
      currentStep: 1,
      nonce: randomSlug(16),
      visitorIp,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    },
  });

  const newStep = 2;
  const newNonce = randomSlug(16);
  await db.downloadSession.update({
    where: { id: session.id },
    data: { currentStep: newStep, nonce: newNonce },
  });

  const hop = await issueNextHop(protocol, session, newStep, newNonce);
  if (!hop.ok) return hop;
  return { ok: true, nextUrl: hop.url };
}

export async function advanceSession(
  protocol: string,
  token: string
): Promise<{ ok: true; nextUrl: string } | { ok: false; reason: string }> {
  const peek = await peekSession(token);
  if (!peek.ok) return { ok: false, reason: "This link is invalid or has expired." };

  const newStep = peek.session.currentStep + 1;
  const newNonce = randomSlug(16);
  await db.downloadSession.update({
    where: { id: peek.session.id },
    data: { currentStep: newStep, nonce: newNonce },
  });

  const hop = await issueNextHop(protocol, peek.session, newStep, newNonce);
  if (!hop.ok) return hop;
  return { ok: true, nextUrl: hop.url };
}

export async function completeSession(
  protocol: string,
  token: string
): Promise<{ ok: true; downloadUrl: string } | { ok: false; reason: string }> {
  const settings = await getSettings();
  const peek = await peekSession(token, totalSteps(settings));
  if (!peek.ok) return { ok: false, reason: "This link is invalid or has expired." };

  const dlToken = await signDownloadToken({ sid: peek.session.id, fileId: peek.session.fileId });
  const origin = originFor(protocol, settings.mainDomain);
  return { ok: true, downloadUrl: `${origin}/api/file/${peek.session.fileId}?dl=${dlToken}` };
}

export async function redeemDownloadToken(
  fileIdFromUrl: string,
  token: string
): Promise<{ ok: true; file: FileItem } | { ok: false; reason: string }> {
  const payload = await verifyDownloadToken(token);
  if (!payload || payload.fileId !== fileIdFromUrl) {
    return { ok: false, reason: "This download link is invalid or has expired." };
  }

  const file = await db.fileItem.findUnique({ where: { id: payload.fileId } });
  if (!file || !isFileDownloadable(file)) {
    return { ok: false, reason: "This file is no longer available." };
  }

  // Atomic single-use claim: succeeds only if this session hasn't already
  // been completed by a concurrent or replayed request. A plain
  // read-then-write here would leave a window where two requests racing on
  // the same token could both pass a completed===false check before either
  // writes completed=true.
  const claim = await db.downloadSession.updateMany({
    where: { id: payload.sid, fileId: payload.fileId, completed: false },
    data: { completed: true },
  });
  if (claim.count === 0) {
    return { ok: false, reason: "This download link has already been used or is invalid." };
  }

  await db.fileItem.update({ where: { id: file.id }, data: { downloadCount: { increment: 1 } } });

  return { ok: true, file };
}
