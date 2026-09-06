import { describe, expect, it } from "vitest";
import { categorizeMime, detectCategory } from "./filetype";

describe("categorizeMime", () => {
  it("maps known image mimes to image", () => {
    expect(categorizeMime("image/png")).toBe("image");
    expect(categorizeMime("image/jpeg")).toBe("image");
  });

  it("maps known video mimes to video", () => {
    expect(categorizeMime("video/mp4")).toBe("video");
    expect(categorizeMime("video/webm")).toBe("video");
  });

  it("maps zip to zip", () => {
    expect(categorizeMime("application/zip")).toBe("zip");
  });

  it("rejects anything not on the allow-list", () => {
    expect(categorizeMime("application/pdf")).toBeNull();
    expect(categorizeMime("text/html")).toBeNull();
    expect(categorizeMime("application/x-msdownload")).toBeNull();
  });
});

describe("detectCategory (real magic bytes)", () => {
  it("detects a PNG signature as image", async () => {
    // PNG signature + the start of the mandatory IHDR chunk (length=13,
    // type="IHDR") — the signature alone isn't enough for file-type to
    // commit to PNG, it also checks the first chunk is really IHDR.
    const png = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48,
      0x44, 0x52,
    ]);
    const result = await detectCategory(png);
    expect(result).toEqual({ category: "image", mime: "image/png", ext: "png" });
  });

  it("detects a ZIP local-file-header signature as zip", async () => {
    const zip = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0, 0, 0, 0, 0, 0, 0, 0]);
    const result = await detectCategory(zip);
    expect(result).toEqual({ category: "zip", mime: "application/zip", ext: "zip" });
  });

  it("rejects a recognized-but-disallowed type (PDF)", async () => {
    const pdf = Buffer.from("%PDF-1.4\n");
    expect(await detectCategory(pdf)).toBeNull();
  });

  it("rejects bytes with no recognizable signature at all", async () => {
    const junk = Buffer.from("just some plain text, not a real file");
    expect(await detectCategory(junk)).toBeNull();
  });
});
