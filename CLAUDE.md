# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes. These apply on top of whatever the user actually asks for.

**Tradeoff:** these guidelines favor caution over speed. For trivial, low-stakes edits, use judgment and don't over-apply them.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

- State your assumptions explicitly before implementing. If genuinely uncertain, ask instead of guessing.
- If a request has more than one reasonable interpretation, say so rather than silently picking one.
- If a simpler approach exists than the one implied by the request, propose it and explain the tradeoff.
- If something is unclear or contradictory, stop and name exactly what's confusing instead of working around it.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for something used once.
- No configurability, flags, or "flexibility" that wasn't requested.
- No error handling for scenarios that can't actually occur here.
- If a change could be 20 lines and it's 100, cut it back down.

Ask: would a senior engineer call this overcomplicated for what it does? If yes, simplify.

## 3. Surgical Changes

**Touch only what the task requires. Clean up only what you created.**

- Don't reformat, restyle, or "improve" code you weren't asked to touch.
- Don't refactor working code that isn't part of the request.
- Match the existing style in the file, even if you'd personally do it differently.
- If you spot unrelated dead code or issues, mention them — don't silently delete or fix them.
- Do remove imports/variables/functions that your own change made unused.

The test: every changed line should trace back to the actual request.

## 4. Goal-Driven Execution

**Define what "done" looks like before starting. Verify against it, don't just declare it.**

Turn vague asks into checkable outcomes, e.g.:
- "Fix the bug" → reproduce it, confirm the fix resolves it.
- "Add X to the workout data" → edit `data/workouts.json` only, then load the app and check the new entry renders correctly.
- "Change the offline/caching behavior" → bump `CACHE_NAME` in `service-worker.js`, then hard-reload and confirm the old cache doesn't mask the change.

For anything multi-step, state a short plan first:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
```

---

**Signal these are working:** fewer unrelated lines in diffs, no unrequested rewrites, and clarifying questions asked before implementation rather than fixes after the fact.
