#!/usr/bin/env bash
set -euo pipefail

# Ensure gh CLI is authenticated
if ! gh auth status >/dev/null 2>&1; then
  echo "❌ GitHub CLI is not logged in."
  echo "Please authenticate first by running:"
  echo "    gh auth login"
  echo "or by setting the GH_TOKEN environment variable."
  exit 1
fi

REPO="rakis/gameledger"
BRANCH="main"

echo "🔒 Protecting branch '$BRANCH' on repository '$REPO'..."

# Branch protection payload using GitHub REST API
gh api \
  --method PUT \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  "/repos/${REPO}/branches/${BRANCH}/protection" \
  --input - << 'EOF'
{
  "required_status_checks": {
    "strict": true,
    "contexts": [
      "Typecheck & Static Analysis",
      "Unit & Invariant Tests (Node 22)",
      "Unit & Invariant Tests (Node 24)",
      "Production Bundle & Asset Verification"
    ]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": null,
  "restrictions": null
}
EOF

echo ""
echo "✔ Successfully configured branch protection for '$BRANCH' on '$REPO'!"
echo "Required status checks:"
echo "  - Typecheck & Static Analysis"
echo "  - Unit & Invariant Tests (Node 22)"
echo "  - Unit & Invariant Tests (Node 24)"
echo "  - Production Bundle & Asset Verification"
