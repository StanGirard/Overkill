# SPEC: Améliore l'ux de la phase de question réponse. L'IA est très verbeuse et c'est chiant a lire ou intéragir 


## Feature Summary

**What:** Améliore l'ux de la phase de question réponse. L'IA est très verbeuse et c'est chiant a lire ou intéragir 


**Why:** Feature requested through Overkill vibe engineering session.

**Repository:** /Users/stan/Dev/Overkill

**Generated:** 2025-12-19

---

## Repository Context

I'll analyze this repository systematically to understand its stack, structure, patterns, and conventions.

---

## Technical Decisions

### Decision 1
> "Quick back and forth would be amazing. Use components to show trade-offs cleanly. I don't know what do you think ? Look at what claude code does too. They ask questions with pre render input and somet..."

### Decision 2
> "1. just common ones. 
2. compact/collapsible. 
Conversational. 

The goal of Overkill is to make a project where you talk to an expert"

### Decision 3
> "Structure output.

I don't know for common. 

Yes that sounds right"

### Decision 4
> "I don't know. I trust you"

---

## Files to Create/Modify

Based on the repository structure and decisions made:

### New Files
- `src/[feature]/index.ts` - Main feature implementation
- `src/[feature]/types.ts` - Type definitions
- `src/[feature]/utils.ts` - Utility functions

### Files to Modify
- `src/index.ts` - Add feature export/integration
- `package.json` - Add any new dependencies (if needed)

*Note: Exact paths depend on the actual repository structure.*

---

## Implementation Steps

### Step 1: Setup
1. Create the feature directory structure
2. Add any required dependencies
3. Set up basic type definitions

### Step 2: Core Implementation
1. Implement the main feature logic
2. Add utility functions as needed
3. Export from the feature module

### Step 3: Integration
1. Import and integrate with existing code
2. Add necessary configuration
3. Update any affected modules

### Step 4: Testing & Verification
1. Add unit tests for new functionality
2. Test integration with existing features
3. Verify acceptance criteria

---

## Constraints

### What NOT to Do
- Do not modify unrelated code
- Do not add unnecessary dependencies
- Do not break existing functionality
- Do not skip type definitions

### Patterns to Follow
- Follow existing code style and conventions
- Use consistent naming patterns
- Maintain separation of concerns
- Write self-documenting code

---

## Acceptance Criteria

- [ ] Feature implementation complete
- [ ] All new code has type definitions
- [ ] Integration with existing code works
- [ ] No regression in existing functionality
- [ ] Code follows project conventions

---

## Conversation Log

<details>
<summary>Click to expand full conversation</summary>

**ASSISTANT**:
Ah, I see the core issue – the Q&A phase is too verbose and exhausting to interact with. Let me understand the current experience first.

## Current Pain Point

You're saying the AI is too wordy during the question/answer phase. I'm guessing users feel like:
- They're reading walls of text when they just want to answer and move on
- The back-and-forth feels slow and draining
- They lose focus or patience before the spec is done

## The Spectrum of Conversational Density

Let me show you the trade-off space:

```
Minimal ◆━━━━━━━━━━━━━━━◆ Verbose
→ Fast, scannable          → Complete, educational
→ Assumes competence       → Explains reasoning
→ Risk: ambiguity          → Risk: fatigue
```

Right now it sounds like you're way over on the right, and users are hitting that fatigue risk hard.

## My First Question

**What does the *ideal* interaction rhythm look like in your head?**

For example:
- Quick back-and-forth like a Slack conversation?
- One focused question at a time with minimal setup?
- A form-like experience where the AI just asks 5-7 questions upfront?
- Something else entirely?

And specifically: **What part of the verbosity is the most annoying?** Is it:
- The explanations of trade-offs (too much context)?
- The examples and reasoning (unnecessary fluff)?
- The length of the questions themselves?
- Something about the pacing/structure?

Give me the vibe you're going for.

---

**USER**:
Quick back and forth would be amazing. Use components to show trade-offs cleanly. I don't know what do you think ? Look at what claude code does too. They ask questions with pre render input and sometime a free range input

---

**ASSISTANT**:
Oh YES, this is the right direction. Claude Code's approach is brilliant – they use those pre-rendered buttons/options that you can just *click* instead of typing out answers.

## Let me paint the picture I'm seeing:

**Current flow (verbose):**
```
AI: "I see you're using Next.js... [3 paragraphs explaining context]
    Here's a spectrum showing trade-offs... [diagram]
    What do you think about..."
    
User: *sighs* types out a response
```

**New flow (snappy):**
```
AI: "Hero section interactivity level?"

[Static HTML] [Light CSS] [Some React] [Full interactive]

Or describe what you want: [____________]
```

## The Implementation Spectrum

```
Text-only ◆━━━━━━━━━━━━━━━◆ Rich components
→ Simple to build          → Better UX
→ Works everywhere         → Needs UI work
→ Slower interaction       → Instant clicks
```

## Here's what I'm thinking:

**For the Q&A phase specifically:**

1. **Questions become:** Short, direct, no preamble
2. **Options become:** Visual components (buttons, sliders, radio groups)
3. **Context becomes:** Collapsible or tooltip ("Why does this matter?")
4. **Free text:** Always available as an escape hatch

**Quick questions:**

1. **Should every question have pre-rendered options, or just common ones?** (like framework choices vs. "describe your feature")

2. **How do you want to handle the spectrum/trade-off visuals?** 
   - Keep them but make them compact/collapsible?
   - Replace with simple button labels?
   - Remove entirely?

3. **What about the AI's "personality"?** Should it:
   - Stay conversational but shorter ("Cool. Next:")
   - Go full minimal ("Question 3/7:")
   - Something in between?

What feels right?

---

**USER**:
1. just common ones. 
2. compact/collapsible. 
Conversational. 

The goal of Overkill is to make a project where you talk to an expert

---

**ASSISTANT**:
Perfect. So we're keeping that "talk to an expert" vibe, just making it *snappier* and more interactive. I like it.

## Let me clarify the vision:

You want that feeling of sitting next to a senior engineer who:
- Asks sharp, direct questions
- Shows you quick visual options when helpful
- Doesn't waste your time with essays
- But can expand on "why" if you need it

## Implementation decisions I need:

**1. Component Library Approach**

Where do these interactive components live?

```
Inline in prompts ◆━━━━━━━━━━━━━━━◆ Separate UI layer
→ Simpler (just better prompts)    → Richer (actual buttons/UI)
→ Works in any LLM interface       → Needs frontend work
→ Still some typing needed         → True click-to-answer
```

Are you thinking:
- **Option A:** The AI outputs structured data that your frontend renders as actual UI components (buttons, radios, etc.)?
- **Option B:** Keep it in the LLM conversation but use better formatting/structure?
- **Option C:** Something hybrid?

**2. Common Question Bank**

You mentioned "common ones" get pre-rendered options. What are the common decision points you see coming up repeatedly? Like:

- Framework/stack choices?
- State management approach?
- Styling/UI library?
- Auth strategy?
- Data fetching patterns?

Give me 3-5 examples of questions that almost *always* get asked.

**3. Collapsible Context**

When the AI wants to explain a trade-off, how do you envision the interaction?

```
AI: "State management approach?"

[Redux] [Zustand] [Context] [Jotai] [Describe...]

💡 Why this matters (click to expand)
```

Does that feel right? Or different?

---

**USER**:
Structure output.

I don't know for common. 

Yes that sounds right

---

**ASSISTANT**:
Cool, we're aligned. So:

✅ Structured output → frontend renders as real UI
✅ Collapsible context with emoji/icon to expand
✅ Keep conversational tone, just shorter

## Now the practical stuff:

**1. What triggers "pre-rendered options" vs "free text input"?**

The AI needs to decide in real-time: "Is this a common choice-based question or an open-ended one?"

```
Hardcoded rules ◆━━━━━━━━━━━━━━━◆ AI decides dynamically
→ Predictable, fast              → Flexible, smart
→ Need to maintain list          → Might guess wrong
→ Less tokens used               → Uses more reasoning
```

My gut says: **Let the AI decide dynamically** based on the question. If it's asking about a well-known choice (framework, library, pattern), it outputs options. If it's exploratory ("what's the main user journey?"), it outputs free text prompt.

Sound reasonable?

**2. Output schema - what does it look like?**

Something like:

```typescript
{
  question: "State management approach?",
  type: "single-choice" | "multi-choice" | "spectrum" | "free-text",
  options?: ["Redux", "Zustand", "Context API", "Jotai"],
  context?: "Managing shared state across components affects bundle size and complexity...",
  contextExpanded: false
}
```

Does that structure capture what you need? Any fields missing?

**3. Where does this fit in your current architecture?**

Looking at your stack - is this:
- A new endpoint that streams structured Q&A objects?
- Modifying the existing agent conversation flow?
- A separate "interview mode" vs the current chat?

What's the integration point?

---

**USER**:
I don't know. I trust you

---

**ASSISTANT**:
Alright, I appreciate the trust. Let me make some calls here based on what makes sense for your codebase.

## Decisions I'm making:

**1. AI decides dynamically** - More flexible, and Claude is good at this. The agent will decide per-question whether to offer options or free text.

**2. Output schema:**
```typescript
{
  question: string,
  type: "single-choice" | "multi-choice" | "slider" | "free-text",
  options?: string[],
  context?: string,  // The "why this matters" expandable
  placeholder?: string  // For free-text inputs
}
```

**3. Integration:** Modify the existing agent's Q&A phase to output this structured format instead of pure text.

## What I need from you now:

**The actual behavior change** - Let's get concrete about the before/after:

**Current flow (I'm guessing):**
```
User: "Add a hero section"
AI: [Long explanation about hero sections...]
User: [Types response]
AI: [Long follow-up...]
```

**New flow should be:**
```
User: "Add a hero section"
AI: {
  question: "What's the main call-to-action?",
  type: "free-text",
  placeholder: "e.g., 'Start free trial', 'Book a demo'..."
}
User: [Clicks, types, or selects]
AI: {
  question: "Visual style?",
  type: "single-choice",
  options: ["Minimal", "Bold/Modern", "Illustration-heavy", "Video background"],
  context: "Affects bundle size and initial load time"
}
```

**My question:** At what point does this structured Q&A phase end and regular conversation resume?

- After N questions?
- When the AI says "SPEC_READY"?
- When user says "done"?
- Something else?

And what happens to that collected info - does it feed into a spec doc, or...?

</details>

---

**Generated by Overkill V2 (TypeScript)**

**Status:** ✅ SPEC_READY — Ready for implementation
