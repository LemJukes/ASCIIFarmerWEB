# ASCIIFarmerWEB Agent Routing

This workspace uses specialized agents for game subsystems. Route requests to one primary agent using keyword intent and file ownership.

## Primary Agent Selection

1. Choose exactly one primary agent for each request.
2. Use state-integrity as consult context only when schema, migration, or snapshot compatibility is at risk.
3. If a request spans domains, pick the agent that owns the first-order behavior change.

## Routing Priority Order

Apply this order when multiple domains appear in one request:

1. state-integrity for schema, migration, normalization, save/load compatibility.
2. automation-systems for background interval/tick behavior.
3. plot-loop for manual click/key gameplay transitions.
4. quest-reward for quest chain, delivery windows, and reward flow.
5. economy-balance for pricing, scaling, and progression thresholds.
6. macintosh-ui for visual presentation and interaction chrome.

## Agents And Trigger Language

### state-integrity
Use when request includes: save, load, snapshot, normalize, migration, schema changes, reconcile, fields state shape, plotStates schema, backward compatibility.

High-signal phrases:
- applyStateSnapshot, normalizePlotState, ensureFieldsStateShape, reconcileAllFieldsProgress
- activeFieldId mismatch, plotStates length mismatch, legacy save import

Anti-signals:
- pure price/cost tuning with no schema change
- pure CSS/window style requests

Owns:
- src/js/state.js
- src/js/persistence.js
- state sections of src/js/main.js

Avoid owning:
- Economy tuning values
- UI styling/layout decisions

### plot-loop
Use when request includes: till, plant, water, harvest, plot click, wrong tool, growth state symbols, symbol transitions, fallow state machine timing, expanded click pattern.

High-signal phrases:
- handlePlotClick, getWrongToolMessage, getGrowthSymbol, expanded click Mk
- tool gating, plot symbol transitions, disabledUntil/fallow behavior

Anti-signals:
- engine tick interval changes
- save schema migration work
- AutoFarmer interval or engine-driven timing changes, even when they affect plot transitions

Clarification:
- Fallow disabledUntil timeout and state-machine timing belong to plot-loop.
- Fallow cost scaling and progression curve tuning belong to economy-balance.
- If a request says duration or timeout, route to plot-loop first.
- If a request says cost scaling or progression curve, route to economy-balance first.

Owns:
- src/js/handlers/plotHandlers.js
- src/js/configs/cropConfig.js
- src/js/configs/toolConfig.js
- plot interaction sections of src/js/ui/field.js

Avoid owning:
- Background automation cadence
- Economy price tuning

### economy-balance
Use when request includes: cost, price, multiplier, scaling curves, progression pacing for coins/resources, spend-based unlock thresholds, profitability, bulk tier tuning.

High-signal phrases:
- progressionConfig, upgradesEconomy, storeEconomy, bulkTiers
- mk cost curve, seed profitability, unlock pacing

Anti-signals:
- quest dialog/timer sequencing changes
- normalization and persistence bug fixes

Owns:
- src/js/configs/progressionConfig.js
- src/js/handlers/storeHandlers.js
- src/js/handlers/upgradeHandlers.js
- economy constants in src/js/configs/autoFarmerConfig.js

Avoid owning:
- Quest timer/dialog behavior
- Plot state normalization

### automation-systems
Use when request includes: AutoFarmer, auto buyer, tick, interval, cadence, engine loop, engine pause/resume, warning suppression, repeated notification spam, automation error handling.

High-signal phrases:
- initializeAutoFarmerEngine, processAutoFarmerCycle, AUTO_FARMER_ENGINE_TICK_MS
- warning suppression, flashingUntil, repeated automation errors

Anti-signals:
- manual click-only behavior changes
- CSS/theme style updates

Owns:
- src/js/handlers/autoFarmerHandlers.js
- src/js/handlers/waterAutoBuyerHandlers.js
- automation-related flow in src/js/handlers/plotHandlers.js
- src/js/configs/autoFarmerConfig.js timing behavior

Avoid owning:
- Manual click plot loop tuning
- General UI layout changes

### quest-reward
Use when request includes: quest unlock sequencing, quest progression, delivery window, late fee, decline penalty, reward application, quest gate logic, quest chain.

High-signal phrases:
- unlockCondition, rewardAppliedAt, questProgressionPaused, deliveryWindowMs
- decline offsets, quest chain blocker, quest completion reward

Anti-signals:
- global non-quest economy tuning
- generic UI theming without quest behavior changes

Clarification:
- Quest unlock cost or requirement gates inside quest progression belong to quest-reward.
- Global price curves, mk scaling, and non-quest progression pricing belong to economy-balance.

Owns:
- src/js/handlers/questHandlers.js
- src/js/configs/questConfig.js
- src/js/ui/quests.js
- quest state integration in src/js/state.js

Avoid owning:
- Pure economy repricing not tied to quests
- Non-quest window styling

Coordination note:
- quest-reward owns quest readiness trigger logic and idempotent state markers such as rewardAppliedAt.
- Consult automation-systems when a quest notification relies on shared cadence or throttling behavior.
- Prevent duplicate quest notifications on reload by persisting and checking quest reward trigger state.

### macintosh-ui
Use when request includes: Mac window, titlebar, subtitlebar, retro control style, notification UI styling, dialog presentation/layout, dark mode icon swaps, keyboard focus UX.

High-signal phrases:
- wrapSectionsInMacWindows, mac-titlebar, mac-subtitlebar, dialog presentation
- dark/light icon behavior, focus ring, keyboard navigation affordance

Anti-signals:
- crop growth logic and tool gating
- save/load schema compatibility

Owns:
- src/js/ui/macWindow.js
- src/js/ui/macNotifications.js
- src/js/ui/darkMode.js
- mac-style UI sections in src/js/ui/field.js and src/css/styles.css

Avoid owning:
- Core game logic/economy behavior
- Save schema changes

## Tie-Break Rules

1. plot-loop vs automation-systems:
- If user action on click/key is primary, choose plot-loop.
- If background interval/tick behavior is primary, choose automation-systems.

2. economy-balance vs quest-reward:
- If global pricing/scaling is primary, choose economy-balance.
- If quest gating, timing, or reward sequence is primary, choose quest-reward.

3. state-integrity vs any other agent:
- If the request changes data shape, migration, or load compatibility, choose state-integrity.
- Otherwise keep state-integrity as consult context only.

## Escalation Rules

1. Escalate to state-integrity when any agent adds/removes/renames persisted fields.
2. Escalate to automation-systems when plot-loop edits affect AutoFarmer handoff behavior.
3. Escalate to economy-balance when quest-reward edits alter costs, payouts, or progression thresholds.

## Output Expectations

Each specialist should provide:
- Scope check: what it owns and what it will not change.
- Regression risks for adjacent systems.
- Brief validation steps relevant to the subsystem.
