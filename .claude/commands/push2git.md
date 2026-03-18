---
name: push2git
description: Examine ListFlow codebase, update documentation, then commit and push to GitHub
---

# Push to Git with Documentation Update

This skill performs a complete documentation audit and git workflow for the ListFlow project:
1. Examines the codebase for recent changes
2. Updates documentation files (README.md, CLAUDE.md task lists)
3. Runs security validation (no API keys, no .env committed)
4. Commits with a descriptive message
5. Pushes to GitHub

## Instructions for Claude

When this skill is invoked, follow these steps IN ORDER:

### Step 1: Analyze Recent Changes

First, gather context about what has changed:

```bash
git status
git diff --stat HEAD~5 HEAD 2>/dev/null || git diff --stat
git log --oneline -10
```

Identify:
- New files added
- Modified files
- New features implemented
- Database schema changes (Prisma)
- API endpoint changes (src/routes/)
- UI/component changes (client/src/components/)

### Step 2: Read Current Documentation

Read these documentation files to understand their current state:
- `README.md` - Project overview, features list, tech stack
- `CLAUDE.md` - Project guidelines, task checklists, architecture notes

### Step 3: Identify Documentation Gaps

Compare the codebase changes against the documentation:
- Are new features documented in README.md?
- Are completed tasks checked off in CLAUDE.md?
- Are new API endpoints documented in CLAUDE.md?
- Are new components/screens mentioned?

### Step 4: Update Documentation Files

**README.md Updates:**
- Update feature descriptions
- Update tech stack changes
- Keep the existing structure and style

**CLAUDE.md Updates:**
- Check off completed tasks in the Technical Tasks section
- Add new tasks if work has been identified
- Update API Endpoints section if new routes added

### Step 5: Run Security Check

Before committing, check for secrets or credentials:

```bash
# Check for API keys, tokens, passwords in staged files
git diff --cached --name-only | xargs grep -l "OPENAI_API_KEY\|EBAY_APP_ID\|EBAY_CERT_ID\|EBAY_DEV_ID\|EBAY_AUTH_TOKEN\|PAYPAL_EMAIL\|sk-\|password.*=.*['\"]" 2>/dev/null || echo "No secrets found in staged files"

# Verify .env is gitignored
git check-ignore .env || echo "WARNING: .env is NOT in .gitignore!"
```

NEVER commit if the security check fails. Alert the user and stop.

### Step 6: Stage and Review Changes

```bash
git status
git diff --stat
```

Show the user what will be committed. Do NOT stage `.env` files or files containing secrets.

### Step 7: Create Commit

Create a descriptive commit message. Stage specific files (not `git add -A`).

```bash
git add [specific files]
git commit -m "$(cat <<'EOF'
[type]: [summary]

[bullet points of changes]

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

### Step 8: Push to GitHub

```bash
git push origin $(git rev-parse --abbrev-ref HEAD)
```

Report success with the commit hash.

## Usage Examples

```
/push2git
```
Examines codebase, updates docs, commits, and pushes.

```
/push2git "Added mobile optimization"
```
Same as above, but uses the provided message context for commit.

## Safety Rules

1. NEVER commit secrets, API keys, or credentials
2. ALWAYS run security check first
3. NEVER force push to main/master
4. ALWAYS show user what will be committed before committing
5. If uncertain about changes, ASK the user before proceeding
6. Stage specific files, never use `git add -A` blindly

## Error Handling

If any step fails:
1. Report the error clearly
2. Do NOT proceed with subsequent steps
3. Suggest how to fix the issue
4. Offer to retry after the user resolves the problem
