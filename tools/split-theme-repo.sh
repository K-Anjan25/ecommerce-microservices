#!/usr/bin/env bash
#
# Split wordpress/cartly out of the platform monorepo into a standalone theme
# repository, preserving the git history of that directory.
#
# Works on Linux, macOS and Windows (Git Bash / MINGW64). Requires git only —
# the GitHub CLI is optional.
#
# Usage
#   bash tools/split-theme-repo.sh
#       Produce ../cartly-wp-theme (a sibling of this repo) + a .bundle backup.
#
#   bash tools/split-theme-repo.sh https://github.com/you/cartly-wp-theme.git
#       ...and push it to that remote.
#
#   OUT_DIR=/some/where bash tools/split-theme-repo.sh
#       ...into a directory you choose.
#
set -euo pipefail

REMOTE="${1:-}"
PREFIX="wordpress/cartly"
BRANCH="cartly-theme-split"
NAME="cartly-wp-theme"

# ---------------------------------------------------------------- preflight --
command -v git >/dev/null 2>&1 || { echo "error: git is not installed." >&2; exit 1; }

# `git subtree --help` shells out to man, which is often absent. Probe the
# command itself: with no args it prints its usage. Capture first — piping into
# `grep -q` would SIGPIPE git and trip `set -o pipefail`.
SUBTREE_USAGE="$(git subtree 2>&1 || true)"
case "$SUBTREE_USAGE" in
	*"git subtree"*) ;;
	*)
		echo "error: 'git subtree' is unavailable." >&2
		echo "       Debian/Ubuntu: sudo apt install git-subtree" >&2
		echo "       macOS/Windows: it ships with git; check your git version." >&2
		exit 1
		;;
esac

cd "$(git rev-parse --show-toplevel)"
ROOT="$(pwd)"

[ -d "$PREFIX" ] || { echo "error: $PREFIX does not exist. Run 'git pull' first." >&2; exit 1; }

if [ -n "$(git status --porcelain)" ]; then
	echo "error: working tree is dirty. Commit or stash first." >&2
	git status --short >&2
	exit 1
fi

# Default to a sibling directory — far easier to find than a temp dir,
# especially on Windows where /tmp is buried in AppData.
OUT="${OUT_DIR:-$(dirname "$ROOT")/$NAME}"

if [ -e "$OUT" ]; then
	echo "note: $OUT already exists and will be replaced."
	printf "      continue? [y/N] "
	read -r reply
	case "$reply" in
		[yY]*) ;;
		*) echo "aborted."; exit 1 ;;
	esac
fi

# -------------------------------------------------------------------- split --
echo "==> splitting $PREFIX (history preserved)"
git branch -D "$BRANCH" >/dev/null 2>&1 || true
git subtree split -P "$PREFIX" -b "$BRANCH" >/dev/null

echo "==> materialising $OUT"
rm -rf "$OUT"
git clone -q --branch "$BRANCH" --single-branch "$ROOT" "$OUT"

cd "$OUT"
git remote remove origin >/dev/null 2>&1 || true
git branch -M main

# The CI workflow can only live at the root of the standalone repo.
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

cd "$ROOT"
git branch -D "$BRANCH" >/dev/null 2>&1 || true

# ------------------------------------------------------------------ report --
COMMITS="$(git -C "$OUT" rev-list --count HEAD)"
echo
echo "==> done"
echo "    repo    $OUT   ($COMMITS commits, history preserved)"
echo "    backup  $OUT.bundle"

# Guess the GitHub owner from this repo's origin, so the printed URL is real.
OWNER=""
ORIGIN="$(git remote get-url origin 2>/dev/null || true)"
case "$ORIGIN" in
	*github.com[:/]*)
		OWNER="$(printf '%s' "$ORIGIN" | sed -E 's#.*github\.com[:/]([^/]+)/.*#\1#')"
		;;
esac
[ -n "$OWNER" ] || OWNER="<your-github-username>"
URL="https://github.com/$OWNER/$NAME.git"

if [ -n "$REMOTE" ]; then
	echo
	echo "==> pushing to $REMOTE"
	git -C "$OUT" remote add origin "$REMOTE"
	git -C "$OUT" push -u origin main
	echo "    pushed."
	exit 0
fi

cat <<EOF

Next — publish it. Pick ONE:

  A) With the GitHub CLI, if you have it:

       gh repo create $NAME --public --source "$OUT" --push

  B) Without it (works everywhere):

       1. Create an EMPTY repo at https://github.com/new
          name: $NAME
          do NOT tick "Add a README", .gitignore or a licence.

       2. Then:

            cd "$OUT"
            git remote add origin $URL
            git push -u origin main

Afterwards, retire the copy in this repo so the two cannot drift:

     cd "$ROOT"
     git rm -r wordpress
     git commit -m "chore: theme moved to its own repository"
EOF
