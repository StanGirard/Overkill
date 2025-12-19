"""Vibe engineering conversation agent."""

import asyncio
from typing import TYPE_CHECKING

from claude_agent_sdk import (
    AssistantMessage,
    ClaudeAgentOptions,
    ClaudeSDKClient,
    ResultMessage,
    TextBlock,
)

if TYPE_CHECKING:
    from overkill.ui.adapter import UIAdapter


class VibeEngineer:
    """Conducts vibe engineering conversation to crystallize decisions."""

    def __init__(
        self, repo_analysis: dict, feature_request: str, ui: "UIAdapter", demo_mode: bool = False
    ):
        self.repo_analysis = repo_analysis
        self.feature_request = feature_request
        self.ui = ui
        self.decisions = []
        self.demo_mode = demo_mode
        self.demo_responses = [
            "I want to create a marketing landing page for Quivr, separate from the docs. Something modern that showcases what it does.",
            "The main message should be: turn any codebase into an intelligent Q&A system. Fast setup, no infrastructure needed.",
            "I want it clean and minimal - think Vercel or Linear style. Fast, with maybe one subtle animation on the hero.",
            "Main CTA should be 'Get Started' linking to docs, secondary CTA 'View on GitHub'. Target audience is Python devs doing RAG.",
            "done",
        ]
        self.demo_response_index = 0

    async def engineer(self) -> dict:
        """Run the vibe engineering conversation."""
        self.ui.update_phase("engineer")
        self.ui.update_agent_status("VibeEngineer", "Starting session...")

        engineer_prompt = self._build_system_prompt()

        options = ClaudeAgentOptions(
            allowed_tools=[],
            permission_mode="default",
            system_prompt=engineer_prompt,
        )

        self.ui.log_activity("Vibe engineering session started", icon="🎯")
        self.ui.log_activity(f"Feature: {self.feature_request[:50]}...", icon="📋")

        conversation_history = []

        async with ClaudeSDKClient(options=options) as client:
            initial = f"""Repository Analysis:
{self.repo_analysis['summary']}

Feature Request: {self.feature_request}

Start the vibe engineering conversation. Ask your first question to understand what the user really wants."""

            await client.query(initial)
            self.ui.update_agent_status("VibeEngineer", "Thinking...")

            while True:
                assistant_response = ""

                self.ui.log_activity("Waiting for Claude response...", icon="⏳")

                async for message in client.receive_response():
                    if isinstance(message, AssistantMessage):
                        for block in message.content:
                            if isinstance(block, TextBlock):
                                assistant_response += block.text
                    elif isinstance(message, ResultMessage):
                        break

                self.ui.log_activity(f"Response length: {len(assistant_response)}", icon="📝")

                if assistant_response:
                    # Display the agent's message in the conversation panel
                    self.ui.add_message("agent", assistant_response)
                    conversation_history.append(
                        {"role": "assistant", "content": assistant_response}
                    )

                    # Check if we're done
                    if (
                        "SPEC_READY" in assistant_response
                        or "ready to generate" in assistant_response.lower()
                    ):
                        self.ui.add_message("agent", "Ready to generate SPEC.md? (yes/no)")
                        confirm = await self._get_user_input("")
                        self.ui.add_message("user", confirm)
                        if confirm.lower() in ["yes", "y", "done"]:
                            break

                    # Get user input
                    user_input = await self._get_user_input("")

                    if not user_input:
                        continue

                    if user_input.lower() in ["done", "exit", "quit", "finish"]:
                        break

                    # Display the user's message in the conversation panel
                    self.ui.add_message("user", user_input)
                    conversation_history.append({"role": "user", "content": user_input})
                    self.ui.update_agent_status("VibeEngineer", "Thinking...")

                    await client.query(user_input)
                else:
                    break

        self.ui.update_agent_status("VibeEngineer", "Session complete")
        self.ui.log_activity("Engineering session complete", icon="✅")

        return {
            "conversation": conversation_history,
            "repo_analysis": self.repo_analysis,
            "feature_request": self.feature_request,
        }

    async def _get_user_input(self, prompt: str) -> str:
        """Get user input, or use demo responses if in demo mode."""
        if self.demo_mode:
            if self.demo_response_index < len(self.demo_responses):
                response = self.demo_responses[self.demo_response_index]
                self.demo_response_index += 1
                await asyncio.sleep(1)
                return response
            else:
                return "done"
        else:
            return await self.ui.prompt_user(prompt)

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
