#!/usr/bin/env bash
#
# Split wordpress/cartly out of the platform monorepo into a standalone theme
# repository, preserving the git history of that directory.
#
# The platform repo (Spring Boot + React + design kit) and the theme repo
# (WordPress + WooCommerce) have different audiences, release cadences and
# deploy targets, so they live apart. `design/tokens.json` stays canonical
# here; the theme pulls it with bin/sync-tokens.sh and CI fails on drift.
#
# Usage
#   tools/split-theme-repo.sh                       # produce a local repo + bundle
#   tools/split-theme-repo.sh git@github.com:you/cartly-wp-theme.git   # and push
#
set -euo pipefail

REMOTE="${1:-}"
PREFIX="wordpress/cartly"
BRANCH="cartly-theme-main"
OUT="${OUT_DIR:-${TMPDIR:-/tmp}/cartly-wp-theme}"

cd "$(git rev-parse --show-toplevel)"

echo "==> splitting $PREFIX (history preserved)"
git branch -D "$BRANCH" >/dev/null 2>&1 || true
git subtree split -P "$PREFIX" -b "$BRANCH" >/dev/null

echo "==> materialising $OUT"
rm -rf "$OUT"
git clone -q --branch "$BRANCH" --single-branch . "$OUT"
cd "$OUT"
git remote remove origin

# The workflow can only live at the root of the standalone repo.
if [ -f ci/github-workflow.yml ]; then
	mkdir -p .github/workflows
	git mv ci/github-workflow.yml .github/workflows/ci.yml
	rmdir ci 2>/dev/null || true
fi

cat > .gitignore <<'GITIGNORE'
node_modules/
.DS_Store
*.log
GITIGNORE

git add -A
git -c user.email=noreply@cartly -c user.name=cartly \
	commit -q -m "chore: standalone theme repository

Split out of the platform monorepo with history preserved. CI moved to
.github/workflows/ci.yml; design tokens are pulled from the platform repo by
bin/sync-tokens.sh and CI fails if they drift."

git bundle create "$OUT.bundle" --all >/dev/null
cd - >/dev/null
git branch -D "$BRANCH" >/dev/null 2>&1 || true

echo
echo "==> done"
echo "    repo:   $OUT"
echo "    bundle: $OUT.bundle   (git clone \"$OUT.bundle\" cartly-wp-theme)"
echo "    commits: $(git -C "$OUT" rev-list --count HEAD)"

if [ -n "$REMOTE" ]; then
	echo
	echo "==> pushing to $REMOTE"
	git -C "$OUT" remote add origin "$REMOTE"
	git -C "$OUT" push -u origin HEAD:main
	echo "    pushed."
else
	cat <<EOF

Next, to publish it:

  gh repo create cartly-wp-theme --public --source "$OUT" --push

or manually:

  cd "$OUT"
  git remote add origin git@github.com:<you>/cartly-wp-theme.git
  git push -u origin main

Then remove wordpress/ from this repo so the two cannot drift:

  git rm -r --cached wordpress && rm -rf wordpress
  git commit -m "chore: theme moved to its own repository"
EOF
fi
