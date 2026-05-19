# bcrypt-rounds-min

Disallow `bcrypt.hash` / `bcrypt.hashSync` with a numeric-literal rounds
value below the configured minimum.

## Why

bcrypt cost factor < 10 is too cheap to bruteforce on commodity GPUs. The
default minimum here is 10; consider 12+ for new systems.

The rule is conservative about non-literal arguments: an `Identifier` like
`env.BCRYPT_ROUNDS` is assumed env-driven and accepted, since the actual
value isn't visible at lint time.

## Recognized call shapes

- `bcrypt.hash(plain, N)` / `bcrypt.hashSync(plain, N)` — default and
  namespace imports.
- `import { hash } from "bcrypt"; hash(plain, N)` — named import.

`<id>` must be a binding for an import from a module in `bcryptModules`
(default `bcrypt`, `bcryptjs`).

## Options

```ts
{
  minRounds?: number;          // default: 10
  bcryptModules?: string[];    // default: ["bcrypt", "bcryptjs"]
}
```

## Examples

Valid:

```ts
import bcrypt from "bcrypt";
bcrypt.hash(plain, 12);
bcrypt.hashSync(plain, 10);
bcrypt.hash(plain, env.BCRYPT_ROUNDS);

import { hash } from "bcrypt";
hash(plain, 12);
```

Invalid:

```ts
import bcrypt from "bcrypt";
bcrypt.hash(plain, 8);
bcrypt.hashSync(plain, 4);

import { hash } from "bcrypt";
hash(plain, 5);
```
