---
name: testwithclaude
description: Generate a comprehensive test prompt for the Claude Chrome plugin to test a ListFlow feature on the live site
---

# Test with Claude Chrome Plugin

This skill generates a detailed testing prompt that you can copy and paste into the Claude Chrome plugin to have it thoroughly test a specific ListFlow feature on the live site at https://listflow.robug.com.

## Instructions for Claude

When this skill is invoked with a feature name or description, generate a comprehensive testing prompt:

### Step 1: Understand the Feature

Search the ListFlow codebase to understand:
- What the feature does (check `client/src/components/screens/` and `src/routes/`)
- Where it's located in the UI (check Sidebar nav items)
- What user interactions are involved
- What the expected behavior should be
- Any edge cases or error states

### Step 2: Generate the Test Prompt

Output a formatted prompt block the user can copy directly.

### Prompt Template

```
=== CLAUDE CHROME PLUGIN TEST PROMPT ===
Copy everything below this line:
---

# Feature Test: [FEATURE NAME]

You are testing the [FEATURE NAME] feature on ListFlow, an eBay listing workflow app.

## Site Context
- URL: https://listflow.robug.com
- Log in with your PIN if prompted (4-digit PIN login screen)

## Navigation
[Specific steps to reach the feature, e.g.:]
1. Click on [menu item] in the left sidebar
2. Navigate to [specific page]
3. Look for [specific element]

## Test Cases

### Basic Functionality
- [ ] [Test case 1]
- [ ] [Test case 2]
- [ ] [Test case 3]

### User Interactions
- [ ] [Click/hover/input tests]
- [ ] [Form submission tests]

### Mobile Responsiveness
- [ ] Resize browser to 375px width — layout adapts properly
- [ ] Touch targets are at least 44px
- [ ] No horizontal overflow
- [ ] Sidebar becomes overlay drawer on mobile

### Edge Cases
- [ ] [Empty state test]
- [ ] [Error handling test]

## Success Criteria
- [What indicates working correctly]
- [Expected visual appearance]

## Report Format

### Test Results Summary
- **Overall Status**: [PASS/FAIL/PARTIAL]
- **Tests Passed**: X/Y
- **Critical Issues**: [Yes/No]

### Detailed Findings

#### Working Correctly:
- [List what works]

#### Issues Found:
- **Issue 1**: [Description]
  - Steps to reproduce: [Steps]
  - Expected: [What should happen]
  - Actual: [What actually happened]
  - Severity: [Critical/High/Medium/Low]

### Recommendations
- [Suggested fixes or improvements]

---
=== END OF PROMPT ===
```

## ListFlow-Specific Test Areas

### Photo Import Screen (`/import`)
Focus on: camera access on mobile, dropzone on desktop, photo grouping, auto-group, file upload

### Queue Screen (`/queue`)
Focus on: kanban vs list view, search, filters, bulk actions, list view defaults on mobile

### Item Detail Screen (`/item/:id`)
Focus on: photo gallery, editable fields, AI analysis display, accept/reject/redo flow, action button tap targets

### Dashboard (`/`)
Focus on: stats cards, recent activity, quick actions

### Sidebar Navigation
Focus on: expandable sub-menus, mobile overlay drawer, backdrop dismiss, active link highlighting

## Usage Examples

```
/testwithclaude photo import
```

```
/testwithclaude queue bulk actions
```

```
/testwithclaude mobile navigation
```
