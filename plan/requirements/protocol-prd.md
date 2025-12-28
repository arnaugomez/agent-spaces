## Product Requirements Document (PRD): Code Execution Protocol (Operations & Events)

### 1) Executive summary

This PRD defines a **simple, fixed protocol** that lets an AI agent accomplish tasks by emitting a list of **operations** (e.g., create file, run shell), and receiving a list of **events** that represent the results of those operations.

The protocol is intentionally small and standardized. It is meant to:
- Enable **deterministic, low-token workflows** where code performs the work instead of the model rewriting large tool outputs.
- Provide a **universal “capability surface”** that works across AI models (including those without native tool calling).
- Support safe, auditable automation via **controlled code execution** in an isolated environment.

This PRD focuses on product behavior and developer experience, not technical implementation.

---

### 2) Problem statement

Current tool calling / MCP-style agent systems have recurring issues:
- The model becomes a **throughput bottleneck** because it must read large tool outputs and rewrite content.
- **Reliability degrades** when the model must search/filter large datasets in natural language.
- **Context window limits** force lossy summarization of tool outputs and intermediate results.
- Tool ecosystems suffer from **tool overload** and poor composability; every new workflow requires new tool shapes.
- Security is awkward when the model must read secrets or pass credentials through tool inputs.

---

### 3) Goals

- **G1: Small, fixed protocol** with a limited number of operation types and event types.
- **G2: Composability via code**: the “tooling” is just code that can call APIs/SDKs and process data deterministically.
- **G3: Pleasant DX**: easy to generate, easy to validate, easy to debug, easy to log.
- **G4: Model-agnostic**: usable by any model that can produce structured text.
- **G5: Safe by design**: aligns with sandboxed execution, approval gates, and least privilege (enforced by the framework).

---

### 4) Non-goals (for the protocol)

- Not a general workflow engine spec (retries/backoff/scheduling are framework features, not protocol requirements).
- Not a transport spec (HTTP/WebSocket/etc. are framework concerns).
- Not a language spec (TypeScript/Bun may be the first target, but protocol is language-neutral).
- Not a plugin marketplace spec (may come later, but not required to standardize the protocol).

---

### 5) Target users & personas

- **AI app developers** building agents that must do real work reliably and safely.
- **Framework/platform engineers** who need a predictable interface between models and execution environments.
- **AI power users** who want automations without fragile prompt/tool sprawl.

---

### 6) Core concepts (glossary)

- **Operation**: An instruction emitted by the agent for the runtime/framework to perform.
- **Event**: A record emitted by the runtime/framework describing the outcome of an operation (and user inputs).
- **Run**: A single agent “turn” or iterative loop where operations are executed and events are returned.
- **Workspace**: A scoped file area the agent can read/write (owned by the runtime).
- **Approval gate**: A user or policy checkpoint required before executing a sensitive operation.

---

### 7) Protocol overview

#### 7.1 Message shapes (conceptual)

The protocol consists of:
- **Agent → Runtime**: list of operations
- **Runtime → Agent**: list of events

The protocol must be representable as plain JSON-like structures.

#### 7.2 Operation types (fixed set)

The protocol defines a fixed set of operation types (mirroring your essay’s proposal):
- `message`: communicate intent/progress to the user (non-executing).
- `createFile`: create a new file with content.
- `readFile`: request the content of a file.
- `editFile`: apply an edit to an existing file.
- `deleteFile`: delete a file.
- `shell`: run a command (within runtime policy/sandbox).

The protocol **must not allow** arbitrary new operation types defined by developers. Extensibility happens through code execution inside the environment, not by expanding the protocol surface area.

#### 7.3 Event types (fixed set)

The protocol defines a fixed set of event types:
- `userMessage`: user-provided input to continue the run.
- `createFile`: result of a create.
- `readFile`: result of a read (includes content on success).
- `editFile`: result of an edit.
- `deleteFile`: result of a delete.
- `shell`: result of a command execution (stdout/stderr/exit status, subject to policy).

---

### 8) Product requirements

#### 8.1 Simplicity & ergonomics

- **R1**: The protocol must be small enough to explain in < 5 minutes.
- **R2**: Operations/events must be easy to generate by LLMs and easy to parse by runtimes.
- **R3**: Each operation/event must be self-describing and consistently shaped across runs.
- **R4**: The protocol should be robust to partial failures: one failed operation does not invalidate the entire list; failures become events.

#### 8.2 Determinism & reliability

- **R5**: The runtime must execute operations in a well-defined order (default: list order).
- **R6**: Results must be returned as events that allow the agent to continue with full fidelity (subject to security policy).
- **R7**: The protocol must support iterative loops: agent emits operations, runtime returns events, agent emits next operations.

#### 8.3 Human-friendly progress & control

- **R8**: The agent must be able to emit `message` operations to describe what it is doing and why.
- **R9**: The runtime must be able to surface approval requests and user prompts as `userMessage` or an equivalent “waiting for input” state (framework-defined UX), without adding new protocol types.

#### 8.4 Safe-by-design boundaries (protocol-level expectations)

The protocol itself is intentionally permissive (it can request a `shell` command), but:
- **R10**: The protocol assumes a **policy-enforcing runtime**. Operations are “requests”, not guaranteed actions.
- **R11**: Any operation may be denied by policy; denial must be represented as a clear event with an actionable error.
- **R12**: The protocol must support “approval gates” without expanding the operation set: the runtime can pause execution and request user input.

#### 8.5 Observability & auditability

- **R13**: Every executed operation must have a corresponding event (success or failure).
- **R14**: Events should include enough information to debug runs (e.g., which operation they correspond to, what failed, and why), while respecting security policies.
- **R15**: A run transcript (operations + events) should be serializable and replayable for debugging, subject to secret redaction policies.

#### 8.6 Developer experience requirements

- **R16**: Provide clear examples of typical runs (create code file → execute → interpret stdout → write output artifact).
- **R17**: Provide guidelines for agents: prefer code for filtering/searching, use files for durable context, keep messages user-readable.
- **R18**: Provide validation rules and best practices to avoid malformed operation lists.

---

### 9) Example user journeys (protocol-level)

#### 9.1 “Write code, run it, store result”

- Agent emits `message`, `createFile` (script), `shell` (run).
- Runtime returns `createFile` success, `shell` stdout/stderr.
- Agent emits `createFile` (report) or `editFile` (update doc), plus `message` summarizing outcome.

#### 9.2 “Read existing context, update a doc”

- Runtime includes a `readFile` event at run start (out-of-band context injection).
- Agent emits `editFile` to update, then `message`.

#### 9.3 “Sensitive action requires approval”

- Agent emits `shell` that requires approval by policy.
- Runtime pauses and returns an event indicating approval is needed and what for (framework UX).
- User supplies `userMessage` granting/denying.
- Agent continues accordingly.

---

### 10) Compatibility & versioning

- **V1**: The protocol must have a version identifier.
- **V2**: Backwards compatibility must be maintained within a major version (framework-defined enforcement).
- **V3**: The protocol should evolve rarely; the goal is stability.

---

### 11) Success metrics (protocol)

Quantitative:
- **Token reduction** vs. equivalent tool-calling workflows (median & p95).
- **Task completion rate** on long-running tasks (multi-step, multi-file).
- **Error recovery rate**: % runs where the agent successfully continues after a failed operation.

Qualitative:
- Developer reported **ease of integration** and **debuggability**.
- Lower perceived complexity vs. bespoke tool ecosystems.

---

### 12) Risks & mitigations

- **Risk: Over-permissive `shell`**: mitigated by runtime policy, approvals, least-privilege.
- **Risk: Protocol too rigid**: mitigated by relying on code inside the environment for extensibility.
- **Risk: Inconsistent model outputs**: mitigated by validation, examples, and “strict mode” parsing in the framework.

---

### 13) MVP scope (protocol)

The MVP protocol includes:
- The fixed operation/event types listed above.
- A minimal set of required fields for correlation, status, and error reporting.
- A single canonical “happy-path” example and 3–5 additional examples (docs).

Everything else (transport, auth, sandboxing, policy) is framework-level.


