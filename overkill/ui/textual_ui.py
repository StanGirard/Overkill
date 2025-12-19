"""Textual-based TUI implementation."""

import asyncio
from typing import Awaitable, Callable, Literal

from rich.text import Text
from textual import on, work
from textual.app import App, ComposeResult
from textual.binding import Binding
from textual.containers import Horizontal, ScrollableContainer, Vertical
from textual.css.query import NoMatches
from textual.message import Message
from textual.reactive import reactive
from textual.widgets import Footer, Input, RichLog, Static

from overkill.ui.adapter import Phase, UIAdapter


class AddMessageRequest(Message):
    """Request to add a message to the conversation."""

    def __init__(self, role: str, content: str, streaming: bool = False):
        super().__init__()
        self.role = role
        self.content = content
        self.streaming = streaming

PHASE_LABELS = {
    "explore": "🔍 EXPLORE",
    "engineer": "🤖 ENGINEER",
    "crystallize": "📝 CRYSTALLIZE",
}


class PhaseIndicator(Static):
    """Top bar showing phase progression."""

    current_phase: reactive[Phase] = reactive("explore")

    def render(self) -> Text:
        """Render the phase indicator."""
        text = Text()
        phases = ["explore", "engineer", "crystallize"]

        for i, phase in enumerate(phases):
            label = PHASE_LABELS[phase]
            if phase == self.current_phase:
                text.append(f" {label} ", style="bold reverse green")
            elif phases.index(phase) < phases.index(self.current_phase):
                text.append(f" ✓ {label} ", style="dim green")
            else:
                text.append(f" {label} ", style="dim")

            if i < len(phases) - 1:
                text.append(" → ", style="dim")

        return text


class AgentStatus(Static):
    """Widget showing current agent name and status."""

    agent_name: reactive[str] = reactive("Idle")
    status: reactive[str] = reactive("Ready")

    def render(self) -> Text:
        """Render the agent status."""
        text = Text()
        text.append(f"🤖 {self.agent_name}\n", style="bold cyan")
        text.append(f"   {self.status}", style="italic")
        return text


class MessageWidget(Static):
    """A single message in the conversation."""

    DEFAULT_CSS = """
    MessageWidget {
        height: auto;
        width: 1fr;
        padding: 0 1;
    }
    """

    def __init__(self, role: str, content: str, **kwargs):
        super().__init__(**kwargs)
        self.role = role
        self.content = content

    def render(self) -> Text:
        """Render the message."""
        text = Text()
        if self.role == "agent":
            text.append("Agent: ", style="bold magenta")
            text.append(self.content)
        else:
            text.append("You: ", style="bold cyan")
            text.append(self.content)
        return text

    def append_content(self, content: str) -> None:
        """Append content to this message (for streaming)."""
        self.content += content
        self.refresh()


class ActivityPanel(Vertical):
    """Left panel with agent status and activity logs."""

    DEFAULT_CSS = """
    ActivityPanel {
        width: 1fr;
        height: 100%;
        border: solid green;
        padding: 1;
    }

    ActivityPanel AgentStatus {
        height: auto;
        margin-bottom: 1;
    }

    ActivityPanel RichLog {
        height: 1fr;
        border: none;
    }
    """

    def compose(self) -> ComposeResult:
        yield AgentStatus(id="agent-status")
        yield RichLog(id="activity-log", highlight=True, markup=True)


class ConversationPanel(Vertical):
    """Right panel with conversation history and input."""

    DEFAULT_CSS = """
    ConversationPanel {
        width: 2fr;
        height: 100%;
        border: solid blue;
        padding: 1;
    }

    ConversationPanel Static#conversation-header {
        height: auto;
        margin-bottom: 1;
    }

    ConversationPanel RichLog {
        height: 1fr;
        border: none;
    }

    ConversationPanel Input {
        dock: bottom;
        margin-top: 1;
    }
    """

    def compose(self) -> ComposeResult:
        yield Static("💬 Conversation", id="conversation-header")
        yield RichLog(id="messages-log", highlight=True, markup=True, wrap=True)
        yield Input(placeholder="Type your message and press Enter...", id="user-input")


class OverkillApp(App):
    """Main Textual application for Overkill."""

    CSS = """
    Screen {
        layout: vertical;
    }

    #header {
        height: 3;
        background: $surface;
        border: solid $primary;
        content-align: center middle;
    }

    #body {
        height: 1fr;
    }

    Footer {
        background: $surface;
    }
    """

    BINDINGS = [
        Binding("ctrl+c", "quit", "Quit"),
        Binding("ctrl+q", "quit", "Quit"),
    ]

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self._input_event: asyncio.Event | None = None
        self._input_value: str = ""
        self._last_streaming_text: str = ""
        self._message_counter: int = 0
        self._pipeline_func: Callable[[], Awaitable[None]] | None = None

    def set_pipeline(self, pipeline_func: Callable[[], Awaitable[None]]) -> None:
        """Set the pipeline function to run after app starts."""
        self._pipeline_func = pipeline_func

    def compose(self) -> ComposeResult:
        yield Vertical(PhaseIndicator(id="phase-indicator"), id="header")
        yield Horizontal(
            ActivityPanel(id="activity-panel"),
            ConversationPanel(id="conversation-panel"),
            id="body",
        )
        yield Footer()

    async def on_mount(self) -> None:
        """Called when the app is mounted and ready."""
        if self._pipeline_func:
            self.run_pipeline()

    @work(exclusive=True)
    async def run_pipeline(self) -> None:
        """Run the pipeline as a background worker."""
        if self._pipeline_func:
            try:
                await self._pipeline_func()
            except Exception as e:
                self.log_activity(f"Error: {e}", icon="❌")

    def on_input_submitted(self, event: Input.Submitted) -> None:
        """Handle user input submission."""
        if self._input_event is not None:
            self._input_value = event.value
            event.input.value = ""
            self._input_event.set()

    def update_phase(self, phase: Phase) -> None:
        """Update the current phase."""
        try:
            indicator = self.query_one("#phase-indicator", PhaseIndicator)
            indicator.current_phase = phase
        except NoMatches:
            pass

    def update_agent_status(self, agent_name: str, status: str) -> None:
        """Update the agent status display."""
        try:
            agent_status = self.query_one("#agent-status", AgentStatus)
            agent_status.agent_name = agent_name
            agent_status.status = status
        except NoMatches:
            pass

    def log_activity(self, message: str, icon: str = "📋") -> None:
        """Log an activity message."""
        try:
            log = self.query_one("#activity-log", RichLog)
            log.write(f"{icon} {message}")
        except NoMatches:
            pass

    def add_message(
        self, role: Literal["agent", "user"], content: str, streaming: bool = False
    ) -> None:
        """Add a message to the conversation panel."""
        self.post_message(AddMessageRequest(role, content, streaming))

    @on(AddMessageRequest)
    def handle_add_message(self, message: AddMessageRequest) -> None:
        """Handle AddMessageRequest - write to the messages log."""
        try:
            messages_log = self.query_one("#messages-log", RichLog)

            if message.streaming and message.role == "agent" and self._last_streaming_text:
                # For streaming, we'd need a different approach - for now just write new line
                self._last_streaming_text += message.content
            else:
                # Format message with role prefix
                if message.role == "agent":
                    formatted = Text()
                    formatted.append("Agent: ", style="bold magenta")
                    formatted.append(message.content)
                else:
                    formatted = Text()
                    formatted.append("You: ", style="bold cyan")
                    formatted.append(message.content)

                messages_log.write(formatted)
                self._message_counter += 1

        except NoMatches as e:
            self.log_activity(f"UI Error: {e}", icon="⚠️")

    @work
    async def _schedule_remove_highlight(self, widget: MessageWidget) -> None:
        """Remove highlight after delay."""
        await asyncio.sleep(2.0)
        widget.remove_class("message-highlight")

    async def prompt_user(self, _question: str) -> str:
        """Prompt user for input and wait for response."""
        self._input_event = asyncio.Event()
        self._input_value = ""
        self._last_streaming_text = ""

        try:
            user_input = self.query_one("#user-input", Input)
            user_input.focus()
        except NoMatches:
            pass

        await self._input_event.wait()

        self._input_event = None
        return self._input_value

    def action_quit(self) -> None:
        """Handle quit action."""
        self.exit()


class TextualUI(UIAdapter):
    """Textual-based implementation of UIAdapter."""

    def __init__(self):
        self.app = OverkillApp()

    def update_phase(self, phase: Phase) -> None:
        """Update the current phase indicator."""
        self.app.update_phase(phase)

    def update_agent_status(self, agent_name: str, status: str) -> None:
        """Update the current agent name and status message."""
        self.app.update_agent_status(agent_name, status)

    def log_activity(self, message: str, icon: str = "📋") -> None:
        """Log an activity message to the agent activity panel."""
        self.app.log_activity(message, icon)

    def add_message(
        self, role: Literal["agent", "user"], content: str, streaming: bool = False
    ) -> None:
        """Add a message to the conversation panel."""
        self.app.add_message(role, content, streaming)

    async def prompt_user(self, question: str) -> str:
        """Prompt user for input and wait for response."""
        return await self.app.prompt_user(question)

    async def run(self, pipeline_func: Callable[[], Awaitable[None]] | None = None) -> None:
        """Start the UI event loop (blocking).

        Args:
            pipeline_func: Optional async function to run as the pipeline.
        """
        if pipeline_func:
            self.app.set_pipeline(pipeline_func)
        await self.app.run_async()

    def shutdown(self) -> None:
        """Signal the UI to shut down gracefully."""
        if self.app.is_running:
            self.app.exit()
