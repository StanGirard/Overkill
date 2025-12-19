#!/usr/bin/env python3
"""
Overkill - Transform fuzzy ideas into executable specs through vibe engineering.

Usage:
    uv run overkill --repo /path/to/repo "feature description"
    uv run overkill --repo https://github.com/user/repo "feature description"
"""

import argparse
import asyncio
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

from overkill.core.crystallizer import Crystallizer
from overkill.core.engineer import VibeEngineer
from overkill.core.explorer import RepoExplorer
from overkill.ui.textual_ui import TextualUI


async def clone_repo(repo_url: str) -> Path:
    """Clone a GitHub repo to a temporary directory."""
    temp_dir = Path(tempfile.mkdtemp(prefix="overkill_"))

    try:
        subprocess.run(
            ["git", "clone", repo_url, str(temp_dir)],
            check=True,
            capture_output=True,
            text=True,
        )
        return temp_dir
    except subprocess.CalledProcessError as e:
        raise RuntimeError(f"Error cloning repo: {e.stderr}") from e


def parse_args() -> argparse.Namespace:
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(
        description="Overkill - Transform fuzzy ideas into executable specs through vibe engineering"
    )
    parser.add_argument("--repo", required=True, help="Path to local repo or GitHub URL")
    parser.add_argument("feature", help="Feature description (fuzzy is fine)")
    parser.add_argument(
        "--output", default="SPEC.md", help="Output file for the spec (default: SPEC.md)"
    )
    parser.add_argument(
        "--demo",
        action="store_true",
        help="Run in demo mode with simulated responses (for non-interactive environments)",
    )
    return parser.parse_args()


async def run_pipeline(ui: TextualUI, args: argparse.Namespace) -> None:
    """Run the Overkill pipeline."""
    repo_path: Path
    cleanup = False

    try:
        # Determine if repo is URL or local path
        if args.repo.startswith(("http://", "https://", "git@")):
            ui.log_activity(f"Cloning {args.repo}...", icon="📥")
            repo_path = await clone_repo(args.repo)
            cleanup = True
            ui.log_activity(f"Cloned to {repo_path}", icon="✅")
        else:
            repo_path = Path(args.repo).resolve()
            if not repo_path.exists():
                ui.log_activity(f"Error: Path does not exist: {repo_path}", icon="❌")
                return

        # Step 1: Explore the repo
        explorer = RepoExplorer(repo_path, ui=ui)
        analysis = await explorer.explore()

        # Step 2: Vibe engineering conversation
        engineer = VibeEngineer(analysis, args.feature, ui=ui, demo_mode=args.demo)
        session = await engineer.engineer()

        # Step 3: Crystallize into SPEC.md
        output_path = Path(args.output).resolve()
        crystallizer = Crystallizer(session, ui=ui)
        spec_path = await crystallizer.crystallize(output_path)

        ui.log_activity(f"SPEC.md generated at: {spec_path}", icon="🎉")
        ui.log_activity("Complete! Press Ctrl+C to exit.", icon="✅")

    except Exception as e:
        ui.log_activity(f"Error: {e}", icon="❌")
    finally:
        if cleanup and repo_path:
            ui.log_activity(f"Cleaning up {repo_path}...", icon="🧹")
            shutil.rmtree(repo_path, ignore_errors=True)


async def main() -> None:
    """Entry point for Overkill TUI application."""
    args = parse_args()

    ui = TextualUI()

    async def pipeline_task():
        await run_pipeline(ui, args)

    # Run UI with pipeline as a worker
    await ui.run(pipeline_func=pipeline_task)


def entrypoint() -> None:
    """Entry point for the CLI command."""
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nGoodbye!")
        sys.exit(0)


if __name__ == "__main__":
    entrypoint()
