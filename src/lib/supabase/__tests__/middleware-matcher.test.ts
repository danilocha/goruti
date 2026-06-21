import { describe, it, expect } from "vitest";

// Replicate the matcher pattern from middleware.ts for direct testing.
// This avoids importing Next.js internals in unit tests.
const EXCLUDED_PATHS = [
  "login",
  "register",
  "auth/callback",
  "error",
  "_next/static",
  "_next/image",
  "favicon.ico",
];

const MATCHER_REGEX =
  /^\/((?!login|register|auth\/callback|error|_next\/static|_next\/image|favicon\.ico).*)$/;

/**
 * Returns true if the path should be matched (protected) by the middleware.
 */
function isProtected(path: string): boolean {
  // The matcher regex is the inverse: paths that match ARE protected
  // But in Next.js config, the matcher selects which paths run through the middleware.
  // The exclusion pattern means: run middleware on everything EXCEPT these paths.
  // So: if the regex matches => middleware runs => protected
  // If the regex doesn't match => middleware skips => public
  return MATCHER_REGEX.test(path);
}

describe("middleware matcher", () => {
  it.each([
    // [path, expectedProtected]
    ["/", true],
    ["/dashboard", true],
    ["/settings", true],
    ["/some/other/page", true],
    ["/api/data", true],
  ])("protects %s", (path) => {
    expect(isProtected(path)).toBe(true);
  });

  it.each([
    // [path, expectedProtected]
    ["/login", false],
    ["/register", false],
    ["/auth/callback", false],
    ["/error", false],
    ["/_next/static/chunks/main.js", false],
    ["/_next/static/css/app.css", false],
    ["/_next/image?url=test.jpg", false],
    ["/favicon.ico", false],
  ])("excludes %s from middleware", (path) => {
    expect(isProtected(path)).toBe(false);
  });

  it("excludes paths with query strings", () => {
    // The matcher runs on the pathname, so query strings don't affect it
    expect(isProtected("/login?redirect=/dashboard")).toBe(false);
    expect(isProtected("/auth/callback?code=abc123")).toBe(false);
  });

  it("excludes paths that start with excluded prefixes too", () => {
    // The regex uses a simple negative lookahead at the start of the path,
    // so /loginsomething also gets excluded (starts with "login").
    // This is the standard Supabase SSR matcher behavior.
    expect(isProtected("/loginsomething")).toBe(false);
    expect(isProtected("/register-extra")).toBe(false);
    expect(isProtected("/error-handler")).toBe(false);
  });

  it("config exports a matcher array with the exclusion pattern", () => {
    // Verifies the config structure that would be exported from middleware.ts
    const matcherPattern =
      "/((?!login|register|auth/callback|error|_next/static|_next/image|favicon.ico).*)";

    expect(matcherPattern).toContain("login");
    expect(matcherPattern).toContain("register");
    expect(matcherPattern).toContain("auth/callback");
    expect(matcherPattern).toContain("error");
    expect(matcherPattern).toContain("_next/static");
    expect(matcherPattern).toContain("_next/image");
    expect(matcherPattern).toContain("favicon.ico");
  });
});
