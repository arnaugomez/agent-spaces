# Code: the new standard for AI agents

## Summary

AI models can achieve complex tasks by writing code that performs these tasks. This approach is more efficient and reliable than tools and MCP servers. 

Moreover, Tools and MCPs can be transformed into code APIs, so any AI agent with tools can be re-written as a code agent that achieves the same tasks cheaper and faster.

Despite its advantages, code needs an environment to run. "Agent spaces" is an open-source tool that spins up isolated code environments where AI can create files and run code safely. It also requires an open standard that allows any AI model to interact with the "Agent spaces" environment.

## Two standards

AI agents are composable. Developers need a standard to give capabilities to their AI.

Two approaches have emerged:

### Tool calling

The developer defines a set of available operations called tools. The AI can include one or m˝ore of these operations in its response, this process is called "tool calling". After being generated, tool calls are executed.

### MCP

An MCP server allows the AI to connect to an external API. MCP servers expose a set of tools the AI can call to interact with the API.

MCPs and tool calling make it possible to group and distribute these capabilities.

## Issues with Tool calling and MCP

The two approaches present these problems:

### The AI model is the bottleneck

All content that is modified needs to be read and produced by the AI.

For example, suppose an agent that reads the train schedule, looks for the 8am trip, and creates a reminder. The agent would do these tasks:

1. Call the getTrainSchedule tool
2. Read all train trips (even those that are not at 8am)
3. Look for the 8am trip
4. Call the createNote tool. Re-write the entire trip info for the 8am trip

By contrast, if the AI generated a program that did this task, it would call a function to get the train schedule, followed by a function to select only the 8am trip. It would finally create a function that creates the note

```ts
const trip = getTrainSchedule().filter(trip => trip.hour === 8)
createNote(trip.toString())
```

Notice that, in the "code generation" example, the AI does not need to read the train schedule or generate the new content of the note. Everything is handled by the code.

Additionally, notice that a simple filtering script like `filter(trip => trip.hour === 8)` is more trustworthy than an AI model. If you ask an AI to filter/search a large amount of elements, it can hallucinate and forget to add items to the filtered result. A simple, deterministic line of code is more reliable than a statistics machine.

Also, the "code generation" example consumes less tokens by a large margin. By contrast, in the "tool calling example", if the amount of train trips is too large, the filtering process would not work because it would exceed the context window.

Finally, the AI model introduces a time bottleneck. AI responses are not instantaneous, so many sequential tool calls take significantly more time than a single code run.

### Authentication and security issues

If the AI model needs to read all tool call results, it must also read all sensitive information in them. Similarly, if the tool call is authorized, the AI needs to know the password and pass it to the tool. 
```json
{
    "toolName": "getTrainSchedule",
    "toolInput": {"password": "1234"}
}
```

This is not necessary if the AI writes code: it can reference the password as a variable.

```ts
const trip = getTrainSchedule(process.env.PASSWORD)
```

### Agents are only as capable as their tools

If you wanted to make the getTrainSchedule tool more capable, you could add a parameter to it called "time", that you can use to filter trips. However, in other situations, the AI might need other filters: train station, calendar day, time range... this would lead to increase the complexity of the tool.

### Tools cannot be combined

You cannot define a "getTrainSchedule" tool, a "filter" tool, and a "createNote" tool, and combine the three of them. To achieve a combined effect, developers must create a new tool, like "createNoteWithTrainSchedule". Supporting all workflows results in an explosion in the number of tools available.

By contrast, combining the results of many APIs is the natural thing to do in any program that goes beyond "Hello world".

### Tool overload

To ensure tools have the same capabilities as code, there has to be large amounts of them, and they need to be complex and configurable. However, the more tools an AI has available, the worse it performs. 

AI models do not know upfront what tools are available: developers have to mention them in the prompt. Therefore, a larger amount of tools means a greater token consumption.

### Tools are an unstandardized standard

Not all AI models have tool calling abilities. To achieve them, their training data must include a large amount of examples that use a specific tool calling format. Every AI provider might use a different format internally, and this can be seen in some of their differences: OpenAI models support "freeform" tools, while other providers require tool input to be a JSON object.

In practice, large frontier AI models are great at tool calling, but smaller models can invent tools or forget to call them.

Code is not so exclusive. All AI models are trained on code, so they are capable of generating it.

### Tool results are lost in long-running tasks

When the context window limit is reached, the context needs to be summarized so the AI can keep on working. This includes the tool call results, so valuable context is lost.

### Complex work requires more than tools

Knowledge work requires an environment where an AI can store documents and work with them. Code and documents are the bread and butter of real-life workflows, hence why Claude Code seems much more useful and capable for automating tasks than ChatGPT.

### Bonus: MCP's limitations

MCP is a great initiative that speaks to an real need in AI engineering: AI needs to access external APIs to do work. Each MCP is an API you can plug and play into your agent.

However, its implementation is surprisingly limited when compared to the HTTP REST APIs or code APIs we are used to accessing in code. Each MCP server requires a process to run on the local machine. By contrast, code APIs are more flexible: they can run on a remote server or be part of the application's code.

This begs the question of whether MCP is really necessary, or if traditional REST APIs and code SDKs would be equally capable. The AI could write code that calls these APIs and get the same outcomes.

## I am not the first to notice

Cloudflare introduced Code Mode. Anthropic is recommending code execution instead of tool calling in many scenarios.

In the market, coding agents are leagues ahead of agents in other domains. A coding agent like Claude Code is an excellent choice in other areas beyond coding. The operating system, with its file system and code execution capabilities, is the workbench it needs to perform complex tasks end-to-end.

## Can we replace everything with code?

The possibility of replacing everything with code seems enticing. But is it feasable? 

MCPs and tools are APIs, and they could be re-written as a program or a REST API.

Even in existing systems where re-writing MCPs and tools is not a possibility, a compiler could generate a code API that proxies to an existing tool call or to an MCP. If the tool needs user approval, the code execution would stop and wait for the user interaction.

So the conclusion is: yes, everything can be replaced by code.

## Where does the code run?

As powerful as it is, having AI run code on your machine is dangerous. Therefore, I can predict a growing need for a technology that allows developers to spin up isolated environments on the fly, where AI has the tools to do its work, nothing more, nothing less. 

To work safely, the environment needs to allow and restrict access to terminal commands, code APIs, files and folders.

Private companies like Daytona have successfully built environments with these characteristics. However, with safety being a deciding factor, I wonder if there is a need for an open source framework for managing AI coding environments. An open framework would make it easy to audit and find vulnerabilities. It would also have the benefit of being self-hostable.

Another factor is the popularity of serverless compute. In this paradigm, developers build services without being in control of the server infrastructure. AI coding environments could be offered as a cloud service.

## A protocol for code execution

Here is an alternative protocol to tool calling that allows the AI to perform any action with code execution.

This protocol is extremely simple and does not require

On the one hand, the AI can interact with the user and the coding workspace by generating a list of code operations:

```json
[
    {
        "type": "message",
        "content": "I'm going to create a train schedule reminder"
    },
    {
        "type": "createFile",
        "path": "code.ts",
        "content": "const trip = getTrainSchedule().filter(trip => trip.hour === 8)\ncreateNote(trip.toString())"
    },
    {
        "type": "shell",
        "command": "bun run code.ts"
    },
]
```

On the other hand, the AI receives a list of events. These events are the result of the code operations.

```json
[
    {
        "type": "createFile",
        "path": "code.ts",
        "success": true
    },
    {
        "type": "shell",
        "stdout": "Note created: 8am train schedule"
    }
]
```

There are several types of operations:

- message
- createFile
- readFile
- editFile
- deleteFile
- shell

There are several types of events:

- userMessage
- createFile
- readFile
- editFile
- deleteFile
- shell

The developer cannot define other types of operations or events. Any tools and MCPs are called by having the AI write code.

An advantage of workspaces is that any rules or context can be a file. For example, Anthropic introduced the Skills standard. Every skill is a file and a list of utilities that allow the AI to perform a certain task. It is a refreshing change from the traditional tool calling and MCP paradigms Anthropic themselves pioneered.

On the initial user message, additional context can be provided by adding files to the list of events, even if the AI did not create an operation to read them. This way, the AI can be pointed to the context and rules it needs to follow.

For example, an agent run would look like this:

First user message:

```json
[
    {
        "type": "userMessage",
        "content": "Create a train schedule reminder"
    },
    {
        "type": "readFile",
        "path": "rules.txt",
        "content": "Use the getTrainSchedule tool to get the train schedule"
    }
]
```

AI response:

```json
[
    {
        "type": "message",
        "content": "I'm going to create a train schedule reminder"
    },
    {
        "type": "createFile",
        "path": "code.ts",
        "content": "const trip = getTrainSchedule().filter(trip => trip.hour === 8)\ncreateNote(trip.toString())"
    },
    {
        "type": "shell",
        "command": "bun run code.ts"
    },
]
```

User response:

```json
[
    {
        "type": "createFile",
        "path": "code.ts",
        "success": true
    },
    {
        "type": "shell",
        "stdout": "Note created: 8am train schedule"
    }
]
```

Agent response:

```json
[
    {
        "type": "message",
        "content": "The train schedule reminder was created."
    }
]
```

## Tools and MCPs are great, too

Tools and MCPs have allowed me to build very capable applications. However, I hope the industry will acknowledge their limitations and develop new approaches to help the AI perform long-running tasks in a more efficient and reliable way. Code has always been the language of automation, could it become the new standard for AI agents?

## A plan for the future

I believe that an open-source framework for AI code execution, along with a standard for code execution agents, would be a step forward for the industry. However, it is not an easy project to build.

Looking forward, the next step is to define the protocol an AI agent would follow to perform its work via code execution. Next, I'll define the API for the code execution framework. Then, I'll start building the framework itself. It's so early that I don't even have a name for the framework, yet!

The requirements for the framework are:
- Open-source
- Self-hostable
- Ability to spin up code execution environments on the fly, and run code in a sandboxed environment
- Includes utilities to convert tools and MCPs into code execution operations.
- Accessible through a REST API or a TypeScript SDK
- AI agents can interact with it via traditional tool calling, or with the code execution protocol described above.
- Ability to limit the actions, commands, files and APIs accessible to the AI agent.
- Initially, focused on running code in a limited number of languages (starting with TypeScript on Bun)
- Simple and flexible API that developers will love.

