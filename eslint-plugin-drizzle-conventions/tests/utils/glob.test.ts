import { describe, expect, it } from "vitest";

import { globToRegExp, matchesAnyGlob } from "../../src/utils/glob";

describe("globToRegExp", () => {
  it("matches simple literal paths", () => {
    const re = globToRegExp("src/index.ts");
    expect(re.test("src/index.ts")).toBe(true);
    expect(re.test("src/index.tsx")).toBe(false);
    expect(re.test("dist/index.ts")).toBe(false);
  });

  it("treats `*` as a single-segment wildcard (no slashes)", () => {
    const re = globToRegExp("src/*.ts");
    expect(re.test("src/index.ts")).toBe(true);
    expect(re.test("src/utils.ts")).toBe(true);
    expect(re.test("src/sub/index.ts")).toBe(false);
  });

  it("treats `**/` as zero-or-more path segments", () => {
    const re = globToRegExp("**/migrations/**");
    expect(re.test("src/db/migrations/0001-init.ts")).toBe(true);
    expect(re.test("migrations/0001-init.ts")).toBe(true);
    expect(re.test("migrations/sub/dir/file.ts")).toBe(true);
    expect(re.test("src/services/users.ts")).toBe(false);
  });

  it("treats `**` standalone as 'anything including slashes'", () => {
    const re = globToRegExp("src/**");
    expect(re.test("src/a.ts")).toBe(true);
    expect(re.test("src/sub/a.ts")).toBe(true);
    expect(re.test("src/")).toBe(true);
    expect(re.test("dist/a.ts")).toBe(false);
  });

  it("anchors with `^` and `$` (no partial matches)", () => {
    const re = globToRegExp("src/x.ts");
    expect(re.test("foo/src/x.ts")).toBe(false);
    expect(re.test("src/x.ts/extra")).toBe(false);
  });

  it("escapes regex metacharacters in literals", () => {
    const re = globToRegExp("src/a.b+c(d).ts");
    expect(re.test("src/a.b+c(d).ts")).toBe(true);
    expect(re.test("src/aXbXcXdX.ts")).toBe(false);
    expect(re.test("src/a.bxc(d).ts")).toBe(false);
  });

  it("treats `?` as a single non-slash character", () => {
    const re = globToRegExp("src/?.ts");
    expect(re.test("src/a.ts")).toBe(true);
    expect(re.test("src/ab.ts")).toBe(false);
    expect(re.test("src//.ts")).toBe(false);
  });

  it("does not let `*` cross a slash", () => {
    const re = globToRegExp("src/*/index.ts");
    expect(re.test("src/users/index.ts")).toBe(true);
    expect(re.test("src/users/sub/index.ts")).toBe(false);
  });

  it("matches the schema-file pattern correctly", () => {
    const re = globToRegExp("**/schema/**/*.schema.ts");
    expect(re.test("src/schema/users/users.schema.ts")).toBe(true);
    // `**/` matches zero-or-more directory levels at both ends, so the
    // bare `schema/<file>.schema.ts` form is intentionally allowed.
    expect(re.test("schema/users.schema.ts")).toBe(true);
    expect(re.test("src/services/users.service.ts")).toBe(false);
    expect(re.test("src/schema/users/users.types.ts")).toBe(false);
    expect(re.test("src/Schema/Users/users.schema.ts")).toBe(false);
  });

  it("caches compiled regexes by reference", () => {
    const a = globToRegExp("**/users/**");
    const b = globToRegExp("**/users/**");
    expect(a).toBe(b);
  });
});

describe("matchesAnyGlob", () => {
  it("returns false for empty pattern list", () => {
    expect(matchesAnyGlob("anything.ts", [])).toBe(false);
  });

  it("returns true if any pattern matches", () => {
    expect(
      matchesAnyGlob("src/db/migrations/0001.ts", [
        "**/raw/**",
        "**/migrations/**"
      ])
    ).toBe(true);
  });

  it("returns false if no pattern matches", () => {
    expect(
      matchesAnyGlob("src/services/users.ts", ["**/migrations/**", "**/raw/**"])
    ).toBe(false);
  });

  it("normalizes Windows-style backslashes", () => {
    expect(
      matchesAnyGlob("C:\\repo\\src\\db\\migrations\\0001.ts", [
        "**/migrations/**"
      ])
    ).toBe(true);
  });

  it("matches absolute POSIX paths", () => {
    expect(
      matchesAnyGlob("/Users/dev/repo/src/db/migrations/0001.ts", [
        "**/migrations/**"
      ])
    ).toBe(true);
  });
});
