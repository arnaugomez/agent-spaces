## Product Requirements Document (PRD): Agent Spaces Framework

### 1) Executive summary

**Agent Spaces** is a framework (self-hostable and optionally offered as a hosted service) that creates and manages **isolated code execution environments** where an AI agent can safely:
- Create/read/edit/delete files in a constrained workspace
- Run code and commands subject to policy
- Convert “tools” and “MCP capabilities” into ordinary code calls (SDKs / APIs) executed inside the environment
- Operate via either (a) traditional tool calling or (b) the standardized operations/events protocol defined in the [Protocol PRD](../plan/protocol-prd.md)

The product goal is a **simple, pleasant developer experience** that makes long-running, multi-step agent workflows more reliable, more composable, and safer than conventional tool calling patterns.

---

### 2) Problem statement

Developers want agents that can do real work end-to-end (generate artifacts, transform data, automate workflows). Today, they run into:
- **Complexity explosion**: tools must encode every workflow variant; tools proliferate and become hard to maintain.
- **LLM bottlenecks**: models must read large tool outputs and rewrite them, increasing latency, cost, and error rates.
- **Security tension**: giving agents broad permissions and secrets is risky; approvals and least privilege are hard to enforce consistently.
- **Poor long-run ergonomics**: results and intermediate context get lost; runs are hard to debug and reproduce.

Agent Spaces addresses these by making **code execution in an isolated environment** the primary mechanism of work, with explicit, audited interactions (files + commands + approvals).

---

### 3) Goals

- **G1: Safe, isolated environments**: spin up per-run or per-project spaces that are strongly sandboxed and policy-controlled.
- **G2: Excellent DX**: easy to start, easy to integrate, easy to observe/debug, easy to host.
- **G3: Protocol support**: first-class support for the [operations/events protocol](../plan/protocol-prd.md) for model-agnostic agent loops.
- **G4: Tool/MCP replacement by code**: allow developers to provide capabilities as code-accessible APIs/SDKs so agents can compose them programmatically.
- **G5: Fine-grained access control**: restrict allowed actions, commands, files, and APIs; provide approvals for sensitive operations.
- **G6: Multi-language roadmap**: start with TypeScript on Bun, expand later (product-level commitment; technical details out of scope here).

---

### 4) Non-goals (for the framework, for now)

- Not an LLM provider abstraction layer (can integrate, but not the core value).
- Not a general CI/CD platform.
- Not a universal secrets manager (but must integrate cleanly with existing secret stores).
- Not a full IDE replacement (but should be friendly to IDE + local workflows).
- Not a “marketplace-first” product in v1 (can be added later).

---

### 5) Target users & personas

- **Agent application developers**: building AI products that need reliable automation and artifact generation.
- **Platform engineers**: hosting internal agent infrastructure with strict security and audit requirements.
- **Tooling/SDK teams**: turning company capabilities into code-accessible SDKs for agents to use.
- **Security/compliance teams** (secondary stakeholder): ensuring least privilege and audit trails.

---

### 6) Key concepts (glossary)

- **Space**: an isolated execution environment instance.
- **Workspace**: the file tree visible to the agent within a space.
- **Run**: an execution session (may be a single turn or iterative loop).
- **Policy**: explicit restrictions on filesystem, shell commands, network, and APIs.
- **Approval**: a required user confirmation for sensitive actions.
- **Capability**: a code-level API exposed inside the space (SDK, library, service stub), replacing bespoke “tools”.

---

### 7) Product surface area

Agent Spaces must be accessible via:
- **REST API**: for broad compatibility and language-agnostic integrations
- **TypeScript SDK**: ergonomic API for JS/TS ecosystem and agent frameworks

The framework should support two integration modes:
- **Mode A: Protocol-native agent loop**: developer uses the operations/events protocol directly.
- **Mode B: Tool-calling compatibility**: developers can expose “tools” outwardly, but their implementation runs in the space as code operations.

---

### 8) Primary user journeys (end-to-end)

#### 8.1 “Hello Agent Space”

- Developer creates a space with a default policy.
- Developer uploads or initializes a workspace.
- Agent writes a small script, runs it, and produces an artifact file.
- Developer downloads/reads outputs and inspects logs.

Success criteria:
- < 5 minutes to first successful run
- Clear logs and an easy-to-understand artifact path

#### 8.2 “Long-running task with iterative loop”

- Agent starts a run, reads context files, writes code, executes commands, iterates.
- Runtime returns events after each batch of operations.
- Final output is a report + updated workspace files.

Success criteria:
- Smooth iteration loop
- Failures are localized and recoverable
- Run transcript is easy to replay/debug

#### 8.3 “Sensitive action with approvals”

- Agent requests a restricted command (or access to a sensitive file/API).
- Framework blocks execution and requests approval.
- User approves/denies; agent continues accordingly.

Success criteria:
- Clear user prompt (“what/why/impact”)
- No accidental leakage of secrets to the model
- Full audit log

#### 8.4 “Replace tools/MCP with code capabilities”

- Developer supplies an internal SDK (or API client) into the space.
- Agent uses it in code to call company services.
- Agent filters/processes results deterministically and writes outputs.

Success criteria:
- Developer does not need to create dozens of bespoke tool shapes
- Agent code can compose capabilities naturally

---

### 9) Developer experience requirements (high priority)

#### 9.1 Onboarding & ergonomics

- **DX1**: A minimal “quickstart” that results in a successful run and artifact generation.
- **DX2**: Simple mental model: *space + workspace + policy + run*.
- **DX3**: First-class examples for common tasks (data processing, document generation, repo modifications, etc.).
- **DX4**: Clear error messages when policies deny actions (with suggestions).

#### 9.2 Local development

- **DX5**: Easy local setup for self-hosting (single command or minimal steps).
- **DX6**: Ability to inspect workspace state (files) and run logs.
- **DX7**: Replay a run transcript in a controlled way for debugging.

#### 9.3 API/SDK usability

- **DX8**: “One obvious way” to create a space and run operations.
- **DX9**: Support streaming or incremental results for long commands (DX requirement; transport details are implementation).
- **DX10**: Strong typing in TS SDK, with sensible defaults.

---

### 10) Security & access control requirements (high priority)

Agent Spaces must enforce least privilege with clear developer controls:

- **SEC1: Policy-first execution**: all filesystem, shell, network, and API access is governed by explicit policy.
- **SEC2: Deny-by-default** posture for sensitive capabilities (especially network and host access).
- **SEC3: Approval gates**: configurable approvals for sensitive operations (commands, file paths, network domains, etc.).
- **SEC4: Secret handling**: secrets can be referenced/used by executed code without being disclosed to the model by default.
- **SEC5: Audit logs**: immutable logs of operations, events, approvals, and policy denials.
- **SEC6: Isolation**: spaces are isolated from each other and from the host environment.

---

### 11) Observability & operations requirements

- **OBS1**: Run timeline view (conceptually): operations → events with timestamps.
- **OBS2**: Logs and outputs are retained per run with configurable retention.
- **OBS3**: Redaction controls for sensitive outputs.
- **OBS4**: Exportable run transcripts for debugging and compliance.

---

### 12) Scope & roadmap

#### 12.1 MVP (v0)

Must include:
- Create/manage spaces
- Workspace file operations (create/read/edit/delete)
- Shell command execution (policy-controlled)
- Approval workflow for restricted operations
- REST API + TypeScript SDK
- Operations/events protocol compatibility per [Protocol PRD](../plan/protocol-prd.md)
- Strong audit/logging basics
- Initial language support: TypeScript on Bun (product-level commitment)

Nice-to-have (not required for MVP):
- Space templates (“starting workspaces”)
- Transcript replay tooling
- Optional hosted offering

#### 12.2 v1+

Potential expansions:
- More languages/runtimes
- Richer policy configuration UX
- Organization/team features (quotas, roles, shared templates)
- Ecosystem integrations (agent frameworks, CI, ticketing systems)

---

### 13) Success metrics

Adoption & engagement:
- Time-to-first-successful-run
- Weekly active spaces/runs
- Retention of developers integrating the SDK

Reliability & safety:
- Policy denial rate with resolution rate (how often developers successfully adjust policy)
- Incident rate (secret leakage, unauthorized actions) — target: near zero

Efficiency:
- Median cost/latency per completed task vs tool-calling baselines

---

### 14) Open questions

- Hosted vs self-hosted priorities for v1: what’s the target audience first?
- What is the default policy posture for local dev vs production?
- How do we want developers to package “capabilities” (SDKs, services, libraries) for agents in a way that stays simple?


