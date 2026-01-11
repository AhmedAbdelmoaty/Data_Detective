# Project Context & Rules

## Role & Seniority
- **Role:** Principal Game Architect + Senior Software Engineer + Data Analysis Expert.
- **Style:** Disciplined, Precise, Calm, Systematic, Value-Driven.
- **Mode:** READ → CONFIRM → PLAN → EXECUTE.
- **Constraints:** No guessing, no rushing, no assumptions.

## Core Fantasy
"You are a Data Detective solving business mysteries using data."

## Absolute Principles (Invalidation Rules)
1.  **This is a Game**: Not a course, quiz, or gamified slide deck.
2.  **Learning is Invisible**: Learning exists only as a tool to win.
3.  **No Quizzes/Drift**: No "choose correct answer", no passive explanations.
4.  **No Direct Hints**: Players solve by analyzing data. Exception: CEO Debrief at the end.
5.  **Clarity**: Player understands goal/mechanics, but not the solution.
6.  **Purpose**: Every screen/click must have a reason.
7.  **Arabic-First**: Hard constraint. All UI/Content in Arabic. Professional tone.

## Technical Constraints
- **Stack**: React + TypeScript + Tailwind (SaaS-like).
- **Architecture**: State-driven, Routing discipline.
- **Workflow**: Impact Check -> Implementation -> Change Log.

## Initial Plan
1.  Receive Case Specification.
2.  Design Schema (Cases, Evidence, Hypotheses).
3.  Implement Game Loop (Briefing -> Investigate -> Solve).
4.  Build Data Analysis UI (Mock DB/Tools).

## Hypothesis-Elimination System (Player-Justified)

### Core Design Philosophy
The game centers on **player-justified hypothesis elimination**:
- 4 hypotheses are presented immediately after CEO briefing (Hypothesis Board is central hub)
- Players gather evidence, conduct interviews, and analyze data
- To eliminate a hypothesis, players must select which items justify their reasoning
- **No visual hints** about what contradicts what - players must reason independently
- The system accepts any player logic, even if imperfect - correctness revealed only after report
- Report submission is gated until exactly 1 hypothesis remains

### Key Principles
1. **Elimination is player-driven**: No automatic eliminations or obvious labels
2. **No contradiction hints**: Evidence/interviews don't reveal which hypotheses they contradict
3. **Reasoning is tracked**: Player's justification choices are stored and displayed
4. **Correctness is deferred**: Only revealed after final report submission

### Data Model
- `Hypothesis`: id, title, description, icon, isCorrect (hidden from player)
- `EliminationJustification`: Stores player's reasoning (which items they selected to justify elimination)
- Evidence, Interviews, DataInsights: Neutral content with no contradiction markers

### Game Flow
1. **Intro** → CEO briefing about sales decline problem
2. **Hypothesis Board** (Central Hub) → View 4 possible explanations
3. **Evidence Room** → Discover and collect evidence documents
4. **Data Desk** → Analyze charts and register data insights
5. **Interviews** → Question stakeholders and gather perspectives
6. **Hypothesis Board** → Eliminate hypotheses by selecting justifying evidence
7. **Report** → Submit when exactly 1 hypothesis remains, see reasoning summary

### Key Files
- `shared/schema.ts`: Type definitions (Hypothesis, EliminationJustification, Case)
- `client/src/content/cases/case001.ts`: Case with 4 hypotheses (no contradiction hints)
- `client/src/store/gameStore.ts`: State management with discovery tracking
- `client/src/components/EliminationModal.tsx`: Justification selection UI
- `client/src/pages/HypothesisBoard.tsx`: Central hub with elimination modal
- `client/src/pages/DataDesk.tsx`: Data analysis with insight discovery
- `client/src/pages/Report.tsx`: Reasoning summary and gated submission
