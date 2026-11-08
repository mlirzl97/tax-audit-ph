# Contributing

Tax Audit PH handles high-risk tax and identity information. Contributions are
welcome, but safety boundaries are part of the product contract.

## Before opening a change

1. Keep accounting, routine tax filing, and pricing outside this repository.
2. Cite the applicable BIR issuance for any rule that affects a deadline,
   remedy, scope, or required response.
3. Version legal rules by effective date; do not silently change historical
   cases.
4. Never add telemetry properties that can contain identity, money, filenames,
   free text, document contents, or stable case/user identifiers.
5. Add a focused test for validation, money, permissions, parsing, deadline, or
   security logic.

## Local checks

```bash
python -m pytest
python -m ruff check .
```

Do not use real taxpayer information in tests, fixtures, screenshots, issues,
or pull requests.

