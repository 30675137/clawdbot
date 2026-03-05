# Model Quick Switch Design

## Problem

Users with 2-3 configured models (e.g. qwen, claude) need a faster way to switch between them. Currently:

- `/model` shows status but no quick-pick buttons for configured models
- Switching requires typing full `provider/model` strings (e.g. `dashscope/qwen-plus`)
- CLI `openclaw models set` is verbose and doesn't resolve aliases

## Design

### Change 1: Quick-pick buttons on `/model` (no args)

When a user sends `/model` with no arguments on Telegram, show configured models as inline keyboard buttons instead of just "Browse providers".

**Before:**

```
Current: dashscope/qwen-plus

[Browse providers]
```

**After:**

```
Current: dashscope/qwen-plus

[* Qwen Plus] [Claude Opus]

[Browse providers]
```

The active model is prefixed with `*`. Tapping a button switches the session model immediately via callback query (same mechanism as existing model browsing buttons).

**Implementation:**

- Modify `maybeHandleModelDirectiveInfo()` in `src/auto-reply/reply/directive-handling.model.ts` — in the `wantsSummary` branch, build an inline keyboard from the configured model catalog (limited to models in `agents.defaults.models` or the primary + fallback chain).
- Add a callback query handler for the new quick-pick buttons in `src/telegram/model-buttons.ts`.
- Non-Telegram surfaces: show the short model list as text with alias hints.

### Change 2: Auto-generate short aliases for configured models

When a model is configured in `agents.defaults.models` or as the primary/fallback model, automatically derive a short alias from its model ID if no explicit alias is set.

**Derivation rules:**

1. Use the model ID (e.g. `qwen-plus` from `dashscope/qwen-plus`)
2. If the model ID alone is unique across providers, use it as the alias
3. If ambiguous, prefix with provider (e.g. `dashscope-qwen-plus`)

**Implementation:**

- Extend `buildModelAliasIndex()` in `src/agents/model-selection.ts` to auto-generate aliases for configured models that lack an explicit alias.
- Only auto-alias models from `agents.defaults.models`, primary model, and fallbacks — not the entire catalog.

**Result:** `/model qwen-plus` works without manual alias configuration.

### Change 3: CLI `openclaw models use <alias>` shorthand

Add a `use` subcommand as a user-friendly alias for `models set` that also resolves aliases.

```bash
openclaw models use qwen-plus    # resolves alias → sets dashscope/qwen-plus
openclaw models use claude        # resolves alias → sets anthropic/claude-opus-4-6
```

**Implementation:**

- Add `use` command in `src/cli/models-cli.ts` alongside existing `set` command.
- Internally calls the same `modelsSetCommand()` from `src/commands/models/set.ts`.
- The existing `set` command already supports aliases via `applyDefaultModelPrimaryUpdate()`, so `use` is a thin wrapper with the same behavior.

## Files to modify

| File                                               | Change                                                  |
| -------------------------------------------------- | ------------------------------------------------------- |
| `src/auto-reply/reply/directive-handling.model.ts` | Add quick-pick buttons in `wantsSummary` branch         |
| `src/telegram/model-buttons.ts`                    | Add `buildQuickPickKeyboard()` and callback data format |
| `src/telegram/callback-queries.ts` (or equivalent) | Handle quick-pick button callbacks                      |
| `src/agents/model-selection.ts`                    | Auto-generate aliases in `buildModelAliasIndex()`       |
| `src/cli/models-cli.ts`                            | Register `use` subcommand                               |
| `src/commands/models/use.ts` (new)                 | Thin wrapper calling `modelsSetCommand()`               |

## Out of scope

- Model profiles / preset groups (future enhancement)
- Per-message model selection (e.g. `@claude translate this`)
- Non-Telegram button UI (Discord slash commands, etc.)
