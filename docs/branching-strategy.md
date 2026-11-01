# Branching & variations

The base product and each variation live in one repository, on separate long-lived
branches, with `git worktree` so more than one can be checked out at once.

## Branches

| Branch / tag | Purpose |
|---|---|
| `master` | **The base.** All shared work lands here. |
| `base-v1.0` (annotated tag) | Frozen stable base (commit `0ee9592`). Immutable — branch or diff from it any time. |
| `variation/clothing-erp` | Long-lived variation for the clothing-brand ERP. |
| `feature/advanced-product-types` | Shared feature: new/advanced product types. Merges into `master`, then `master` merges into the variation. |

Short-lived feature branches (`feature/*`) branch off whichever line they belong to and
merge back to it. Never develop variation-specific work on `master`.

## Layout

```
Projects/
  invenos-backend/          master                        (base)
  invenos-clothing-erp/     variation/clothing-erp         (worktree)
```

## Daily workflow

- **Base work** — in `invenos-backend`. Branch `feature/<x>` off `master`, merge to `master`.
- **Variation work** — in `invenos-clothing-erp`. Branch `feature/clothing-<x>` off
  `variation/clothing-erp`, merge back there.
- Nothing that only the clothing brand needs should be merged into `master`.

## Pulling base improvements into a variation

```bash
cd invenos-clothing-erp
git fetch
git merge master

# public/build is tracked (see below), so asset chunks conflict on every merge.
# Never hand-merge them — delete and rebuild.
rm -rf public/build && npm run build
git add public/build && git commit -m "chore: rebuild assets after merge"
```

## Per-variation environment

Each worktree has its own `.env` (gitignored, so it does not travel with the branch):

| | base | clothing-erp |
|---|---|---|
| `APP_NAME` | `Laravel` | `Clothing ERP` |
| `APP_URL` | `http://localhost` | `http://localhost:8001` |
| `DB_DATABASE` | `invenos` | `invenos_clothing` |
| `APP_KEY` | own | own |

A distinct `APP_NAME` also separates the session cookie — `config/session.php` derives it
from `Str::slug(APP_NAME)` — so both variants can run on localhost simultaneously without
logging each other out.

A fresh worktree needs its dependencies before it will boot:

```bash
composer install
npm install
php artisan migrate
```

## Adding another variation

```bash
git tag -a base-vX.Y -m "stable base <date>"
git worktree add ../invenos-<name> -b variation/<name> master
```

Then copy `.env` into the new worktree, set `APP_NAME` / `APP_URL` / `DB_DATABASE`, create
that database, and install dependencies.

## Deploying

- Base deploys from `master`.
- A variation deploys from its branch, after rebuilding assets (`public/build` is committed
  because cPanel has no Node — see `.gitignore`).
- Give each deployment its own `.env` and database.

## Known quirks

- `public/build` is **intentionally tracked** for cPanel. This is the main source of merge
  friction between branches; the rebuild step above is mandatory after any merge.
- Tests run against `invenos_testing`. `tests/bootstrap.php` forces the testing environment
  even when the invoking shell exports `APP_ENV` / `DB_DATABASE`, so the suite never touches
  a development database.
