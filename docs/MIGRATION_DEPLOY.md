# Prisma migration deployment notes (LoveCry)

Migration folder: `prisma/migrations/20260812120000_production_backend`

## Case A — Empty Hostinger MySQL database

```bash
npx prisma migrate deploy
npx prisma generate
```

Safe for a brand-new database with no LoveCry tables.

## Case B — Tables already created via `prisma db push`

`migrate deploy` may fail because the baseline migration contains `CREATE TABLE` for objects that already exist.

Safe options:

1. **Baseline without re-running SQL** (preferred if schema already matches):
   ```bash
   npx prisma migrate resolve --applied 20260812120000_production_backend
   ```
   Then apply any *new* incremental migrations only.

2. **Inspect drift first**:
   ```bash
   npx prisma migrate diff --from-migrations prisma/migrations --to-schema-datamodel prisma/schema.prisma --script
   ```
   Review the SQL. Apply only additive ALTERs manually or as a new migration.

## Never on production

```bash
npx prisma migrate reset
```

Do not drop production tables.

## Incremental hardening (this pass)

Schema additions such as `SignedConsent.certificateText`, `acknowledgements`, `artifactStatus` may need:

```bash
npx prisma db push
# or a new migrate diff → migrate dev on a staging clone
```

after reviewing the generated SQL.
