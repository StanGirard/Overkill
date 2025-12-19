"""Trade-offs panel widget for displaying options and context."""

from typing import TypedDict

from rich.text import Text
from textual.reactive import reactive
from textual.widgets import Static


class OptionDict(TypedDict, total=False):
    """Type definition for option dictionaries."""

    label: str
    pros: list[str]
    cons: list[str]


class ContextDict(TypedDict, total=False):
    """Type definition for context dictionaries."""

    stack: list[str]
    patterns: list[str]


class TradeoffsPanel(Static):
    """Panel for displaying trade-offs and technical context.

    States:
    1. Options present - Shows A/B/C options with pros/cons
    2. Context present - Shows technical stack and patterns
    3. Empty - Panel is cleared
    """

    DEFAULT_CSS = """
    TradeoffsPanel {
        width: 1fr;
        height: 100%;
        border: solid $secondary;
        padding: 1;
        overflow-y: auto;
    }

    TradeoffsPanel.hidden {
        display: none;
    }
    """

    options: reactive[list[OptionDict]] = reactive([], init=False)
    recommendation: reactive[str | None] = reactive(None, init=False)
    context: reactive[ContextDict | None] = reactive(None, init=False)

    def __init__(self, **kwargs) -> None:
        super().__init__(**kwargs)
        self._options: list[OptionDict] = []
        self._recommendation: str | None = None
        self._context: ContextDict | None = None

    def update_options(
        self, options: list[OptionDict], recommendation: str | None = None
    ) -> None:
        """Display A/B/C options with pros/cons.

        Args:
            options: List of dicts with keys: label, pros (list), cons (list)
            recommendation: Optional label of recommended option
        """
        self._options = options
        self._recommendation = recommendation
        self._context = None
        self.refresh()

    def update_context(self, context: ContextDict) -> None:
        """Update technical context display when no options are shown.

        Args:
            context: Dict with keys like 'stack' (list), 'patterns' (list)
        """
        self._options = []
        self._recommendation = None
        self._context = context
        self.refresh()

    def clear(self) -> None:
        """Clear/hide panel content."""
        self._options = []
        self._recommendation = None
        self._context = None
        self.refresh()

    def render(self) -> Text:
        """Render the panel content."""
        text = Text()

        if self._options:
            text.append("Options\n", style="bold underline")
            text.append("\n")

            for option in self._options:
                is_recommended = (
                    self._recommendation is not None
                    and option.get("label") == self._recommendation
                )
                self._render_option(text, option, is_recommended)
                text.append("\n")

        elif self._context:
            text.append("Context\n", style="bold underline")
            text.append("\n")

            stack = self._context.get("stack", [])
            if stack:
                text.append("Stack:\n", style="bold")
                for item in stack:
                    text.append(f"  {item}\n", style="dim")

            patterns = self._context.get("patterns", [])
            if patterns:
                text.append("\nPatterns:\n", style="bold")
                for item in patterns:
                    text.append(f"  {item}\n", style="dim")

            if not stack and not patterns:
                text.append("No stack detected", style="dim italic")

        else:
            text.append("Trade-offs\n", style="bold underline dim")
            text.append("\n")
            text.append("Waiting for options...", style="dim italic")

        return text

    def _render_option(
        self, text: Text, option: OptionDict, is_recommended: bool
    ) -> None:
        """Render a single option with pros/cons.

        Args:
            text: Text object to append to
            option: Option dictionary
            is_recommended: Whether this is the recommended option
        """
        label = option.get("label", "Option")
        pros = option.get("pros", [])
        cons = option.get("cons", [])

        # Option label with recommendation indicator
        if is_recommended:
            text.append("* ", style="yellow bold")
            text.append(f"{label}", style="bold yellow")
            text.append(" (recommended)\n", style="dim yellow")
        else:
            text.append(f"{label}\n", style="bold")

        # Pros
        for pro in pros:
            text.append("  + ", style="green")
            text.append(f"{pro}\n")

        # Cons
        for con in cons:
            text.append("  - ", style="red")
            text.append(f"{con}\n")
