import * as parser from "@typescript-eslint/parser";
import type { TSESTree } from "@typescript-eslint/utils";
import { describe, expect, it } from "vitest";

import {
  analyzeThreeImports,
  isLegacyExamplesJsmSource,
  isThreeCdnSource,
  isThreePackageSource,
  isThreeSrcSource,
  rewriteExamplesJsmToAddons
} from "../src/utils/three";

function parseProgram(code: string): TSESTree.Program {
  return parser.parseForESLint(code, {
    range: true,
    loc: true,
    tokens: false,
    comment: false,
    ecmaVersion: 2022,
    sourceType: "module"
  }).ast;
}

describe("three utils", () => {
  it("classifies package, legacy, src, and CDN sources", () => {
    expect(isThreePackageSource("three")).toBe(true);
    expect(isThreePackageSource("three/addons/loaders/GLTFLoader.js")).toBe(true);
    expect(isThreePackageSource("./math")).toBe(false);

    expect(isLegacyExamplesJsmSource("three/examples/jsm/loaders/GLTFLoader.js")).toBe(true);
    expect(isLegacyExamplesJsmSource("three/addons/loaders/GLTFLoader.js")).toBe(false);

    expect(isThreeSrcSource("three/src/Three.js")).toBe(true);
    expect(isThreeSrcSource("three/addons/controls/OrbitControls.js")).toBe(false);

    expect(isThreeCdnSource("https://unpkg.com/three@0.160.0/build/three.module.js")).toBe(true);
    expect(isThreeCdnSource("three")).toBe(false);
  });

  it("rewrites examples/jsm to addons and leaves other paths alone", () => {
    expect(rewriteExamplesJsmToAddons("three/examples/jsm/loaders/GLTFLoader.js")).toBe(
      "three/addons/loaders/GLTFLoader.js"
    );
    expect(rewriteExamplesJsmToAddons("three/addons/loaders/GLTFLoader.js")).toBeNull();
  });

  it("records aliased named imports, namespaces, and addon paths", () => {
    const imports = analyzeThreeImports(
      parseProgram(`
        import * as THREE from "three";
        import { Scene as S, Vector3 } from "three";
        import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
      `)
    );

    expect(imports.hasThreeImport).toBe(true);
    expect(imports.namespaceNames.has("THREE")).toBe(true);
    expect(imports.namedBindings.get("S")).toBe("Scene");
    expect(imports.namedBindings.get("Vector3")).toBe("Vector3");
    expect(imports.namedBindings.get("GLTFLoader")).toBe("GLTFLoader");
  });

  it("ignores same-named imports from other modules", () => {
    const imports = analyzeThreeImports(
      parseProgram(`
        import { Vector3 } from "./math";
        import { Scene } from "other-three";
      `)
    );

    expect(imports.hasThreeImport).toBe(false);
    expect(imports.namedBindings.size).toBe(0);
  });
});
