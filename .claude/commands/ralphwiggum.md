---
name: ralphwiggum
description: PRD Builder that creates execution-ready Product Requirements Documents for the Ralph autonomous coding loop, then executes tasks one at a time with validation
---

# Ralph Wiggum - Autonomous Coding Agent Protocol

This skill has two modes: **PRD Builder** (create the plan) and **Ralph Loop** (execute the plan).

## Mode 1: PRD Builder

When invoked with a feature description, build an execution-ready PRD following these phases:

### Phase 1: Collection & Clarification
- Gather the feature brief from the user
- Ask 3-5 targeted questions with lettered options (a, b, c, d) to resolve ambiguities around:
  - Objectives
  - Capabilities
  - Boundaries
  - Success signals

### Phase 2: Story Sizing
Each Ralph iteration runs without memory of previous steps. Oversized stories risk incomplete or broken output.

**Constraint:** Stories must fit within a single context window (~10 minutes of work).

**Litmus test:** If a story cannot be described in 2-3 sentences, it requires splitting.

### Phase 3: Dependency Sequencing
Order stories so earlier items never depend on later ones. For ListFlow, typical pattern:
1. Database/Prisma schema changes
2. Backend API routes (`src/routes/`)
3. API client methods (`client/src/api/client.ts`)
4. UI components (`client/src/components/`)
5. Screen integration and testing

### Phase 4: Testable Acceptance Criteria
Every criterion must be objectively verifiable.

**Reject:** "works as expected", "looks good", "functions properly"
**Accept:** Specific fields present, specific UI elements visible, "typecheck passes", "verify changes work in browser"

### Output Format

Generate two files in the project root:

**PRD.md:**
```markdown
# [Feature Name]

## Introduction
[Brief description]

## Goals
- [Goal 1]
- [Goal 2]

## User Stories

### US-001: [Story Title]
- [ ] [Acceptance criterion 1]
- [ ] [Acceptance criterion 2]
- [ ] [Acceptance criterion 3]

### US-002: [Story Title]
- [ ] [Acceptance criterion 1]
- [ ] [Acceptance criterion 2]

## Non-Goals
- [What this does NOT include]

## Technical Notes
- [Relevant implementation notes]
```

**progress.txt:**
```
# Progress Tracker
Created: [date]

## Status: In Progress
```

---

## Mode 2: Ralph Loop Execution

When executing tasks from an existing PRD.md:

### Per-Cycle Protocol

1. **Inspect PRD.md** — Find the first incomplete task (marked with `[ ]`)
2. **Review progress.txt** — Read the Learnings section for context from previous iterations
3. **Implement only that one task** — No scope creep. Do exactly one story.
4. **Validate** — Run typecheck: `cd client && npx tsc --noEmit`

### On Successful Validation:
- Mark task complete with `[x]` in PRD.md
- Commit using format: `feat: [task description]`
- Document in progress.txt:
  ```
  ## Iteration [N] — [Task Name]
  - Implementation details
  - Modified files
  - Learnings for next cycles:
    - Discovered patterns
    - Common pitfalls
    - Relevant context
  ```

### On Validation Failure:
- Leave task unchecked `[ ]` in PRD.md
- Do NOT commit
- Log failure details in progress.txt as learning for future attempts

### Completion Signal
When all PRD.md tasks are marked `[x]`, output: `<promise>COMPLETE</promise>`

---

## Shell Runner

To run Ralph autonomously in a loop from the ListFlow project root:

```bash
#!/bin/bash
set -e
MAX_ITERATIONS=${1:-10}
PAUSE_SECONDS=${2:-2}

PROMPT="Read PRD.md and progress.txt. Find the first incomplete task ([ ]). Implement ONLY that task. Validate with typecheck (cd client && npx tsc --noEmit). If valid: mark [x], commit, update progress.txt. If invalid: log failure in progress.txt. If all done: output <promise>COMPLETE</promise>"

echo "Launching Ralph — up to $MAX_ITERATIONS runs"
for ((i=1; i<=MAX_ITERATIONS; i++)); do
    echo "=== Run $i of $MAX_ITERATIONS ==="
    result=$(claude --dangerously-skip-permissions --output-format text -p "$PROMPT")
    echo "$result"
    if [[ "$result" == *"<promise>COMPLETE</promise>"* ]]; then
        echo "=== All work finished in $i runs ==="
        exit 0
    fi
    sleep $PAUSE_SECONDS
done
echo "=== Maximum runs reached ($MAX_ITERATIONS) ==="
exit 1
```

Save as `ralph.sh`, make executable with `chmod +x ralph.sh`, and run with `./ralph.sh [max_iterations] [pause_seconds]`.

## Usage Examples

```
/ralphwiggum build eBay API integration for publishing listings
```
Creates PRD.md with sized stories and progress.txt tracker.

```
/ralphwiggum execute
```
Picks up the next incomplete task from PRD.md and implements it.
