"""Abstract interface for UI implementations."""

from abc import ABC, abstractmethod
from typing import Awaitable, Callable, Literal

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
    def add_message(
        self, role: Literal["agent", "user"], content: str, streaming: bool = False
    ) -> None:
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
    async def run(self, pipeline_func: Callable[[], Awaitable[None]] | None = None) -> None:
        """Start the UI event loop (blocking).

        Args:
            pipeline_func: Optional async function to run as the main pipeline.
        """
        pass

    @abstractmethod
    def shutdown(self) -> None:
        """Signal the UI to shut down gracefully."""
        pass
