# Overkill

Transform fuzzy ideas into executable specs through vibe engineering.

## The Problem

Vibe coding fails because decisions are made by the LLM in a black box. Overkill forces the explicitation of decisions before generating anything.

## What It Does

1. **Explores** your repo - analyzes stack, structure, patterns, conventions
2. **Engineers** through conversation - poses spectrums, presents trade-offs, records decisions
3. **Crystallizes** into SPEC.md - zero ambiguity, ready to execute

## TUI Interface

Overkill features a beautiful Terminal User Interface (TUI) with:
- Split-panel layout showing agent activity (left) and conversation (right)
- Real-time streaming of agent responses
- Visible tool calls and status updates as agents work
- Scrollable conversation history

```
╔═══════════════════════════════════════════════════════════╗
║  🔍 EXPLORE → 🤖 ENGINEER → 📝 CRYSTALLIZE                ║
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

## Installation

```bash
# Install with uv
uv sync

# Make sure Claude Code CLI is available
npm install -g @anthropic-ai/claude-code
```

## Usage

```bash
# Local repo
uv run overkill --repo /path/to/repo "I want to improve the hero"

# GitHub repo
uv run overkill --repo https://github.com/user/repo "Add dark mode toggle"

# Custom output location
uv run overkill --repo ./my-project "Feature description" --output ./specs/FEATURE.md

# Demo mode (for non-interactive environments)
uv run overkill --repo ./my-project "Feature description" --demo
```

## How It Works

### 1. Repository Explorer

Analyzes your codebase using Claude to understand:
- Stack (frameworks, languages)
- Structure (directories, organization)
- Patterns (architecture, naming)
- Conventions (code style)
- Integration points (where features live)

### 2. Vibe Engineer

Conducts a conversation like a senior dev would:
- Asks open-ended questions
- Presents options as spectrums with trade-offs
- Has opinions but lets you decide
- Records decisions explicitly

Example question:
```
I saw you're using Next.js with the App Router.
For the hero, there's a spectrum:

Static ◆━━━━━━━━━━━━━━━◆ Full interactive
→ Faster, SEO friendly      → More engaging
→ Less JS                   → More complex

Since this is a landing page, I'd lean toward static
with maybe a subtle CSS animation.

What level of interactivity feels right?
```

### 3. Crystallizer

Generates SPEC.md with:
- Feature summary
- All technical decisions made
- Files to create/modify (exact paths)
- Implementation steps (ordered)
- Constraints (patterns to follow)
- Acceptance criteria

The output is so clear that ANY developer (or Claude Code) can execute it without asking questions.

## Keyboard Shortcuts

- `Ctrl+C` or `Ctrl+Q`: Quit the application
- `Enter`: Submit your message in the conversation

## Architecture

Modular implementation using Claude Agent SDK and Textual:

```
overkill/
├── __init__.py
├── core/
│   ├── explorer.py       # RepoExplorer agent
│   ├── engineer.py       # VibeEngineer agent
│   └── crystallizer.py   # Crystallizer agent
├── ui/
│   ├── adapter.py        # UIAdapter abstract interface
│   └── textual_ui.py     # Textual TUI implementation
└── main.py               # Entry point
```

- **UIAdapter**: Abstract interface for UI implementations (enables future web/Electron)
- **TextualUI**: Terminal-based UI with split panels
- **RepoExplorer**: Uses Claude with Read/Grep/Glob tools to analyze codebase
- **VibeEngineer**: Uses ClaudeSDKClient for continuous conversation
- **Crystallizer**: Uses Claude to generate structured SPEC.md from decisions

## Requirements

- Python 3.11+
- Claude Agent SDK
- Claude Code CLI
- Textual (installed automatically)
- Git (for cloning repos)

## Design Principles

1. **Transparency** - See what agents are doing in real-time
2. **Conversation quality** - Focus on thoughtful questions
3. **Zero ambiguity** - SPEC.md must be executable without clarification
4. **Future-ready** - Architecture supports web/Electron migration

## License

MIT
