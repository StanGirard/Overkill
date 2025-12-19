# Overkill V2

Transform fuzzy ideas into executable specs through vibe engineering.

## What is Overkill?

Overkill is a desktop application that helps you crystallize vague feature ideas into concrete, actionable specifications. It uses a conversational AI approach with a unique "decision forcing" methodology:

- **No yes/no questions** - Trade-offs are presented as visual spectrums
- **Explicit decisions** - Every choice is recorded with rationale
- **Executable output** - SPEC.md files that Claude Code (or any dev) can execute

## Quick Start

```bash
# Install dependencies
yarn install

# Run in development mode
yarn dev

# Build for production
yarn build

# Package for distribution
yarn package
```

## Architecture

```
overkill-ts/
├── src/
│   ├── main/                  # Electron main process
│   │   ├── index.ts           # App entry point
│   │   ├── preload.ts         # Secure IPC bridge
│   │   ├── ipc-handlers.ts    # IPC request handlers
│   │   └── agent-controller.ts # Pipeline orchestration
│   ├── renderer/              # React UI
│   │   ├── App.tsx            # Main component
│   │   └── components/        # UI components
│   ├── agents/                # AI agents
│   │   ├── code-explorer.ts   # Repository analysis
│   │   ├── vibe-engineer.ts   # Conversation agent
│   │   └── crystallizer.ts    # SPEC generation
│   └── shared/                # Shared types & constants
└── package.json
```

## The 3-Phase Pipeline

### 1. Explore

The **CodeExplorer** agent analyzes your repository:
- Stack detection (languages, frameworks)
- Project structure mapping
- Pattern recognition
- Integration point identification

### 2. Engineer

The **VibeEngineer** agent conducts a conversation:
- Asks probing questions about your feature
- Presents trade-offs as visual spectrums
- Forces explicit decisions
- Records rationale for each choice

Example spectrum:
```
Static ◆━━━━━━━━━━━━━━━◆ Full interactive
→ Faster, SEO friendly      → More engaging
→ Less JS                   → More complex
```

### 3. Crystallize

The **Crystallizer** agent generates SPEC.md:
- Feature summary
- All technical decisions
- Files to create/modify
- Implementation steps
- Constraints and patterns
- Acceptance criteria

## Usage

1. Launch the app
2. Select a repository (or paste path)
3. Describe your feature idea
4. Answer the AI's questions
5. Type "done" when ready
6. Get your SPEC.md

## Tech Stack

- **Electron** - Desktop app framework
- **React** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Claude Agent SDK** - AI orchestration (planned)

## Development

```bash
# Type checking
yarn typecheck

# Lint
yarn lint

# Build main + preload + renderer
yarn build
```

## MVP vs Full Vision

### Current MVP
- [x] CodeExplorer (simulated)
- [x] VibeEngineer (conversation flow)
- [x] Crystallizer (SPEC.md generation)
- [x] Basic chat UI
- [x] Worker status sidebar

### Full Vision (Planned)
- [ ] Real Claude Agent SDK integration
- [ ] ResearcherAgent (web search)
- [ ] DependencyChecker
- [ ] PatternMatcher
- [ ] MCP integration
- [ ] Session persistence

## License

MIT

---

**Ported from Python** | Original: [overkill/](../overkill/)
