#!/bin/bash
# =============================================================================
# WebForge — init.sh
# Installs the .webforge/ framework into any existing project repo.
# Future: this logic will be wrapped by `npx webforge init`
#
# Usage:
#   cd /path/to/your/project
#   bash /path/to/webforge/scripts/init.sh
# =============================================================================

set -euo pipefail

# Colours
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

info()    { echo -e "${CYAN}[webforge]${RESET} $*"; }
success() { echo -e "${GREEN}[webforge]${RESET} ✓ $*"; }
warn()    { echo -e "${YELLOW}[webforge]${RESET} ⚠ $*"; }
error()   { echo -e "${RED}[webforge]${RESET} ✗ $*" >&2; exit 1; }
ask()     { echo -e "${BOLD}$*${RESET}"; }

# Where is this script? (source of agent templates)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRAMEWORK_SOURCE="$(cd "$SCRIPT_DIR/.." && pwd)"

# Where are we installing? (current working directory = user's project root)
PROJECT_ROOT="$(pwd)"
WEBFORGE_DIR="$PROJECT_ROOT/.webforge"

echo ""
echo -e "${BOLD}╔══════════════════════════════════════╗${RESET}"
echo -e "${BOLD}║       WebForge Agent Framework       ║${RESET}"
echo -e "${BOLD}╚══════════════════════════════════════╝${RESET}"
echo ""
info "Installing into: $PROJECT_ROOT"
echo ""

# Guard: don't install inside the framework source itself
if [[ "$PROJECT_ROOT" == "$FRAMEWORK_SOURCE" ]]; then
  error "Run this script from your project directory, not from the webforge source directory."
fi

# Guard: already installed?
#if [[ -d "$WEBFORGE_DIR" ]]; then
#  ask "⚠ .webforge/ already exists. Reinitialise? This will overwrite agent prompts but keep logs and config. [y/N]"
#  read -r confirm
#  [[ "$confirm" =~ ^[Yy]$ ]] || { info "Aborted."; exit 0; }
# fi

# ─────────────────────────────────────────────────────────────────────────────
# Step 1: Detect project context
# ─────────────────────────────────────────────────────────────────────────────
info "Scanning project..."

PROJECT_NAME="$(basename "$PROJECT_ROOT")"
DETECTED_FRONTEND=""
DETECTED_STYLING=""
DETECTED_BACKEND=""
DETECTED_DATABASE=""
DETECTED_AUTH=""
BASE_BRANCH="main"

# Detect stack from package.json
if [[ -f "$PROJECT_ROOT/package.json" ]]; then
  PKG=$(cat "$PROJECT_ROOT/package.json")

  echo "$PKG" | grep -q '"next"'       && DETECTED_FRONTEND="next.js"
  echo "$PKG" | grep -q '"react"'      && [[ -z "$DETECTED_FRONTEND" ]] && DETECTED_FRONTEND="react"
  echo "$PKG" | grep -q '"vue"'        && DETECTED_FRONTEND="vue"
  echo "$PKG" | grep -q '"svelte"'     && DETECTED_FRONTEND="svelte"
  echo "$PKG" | grep -q '"tailwindcss"' && DETECTED_STYLING="tailwind"
  echo "$PKG" | grep -q '"express"'    && DETECTED_BACKEND="express"
  echo "$PKG" | grep -q '"fastify"'    && DETECTED_BACKEND="fastify"
  echo "$PKG" | grep -q '"@supabase"'  && DETECTED_DATABASE="supabase"
  echo "$PKG" | grep -q '"mongoose"'   && DETECTED_DATABASE="mongodb"
  echo "$PKG" | grep -q '"prisma"'     && DETECTED_DATABASE="prisma"
  echo "$PKG" | grep -q '"next-auth"'  && DETECTED_AUTH="next-auth"
  echo "$PKG" | grep -q '"clerk"'      && DETECTED_AUTH="clerk"
fi

# Detect base branch
if git -C "$PROJECT_ROOT" rev-parse --is-inside-work-tree &>/dev/null 2>&1; then
  if git -C "$PROJECT_ROOT" show-ref --verify --quiet refs/heads/develop; then
    BASE_BRANCH="develop"
  fi
fi

# Show what we found
[[ -n "$DETECTED_FRONTEND" ]] && info "  Frontend detected : $DETECTED_FRONTEND"
[[ -n "$DETECTED_STYLING"  ]] && info "  Styling detected  : $DETECTED_STYLING"
[[ -n "$DETECTED_BACKEND"  ]] && info "  Backend detected  : $DETECTED_BACKEND"
[[ -n "$DETECTED_DATABASE" ]] && info "  Database detected : $DETECTED_DATABASE"
[[ -n "$DETECTED_AUTH"     ]] && info "  Auth detected     : $DETECTED_AUTH"
info "  Git base branch   : $BASE_BRANCH"
echo ""
read -p "Press [Enter] key to continue..."
# ─────────────────────────────────────────────────────────────────────────────
# Step 2: Ask user what to version
# ─────────────────────────────────────────────────────────────────────────────
ask "What should be committed to git? (you can change this later in .webforge/.gitignore)"
echo "  1) Nothing — add all of .webforge/ to .gitignore (private setup)"
echo "  2) Agent prompts + config only — share the setup, not the logs"
echo "  3) Everything — full transparency, team shares all history"
echo ""
read -rp "Choice [1/2/3, default 2]: " version_choice
version_choice="${version_choice:-2}"

COMMIT_AGENTS=false
COMMIT_CONFIG=false
COMMIT_LOGS=false

case "$version_choice" in
  1) ;;  # all false
  3) COMMIT_AGENTS=true; COMMIT_CONFIG=true; COMMIT_LOGS=true ;;
  *) COMMIT_AGENTS=true; COMMIT_CONFIG=true ;;  # default: 2
esac

# ─────────────────────────────────────────────────────────────────────────────
# Step 3: Create directory structure
# ─────────────────────────────────────────────────────────────────────────────
#info "Creating .webforge/ structure..."
#
#mkdir -p "$WEBFORGE_DIR"/{agents/{cto,po,architect,frontend,backend,qa,ux},logs,scripts}

# ─────────────────────────────────────────────────────────────────────────────
# Step 4: Copy agent CLAUDE.md files from framework source
# ─────────────────────────────────────────────────────────────────────────────
# ─────────────────────────────────────────────────────────────────────────────
# Step 5: Write config.json
# ─────────────────────────────────────────────────────────────────────────────
cat > "$WEBFORGE_DIR/config.json" << EOF
{
  "project": "$PROJECT_NAME",
  "root": "$PROJECT_ROOT",
  "stack": {
    "frontend": ${DETECTED_FRONTEND:+"\"$DETECTED_FRONTEND\""}${DETECTED_FRONTEND:-null},
    "styling":  ${DETECTED_STYLING:+"\"$DETECTED_STYLING\""}${DETECTED_STYLING:-null},
    "backend":  ${DETECTED_BACKEND:+"\"$DETECTED_BACKEND\""}${DETECTED_BACKEND:-null},
    "database": ${DETECTED_DATABASE:+"\"$DETECTED_DATABASE\""}${DETECTED_DATABASE:-null},
    "auth":     ${DETECTED_AUTH:+"\"$DETECTED_AUTH\""}${DETECTED_AUTH:-null}
  },
  "git": {
    "base_branch": "$BASE_BRANCH",
    "feature_prefix": "feature/"
  },
  "versioning": {
    "commit_agents": $COMMIT_AGENTS,
    "commit_config": $COMMIT_CONFIG,
    "commit_logs": $COMMIT_LOGS
  },
  "engram": {
    "namespace": "webforge/$PROJECT_NAME"
  }
}
EOF
success "Written config.json"

# ─────────────────────────────────────────────────────────────────────────────
# Step 6: Generate .gitignore for .webforge/
# ─────────────────────────────────────────────────────────────────────────────
{
  echo "# WebForge — auto-generated by init.sh"
  echo "# Edit manually or re-run init to regenerate"
  echo ""

  if [[ "$COMMIT_AGENTS" == "false" ]]; then
    echo "agents/"
  fi
  if [[ "$COMMIT_CONFIG" == "false" ]]; then
    echo "config.json"
  fi
  if [[ "$COMMIT_LOGS" == "false" ]]; then
    echo "logs/"
  fi

  # Active jobs are never committed (they're transient work state)
  echo ""
  echo "# Never commit active jobs (transient work state)"
  echo "agents/*/actual_job.md"
  echo "agents/*/inbox.md"

} > "$WEBFORGE_DIR/.gitignore"
success "Written .webforge/.gitignore"

# Also add .webforge to project root .gitignore if version_choice=1
if [[ "$version_choice" == "1" ]]; then
  if [[ -f "$PROJECT_ROOT/.gitignore" ]]; then
    if ! grep -q "\.webforge" "$PROJECT_ROOT/.gitignore"; then
      echo "" >> "$PROJECT_ROOT/.gitignore"
      echo "# WebForge agent framework" >> "$PROJECT_ROOT/.gitignore"
      echo ".webforge/" >> "$PROJECT_ROOT/.gitignore"
      success "Added .webforge/ to project root .gitignore"
    fi
  fi
fi

# ─────────────────────────────────────────────────────────────────────────────
# Done
# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}╔══════════════════════════════════════╗${RESET}"
echo -e "${GREEN}${BOLD}║  WebForge installed successfully ✓   ║${RESET}"
echo -e "${GREEN}${BOLD}╚══════════════════════════════════════╝${RESET}"
echo ""
info "Next steps:"
echo "  1. Start a feature:"
echo "     echo 'I want a login page with email/password' > .webforge/agents/po/inbox.md"
echo ""
echo "  2. Start the CTO loop:"
echo "     PROJECT_PATH=$PROJECT_ROOT bash .webforge/scripts/run_cto.sh"
echo ""
echo "  3. Check status anytime:"
echo "     source .webforge/scripts/inbox_protocol.sh && inbox_status"
echo ""
