# An alternative to tool calling and MCP

## Summary

AI models can achieve complex tasks by writing code that performs these tasks. This approach is significantly more efficient and reliable than interacting with tools and MCP servers. 

Moreover, Tools and MCPs can be transformed into code APIs, so any AI agent with tools can be re-written as a code agent that achieves the same tasks cheaper and faster.

Despite its advantages, code execution needs an environment where code runs safely.

## Two standards

AI agents are composable. Developers need a simple standard to give capabilities to their AI. Two approaches have emerged:

### Tool calling

The developer defines a set of available operations called tools. The AI can include one or m˝ore of these operations in its response, this process is called "tool calling". After being generated, tool calls are executed.

### MCP

An MCP server allows the AI to connect to an external API. Each MCP server exposes a set of tools the AI can call to interact with the API.

## Problems with Tool calling and MCP

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

MCP is a great initiative that speaks to an real need in AI engineering: AI needs to access external APIs to do their work.

However, in implementation