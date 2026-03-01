# Model Quick Switch Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable fast model switching via Telegram quick-pick buttons, auto-generated aliases, and a CLI shorthand command.

**Architecture:** Extends the existing `/model` directive handler to show inline keyboard buttons for configured models on Telegram. Enhances `buildModelAliasIndex()` to auto-derive short aliases from model IDs. Adds a `use` CLI subcommand as a thin alias for `models set`.

**Tech Stack:** TypeScript (ESM), Vitest, Telegram Bot API inline keyboards.

---

### Task 1: Auto-generate short aliases in `buildModelAliasIndex()`

**Files:**

- Modify: `src/agents/model-selection.ts:253-279`
- Test: `src/agents/model-selection.test.ts` (or create if absent)

**Step 1: Write the failing test**

In the test file for `model-selection.ts`, add:

```typescript
import { buildModelAliasIndex } from "./model-selection.js";

describe("buildModelAliasIndex auto-aliases", () => {
  it("auto-generates alias from model ID when no explicit alias is set", () => {
    const cfg = {
      agents: {
        defaults: {
          models: {
            "dashscope/qwen-plus": {}, // no alias field
          },
        },
      },
    };
    const index = buildModelAliasIndex({ cfg: cfg as any, defaultProvider: "anthropic" });
    const match = index.byAlias.get("qwen-plus");
    expect(match).toBeDefined();
    expect(match?.ref.provider).toBe("dashscope");
    expect(match?.ref.model).toBe("qwen-plus");
  });

  it("does not overwrite an explicit alias", () => {
    const cfg = {
      agents: {
        defaults: {
          models: {
            "dashscope/qwen-plus": { alias: "qw" },
          },
        },
      },
    };
    const index = buildModelAliasIndex({ cfg: cfg as any, defaultProvider: "anthropic" });
    expect(index.byAlias.has("qw")).toBe(true);
    // Auto-alias should still be generated as a secondary alias
    expect(index.byAlias.has("qwen-plus")).toBe(true);
  });

  it("prefixes with provider when model IDs collide across providers", () => {
    const cfg = {
      agents: {
        defaults: {
          models: {
            "provider-a/chat": {},
            "provider-b/chat": {},
          },
        },
      },
    };
    const index = buildModelAliasIndex({ cfg: cfg as any, defaultProvider: "anthropic" });
    // "chat" alone is ambiguous, so both should get provider-prefixed aliases
    expect(index.byAlias.has("provider-a-chat")).toBe(true);
    expect(index.byAlias.has("provider-b-chat")).toBe(true);
    // The bare "chat" should NOT be registered (ambiguous)
    expect(index.byAlias.has("chat")).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- src/agents/model-selection.test.ts -t "auto-aliases" --reporter verbose`
Expected: FAIL — auto-alias logic doesn't exist yet.

**Step 3: Implement auto-alias generation**

In `src/agents/model-selection.ts`, modify `buildModelAliasIndex()`. After the existing explicit-alias loop, add auto-alias generation:

```typescript
export function buildModelAliasIndex(params: {
  cfg: OpenClawConfig;
  defaultProvider: string;
}): ModelAliasIndex {
  const byAlias = new Map<string, { alias: string; ref: ModelRef }>();
  const byKey = new Map<string, string[]>();

  const rawModels = params.cfg.agents?.defaults?.models ?? {};

  // Pass 1: collect explicit aliases (existing logic, unchanged)
  for (const [keyRaw, entryRaw] of Object.entries(rawModels)) {
    const parsed = parseModelRef(String(keyRaw ?? ""), params.defaultProvider);
    if (!parsed) {
      continue;
    }
    const alias = String((entryRaw as { alias?: string } | undefined)?.alias ?? "").trim();
    if (!alias) {
      continue;
    }
    const aliasKey = normalizeAliasKey(alias);
    byAlias.set(aliasKey, { alias, ref: parsed });
    const key = modelKey(parsed.provider, parsed.model);
    const existing = byKey.get(key) ?? [];
    existing.push(alias);
    byKey.set(key, existing);
  }

  // Pass 2: auto-generate short aliases from model IDs for entries without explicit aliases
  // First, count how many entries share the same model ID (to detect collisions)
  const modelIdCounts = new Map<string, number>();
  const parsedEntries: Array<{ ref: ModelRef; hasExplicitAlias: boolean }> = [];
  for (const [keyRaw, entryRaw] of Object.entries(rawModels)) {
    const parsed = parseModelRef(String(keyRaw ?? ""), params.defaultProvider);
    if (!parsed) {
      continue;
    }
    const hasExplicit = Boolean(
      String((entryRaw as { alias?: string } | undefined)?.alias ?? "").trim(),
    );
    parsedEntries.push({ ref: parsed, hasExplicitAlias: hasExplicit });
    const modelId = parsed.model.toLowerCase();
    modelIdCounts.set(modelId, (modelIdCounts.get(modelId) ?? 0) + 1);
  }

  for (const { ref } of parsedEntries) {
    const modelId = ref.model;
    const modelIdLower = modelId.toLowerCase();
    const isAmbiguous = (modelIdCounts.get(modelIdLower) ?? 0) > 1;

    // Try bare model ID first (e.g. "qwen-plus")
    if (!isAmbiguous) {
      const autoKey = normalizeAliasKey(modelId);
      if (!byAlias.has(autoKey)) {
        byAlias.set(autoKey, { alias: modelId, ref });
        const key = modelKey(ref.provider, ref.model);
        const existing = byKey.get(key) ?? [];
        existing.push(modelId);
        byKey.set(key, existing);
      }
    } else {
      // Ambiguous: use provider-model format (e.g. "dashscope-qwen-plus")
      const prefixed = `${ref.provider}-${modelId}`;
      const autoKey = normalizeAliasKey(prefixed);
      if (!byAlias.has(autoKey)) {
        byAlias.set(autoKey, { alias: prefixed, ref });
        const key = modelKey(ref.provider, ref.model);
        const existing = byKey.get(key) ?? [];
        existing.push(prefixed);
        byKey.set(key, existing);
      }
    }
  }

  return { byAlias, byKey };
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test -- src/agents/model-selection.test.ts -t "auto-aliases" --reporter verbose`
Expected: PASS

**Step 5: Commit**

```bash
scripts/committer "feat: auto-generate short aliases for configured models" src/agents/model-selection.ts src/agents/model-selection.test.ts
```

---

### Task 2: Quick-pick buttons for `/model` on Telegram

**Files:**

- Modify: `src/telegram/model-buttons.ts`
- Modify: `src/auto-reply/reply/directive-handling.model.ts`
- Test: `src/telegram/model-buttons.test.ts`

**Step 1: Write the failing test for `buildQuickPickKeyboard`**

In `src/telegram/model-buttons.test.ts`, add:

```typescript
import { buildQuickPickKeyboard } from "./model-buttons.js";

describe("buildQuickPickKeyboard", () => {
  it("builds buttons for configured models", () => {
    const rows = buildQuickPickKeyboard({
      models: [
        { provider: "dashscope", model: "qwen-plus", name: "Qwen Plus" },
        { provider: "anthropic", model: "claude-opus-4-6", name: "Claude Opus" },
      ],
      currentModel: "dashscope/qwen-plus",
    });
    expect(rows.length).toBeGreaterThanOrEqual(1);
    // First model is current, should have checkmark
    const allButtons = rows.flat();
    const qwenBtn = allButtons.find((b) => b.callback_data.includes("qwen-plus"));
    expect(qwenBtn?.text).toContain("✓");
    // Second model should not have checkmark
    const claudeBtn = allButtons.find((b) => b.callback_data.includes("claude-opus"));
    expect(claudeBtn?.text).not.toContain("✓");
  });

  it("returns empty array when no models provided", () => {
    const rows = buildQuickPickKeyboard({ models: [], currentModel: undefined });
    expect(rows).toEqual([]);
  });

  it("uses mdl_sel_ callback data format", () => {
    const rows = buildQuickPickKeyboard({
      models: [{ provider: "dashscope", model: "qwen-plus", name: "Qwen Plus" }],
      currentModel: undefined,
    });
    const btn = rows.flat()[0];
    expect(btn?.callback_data).toBe("mdl_sel_dashscope/qwen-plus");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- src/telegram/model-buttons.test.ts -t "buildQuickPickKeyboard" --reporter verbose`
Expected: FAIL — function doesn't exist yet.

**Step 3: Add `buildQuickPickKeyboard` to `model-buttons.ts`**

Add after `buildBrowseProvidersButton()`:

```typescript
export type QuickPickModel = {
  provider: string;
  model: string;
  name?: string;
};

/**
 * Build quick-pick inline keyboard showing configured models.
 * Two models per row. Active model gets a checkmark.
 */
export function buildQuickPickKeyboard(params: {
  models: QuickPickModel[];
  currentModel?: string;
}): ButtonRow[] {
  const { models, currentModel } = params;
  if (models.length === 0) {
    return [];
  }

  const rows: ButtonRow[] = [];
  let currentRow: ButtonRow = [];

  for (const m of models) {
    const key = `${m.provider}/${m.model}`;
    const callbackData = `mdl_sel_${key}`;
    if (Buffer.byteLength(callbackData, "utf8") > MAX_CALLBACK_DATA_BYTES) {
      continue;
    }
    const isCurrent = currentModel === key;
    const label = m.name ?? m.model;
    const displayText = truncateModelId(label, 18);
    const text = isCurrent ? `${displayText} ✓` : displayText;

    currentRow.push({ text, callback_data: callbackData });
    if (currentRow.length === 2) {
      rows.push(currentRow);
      currentRow = [];
    }
  }

  if (currentRow.length > 0) {
    rows.push(currentRow);
  }

  return rows;
}
```

Note: `truncateModelId` and `MAX_CALLBACK_DATA_BYTES` are already defined in the file (used by `buildModelsKeyboard`). The callback data format `mdl_sel_{provider/model}` reuses the existing pattern, so the callback handler in `bot-handlers.ts` already knows how to handle these buttons — no new callback handler needed.

**Step 4: Run test to verify it passes**

Run: `pnpm test -- src/telegram/model-buttons.test.ts -t "buildQuickPickKeyboard" --reporter verbose`
Expected: PASS

**Step 5: Commit**

```bash
scripts/committer "feat: add buildQuickPickKeyboard for model quick-pick buttons" src/telegram/model-buttons.ts src/telegram/model-buttons.test.ts
```

---

### Task 3: Wire quick-pick buttons into `/model` summary on Telegram

**Files:**

- Modify: `src/auto-reply/reply/directive-handling.model.ts:238-265` (the `wantsSummary && isTelegram` branch)

**Step 1: Write the failing test**

In `src/auto-reply/reply/directive-handling.model.test.ts` (or create if absent), add a test that verifies the summary response includes quick-pick buttons. Check the existing test patterns in that file first and follow the same mocking strategy.

The key assertion: when `wantsSummary` is true and `surface === "telegram"`, the returned `channelData.telegram.buttons` should include `mdl_sel_` buttons for configured models (not just "Browse providers").

**Step 2: Run test to verify it fails**

Run: `pnpm test -- src/auto-reply/reply/directive-handling.model.test.ts --reporter verbose`
Expected: FAIL

**Step 3: Modify the `wantsSummary && isTelegram` branch**

In `src/auto-reply/reply/directive-handling.model.ts`, modify the `wantsSummary` section (around line 250). Import and use `buildQuickPickKeyboard`:

```typescript
import {
  buildBrowseProvidersButton,
  buildQuickPickKeyboard,
  type QuickPickModel,
} from "../../telegram/model-buttons.js";
```

Replace the `isTelegram` block inside `wantsSummary` (lines ~250-264) with:

```typescript
if (isTelegram) {
  // Build quick-pick buttons from the configured model catalog
  const quickPickModels: QuickPickModel[] = pickerCatalog.map((entry) => ({
    provider: entry.provider,
    model: entry.id,
    name: entry.name,
  }));
  const quickPickRows = buildQuickPickKeyboard({
    models: quickPickModels,
    currentModel: current,
  });
  const browseRow = buildBrowseProvidersButton();
  const buttons = [...quickPickRows, ...browseRow];

  return {
    text: [
      `Current: ${current}${modelRefs.activeDiffers ? " (selected)" : ""}`,
      activeRuntimeLine,
      "",
      quickPickModels.length > 0 ? "Tap to switch:" : null,
      "/model <name> to switch",
      "/model status for details",
    ]
      .filter(Boolean)
      .join("\n"),
    channelData: { telegram: { buttons } },
  };
}
```

For non-Telegram surfaces, also enhance the text output to show available model short names:

```typescript
// Non-Telegram: show model list as text
const modelHints = pickerCatalog
  .slice(0, 5)
  .map((e) => `  ${e.provider}/${e.id}`)
  .join("\n");

return {
  text: [
    `Current: ${current}${modelRefs.activeDiffers ? " (selected)" : ""}`,
    activeRuntimeLine,
    "",
    pickerCatalog.length > 0 ? `Available:\n${modelHints}` : null,
    "",
    "Switch: /model <provider/model>",
    "Browse: /models",
    "More: /model status",
  ]
    .filter(Boolean)
    .join("\n"),
};
```

**Step 4: Run test to verify it passes**

Run: `pnpm test -- src/auto-reply/reply/directive-handling.model.test.ts --reporter verbose`
Expected: PASS

**Step 5: Commit**

```bash
scripts/committer "feat: show quick-pick model buttons on /model in Telegram" src/auto-reply/reply/directive-handling.model.ts src/auto-reply/reply/directive-handling.model.test.ts
```

---

### Task 4: CLI `openclaw models use` subcommand

**Files:**

- Modify: `src/cli/models-cli.ts:117-125` (add `use` alongside `set`)

**Step 1: Write the failing test**

There may not be CLI integration tests. Check for `models-cli.test.ts` or similar first. If none exist, a manual verification step is fine. If tests exist, add a case for `use`.

**Step 2: Add the `use` command**

In `src/cli/models-cli.ts`, add after the `set` command block (after line 125):

```typescript
models
  .command("use")
  .description("Switch the default model (alias for set)")
  .argument("<model>", "Model id or alias")
  .action(async (model: string) => {
    await runModelsCommand(async () => {
      await modelsSetCommand(model, defaultRuntime);
    });
  });
```

This reuses `modelsSetCommand` which already resolves aliases via `applyDefaultModelPrimaryUpdate()`.

**Step 3: Verify manually**

Run: `pnpm openclaw models use --help`
Expected: Shows usage info for the `use` subcommand.

Run: `pnpm openclaw models use dashscope/qwen-plus` (if configured)
Expected: "Default model: dashscope/qwen-plus"

**Step 4: Commit**

```bash
scripts/committer "feat: add 'openclaw models use' as alias for 'models set'" src/cli/models-cli.ts
```

---

### Task 5: Run full test suite and verify

**Step 1: Type check**

Run: `pnpm build`
Expected: No type errors.

**Step 2: Lint**

Run: `pnpm check`
Expected: No lint errors.

**Step 3: Run related tests**

Run: `pnpm test -- src/agents/model-selection.test.ts src/telegram/model-buttons.test.ts src/auto-reply/reply/directive-handling.model.test.ts --reporter verbose`
Expected: All pass.

**Step 4: Run full test suite**

Run: `pnpm test`
Expected: All pass.

**Step 5: Final commit if any lint/format fixes needed**

```bash
pnpm format:fix && scripts/committer "style: format" <changed-files>
```
