# Claude Code Instructions

## Browser Testing

**Prefer `agent-browser` over Playwright MCP tools** for all browser automation and testing tasks.

Use agent-browser for:
- Visual testing and screenshots
- Clicking, filling forms, navigation
- Mobile viewport testing (`--viewport 390x844`)
- Inspecting page state and elements

Only fall back to Playwright if agent-browser lacks a specific feature needed (e.g., WebKit engine emulation for true iOS Safari testing - though note agent-browser uses Chromium).

```bash
# Core workflow
agent-browser open <url>              # Navigate
agent-browser snapshot -i -c          # Get interactive elements
agent-browser click @e5               # Interact using refs
agent-browser screenshot out.png      # Capture
```

## Capability Verification Protocol

Before asserting that a requested action cannot be performed:

1. **Consult authoritative sources** - Search current documentation, official references, or reliable technical sources to verify the limitation exists
2. **Cite evidence** - If the limitation is genuine, provide specific references (documentation links, error codes, technical constraints) that substantiate the claim
3. **Exhaust alternatives** - Attempt reasonable workarounds or alternative approaches before concluding impossibility

If the user demonstrates that the action is in fact possible, acknowledge the correction and proceed with execution immediately rather than defending the initial position.

The goal is accuracy over confidence. An incorrect "I cannot do this" wastes the user's time and money.
