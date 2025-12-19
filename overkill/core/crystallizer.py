"""Spec crystallization agent."""

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


class Crystallizer:
    """Generates SPEC.md from conversation and decisions."""

    def __init__(self, engineering_session: dict, ui: "UIAdapter"):
        self.session = engineering_session
        self.ui = ui

    async def crystallize(self, output_path: Path) -> str:
        """Generate SPEC.md from the engineering session."""
        self.ui.update_phase("crystallize")
        self.ui.update_agent_status("Crystallizer", "Starting...")

        options = ClaudeAgentOptions(
            allowed_tools=["Write"],
            permission_mode="acceptEdits",
            cwd=str(output_path.parent),
            system_prompt="You are a technical writer creating executable specifications. Be precise, unambiguous, and actionable.",
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

        self.ui.log_activity("Generating SPEC.md...", icon="📝")
        self.ui.update_agent_status("Crystallizer", "Generating spec...")

        result_text = ""

        async with ClaudeSDKClient(options=options) as client:
            await client.query(crystallize_prompt)

            async for message in client.receive_response():
                if isinstance(message, AssistantMessage):
                    for block in message.content:
                        if isinstance(block, TextBlock):
                            result_text += block.text
                        elif isinstance(block, ToolUseBlock):
                            self._log_tool_use(block)
                        elif isinstance(block, ToolResultBlock):
                            self._log_tool_result(block)

        self.ui.update_agent_status("Crystallizer", "Complete")
        self.ui.log_activity(f"SPEC.md written to {output_path}", icon="✅")

        return str(output_path)

    def _format_conversation(self) -> str:
        """Format the conversation history."""
        formatted = []
        for turn in self.session["conversation"]:
            role = turn["role"].upper()
            content = turn["content"]
            formatted.append(f"{role}: {content}")
        return "\n\n".join(formatted)

    def _log_tool_use(self, block: ToolUseBlock) -> None:
        """Log a tool use to the UI."""
        tool_name = block.name
        tool_input = block.input

        if tool_name == "Write":
            file_path = tool_input.get("file_path", "unknown")
            self.ui.log_activity(f"Write({file_path})", icon="🔧")
        else:
            self.ui.log_activity(f"{tool_name}(...)", icon="🔧")

    def _log_tool_result(self, block: ToolResultBlock) -> None:
        """Log a tool result summary to the UI."""
        self.ui.log_activity("File written successfully", icon="📊")
