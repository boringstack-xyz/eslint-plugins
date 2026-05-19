# no-cross-feature-imports

Prevent imports across different features. Each feature in `src/features/<feature>/**` must not import from another feature `src/features/<other>/**`.

## Rationale

Cross-feature imports create hidden dependencies and make it hard to move, remove, or test features independently. Shared code should live in `src/lib` or `src/components` to maintain clear feature boundaries.

## Incorrect

```tsx
// src/features/auth/pages/Login.tsx
import { profileUtils } from "@/features/profile/utils";
import { getOrders } from "@/features/orders/api";
```

## Correct

```tsx
// src/lib/utils/shared.ts
export const profileUtils = { ... };
export const getOrders = async () => { ... };

// src/features/auth/pages/Login.tsx
import { profileUtils, getOrders } from "@/lib/utils/shared";
```

## Options

- `featuresDir`: configurable path segment (default: `"src/features"`)
- `allowSiblingTypes`: bool — allow `import type ... from "@/features/<other>/..."` (default: true)
- `allowList`: array of `[from, to]` tuples that are explicitly allowed

## Limitations

- Only checks files inside `src/features/<feature>/` directories
- Uses simple string matching for feature names; symlinks are not considered
- Relative imports are resolved based on file path

## Autofix

Not available — requires moving code to shared location.

## Version

0.2.0
