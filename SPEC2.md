# SPEC: TUI Interface for Overkill

## Feature Summary

Transform Overkill from a basic CLI tool into a beautiful Terminal User Interface (TUI) application that provides real-time visibility into agent activity and enables conversational interaction.

**Current State**: Overkill is a single-file Python script (`overkill.py`) that runs three sequential stages (Explore → Engineer → Crystallize) with minimal terminal output.

**Target State**: A structured TUI application with:
- Split-panel interface showing agent activity (left) and conversation (right)
- Real-time streaming of agent responses (character-by-character)
- Visible tool calls and status updates as agents work
- Scrollable conversation history with notifications
- Architecture that supports future migration to web/Electron

**Why**: The current experience lacks visual feedback and makes it hard to understand what agents are doing. A TUI provides transparency and creates a foundation for future interactive features.

---

## Technical Decisions

### Stack & Libraries
- **TUI Framework**: `textual` (modern, component-based, async-native)
  - Rationale: Better for complex layouts and future dashboard features compared to `rich`
  - Supports CSS-like styling, hot reload, and interactive components
- **Language**: Python 3.11+ (existing)
- **Dependencies**: Add `textual` to `pyproject.toml`

### Architecture Pattern
- **UI Abstraction Layer**: Create `UIAdapter` interface that agents call
  - Agents remain decoupled from specific UI implementation
  - Enables future swap to WebSocket-based UI for web/Electron
- **Monolithic Process**: TUI and core logic run in same process (for now)
  - Future refactor to separate service is possible but not required initially
- **Communication**: Direct method calls via adapter (no event bus/WebSocket yet)

### Code Structure
- **Refactor Approach**: Complete restructure (not progressive wrapper)
  - Move from single `overkill.py` to organized module structure
  - Inject `UIAdapter` into existing classes (`RepoExplorer`, `VibeEngineer`, `Crystallizer`)
  - Rationale: Project is small enough; clean architecture now prevents debt later

### Layout Design
```
╔═══════════════════════════════════════════════════════════╗
║  🔍 EXPLORE → 🤖 ENGINEER → 📝 CRYSTALLIZE                ║  Phase indicator
╠═════════════════════════╦═════════════════════════════════╣
║  Agent Activity         ║  💬 Conversation                ║
║  ─────────────────      ║  ─────────────────              ║
║  RepoExplorer           ║  Agent: [message]               ║
║  Status: Analyzing...   ║                                 ║
║                         ║  You: [message]                 ║
║  🔧 Read(main.py)       ║                                 ║
║  📊 Found: 3 classes    ║  [scrollable history]           ║
║  🔧 Grep(async def)     ║                                 ║
║  ✓ 8 matches            ║  🔔 New message!                ║
║                         ║                                 ║
║  [scrollable logs]      ║  ─────────────────              ║
║                         ║  You: ▌ [input field]           ║
╚═════════════════════════╩═════════════════════════════════╝
```

**Left Panel (Agent Activity)**:
- Current agent name and status
- Tool calls with relevant details (file names, match counts)
- Format: `🔧 Tool(args)` followed by `📊 Result` or `✓ Success`
- Auto-scrolls to bottom as new activity arrives

**Right Panel (Conversation)**:
- Full conversation history (scrollable)
- Agent messages stream in character-by-character
- User input field at bottom (always visible)
- New messages auto-scroll and highlight temporarily

**Top Bar (Phase Indicator)**:
- Shows current phase with visual progression
- Format: `✓ EXPLORE → 🤖 ENGINEER → CRYSTALLIZE`

### Agent Visibility Level
Show **medium detail** for agent activity:
- Tool name and key parameters (e.g., file paths, patterns)
- High-level results (e.g., "Found 3 classes", "8 matches")
- Status updates (e.g., "Analyzing repository...")
- **Do NOT show**: Full file contents, complete API responses, token-level details

### Streaming & Notifications
- **Agent responses**: Stream character-by-character (like ChatGPT)
  - Use Claude SDK streaming capabilities
  - Show typing indicator while waiting for first character
- **Notifications**: Auto-scroll + temporary highlight (2-3 seconds)
  - New messages appear with colored background that fades
  - No system notifications or beeps

### File Organization
```
overkill/
├── __init__.py
├── core/
│   ├── __init__.py
│   ├── explorer.py       # RepoExplorer (refactored with UI calls)
│   ├── engineer.py       # VibeEngineer (refactored with UI calls)
│   └── crystallizer.py   # Crystallizer (refactored with UI calls)
├── ui/
│   ├── __init__.py
│   ├── adapter.py        # UIAdapter abstract interface
│   └── textual_ui.py     # Textual implementation
└── main.py               # Entry point (replaces old main.py)

# Root level (unchanged)
pyproject.toml            # Add textual dependency
uv.lock                   # Will update automatically
README.md                 # Update with new usage
```

---

## Files to Create/Modify

### NEW: `overkill/__init__.py`
- Empty or minimal exports
- Purpose: Make `overkill` a proper package

### NEW: `overkill/core/__init__.py`
- Export `RepoExplorer`, `VibeEngineer`, `Crystallizer`

### NEW: `overkill/core/explorer.py`
**Source**: Extract from `overkill.py` lines ~27-100 (`RepoExplorer` class)

**Changes**:
- Add `__init__(self, ui: UIAdapter)` parameter
- Add calls to `self.ui.update_phase("explore")` at start
- Add calls to `self.ui.log_activity(msg)` for:
  - When starting analysis
  - When tool calls happen (intercept from SDK if possible)
  - When analysis completes
- Add call to `self.ui.update_agent_status("RepoExplorer", "status_message")`

### NEW: `overkill/core/engineer.py`
**Source**: Extract from `overkill.py` lines ~101-210 (`VibeEngineer` class)

**Changes**:
- Add `__init__(self, ui: UIAdapter)` parameter
- Add call to `self.ui.update_phase("engineer")` at start
- Replace `self._get_user_input()` with `self.ui.prompt_user(question)`
  - Returns user's text input from TUI
- Add calls to `self.ui.add_message("agent", text)` for agent responses (streaming)
- Add calls to `self.ui.add_message("user", text)` for user inputs
- Remove print statements, use `self.ui.log_activity()` instead

### NEW: `overkill/core/crystallizer.py`
**Source**: Extract from `overkill.py` lines ~211-260 (`Crystallizer` class)

**Changes**:
- Add `__init__(self, ui: UIAdapter)` parameter
- Add call to `self.ui.update_phase("crystallize")` at start
- Add calls to `self.ui.log_activity(msg)` for:
  - When starting spec generation
  - When writing to file
  - When complete
- Add call to `self.ui.update_agent_status("Crystallizer", "status_message")`

### NEW: `overkill/ui/__init__.py`
- Export `UIAdapter`, `TextualUI`

### NEW: `overkill/ui/adapter.py`
**Purpose**: Abstract interface for UI implementations

```python
from abc import ABC, abstractmethod
from typing import Literal

Phase = Literal["explore", "engineer", "crystallize"]

class UIAdapter(ABC):
    """Abstract interface for UI implementations.

    This allows core logic to remain decoupled from specific UI frameworks.
    Implementations: TextualUI (current), WebSocketUI (future).
    """

    @abstractmethod
    def update_phase(self, phase: Phase) -> None:
        """Update the current phase indicator."""
        pass

    @abstractmethod
    def update_agent_status(self, agent_name: str, status: str) -> None:
        """Update the current agent name and status message."""
        pass

    @abstractmethod
    def log_activity(self, message: str, icon: str = "📋") -> None:
        """Log an activity message to the agent activity panel.

        Args:
            message: The message to display
            icon: Emoji icon to prefix (e.g., "🔧", "📊", "✓")
        """
        pass

    @abstractmethod
    def add_message(self, role: Literal["agent", "user"], content: str, streaming: bool = False) -> None:
        """Add a message to the conversation panel.

        Args:
            role: "agent" or "user"
            content: Message text (full or partial if streaming)
            streaming: If True, append to last agent message; if False, create new message
        """
        pass

    @abstractmethod
    async def prompt_user(self, question: str) -> str:
        """Prompt user for input and wait for response.

        Args:
            question: Question to display (will be added as agent message)

        Returns:
            User's text input
        """
        pass

    @abstractmethod
    async def run(self) -> None:
        """Start the UI event loop (blocking)."""
        pass
```

### NEW: `overkill/ui/textual_ui.py`
**Purpose**: Textual-based implementation of UIAdapter

**Components**:
- `OverkillApp(App)` - Main Textual application
  - Composition: `PhaseIndicator`, `ActivityPanel`, `ConversationPanel`
  - Layout: Vertical container with header + horizontal split body
- `PhaseIndicator(Static)` - Top bar showing phase progression
- `ActivityPanel(Widget)` - Left panel with scrollable RichLog
  - Shows agent status at top
  - Streams activity logs below
- `ConversationPanel(Widget)` - Right panel with scrollable message list + input
  - Message widgets (agent/user styled differently)
  - Input field at bottom
  - Notification logic (highlight new messages)

**Streaming Implementation**:
- `add_message(..., streaming=True)` appends to last agent message widget
- Use Textual's reactive updates to trigger re-render
- Implement temporary highlight with scheduled callback to remove after 2-3 seconds

**Key Methods**:
- Implement all `UIAdapter` abstract methods
- `run()` calls `self.app.run()` (Textual's event loop)
- `prompt_user()` sets input field focus and waits for submit event (async)

### MODIFY: `overkill/main.py`
**Source**: Extract from `overkill.py` lines ~261-330 (current `main()` + argparse)

**Changes**:
```python
import asyncio
from pathlib import Path
from overkill.core.explorer import RepoExplorer
from overkill.core.engineer import VibeEngineer
from overkill.core.crystallizer import Crystallizer
from overkill.ui.textual_ui import TextualUI

async def main():
    """Entry point for Overkill TUI application."""
    # Parse args (keep existing argparse logic)
    args = parse_args()

    # Initialize UI
    ui = TextualUI()

    # Initialize agents with UI
    explorer = RepoExplorer(ui=ui)
    engineer = VibeEngineer(ui=ui)
    crystallizer = Crystallizer(ui=ui)

    # Start UI and run pipeline
    async def run_pipeline():
        # Clone/setup repo
        repo_path = setup_repository(args)

        # Run three stages
        analysis = await explorer.explore(repo_path)
        decisions = await engineer.engineer(analysis)
        await crystallizer.crystallize(repo_path, analysis, decisions)

        ui.log_activity("✅ Complete! SPEC.md generated.", icon="🎉")

    # Run UI and pipeline concurrently
    await asyncio.gather(
        ui.run(),
        run_pipeline()
    )

if __name__ == "__main__":
    asyncio.run(main())
```

### MODIFY: `pyproject.toml`
**Add to dependencies**:
```toml
dependencies = [
    "textual>=0.47.0",
    # ... existing dependencies ...
]
```

### MODIFY: `README.md`
**Update usage section** to reflect TUI interface:
- Replace screenshot/example with TUI description
- Document keyboard shortcuts (if any)
- Note that output is still `SPEC.md` in repo directory

### DELETE: `overkill.py`
After refactoring is complete and tested, remove the old monolithic file.

---

## Implementation Steps

### Phase 1: Setup Structure (Non-breaking)
1. Create directory structure:
   ```bash
   mkdir -p overkill/core overkill/ui
   touch overkill/__init__.py overkill/core/__init__.py overkill/ui/__init__.py
   ```

2. Add `textual` dependency:
   ```bash
   uv add textual
   ```

3. Create `overkill/ui/adapter.py` with `UIAdapter` abstract class (full implementation from spec above)

### Phase 2: Refactor Core Logic
4. Create `overkill/core/explorer.py`:
   - Copy `RepoExplorer` class from `overkill.py`
   - Add `ui: UIAdapter` parameter to `__init__`
   - Add UI calls at key points (phase update, status, activity logs)
   - Test: Verify imports work, class initializes

5. Create `overkill/core/engineer.py`:
   - Copy `VibeEngineer` class from `overkill.py`
   - Add `ui: UIAdapter` parameter to `__init__`
   - Replace `_get_user_input()` with `ui.prompt_user()`
   - Add `ui.add_message()` calls for conversation
   - Test: Verify imports work, class initializes

6. Create `overkill/core/crystallizer.py`:
   - Copy `Crystallizer` class from `overkill.py`
   - Add `ui: UIAdapter` parameter to `__init__`
   - Add UI calls (phase, status, activity logs)
   - Test: Verify imports work, class initializes

7. Update `overkill/core/__init__.py`:
   ```python
   from .explorer import RepoExplorer
   from .engineer import VibeEngineer
   from .crystallizer import Crystallizer

   __all__ = ["RepoExplorer", "VibeEngineer", "Crystallizer"]
   ```

### Phase 3: Implement TUI
8. Create `overkill/ui/textual_ui.py`:
   - Start with minimal `TextualUI(UIAdapter)` implementation
   - Implement stub methods that print to console (temporary)
   - Create `OverkillApp(App)` with basic layout structure
   - Test: Verify Textual app launches and displays

9. Implement `PhaseIndicator` component:
   - Static widget showing three phases
   - Update highlighting based on `update_phase()` calls
   - Test: Manually call `update_phase()` and verify visual update

10. Implement `ActivityPanel` component:
    - Left panel with `RichLog` for scrollable logs
    - Display agent status at top (reactive)
    - Log activity messages with icons
    - Test: Call `log_activity()` multiple times, verify scrolling

11. Implement `ConversationPanel` component:
    - Right panel with message list (ScrollableContainer)
    - Separate message widgets for agent vs user (styled differently)
    - Input field at bottom (TextArea or Input)
    - Test: Add messages manually, verify scrolling and input

12. Implement streaming in `ConversationPanel`:
    - `add_message(..., streaming=True)` appends to last agent message
    - Use Textual reactive variables to trigger updates
    - Test: Call with streaming=True repeatedly, verify char-by-char append

13. Implement notification/highlight:
    - When new agent message arrives, highlight with background color
    - Use `set_timer(2.0, remove_highlight)` to fade after 2 seconds
    - Auto-scroll to bottom on new message
    - Test: Add message, verify highlight appears and fades

14. Implement `prompt_user()` async method:
    - Focus input field
    - Set up event handler for Enter key
    - Use `asyncio.Event` to wait for user submission
    - Return user input text
    - Test: Call `prompt_user()`, type input, verify return value

15. Wire up `TextualUI.run()`:
    - Start Textual app event loop
    - Test: Launch app, verify it stays open until quit

16. Update `overkill/ui/__init__.py`:
    ```python
    from .adapter import UIAdapter
    from .textual_ui import TextualUI

    __all__ = ["UIAdapter", "TextualUI"]
    ```

### Phase 4: Integrate & Test
17. Create new `overkill/main.py`:
    - Import refactored components
    - Initialize `TextualUI`
    - Pass UI to each agent
    - Run pipeline concurrently with UI loop (asyncio.gather)
    - Test: Run end-to-end, verify TUI displays and pipeline executes

18. Hook up Claude SDK streaming (in `engineer.py`):
    - Modify `ClaudeSDKClient` call to enable streaming
    - In stream callback, call `ui.add_message("agent", chunk, streaming=True)`
    - Test: Verify agent responses appear character-by-character

19. Integration testing:
    - Test full Explore → Engineer → Crystallize flow
    - Verify phase indicator updates correctly
    - Verify activity logs appear in left panel
    - Verify conversation works in right panel
    - Verify user input during Engineer phase
    - Verify SPEC.md is generated at end

20. Update `README.md`:
    - Add screenshot or description of TUI
    - Document new user experience
    - Note keyboard shortcuts (if any added)

21. Clean up:
    - Delete `overkill.py` (old monolithic file)
    - Verify `uv run overkill` or `python -m overkill.main` works
    - Update any broken imports or references

---

## Constraints & Patterns

### Code Style
- **Type hints**: Use on all function signatures (existing convention)
- **Async/await**: All agent methods are async (existing pattern)
- **Docstrings**: Add to all public classes and methods
- **Private methods**: Prefix with `_` (existing convention)

### UI Adapter Usage
- **Mandatory injection**: All core classes MUST receive `UIAdapter` in `__init__`
- **No direct print()**: Use `ui.log_activity()` instead
- **No direct input()**: Use `ui.prompt_user()` instead
- **Graceful degradation**: If `ui` is None, fail loudly (don't silently skip)

### Textual Best Practices
- Use **reactive variables** for data that updates UI (e.g., current phase, agent status)
- Use **compose()** method to define widget hierarchy
- Use **CSS** for styling (create inline or separate `.css` file)
- Use **messages** (Textual's event system) for inter-component communication if needed

### Claude SDK Integration
- **Streaming**: Enable via `ClaudeAgentOptions` or SDK client config
- **Tool call visibility**: Hook into SDK's tool call events if available
  - If not exposed by SDK, add logging after each tool call manually
- **Error handling**: Wrap SDK calls in try/except, log errors to UI

### File Organization
- **Keep it flat**: Don't add deeper nesting (no `ui/components/`, `core/agents/`)
- **Single responsibility**: Each file has one main class
- **Explicit exports**: Always define `__all__` in `__init__.py`

### What NOT to Do
- ❌ Don't add CLI fallback mode (TUI is the default, only mode)
- ❌ Don't add configuration files yet (keep it simple for V1)
- ❌ Don't implement dashboard-level features (pause, resume, manual tool calls)
- ❌ Don't add system notifications or beeps
- ❌ Don't show full file contents or raw API responses in activity panel
- ❌ Don't add web/Electron implementation yet (architecture supports it, but don't build it)

---

## Acceptance Criteria

### Visual Requirements
- [ ] TUI launches successfully with split-panel layout
- [ ] Phase indicator shows all three phases and highlights current one
- [ ] Left panel displays agent name, status, and activity logs
- [ ] Right panel displays conversation history with distinct agent/user styling
- [ ] Input field is always visible at bottom of conversation panel
- [ ] Both panels are independently scrollable
- [ ] UI is responsive (no freezing during agent execution)

### Functional Requirements
- [ ] Explore phase: Activity logs show tool calls (Read, Grep, etc.) with file names
- [ ] Explore phase: Status updates as repository is analyzed
- [ ] Engineer phase: Agent messages stream character-by-character
- [ ] Engineer phase: User can type responses in input field
- [ ] Engineer phase: Conversation history is preserved and scrollable
- [ ] Engineer phase: New agent messages trigger auto-scroll and highlight
- [ ] Crystallize phase: Activity logs show spec generation progress
- [ ] SPEC.md file is created in repository directory at end
- [ ] Application exits cleanly after crystallization completes

### Technical Requirements
- [ ] All core classes (`RepoExplorer`, `VibeEngineer`, `Crystallizer`) accept `UIAdapter`
- [ ] No `print()` or `input()` calls in core logic
- [ ] All UI updates go through `UIAdapter` interface
- [ ] Claude SDK streaming is enabled and working
- [ ] Code is organized in `overkill/core/` and `overkill/ui/` structure
- [ ] `pyproject.toml` includes `textual` dependency
- [ ] `README.md` is updated with TUI description
- [ ] Old `overkill.py` is removed

### Testing Checklist
Run the following test scenarios:

1. **Smoke test**: `uv run overkill <repo-url>`
   - TUI launches without errors
   - All three phases complete
   - SPEC.md is generated

2. **Visual test**: During Explore phase
   - Activity panel shows at least 3 tool calls
   - Phase indicator highlights "EXPLORE"

3. **Conversation test**: During Engineer phase
   - Agent question appears in conversation panel streaming character-by-character
   - User can type response and submit with Enter
   - Conversation history shows both agent and user messages
   - New agent message auto-scrolls and highlights briefly

4. **Scrolling test**: Generate long output
   - Activity panel scrolls when logs exceed visible area
   - Conversation panel scrolls when messages exceed visible area

5. **Error handling**: Use invalid repo URL
   - Error message appears in activity panel (not crash)

---

## Success Metrics

**V1 is successful if:**
- A developer can clone Overkill, run `uv run overkill <repo>`, and immediately understand what's happening via the TUI
- The conversation phase feels natural (not clunky or laggy)
- Agent activity is transparent (can see what tools are being used)
- The generated SPEC.md is identical in quality to the old CLI version

**V1 is ready for web/Electron migration when:**
- `UIAdapter` interface is stable (no changes needed for 2+ weeks)
- Core logic (`explorer.py`, `engineer.py`, `crystallizer.py`) has zero Textual imports
- All UI state updates go through adapter methods (no direct widget manipulation outside `textual_ui.py`)

---

## Future Work (Out of Scope for V1)

**Post-V1 enhancements** (don't implement now):
- Interactive features: Pause/resume agents, manually trigger tools
- Multi-repo support: Switch between analyzing different repos
- Configuration: Settings panel for model selection, verbosity, etc.
- Export: Save conversation history to file
- Validation: Check SPEC.md completeness before finishing
- Web/Electron UI: Replace Textual with React + WebSocket backend

**Architecture is ready for these**, but focus on core TUI experience first.

---

## Notes for Implementer

**If you're Claude Code implementing this spec:**
1. Work sequentially through implementation steps (don't skip ahead)
2. Test each component in isolation before integration
3. If Textual behavior is unclear, consult docs at https://textual.textualize.io/
4. If Claude SDK streaming is unclear, check SDK docs for stream callbacks
5. Ask user for clarification if any decision point is ambiguous (there shouldn't be any, but safety net)

**If you're a human developer:**
- Budget ~4-6 hours for full implementation (assuming Textual familiarity)
- The trickiest part is Textual async integration with Claude SDK streaming
- Test in a separate branch first (this touches every file)
- Consider adding a `--debug` flag that shows raw SDK output for troubleshooting

**Design philosophy to maintain:**
- "Overkill" is about conversation-driven spec generation
- The TUI should make that conversation more transparent, not more complex
- Prefer clarity over cleverness (simple animations, clear labels, obvious interactions)

---

**End of Spec**

This specification is complete and ready for implementation. All decisions have been made during the vibe engineering session. No further clarification should be needed.
