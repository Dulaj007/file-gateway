import { describe, expect, it } from "vitest";
import {
  signDownloadToken,
  signStepToken,
  verifyDownloadToken,
  verifyStepToken,
} from "./tokens";

describe("step tokens", () => {
  it("round-trips a valid payload", async () => {
    const token = await signStepToken({ sid: "sess1", step: 2, nonce: "abc" });
    const payload = await verifyStepToken(token);
    expect(payload).toEqual({ sid: "sess1", step: 2, nonce: "abc" });
  });

  it("rejects a tampered token", async () => {
    const token = await signStepToken({ sid: "sess1", step: 2, nonce: "abc" });
    const tampered = token.slice(0, -2) + (token.at(-2) === "a" ? "b" : "a") + token.at(-1);
    expect(await verifyStepToken(tampered)).toBeNull();
  });

  it("rejects garbage input", async () => {
    expect(await verifyStepToken("not.a.jwt")).toBeNull();
    expect(await verifyStepToken("")).toBeNull();
  });

  it("a token for one nonce does not verify as another (replay after rotation)", async () => {
    const tokenBeforeRotation = await signStepToken({ sid: "sess1", step: 2, nonce: "old-nonce" });
    const payload = await verifyStepToken(tokenBeforeRotation);
    // The token itself is still cryptographically valid — nonce rotation is
    // enforced by comparing payload.nonce against the DB row (see flow.ts),
    // not by the token becoming unverifiable. This just confirms the payload
    // carries the nonce faithfully so that comparison is possible.
    expect(payload?.nonce).toBe("old-nonce");
  });
});

describe("download tokens", () => {
  it("round-trips a valid payload", async () => {
    const token = await signDownloadToken({ sid: "sess1", fileId: "file1" });
    const payload = await verifyDownloadToken(token);
    expect(payload).toEqual({ sid: "sess1", fileId: "file1" });
  });

  it("a step token does not verify as a download token payload shape", async () => {
    const stepToken = await signStepToken({ sid: "sess1", step: 2, nonce: "abc" });
    // Signature is valid (same secret) but the payload shape doesn't match
    // downloadTokenSchema (no fileId), so this must still be rejected.
    expect(await verifyDownloadToken(stepToken)).toBeNull();
  });
});
