# Overkill V0

Transform fuzzy ideas into executable specs through vibe engineering.

## The Problem

Vibe coding fails because decisions are made by the LLM in a black box. Overkill forces the explicitation of decisions before generating anything.

## What It Does

1. **Explores** your repo - analyzes stack, structure, patterns, conventions
2. **Engineers** through conversation - poses spectrums, presents trade-offs, records decisions
3. **Crystallizes** into SPEC.md - zero ambiguity, ready to execute

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
uv run overkill.py --repo /path/to/repo "I want to improve the hero"

# GitHub repo
uv run overkill.py --repo https://github.com/user/repo "Add dark mode toggle"

# Custom output location
uv run overkill.py --repo ./my-project "Feature description" --output ./specs/FEATURE.md
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

## Example Session

```bash
$ uv run overkill.py --repo https://github.com/QuivrHQ/quivr "Improve the hero"

🔍 Exploring repository...

============================================================
REPOSITORY ANALYSIS
============================================================
[Analysis output...]
============================================================

============================================================
VIBE ENGINEERING SESSION
============================================================
Feature request: Improve the hero
Repo: /tmp/overkill_xyz

Engineer: I see you're using Next.js with Tailwind CSS...
[Conversation continues...]

You: I want something more engaging but still fast

Engineer: Got it. Here's a spectrum for engagement...

[More conversation...]

Ready to generate SPEC.md? (yes/no): yes

📝 Crystallizing decisions into SPEC.md...

✅ SPEC.md generated at: /home/user/SPEC.md
```

## Architecture

Single-file implementation using Claude Agent SDK:

- **RepoExplorer**: Uses Claude with Read/Grep/Glob tools to analyze codebase
- **VibeEngineer**: Uses ClaudeSDKClient for continuous conversation (maintains context)
- **Crystallizer**: Uses Claude to generate structured SPEC.md from decisions

## Requirements

- Python 3.11+
- Claude Agent SDK
- Claude Code CLI
- Git (for cloning repos)

## Design Principles

1. **No over-engineering** - Single file, minimal dependencies
2. **Conversation quality** - Focus on thoughtful questions
3. **Zero ambiguity** - SPEC.md must be executable without clarification
4. **Fast feedback** - Quick exploration, focused conversation

## Next Steps

This is V0. Future improvements could include:
- Better conversation templates
- Multi-turn spec refinement
- Integration with Claude Code workflows
- SPEC.md validation

## License

MIT