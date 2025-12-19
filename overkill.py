#!/usr/bin/env python3
"""
Overkill V0 - Transform fuzzy ideas into executable specs through vibe engineering.

Usage:
    python overkill.py --repo /path/to/repo "feature description"
    python overkill.py --repo https://github.com/user/repo "feature description"
"""

import argparse
import asyncio
import sys
from pathlib import Path
from typing import Optional
from claude_agent_sdk import ClaudeSDKClient, ClaudeAgentOptions, AssistantMessage, TextBlock, ResultMessage


class RepoExplorer:
    """Analyzes a repository to understand its structure and patterns."""

    def __init__(self, repo_path: Path):
        self.repo_path = repo_path
        self.analysis = {}

    async def explore(self) -> dict:
        """Explore the repository and return analysis."""
        options = ClaudeAgentOptions(
            allowed_tools=["Read", "Grep", "Glob", "Bash"],
            permission_mode="default",
            cwd=str(self.repo_path),
            system_prompt="You are a senior software engineer analyzing a codebase. Focus on: stack, structure, patterns, conventions, and where features typically live."
        )

        analysis_prompt = """Analyze this repository and provide:

1. **Stack**: What technologies, frameworks, languages are used?
2. **Structure**: How is the code organized? What are the main directories?
3. **Patterns**: What patterns do you see? (architecture, naming, styling)
4. **Conventions**: Code style, file organization conventions
5. **Integration points**: Where would new features typically be added?

Be concise but thorough. Focus on actionable insights."""

        result_text = ""

        async with ClaudeSDKClient(options=options) as client:
            await client.query(analysis_prompt)

            async for message in client.receive_response():
                if isinstance(message, AssistantMessage):
                    for block in message.content:
                        if isinstance(block, TextBlock):
                            result_text += block.text

        return {"summary": result_text, "path": str(self.repo_path)}


class VibeEngineer:
    """Conducts vibe engineering conversation to crystallize decisions."""

    def __init__(self, repo_analysis: dict, feature_request: str):
        self.repo_analysis = repo_analysis
        self.feature_request = feature_request
        self.decisions = []

    async def engineer(self) -> dict:
        """Run the vibe engineering conversation."""

        # Load the engineer system prompt
        engineer_prompt = self._build_system_prompt()

        options = ClaudeAgentOptions(
            allowed_tools=[],  # No tools needed, just conversation
            permission_mode="default",
            system_prompt=engineer_prompt
        )

        print("\n" + "="*60)
        print("VIBE ENGINEERING SESSION")
        print("="*60)
        print(f"\nFeature request: {self.feature_request}")
        print(f"Repo: {self.repo_analysis['path']}\n")
        print("="*60 + "\n")

        conversation_history = []

        async with ClaudeSDKClient(options=options) as client:
            # Initial prompt to start the conversation
            initial = f"""Repository Analysis:
{self.repo_analysis['summary']}

Feature Request: {self.feature_request}

Start the vibe engineering conversation. Ask your first question to understand what the user really wants."""

            await client.query(initial)

            # Main conversation loop
            while True:
                assistant_response = ""

                async for message in client.receive_response():
                    if isinstance(message, AssistantMessage):
                        for block in message.content:
                            if isinstance(block, TextBlock):
                                assistant_response += block.text
                    elif isinstance(message, ResultMessage):
                        break

                if assistant_response:
                    print(f"\nEngineer: {assistant_response}\n")
                    conversation_history.append({"role": "assistant", "content": assistant_response})

                    # Check if we're done (engineer says we have enough)
                    if "SPEC_READY" in assistant_response or "ready to generate" in assistant_response.lower():
                        confirm = input("\nReady to generate SPEC.md? (yes/no): ").strip().lower()
                        if confirm in ['yes', 'y']:
                            break

                    # Get user input
                    user_input = input("You: ").strip()

                    if not user_input:
                        continue

                    if user_input.lower() in ['done', 'exit', 'quit', 'finish']:
                        break

                    conversation_history.append({"role": "user", "content": user_input})

                    # Send user response back to Claude
                    await client.query(user_input)
                else:
                    break

        return {
            "conversation": conversation_history,
            "repo_analysis": self.repo_analysis,
            "feature_request": self.feature_request
        }

    def _build_system_prompt(self) -> str:
        """Build the system prompt for the vibe engineer."""
        return """You are a senior software engineer helping crystallize a fuzzy feature idea into concrete decisions.

YOUR MISSION: Ask questions that force explicit decisions. Present trade-offs as spectrums, not binaries.

STYLE:
- Talk like a thoughtful senior engineer thinking aloud
- Share your opinion but let the user decide
- Use spectrums to show trade-offs visually
- Ask open-ended questions, not yes/no
- Record decisions as you go

EXAMPLE GOOD QUESTION:
"I saw you're using Next.js with the App Router. For the hero section, there's a spectrum:

Static ◆━━━━━━━━━━━━━━━◆ Full interactive
→ Faster, SEO friendly      → More engaging
→ Less JS                   → More complex

Since this is a landing page, I'd lean toward static with maybe a subtle CSS animation.

What level of interactivity feels right for your use case?"

EXAMPLE BAD QUESTION:
"Do you want animations? (yes/no)"

FLOW:
1. Understand the feature deeply
2. Present options with trade-offs
3. Help user make explicit decisions
4. Confirm understanding
5. When you have enough info, say "SPEC_READY" and summarize all decisions

Remember: You're forcing decisions out of the black box, not making them yourself.

The user will tell you when they're ready to finish by saying "done" or similar."""


class Crystallizer:
    """Generates SPEC.md from conversation and decisions."""

    def __init__(self, engineering_session: dict):
        self.session = engineering_session

    async def crystallize(self, output_path: Path) -> str:
        """Generate SPEC.md from the engineering session."""

        options = ClaudeAgentOptions(
            allowed_tools=["Write"],
            permission_mode="acceptEdits",
            cwd=str(output_path.parent),
            system_prompt="You are a technical writer creating executable specifications. Be precise, unambiguous, and actionable."
        )

        crystallize_prompt = f"""Based on this vibe engineering session, generate a SPEC.md file.

Repository Analysis:
{self.session['repo_analysis']['summary']}

Original Feature Request:
{self.session['feature_request']}

Conversation and Decisions:
{self._format_conversation()}

Create a SPEC.md file at {output_path} that includes:

1. **Feature Summary** - What we're building and why
2. **Technical Decisions** - All decisions made during the conversation
3. **Files to Create/Modify** - Exact file paths and what changes
4. **Implementation Steps** - Clear, ordered steps
5. **Constraints** - What NOT to do, patterns to follow
6. **Acceptance Criteria** - How to verify it's done

Make it so clear that ANY developer (or Claude Code) can execute it without asking questions.
Use the exact file paths and patterns from the repo analysis."""

        result_text = ""

        async with ClaudeSDKClient(options=options) as client:
            await client.query(crystallize_prompt)

            async for message in client.receive_response():
                if isinstance(message, AssistantMessage):
                    for block in message.content:
                        if isinstance(block, TextBlock):
                            result_text += block.text

        return str(output_path)

    def _format_conversation(self) -> str:
        """Format the conversation history."""
        formatted = []
        for turn in self.session['conversation']:
            role = turn['role'].upper()
            content = turn['content']
            formatted.append(f"{role}: {content}")
        return "\n\n".join(formatted)


async def clone_repo(repo_url: str, target_dir: Path) -> Path:
    """Clone a GitHub repo to a temporary directory."""
    print(f"Cloning {repo_url}...")

    import tempfile
    import subprocess

    temp_dir = Path(tempfile.mkdtemp(prefix="overkill_"))

    try:
        subprocess.run(
            ["git", "clone", repo_url, str(temp_dir)],
            check=True,
            capture_output=True,
            text=True
        )
        print(f"Cloned to {temp_dir}")
        return temp_dir
    except subprocess.CalledProcessError as e:
        print(f"Error cloning repo: {e.stderr}")
        raise


async def main():
    parser = argparse.ArgumentParser(
        description="Overkill - Transform fuzzy ideas into executable specs through vibe engineering"
    )
    parser.add_argument(
        "--repo",
        required=True,
        help="Path to local repo or GitHub URL"
    )
    parser.add_argument(
        "feature",
        help="Feature description (fuzzy is fine)"
    )
    parser.add_argument(
        "--output",
        default="SPEC.md",
        help="Output file for the spec (default: SPEC.md)"
    )

    args = parser.parse_args()

    # Determine if repo is URL or local path
    repo_path: Path
    cleanup = False

    if args.repo.startswith(("http://", "https://", "git@")):
        # Clone the repo
        repo_path = await clone_repo(args.repo, Path.cwd())
        cleanup = True
    else:
        repo_path = Path(args.repo).resolve()
        if not repo_path.exists():
            print(f"Error: Repository path does not exist: {repo_path}")
            sys.exit(1)

    try:
        # Step 1: Explore the repo
        print("\n🔍 Exploring repository...\n")
        explorer = RepoExplorer(repo_path)
        analysis = await explorer.explore()

        print("\n" + "="*60)
        print("REPOSITORY ANALYSIS")
        print("="*60)
        print(analysis['summary'])
        print("="*60 + "\n")

        # Step 2: Vibe engineering conversation
        engineer = VibeEngineer(analysis, args.feature)
        session = await engineer.engineer()

        # Step 3: Crystallize into SPEC.md
        print("\n📝 Crystallizing decisions into SPEC.md...\n")
        output_path = Path(args.output).resolve()
        crystallizer = Crystallizer(session)
        spec_path = await crystallizer.crystallize(output_path)

        print(f"\n✅ SPEC.md generated at: {spec_path}")
        print("\nYou can now execute this spec with Claude Code or any developer.\n")

    finally:
        if cleanup:
            import shutil
            print(f"\nCleaning up temporary clone at {repo_path}")
            shutil.rmtree(repo_path, ignore_errors=True)


if __name__ == "__main__":
    asyncio.run(main())

