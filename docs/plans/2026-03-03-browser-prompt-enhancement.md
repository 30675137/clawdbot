# Browser Prompt Enhancement Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable natural language triggering of browser automation by improving system prompt guidance.

**Architecture:** Add a new `buildBrowserSection()` function to generate browser usage guidance, update the browser tool summary to be more descriptive, and include the section in prompt assembly.

**Tech Stack:** TypeScript, Vitest for testing

---

## Task 1: Update browser tool summary

**Files:**

- Modify: `src/agents/system-prompt.ts:250`

**Step 1: Update the coreToolSummaries.browser entry**

Change line 250 from:

```typescript
browser: "Control web browser",
```

To:

```typescript
browser: "Browse websites, take screenshots, analyze pages, click/type/fill forms",
```

**Step 2: Verify no syntax errors**

Run: `pnpm tsgo`
Expected: No errors related to system-prompt.ts

**Step 3: Commit**

```bash
git add src/agents/system-prompt.ts
git commit -m "feat(prompt): expand browser tool summary description"
```

---

## Task 2: Add buildBrowserSection function

**Files:**

- Modify: `src/agents/system-prompt.ts` (add after line 168, after buildVoiceSection)

**Step 1: Add the buildBrowserSection function**

Insert after the `buildVoiceSection` function (around line 168):

```typescript
function buildBrowserSection(params: { isMinimal: boolean; availableTools: Set<string> }) {
  if (params.isMinimal) {
    return [];
  }
  if (!params.availableTools.has("browser")) {
    return [];
  }
  return [
    "## Browser",
    "Use the browser tool when the user wants to:",
    "- Visit a webpage and extract information",
    "- Take screenshots of websites",
    "- Analyze page content or structure",
    "- Automate web interactions (click, type, fill forms)",
    "- Monitor page changes or check statuses",
    "",
    "Workflow:",
    "1. `browser action=start` - Start browser if not running",
    "2. `browser action=open url=<url>` - Open a URL",
    "3. `browser action=snapshot` - Get page content (AI-readable)",
    "4. `browser action=screenshot` - Capture visual screenshot",
    "5. `browser action=act kind=click ref=<n>` - Click element by ref",
    "6. `browser action=act kind=type ref=<n> text=<text>` - Type into element",
    "",
    "Proactive triggers (use browser without being asked):",
    "- User mentions a URL -> offer to visit and analyze",
    "- User asks 'what does X website show' -> use browser",
    "- User wants to check something online -> use browser",
    "- User mentions web scraping or automation -> use browser",
    "",
  ];
}
```

**Step 2: Verify no syntax errors**

Run: `pnpm tsgo`
Expected: No errors

**Step 3: Commit**

```bash
git add src/agents/system-prompt.ts
git commit -m "feat(prompt): add buildBrowserSection function"
```

---

## Task 3: Include browser section in prompt assembly

**Files:**

- Modify: `src/agents/system-prompt.ts` (in buildAgentSystemPrompt function, around line 569)

**Step 1: Find the location to insert**

Look for where `buildVoiceSection` is called (around line 569):

```typescript
...buildVoiceSection({ isMinimal, ttsHint: params.ttsHint }),
```

**Step 2: Add browser section call after voice section**

Insert after the `buildVoiceSection` spread:

```typescript
    ...buildVoiceSection({ isMinimal, ttsHint: params.ttsHint }),
    ...buildBrowserSection({ isMinimal, availableTools }),
```

**Step 3: Verify no syntax errors**

Run: `pnpm tsgo`
Expected: No errors

**Step 4: Commit**

```bash
git add src/agents/system-prompt.ts
git commit -m "feat(prompt): include browser section in prompt assembly"
```

---

## Task 4: Add unit test for buildBrowserSection

**Files:**

- Create: `src/agents/system-prompt.browser-section.test.ts`

**Step 1: Write the test file**

```typescript
import { describe, expect, it } from "vitest";
import { buildAgentSystemPrompt } from "./system-prompt.js";

describe("buildAgentSystemPrompt browser section", () => {
  it("includes browser section when browser tool is available", () => {
    const prompt = buildAgentSystemPrompt({
      workspaceDir: "/tmp/test",
      toolNames: ["browser", "read", "write"],
      promptMode: "full",
    });

    expect(prompt).toContain("## Browser");
    expect(prompt).toContain("Use the browser tool when the user wants to:");
    expect(prompt).toContain("browser action=start");
    expect(prompt).toContain("Proactive triggers");
  });

  it("excludes browser section when browser tool is not available", () => {
    const prompt = buildAgentSystemPrompt({
      workspaceDir: "/tmp/test",
      toolNames: ["read", "write"],
      promptMode: "full",
    });

    expect(prompt).not.toContain("## Browser");
    expect(prompt).not.toContain("Use the browser tool when the user wants to:");
  });

  it("excludes browser section in minimal mode", () => {
    const prompt = buildAgentSystemPrompt({
      workspaceDir: "/tmp/test",
      toolNames: ["browser", "read", "write"],
      promptMode: "minimal",
    });

    expect(prompt).not.toContain("## Browser");
  });

  it("includes expanded browser tool summary", () => {
    const prompt = buildAgentSystemPrompt({
      workspaceDir: "/tmp/test",
      toolNames: ["browser"],
      promptMode: "full",
    });

    expect(prompt).toContain(
      "browser: Browse websites, take screenshots, analyze pages, click/type/fill forms",
    );
  });
});
```

**Step 2: Run the test to verify it passes**

Run: `pnpm test src/agents/system-prompt.browser-section.test.ts`
Expected: All 4 tests PASS

**Step 3: Commit**

```bash
git add src/agents/system-prompt.browser-section.test.ts
git commit -m "test(prompt): add browser section unit tests"
```

---

## Task 5: Manual integration test

**Step 1: Build and verify**

Run: `pnpm build`
Expected: Build succeeds with no errors

**Step 2: Test locally (optional manual verification)**

1. Start openclaw gateway: `openclaw gateway run`
2. Send a message via Feishu: "帮我打开 https://example.com 截个图"
3. Verify AI uses browser tool automatically

**Step 3: Final commit (if any fixes needed)**

If all tests pass, the implementation is complete.

---

## Summary

| Task | Description                         | Files                                 |
| ---- | ----------------------------------- | ------------------------------------- |
| 1    | Update browser tool summary         | system-prompt.ts:250                  |
| 2    | Add buildBrowserSection function    | system-prompt.ts (after line 168)     |
| 3    | Include browser section in assembly | system-prompt.ts (around line 569)    |
| 4    | Add unit tests                      | system-prompt.browser-section.test.ts |
| 5    | Manual integration test             | N/A                                   |
