# Browser System Prompt Enhancement Design

## Problem

The browser tool is fully functional but underutilized because the AI agent doesn't know:

1. What capabilities it has (screenshots, page analysis, click/type, form filling)
2. When to proactively use it
3. The workflow for using it effectively

Current system prompt description is too brief:

```
browser: "Control web browser"
```

## Goal

Enable natural language triggering of browser automation through chat (Feishu/Telegram/etc.) by improving the system prompt guidance.

## User Story

User says: "帮我打开 example.com 截个图"
AI should: Automatically use browser tool to open the URL, take a screenshot, and return it.

## Design

### Change 1: Expand browser tool summary

**File:** `src/agents/system-prompt.ts`

```typescript
// Before
browser: "Control web browser",

// After
browser: "Browse websites, take screenshots, analyze pages, click/type/fill forms",
```

### Change 2: Add Browser guidance section

**File:** `src/agents/system-prompt.ts`

Add a new `buildBrowserSection()` function that generates guidance when browser tool is available:

```markdown
## Browser

Use the browser tool when the user wants to:

- Visit a webpage and extract information
- Take screenshots of websites
- Analyze page content or structure
- Automate web interactions (click, type, fill forms)
- Monitor page changes or check statuses

Workflow:

1. `browser action=start` - Start browser if not running
2. `browser action=open url=<url>` - Open a URL
3. `browser action=snapshot` - Get page content (AI-readable)
4. `browser action=screenshot` - Capture visual screenshot
5. `browser action=act kind=click ref=<n>` - Click element by ref
6. `browser action=act kind=type ref=<n> text=<text>` - Type into element

Proactive triggers (use browser without being asked):

- User mentions a URL -> offer to visit and analyze
- User asks "what does X website show" -> use browser
- User wants to check something online -> use browser
- User mentions web scraping or automation -> use browser
```

### Change 3: Include browser section in system prompt assembly

Add the browser section to the main prompt assembly, similar to how `buildMemorySection()` or `buildMessagingSection()` are included.

The section should only be included when:

- `promptMode` is not "minimal" or "none"
- `browser` tool is in `availableTools`

## Implementation Files

| File                          | Change                                                                                      |
| ----------------------------- | ------------------------------------------------------------------------------------------- |
| `src/agents/system-prompt.ts` | Update `coreToolSummaries.browser`, add `buildBrowserSection()`, include in prompt assembly |

## Testing

1. Start openclaw gateway locally
2. Send a message via Feishu: "帮我打开 https://example.com 截个图"
3. Verify AI uses browser tool automatically
4. Check system prompt includes the new Browser section

## Success Criteria

- AI proactively uses browser tool when user mentions URLs or web tasks
- Natural language commands like "打开网页截图" work without explicit instructions
- Browser workflow (start -> open -> snapshot/screenshot) is followed correctly
