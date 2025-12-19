# SPEC: Améliorer l'expérience utilisateur - Questions concises avec Trade-offs visuels

## 1. Feature Summary

### Problem
The Engineer phase questions are too verbose with long ASCII art spectrums that slow down the decision-making flow. Users need to read through large blocks of text for simple A/B/C decisions.

**Before:**
```
Agent: "I saw you're using Next.js with the App Router. For the hero section,
there's a spectrum:

Static ◆━━━━━━━━━━━━━━━◆ Full interactive
→ Faster, SEO friendly      → More engaging
→ Less JS                   → More complex
→ Better initial load       → Richer experience

What approach do you prefer?"
```

**After:**
```
Agent: "Hero section: static ou interactive?"

[Trade-offs panel shows pros/cons visually]
```

### Solution
Separate **conversation** (concise questions) from **trade-offs** (contextual information) in the UI. Move decision context to a dedicated visual panel that appears/disappears dynamically.

### Impact
- ⚡ Faster reading and decision-making
- 🎯 Cleaner conversation flow
- 📊 Visual trade-off comparison
- 🧹 Less UI clutter

---

## 2. Technical Decisions

### 2.1 UI Layout
**Decision:** Three-column layout with responsive behavior

```
┌──────────┬─────────────────────┬─────────────────┐
│ Activity │   Conversation      │   Trade-offs    │
│  (20%)   │      (55%)          │     (25%)       │
│          │                     │                 │
│ 🔧 Grep: │ Agent: "Hero:       │ ⭐ Static (reco)│
│   *.py   │  static ou          │   ✓ Meilleur SEO│
│          │  interactive?"      │   ✓ Moins de JS │
│ 📖 Read: │                     │   ✗ Moins enga- │
│   main.py│ User: "Static"      │     geant       │
│          │                     │                 │
│          │                     │ Interactive     │
│          │                     │   ✓ Plus enga-  │
│          │                     │     geant       │
│          │                     │   ✗ Plus com-   │
│          │                     │     plexe       │
└──────────┴─────────────────────┴─────────────────┘
```

**Rationale:**
- Activity log reduced to 20% (from current 40%) - less distraction
- Conversation remains central focus at 55%
- Trade-offs panel at 25% provides visual reference without cluttering conversation

**Responsive behavior:**
- If terminal width < 120 columns: collapse trade-offs panel (revert to 2-column layout)
- Activity and Conversation expand proportionally

### 2.2 Activity Log (Left Column)
**Decision:** Show only tool uses in compact format

**Format:** `{emoji} {ToolName}: {target}`

**Examples:**
- `🔧 Grep: *.py`
- `📖 Read: main.py`
- `🌐 Glob: src/**/*.ts`
- `⚙️ Bash: git log`

**What to exclude:**
- Tool results (unless critical errors)
- Success/completion messages
- Verbose output logs

**Rationale:** Users care about *what* the agent is doing, not detailed results. Reduce noise.

### 2.3 Trade-offs Panel (Right Column)
**Decision:** Dynamic panel with three states

**State 1: Options present (during A/B/C questions)**
```
┌─ Options ────────────┐
│ ⭐ Static (recommended)
│   ✓ Meilleur SEO     │
│   ✓ Moins de JS      │
│   ✓ Plus rapide      │
│   ✗ Moins engageant  │
│                      │
│ Interactive          │
│   ✓ Plus engageant   │
│   ✓ Moderne          │
│   ✗ Plus complexe    │
│   ✗ Plus de JS       │
└──────────────────────┘
```

**State 2: No options (between questions)**
```
┌─ Context ────────────┐
│ Stack détectée:      │
│  • Next.js 14        │
│  • React 18          │
│  • TypeScript        │
│                      │
│ Patterns:            │
│  • App Router        │
│  • Server Components │
└──────────────────────┘
```

**State 3: Hidden (terminal < 120 cols)**

**Styling:**
- **Pros:** ✓ with green color
- **Cons:** ✗ with red color
- **Recommendation:** ⭐ prefix + highlighted (different background or border)

**Behavior:**
- Appears when agent presents options
- Disappears after user responds
- Shows technical context when idle

**Rationale:** Keep trade-offs visible during decision-making, then clear to reduce clutter. Use idle time to show helpful context.

### 2.4 Data Format
**Decision:** Structured JSON output from Engineer agent

```json
{
  "message": "Hero section: static ou interactive?",
  "options": [
    {
      "label": "Static",
      "pros": ["Meilleur SEO", "Moins de JS", "Plus rapide"],
      "cons": ["Moins engageant"]
    },
    {
      "label": "Interactive",
      "pros": ["Plus engageant", "Moderne"],
      "cons": ["Plus complexe", "Plus de JS"]
    }
  ],
  "recommendation": "Static"
}
```

**Rationale:**
- ✅ Reliable parsing (no fragile regex)
- ✅ Claude SDK supports structured outputs natively
- ✅ Extensible for future fields
- ✅ Agent can still be conversational in `message` field

### 2.5 Engineer Questions
**Decision:** Short, scannable questions without ASCII art

**Before:**
```
"I saw you're using Next.js with the App Router. For the hero section,
there's a spectrum:

Static ◆━━━━━━━━━━━━━━━◆ Full interactive
→ Faster, SEO friendly      → More engaging
→ Less JS                   → More complex
..."
```

**After:**
```
"Hero section: static ou interactive?"
```

**Rationale:** Trade-offs moved to dedicated UI panel. Questions can be direct.

---

## 3. Files to Create/Modify

### 3.1 New Files

#### `/src/overkill/ui/widgets/tradeoffs_panel.py`
**Purpose:** Custom Textual widget for displaying trade-offs

**Class:** `TradeoffsPanel(Static)`

**Methods:**
- `update_options(options: list[dict], recommendation: str | None)` - Display A/B/C options
- `update_context(context: dict)` - Display technical stack/patterns
- `clear()` - Hide/clear panel content
- `_render_option(option: dict, is_recommended: bool) -> RenderableType` - Render single option with pros/cons

**Styling:**
- Use Rich Text for colors (green ✓, red ✗)
- Border with title "Options" or "Context"
- Highlight recommended option (background color or border)

### 3.2 Modified Files

#### `/src/overkill/ui/adapter.py`
**Changes:** Add three new abstract methods

```python
@abstractmethod
def show_tradeoffs(self, options: list[dict], recommendation: str | None = None) -> None:
    """Display trade-offs for decision options in dedicated panel.

    Args:
        options: List of dicts with keys: label, pros (list), cons (list)
        recommendation: Optional label of recommended option
    """

@abstractmethod
def hide_tradeoffs(self) -> None:
    """Clear/hide trade-offs panel."""

@abstractmethod
def update_context(self, context: dict) -> None:
    """Update technical context display when no options are shown.

    Args:
        context: Dict with keys like 'stack' (list), 'patterns' (list)
    """
```

**Rationale:** Maintain UI abstraction - future web/Electron UIs will implement these.

#### `/src/overkill/ui/textual_ui.py`
**Changes:**

1. **Import new widget:**
   ```python
   from overkill.ui.widgets.tradeoffs_panel import TradeoffsPanel
   ```

2. **Add TradeoffsPanel to layout:**
   ```python
   def compose(self) -> ComposeResult:
       yield Header()
       yield PhaseIndicator()
       with Horizontal():
           yield ActivityLog(id="activity")  # 20% width
           yield MessageList(id="messages")  # 55% width
           yield TradeoffsPanel(id="tradeoffs")  # 25% width
       yield ConversationInput(id="input")
   ```

3. **Update CSS for three-column layout:**
   ```css
   #activity {
       width: 20%;  /* was 40% */
   }
   #messages {
       width: 55%;  /* was 60% */
   }
   #tradeoffs {
       width: 25%;
   }

   /* Responsive: hide tradeoffs if terminal < 120 cols */
   @media (max-width: 120) {
       #tradeoffs {
           display: none;
       }
       #activity {
           width: 30%;
       }
       #messages {
           width: 70%;
       }
   }
   ```

4. **Implement new UIAdapter methods:**
   ```python
   def show_tradeoffs(self, options: list[dict], recommendation: str | None = None) -> None:
       panel = self.query_one("#tradeoffs", TradeoffsPanel)
       panel.update_options(options, recommendation)

   def hide_tradeoffs(self) -> None:
       panel = self.query_one("#tradeoffs", TradeoffsPanel)
       panel.clear()

   def update_context(self, context: dict) -> None:
       panel = self.query_one("#tradeoffs", TradeoffsPanel)
       panel.update_context(context)
   ```

5. **Compact activity log format:**
   - Modify `log_activity()` method
   - Change from multi-line to single-line format
   - Filter out verbose tool results

   **Before:**
   ```python
   def log_activity(self, message: str, category: str = "info"):
       text = Text()
       if category == "tool_use":
           text.append("🔧 ", style="bold cyan")
           text.append(f"Tool: {message}")
       # ... verbose formatting
   ```

   **After:**
   ```python
   def log_activity(self, message: str, category: str = "info"):
       if category == "tool_use":
           # Format: "🔧 ToolName: target"
           text = Text(f"🔧 {message}", style="cyan")
       elif category == "error":
           text = Text(f"❌ {message}", style="red")
       else:
           return  # Skip non-critical logs
       # ... append to activity log
   ```

#### `/src/overkill/core/engineer.py`
**Changes:**

1. **Modify system prompt in `_build_system_prompt()`:**

   **Remove:** ASCII art spectrum examples, verbose question format

   **Add:** Instructions for structured output

   ```python
   def _build_system_prompt(self, repo_summary: dict) -> str:
       # ... existing context ...

       prompt = f"""You are a vibe engineer conducting a conversation to understand project requirements.

   REPOSITORY CONTEXT:
   {self._format_repo_summary(repo_summary)}

   YOUR ROLE:
   - Ask SHORT, DIRECT questions (1-2 lines max)
   - When presenting A/B/C options, output structured JSON
   - NO ASCII art spectrums
   - NO long explanations in questions

   STRUCTURED OUTPUT FORMAT:
   When you need to present options to the user, respond with JSON:
   {{
     "message": "Short question?",
     "options": [
       {{
         "label": "Option A",
         "pros": ["Benefit 1", "Benefit 2"],
         "cons": ["Drawback 1"]
       }},
       {{
         "label": "Option B",
         "pros": ["Benefit 1"],
         "cons": ["Drawback 1", "Drawback 2"]
       }}
     ],
     "recommendation": "Option A"  // optional
   }}

   For open-ended questions without clear A/B/C choices, just ask normally (no JSON).

   CONVERSATION STYLE:
   - Concise and scannable
   - Trust user's technical knowledge
   - Trade-offs will be displayed visually in UI
   - Focus on decision-making, not education
   """
       return prompt
   ```

2. **Parse agent responses for structured output:**

   ```python
   async def engineer(self) -> dict:
       """Run engineering conversation with structured output parsing."""

       # ... existing setup ...

       while True:
           response = await agent.prompt(user_message)

           # Try to parse as JSON (structured output)
           try:
               data = json.loads(response)
               if "options" in data:
                   # Structured output with trade-offs
                   self.ui.add_message(data["message"], "agent")
                   self.ui.show_tradeoffs(
                       data["options"],
                       data.get("recommendation")
                   )
               else:
                   # Regular message
                   self.ui.add_message(response, "agent")
           except json.JSONDecodeError:
               # Not JSON, treat as regular message
               self.ui.add_message(response, "agent")

           # Wait for user response
           user_message = await self.ui.get_user_input()

           # Hide trade-offs after user responds
           self.ui.hide_tradeoffs()

           if user_message.lower() == "done":
               break

       return self.decisions
   ```

3. **Update tool use logging** for compact format:

   ```python
   def _log_tool_use(self, tool_name: str, tool_input: dict) -> None:
       """Log tool usage in compact format."""
       # Extract target/pattern from tool input
       target = tool_input.get("pattern") or tool_input.get("file_path") or tool_input.get("command") or ""

       # Format: "ToolName: target"
       message = f"{tool_name}: {target}"
       self.ui.log_activity(message, "tool_use")
   ```

#### `/src/overkill/core/explorer.py`
**Changes:** Extract and pass technical context to UI

```python
async def explore(self) -> dict:
    """Analyze repository and extract technical context."""

    # ... existing exploration logic ...

    # Extract stack and patterns
    context = {
        "stack": [],
        "patterns": []
    }

    # Detect stack from package files
    if (self.repo_path / "package.json").exists():
        # Parse package.json for dependencies
        package_data = json.loads((self.repo_path / "package.json").read_text())
        deps = {**package_data.get("dependencies", {}), **package_data.get("devDependencies", {})}

        if "next" in deps:
            context["stack"].append(f"Next.js {deps['next']}")
        if "react" in deps:
            context["stack"].append(f"React {deps['react']}")
        if "typescript" in deps or (self.repo_path / "tsconfig.json").exists():
            context["stack"].append("TypeScript")

    # Detect patterns from file structure
    if (self.repo_path / "app").exists():
        context["patterns"].append("App Router")
    if (self.repo_path / "pages").exists():
        context["patterns"].append("Pages Router")

    # Send context to UI
    self.ui.update_context(context)

    return summary
```

---

## 4. Implementation Steps

Execute in this exact order:

### Step 1: Create TradeoffsPanel Widget
**File:** `/src/overkill/ui/widgets/tradeoffs_panel.py`

1. Create new file and directory if needed
2. Implement `TradeoffsPanel(Static)` class
3. Add methods: `update_options()`, `update_context()`, `clear()`
4. Implement rendering with Rich Text (colors, emojis)
5. Add tests for rendering logic

**Verification:** Widget can be imported and instantiated

### Step 2: Update UIAdapter Interface
**File:** `/src/overkill/ui/adapter.py`

1. Add three new abstract methods: `show_tradeoffs()`, `hide_tradeoffs()`, `update_context()`
2. Add comprehensive docstrings with parameter types

**Verification:** No syntax errors, type hints valid

### Step 3: Implement TextualUI Methods
**File:** `/src/overkill/ui/textual_ui.py`

1. Import `TradeoffsPanel`
2. Add widget to `compose()` method
3. Update CSS for three-column layout (20% / 55% / 25%)
4. Add responsive CSS rule (< 120 cols → hide tradeoffs)
5. Implement `show_tradeoffs()`, `hide_tradeoffs()`, `update_context()`
6. Compact activity log: modify `log_activity()` to single-line format

**Verification:**
- Run app, verify three-column layout appears
- Resize terminal, verify responsive behavior
- Activity log shows compact format

### Step 4: Modify Engineer System Prompt
**File:** `/src/overkill/core/engineer.py`

1. Update `_build_system_prompt()` method
2. Remove ASCII art examples
3. Add structured JSON output instructions
4. Keep prompt concise

**Verification:** Print system prompt, verify it matches spec

### Step 5: Implement Structured Output Parsing
**File:** `/src/overkill/core/engineer.py`

1. Modify `engineer()` conversation loop
2. Add JSON parsing try/catch
3. Call `ui.show_tradeoffs()` when options detected
4. Call `ui.hide_tradeoffs()` after user responds
5. Update `_log_tool_use()` for compact format

**Verification:**
- Run engineer phase
- Verify JSON parsing works (test with mock response)
- Verify trade-offs panel appears/disappears

### Step 6: Add Context Extraction to Explorer
**File:** `/src/overkill/core/explorer.py`

1. Add context extraction logic (detect stack, patterns)
2. Call `ui.update_context()` with extracted data
3. Handle missing/optional files gracefully

**Verification:**
- Run explorer phase
- Verify context appears in trade-offs panel
- Test with repos missing package.json

### Step 7: Integration Testing
**Test scenarios:**

1. **Full pipeline:** Run `overkill <repo>` end-to-end
2. **Responsive:** Resize terminal to < 120 cols, verify collapse
3. **Question flow:** Verify trade-offs appear during A/B/C questions
4. **Context display:** Verify technical stack shows between questions
5. **Activity log:** Verify compact format (tool uses only)

**Verification checklist:**
- [ ] Three-column layout renders correctly
- [ ] Trade-offs panel shows options with pros/cons
- [ ] Recommended option is highlighted
- [ ] Panel clears after user responds
- [ ] Context displays between questions
- [ ] Activity log is compact (20% width, single-line entries)
- [ ] Responsive behavior works (< 120 cols)
- [ ] Questions are short (no ASCII art)
- [ ] No regressions in Explore/Crystallize phases

### Step 8: Polish and Edge Cases

1. **Empty states:**
   - Handle empty pros/cons lists
   - Handle no recommendation provided
   - Handle missing context data

2. **Text wrapping:**
   - Long option labels
   - Long pros/cons items
   - Narrow terminal widths

3. **Colors:**
   - Verify green/red are accessible
   - Test in different terminal themes

4. **Error handling:**
   - Invalid JSON from agent (fallback to regular message)
   - Missing fields in structured output
   - UI widget query failures

**Verification:** Test all edge cases manually

---

## 5. Constraints

### 5.1 MUST Follow These Patterns

**Textual Widget Pattern:**
```python
from textual.widgets import Static
from textual.reactive import reactive

class TradeoffsPanel(Static):
    """Follow existing widget patterns in textual_ui.py"""

    options: reactive[list] = reactive([])  # Use reactive attributes

    def watch_options(self, old, new):
        """Use watch_* methods for reactive updates"""
        self.refresh()
```

**Type Hints:**
```python
# ALL functions must have type hints
def show_tradeoffs(self, options: list[dict], recommendation: str | None = None) -> None:
    ...
```

**Async/Await:**
```python
# All I/O operations must be async
async def engineer(self) -> dict:
    response = await agent.prompt(message)  # NOT blocking call
```

**Error Handling:**
```python
# Use try/except with graceful fallback
try:
    data = json.loads(response)
except json.JSONDecodeError:
    # Fallback to regular message
    self.ui.add_message(response, "agent")
```

### 5.2 MUST NOT Do

❌ **Do NOT modify these files:**
- `/src/overkill/main.py` (only change if CLI args needed)
- `/src/overkill/core/explorer.py` (minimal changes only for context extraction)
- `/src/overkill/core/crystallizer.py` (no changes)

❌ **Do NOT change existing method signatures** in `UIAdapter` (only add new ones)

❌ **Do NOT block the async event loop:**
```python
# BAD
response = requests.get(url)  # Blocking I/O

# GOOD
response = await aiohttp.get(url)  # Async I/O
```

❌ **Do NOT use external UI libraries** (stick to Textual + Rich)

❌ **Do NOT persist trade-offs after user responds** (violates decision: "disparaître")

❌ **Do NOT add complexity to Explore/Crystallize phases** (scope limited to Engineer UX)

### 5.3 Code Style
- Follow existing PEP 8 conventions in codebase
- Use f-strings for formatting (not `.format()` or `%`)
- Use pathlib (`Path`) for file operations (not `os.path`)
- Use `Rich.Text` objects for styled terminal output
- Docstrings: Google style (existing pattern)

---

## 6. Acceptance Criteria

### 6.1 Functional Requirements

**✅ Layout:**
- [ ] Three columns visible: Activity (20%) | Conversation (55%) | Trade-offs (25%)
- [ ] Responsive: < 120 cols → two columns (Activity | Conversation)
- [ ] All columns scrollable independently

**✅ Activity Log:**
- [ ] Shows tool uses only (no results)
- [ ] Format: `{emoji} {ToolName}: {target}`
- [ ] Examples: "🔧 Grep: *.py", "📖 Read: main.py"
- [ ] Max 20% width
- [ ] Errors still visible (❌ prefix)

**✅ Trade-offs Panel:**
- [ ] Appears when agent presents options (A/B/C questions)
- [ ] Shows pros with ✓ in green
- [ ] Shows cons with ✗ in red
- [ ] Highlights recommended option with ⭐ and visual distinction
- [ ] Disappears after user responds
- [ ] Shows technical context when no options present
- [ ] Context includes: detected stack, patterns
- [ ] Hidden on terminals < 120 cols

**✅ Engineer Questions:**
- [ ] Short (1-2 lines max)
- [ ] No ASCII art spectrums
- [ ] No long explanatory blocks
- [ ] Clear A/B/C format when options presented

**✅ Structured Output:**
- [ ] Agent outputs valid JSON for option-based questions
- [ ] JSON includes: message, options (label/pros/cons), optional recommendation
- [ ] Falls back gracefully if JSON parse fails
- [ ] Open-ended questions still work (no JSON required)

**✅ Context Extraction:**
- [ ] Explorer detects stack (Next.js, React, TypeScript, etc.)
- [ ] Explorer detects patterns (App Router, Pages Router, etc.)
- [ ] Context displayed in trade-offs panel between questions
- [ ] Handles missing files gracefully (no crashes)

### 6.2 Non-Functional Requirements

**Performance:**
- [ ] No noticeable lag when switching trade-offs states
- [ ] Smooth scrolling in all three columns
- [ ] Responsive resize without flicker

**Compatibility:**
- [ ] Works on terminals ≥ 80 cols wide
- [ ] Works on macOS Terminal, iTerm2, VS Code terminal
- [ ] Colors visible in light and dark themes

**Maintainability:**
- [ ] All new code has type hints
- [ ] All public methods have docstrings
- [ ] Widget follows existing Textual patterns
- [ ] No circular imports

**Robustness:**
- [ ] Invalid JSON from agent doesn't crash
- [ ] Missing context fields handled gracefully
- [ ] UI widget query failures logged, not fatal
- [ ] Works with repos missing package.json/tsconfig

### 6.3 Test Cases

**Test 1: Full Pipeline**
```bash
uv run overkill https://github.com/vercel/next.js
```
- [ ] Explorer phase shows context in trade-offs panel
- [ ] Engineer asks short questions
- [ ] Trade-offs appear for A/B/C questions
- [ ] Trade-offs disappear after each response
- [ ] Crystallizer phase unchanged

**Test 2: Responsive Behavior**
```bash
# Resize terminal to < 120 cols during engineer phase
```
- [ ] Trade-offs panel hidden
- [ ] Activity and conversation expand proportionally
- [ ] No layout breaks or overlaps

**Test 3: Structured Output Parsing**
```python
# Mock agent response in engineer.py
response = '{"message": "Test?", "options": [...], "recommendation": "A"}'
```
- [ ] Parses JSON successfully
- [ ] Displays options in trade-offs panel
- [ ] Highlights recommendation

**Test 4: Fallback for Invalid JSON**
```python
# Mock agent response (invalid JSON)
response = "This is a regular question without JSON"
```
- [ ] No crash or error
- [ ] Message displayed in conversation normally
- [ ] Trade-offs panel shows context (not options)

**Test 5: Context Extraction**
```bash
# Test with Next.js repo (has package.json)
uv run overkill <nextjs-repo>
```
- [ ] Context shows: Next.js version, React version, TypeScript
- [ ] Context shows: App Router or Pages Router

```bash
# Test with Python repo (no package.json)
uv run overkill <python-repo>
```
- [ ] No crash
- [ ] Context panel shows "No stack detected" or similar

**Test 6: Activity Log Compactness**
- [ ] Each tool use is single line
- [ ] Format matches: `🔧 Grep: *.py`
- [ ] No verbose results logged
- [ ] Log stays within 20% width
- [ ] Scrollable when many tool uses

**Test 7: Trade-offs Styling**
- [ ] ✓ appears green (pros)
- [ ] ✗ appears red (cons)
- [ ] ⭐ appears on recommended option
- [ ] Recommended option has visual highlight (background or border)
- [ ] Readable in both light and dark terminal themes

---

## 7. Implementation Notes

### 7.1 Textual Responsive CSS
Use Textual's built-in responsive features:

```css
/* In textual_ui.py DEFAULT_CSS */
@media (max-width: 120) {
    #tradeoffs {
        display: none;
    }
}
```

Reference: https://textual.textualize.io/guide/design/#responsive-design

### 7.2 Structured Outputs with Claude SDK
Claude supports structured outputs via JSON mode. Update agent initialization:

```python
from claude_sdk import ClaudeAgentOptions

options = ClaudeAgentOptions(
    # ... existing options ...
    response_format="json_object"  # Enable JSON mode when needed
)
```

**Important:** JSON mode is opt-in per request, not global. Only use for option-based questions.

### 7.3 Rich Text Styling
Use existing Rich patterns from `textual_ui.py`:

```python
from rich.text import Text

# Green checkmark
pros_text = Text("✓ ", style="green") + Text("Meilleur SEO")

# Red X
cons_text = Text("✗ ", style="red") + Text("Plus complexe")

# Star for recommendation
reco_text = Text("⭐ ", style="yellow bold") + Text("Static")
```

### 7.4 Testing Strategy
1. **Unit tests:** Test `TradeoffsPanel` rendering in isolation
2. **Integration tests:** Test full engineer phase with mock responses
3. **Manual tests:** Run against real repos (Next.js, React, Python)
4. **Regression tests:** Verify Explore/Crystallize unchanged

---

## 8. Future Enhancements (Out of Scope)

These are NOT part of this spec but documented for future reference:

- **Conversation history:** Allow revisiting previous decisions
- **Edit mode:** Change answers inline without restarting
- **Export trade-offs:** Save decision matrix to file
- **Multi-select:** Allow choosing multiple options (e.g., "both A and B")
- **Custom trade-offs:** User can add their own pros/cons
- **Keyboard shortcuts:** Navigate options with arrow keys
- **Search/filter:** Find specific decisions in long conversations
- **Comparison mode:** Side-by-side comparison of 3+ options

---

## 9. Rollback Plan

If implementation fails or causes regressions:

1. **Revert in order:**
   - Step 6 (explorer.py changes)
   - Step 5 (engineer.py parsing)
   - Step 4 (engineer.py system prompt)
   - Step 3 (textual_ui.py implementation)
   - Step 2 (adapter.py interface)
   - Step 1 (tradeoffs_panel.py widget)

2. **Git strategy:**
   - One commit per implementation step
   - Tag before starting: `git tag before-ux-improvement`
   - Rollback: `git reset --hard before-ux-improvement`

3. **Partial rollback:**
   - Keep trade-offs panel, revert to 2-column layout
   - Keep short questions, remove structured JSON
   - Keep compact activity log, revert conversation changes

---

## 10. Success Metrics

**Quantitative:**
- Questions reduced from ~150 words to ~10-15 words average
- Activity log noise reduced by ~70% (tool uses only)
- Trade-offs panel shows context 100% of idle time
- No performance degradation (< 16ms frame time)

**Qualitative:**
- Users can scan questions in < 3 seconds
- Visual trade-offs reduce decision fatigue
- Cleaner UI feels less overwhelming
- Conversation flows naturally without verbose interruptions

---

## Questions for Implementer

Before starting, confirm:

1. **Textual version:** Currently using 6.11+. Verify responsive CSS syntax.
2. **Claude SDK structured outputs:** Verify `response_format="json_object"` is supported in current version.
3. **Terminal width detection:** Confirm 120 cols is appropriate threshold (test on target devices).
4. **Color accessibility:** Test green/red colors with colorblind users if possible.

---

**Spec Version:** 1.0
**Created:** 2025-12-19
**Status:** Ready for Implementation
**Estimated Effort:** 6-8 hours for experienced Python + Textual developer
