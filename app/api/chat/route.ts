// /app/api/chat/route.ts
import { NextResponse } from "next/server";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { BufferMemory } from "langchain/memory";
import { ConversationChain } from "langchain/chains";
import { ChatMessageHistory } from "@langchain/community/stores/message/in_memory";

const chatSessions = new Map<string, ChatMessageHistory>();

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const message = formData.get("message") as string;
    const sessionId = formData.get("sessionId") as string;
    const files = formData.getAll("files") as File[];

    if (!message && files.length === 0) {
      return NextResponse.json(
        { error: "No message or files provided" },
        { status: 400 }
      );
    }

    if (!chatSessions.has(sessionId)) {
      chatSessions.set(sessionId, new ChatMessageHistory());
    }
    const chatHistory = chatSessions.get(sessionId)!;

    const memory = new BufferMemory({
      chatHistory: chatHistory,
      returnMessages: true,
      memoryKey: "history",
    });

    // Process files if any
    let fileContents = "";
    if (files && files.length > 0) {
      for (const file of files) {
        const buffer = await file.arrayBuffer();
        const text = new TextDecoder().decode(buffer);
        fileContents += `Content from ${file.name}:\n${text}\n\n`;
      }
    }

    // Construct the full message
    const fullMessage = fileContents
      ? `User Question: ${message}\n\n${fileContents}\n\nPlease analyze the above content and respond to the user's question.`
      : message;

    // Initialize chat model with streaming
    const model = new ChatOpenAI({
      modelName: "gpt-4",
      streaming: true,
      temperature: 0.7,
    });

    // Create conversation chain
    const chain = new ConversationChain({
      llm: model,
      memory: memory,
    });

    // Create readable stream for response
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    const encoder = new TextEncoder();

    // Process the conversation
    chain.call(
      { input: fullMessage },
      {
        callbacks: [
          {
            async handleLLMNewToken(token: string) {
              await writer.write(
                encoder.encode(
                  `data: ${JSON.stringify({ content: token })}\n\n`
                )
              );
            },
            async handleLLMEnd() {
              await writer.write(
                encoder.encode(
                  `data: ${JSON.stringify({ content: "[DONE]" })}\n\n`
                )
              );
              await writer.close();
            },
            async handleLLMError(error: Error) {
              console.error("LLM error:", error);
              await writer.abort(error);
            },
          },
        ],
      }
    );

    return new Response(stream.readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error in chat route:", error);
    return NextResponse.json(
      { error: "An error occurred while processing your request" },
      { status: 500 }
    );
  }
}
