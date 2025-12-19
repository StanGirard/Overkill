"""Repository exploration agent."""

from pathlib import Path
from typing import TYPE_CHECKING

from claude_agent_sdk import (
    AssistantMessage,
    ClaudeAgentOptions,
    ClaudeSDKClient,
    TextBlock,
    ToolResultBlock,
    ToolUseBlock,
)

if TYPE_CHECKING:
    from overkill.ui.adapter import UIAdapter


class RepoExplorer:
    """Analyzes a repository to understand its structure and patterns."""

    def __init__(self, repo_path: Path, ui: "UIAdapter"):
        self.repo_path = repo_path
        self.ui = ui
        self.analysis = {}

    async def explore(self) -> dict:
        """Explore the repository and return analysis."""
        self.ui.update_phase("explore")
        self.ui.update_agent_status("RepoExplorer", "Initializing...")

        options = ClaudeAgentOptions(
            allowed_tools=["Read", "Grep", "Glob", "Bash"],
            permission_mode="default",
            cwd=str(self.repo_path),
            system_prompt="You are a senior software engineer analyzing a codebase. Focus on: stack, structure, patterns, conventions, and where features typically live.",
        )

        analysis_prompt = """Analyze this repository and provide:

1. **Stack**: What technologies, frameworks, languages are used?
2. **Structure**: How is the code organized? What are the main directories?
3. **Patterns**: What patterns do you see? (architecture, naming, styling)
4. **Conventions**: Code style, file organization conventions
5. **Integration points**: Where would new features typically be added?

Be concise but thorough. Focus on actionable insights."""

        self.ui.update_agent_status("RepoExplorer", "Analyzing repository...")
        self.ui.log_activity("Starting repository analysis", icon="🔍")

        result_text = ""

        async with ClaudeSDKClient(options=options) as client:
            await client.query(analysis_prompt)

            async for message in client.receive_response():
                if isinstance(message, AssistantMessage):
                    for block in message.content:
                        if isinstance(block, TextBlock):
                            result_text += block.text
                        elif isinstance(block, ToolUseBlock):
                            self._log_tool_use(block)
                        elif isinstance(block, ToolResultBlock):
                            self._log_tool_result(block)

        self.ui.update_agent_status("RepoExplorer", "Analysis complete")
        self.ui.log_activity("Repository analysis complete", icon="✅")

        return {"summary": result_text, "path": str(self.repo_path)}

    def _log_tool_use(self, block: ToolUseBlock) -> None:
        """Log a tool use to the UI."""
        tool_name = block.name
        tool_input = block.input

        if tool_name == "Read":
            file_path = tool_input.get("file_path", "unknown")
            self.ui.log_activity(f"Read({file_path})", icon="🔧")
        elif tool_name == "Grep":
            pattern = tool_input.get("pattern", "")
            self.ui.log_activity(f"Grep({pattern})", icon="🔧")
        elif tool_name == "Glob":
            pattern = tool_input.get("pattern", "")
            self.ui.log_activity(f"Glob({pattern})", icon="🔧")
        elif tool_name == "Bash":
            command = tool_input.get("command", "")
            # Truncate long commands
            if len(command) > 40:
                command = command[:37] + "..."
            self.ui.log_activity(f"Bash({command})", icon="🔧")
        else:
            self.ui.log_activity(f"{tool_name}(...)", icon="🔧")

    def _log_tool_result(self, block: ToolResultBlock) -> None:
        """Log a tool result summary to the UI."""
        # Show a brief summary of the result
        content = str(block.content) if block.content else ""
        if len(content) > 100:
            # Count lines or show truncated preview
            lines = content.count("\n") + 1
            self.ui.log_activity(f"Result: {lines} lines", icon="📊")
        elif content:
            # Short result, show it
            preview = content[:50].replace("\n", " ")
            if len(content) > 50:
                preview += "..."
            self.ui.log_activity(f"Result: {preview}", icon="📊")
