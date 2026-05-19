# no-untranslated-jsx-text

Flag user-visible string literals appearing as JSX text content. The intent is "every user-facing string must go through `t(...)`".

## Rationale

Hardcoded user-visible strings in JSX create maintenance and i18n problems. All user-facing text should be wrapped in a translation function to support internationalization and centralized text management.

## Incorrect

```tsx
<button>Submit</button>
<h1>Welcome</h1>
<label>Email</label>
```

## Correct

```tsx
<button>{t("auth.login.submit")}</button>
<h1>{t("app.welcome.title")}</h1>
<label>{t("forms.email.label")}</label>
```

## Options

- `ignoreElements`: string[] of element names to never check (default: `["Code", "pre", "code", "kbd", "samp", "var"]`)
- `allowedPatterns`: regex strings that are exempt (default: `["^[A-Z0-9_-]+$"]` for version strings, ticker symbols, etc.)
- `ignoreFiles`: glob list of filenames to skip (default: `["**/*.stories.tsx", "**/*.test.tsx", "**/*.spec.tsx"]`)

## Limitations

- Only flags `JSXText` nodes; expressions like `{someVariable}` are allowed
- Comments and data attributes are not checked
- Pattern matching is case-sensitive

## Autofix

Not available — requires manual judgment about which translation key to use.

## Version

0.2.0
