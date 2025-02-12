// /app/api/chat/route.ts
import { NextResponse } from "next/server";
import { ChatOpenAI } from "@langchain/openai";
import { BufferMemory } from "langchain/memory";
import { ConversationChain } from "langchain/chains";
import { SystemMessage } from "@langchain/core/messages";
import { ChatMessageHistory } from "@langchain/community/stores/message/in_memory";
import { PineconeStore } from "@langchain/pinecone";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Pinecone } from "@pinecone-database/pinecone";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { MessagesPlaceholder } from "@langchain/core/prompts";

const chatSessions = new Map<string, ChatMessageHistory>();

export async function POST(req: Request) {
  // Timestamp for tracking request processing time
  const requestStartTime = Date.now();

  console.log("------- NEW CHAT REQUEST -------");
  console.log(`Request Timestamp: ${new Date().toISOString()}`);

  try {
    // Log incoming request details
    console.log("Parsing form data...");
    const formData = await req.formData();

    console.log("Form Data:", formData);

    // Log form data details
    console.log("Form Data Received:", {
      messageLength: formData.get("message")?.toString().length || 0,
      sessionId: formData.get("sessionId"),
      namespace: formData.get("namespace"),
      filesCount: formData.getAll("files").length,
      systemPrompt: formData.get("system_prompt"),
    });

    const message = formData.get("message") as string;
    const sessionId = formData.get("sessionId") as string;
    const namespace = formData.get("namespace") as string | null;
    const files = formData.getAll("files") as File[];
    const systemPrompt = formData.get("system_prompt") as string | null;

    // Log all form data for debugging
    console.log("Form Data Entries:", Array.from(formData.entries()));

    // Additional detailed logging
    console.log("Raw systemPrompt from formData:", systemPrompt);
    console.log("Type of systemPrompt:", typeof systemPrompt);
    console.log(
      "Is systemPrompt null or empty?",
      systemPrompt === null || systemPrompt === ""
    );

    // Validate input
    if (!message && files.length === 0) {
      console.warn("Validation Error: No message or files provided");
      return NextResponse.json(
        { error: "No message or files provided" },
        { status: 400 }
      );
    }

    // Environment variable validation with detailed logging
    console.log("Checking environment configuration...");
    const envConfig = {
      PINECONE_API_KEY: !!process.env.PINECONE_API_KEY,
      PINECONE_INDEX_NAME: !!process.env.PINECONE_INDEX_NAME,
      OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
    };
    console.log("Environment Configuration:", envConfig);

    if (!process.env.PINECONE_API_KEY) {
      console.warn("Pinecone API key not configured. Skipping vector search.");
    }

    let contextualInfo = "";
    if (
      namespace &&
      process.env.PINECONE_API_KEY &&
      process.env.PINECONE_INDEX_NAME
    ) {
      try {
        console.log(`Initializing Pinecone client for namespace: ${namespace}`);
        // Initialize Pinecone client
        const pinecone = new Pinecone({
          apiKey: process.env.PINECONE_API_KEY,
        });

        const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME);
        const embeddings = new OpenAIEmbeddings();

        console.log("Creating vector store from existing index...");
        const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
          pineconeIndex,
          namespace,
        });

        console.log(`Performing vector search for query: "${message}"`);

        // Comprehensive Pinecone and vector store diagnostics
        console.log("Pinecone Configuration Diagnostics:", {
          apiKeyPresent: !!process.env.PINECONE_API_KEY,
          indexName: process.env.PINECONE_INDEX_NAME,
          namespace: namespace,
        });

        try {
          // Log detailed vector store information before search
          console.log("Vector Store Details:", {
            indexName: process.env.PINECONE_INDEX_NAME,
            namespace: namespace,
            embeddingsType: embeddings.constructor.name,
          });

          // Diagnostic check for embeddings
          try {
            const testEmbedding = await embeddings.embedQuery(message);
            console.log("Embedding Generation:", {
              embeddingLength: testEmbedding.length,
              firstFewValues: testEmbedding.slice(0, 5),
            });
          } catch (embeddingError) {
            console.error("Embedding Generation Failed:", {
              errorMessage:
                embeddingError instanceof Error
                  ? embeddingError.message
                  : "Unknown error",
            });
          }

          // Perform similarity search with enhanced diagnostics
          const searchResults = await vectorStore.similaritySearch(message, 3);
          const mappedResults = searchResults.map((result) => ({
            ...result,
            pageContent: result.metadata.content || "", // Map stored content back to pageContent
          }));
          // Add the contextualInfo assignment here
          contextualInfo =
            mappedResults.length > 0
              ? mappedResults
                  .map(
                    (result, index) =>
                      `Context Source ${index + 1}:\n${result.pageContent}\n`
                  )
                  .join("\n")
              : "No contextual information found.";

          // Detailed index information
          const indexInfo = await pineconeIndex.describeIndexStats();
          console.log("Pinecone Index Statistics:", {
            totalVectorCount: indexInfo.totalRecordCount,
            namespaces: Object.keys(indexInfo.namespaces || {}),
            dimensions: indexInfo.dimension,
          });

          // Log raw search results object with full details
          console.log(
            "Raw Search Results:",
            searchResults.map((result, index) => ({
              resultIndex: index + 1,
              pageContentType: typeof result.pageContent,
              pageContentLength: result.pageContent
                ? result.pageContent.length
                : 0,
              metadataKeys: result.metadata ? Object.keys(result.metadata) : [],
              metadataType: typeof result.metadata,
            }))
          );

          // Detailed logging of each result
          searchResults.forEach((result, index) => {
            console.log(`\n--- Detailed Result ${index + 1} ---`);
            console.log("Raw Result Object:", JSON.stringify(result, null, 2));

            // Extensive content and metadata checks
            console.log("Content Diagnostics:");
            console.log("- Content Type:", typeof result.pageContent);
            console.log(
              "- Content Length:",
              result.pageContent ? result.pageContent.length : "N/A"
            );
            console.log("- Content Value:", result.pageContent || "EMPTY");

            console.log("\nMetadata Diagnostics:");
            console.log("- Metadata Type:", typeof result.metadata);
            console.log(
              "- Metadata Keys:",
              result.metadata ? Object.keys(result.metadata) : "N/A"
            );
            console.log(
              "- Metadata Value:",
              result.metadata
                ? JSON.stringify(result.metadata, null, 2)
                : "EMPTY"
            );

            console.log("-------------------");
          });

          // Fallback content generation if results are empty
          // contextualInfo =
          //   searchResults.length > 0
          //     ? searchResults
          //         .map(
          //           (result, index) =>
          //             `Context Source ${index + 1}:\n${
          //               result.pageContent || "No content"
          //             }\n`
          //         )
          //         .join("\n")
          //     : "No contextual information found.";
        } catch (searchError) {
          // Ultra-comprehensive error logging
          console.error("Comprehensive Vector Search Error:", {
            errorType:
              searchError instanceof Error
                ? searchError.name
                : "Unknown Error Type",
            errorMessage:
              searchError instanceof Error
                ? searchError.message
                : "No error details",
            errorStack:
              searchError instanceof Error
                ? searchError.stack
                : "No stack trace",
            searchContext: {
              query: message,
              namespace: namespace,
              topK: 3,
              apiKeyPresent: !!process.env.PINECONE_API_KEY,
              indexName: process.env.PINECONE_INDEX_NAME,
            },
          });

          // Rethrow to maintain original error handling
          throw searchError;
        }
      } catch (vectorSearchError) {
        console.error("Detailed Vector Search Error:", {
          errorName:
            vectorSearchError instanceof Error
              ? vectorSearchError.name
              : "Unknown Error",
          errorMessage:
            vectorSearchError instanceof Error
              ? vectorSearchError.message
              : "No details",
          errorStack:
            vectorSearchError instanceof Error
              ? vectorSearchError.stack
              : "No stack trace",
        });

        return NextResponse.json(
          {
            error: "Failed to retrieve contextual information",
            details:
              vectorSearchError instanceof Error
                ? vectorSearchError.message
                : "Unknown error occurred",
          },
          { status: 500 }
        );
      }
    }

    // Session management logging
    console.log(`Managing chat session for ID: ${sessionId}`);
    if (!chatSessions.has(sessionId)) {
      console.log(`Creating new chat session for ID: ${sessionId}`);
      chatSessions.set(sessionId, new ChatMessageHistory());
    }
    const chatHistory = chatSessions.get(sessionId)!;

    const memory = new BufferMemory({
      chatHistory: chatHistory,
      returnMessages: true,
      memoryKey: "history",
    });

    // File processing logging
    console.log("Processing uploaded files...");
    let fileContents = "";
    if (files && files.length > 0) {
      console.log(`Number of files to process: ${files.length}`);
      for (const file of files) {
        const buffer = await file.arrayBuffer();
        const text = new TextDecoder().decode(buffer);
        console.log(
          `Processed file: ${file.name}, Size: ${buffer.byteLength} bytes`
        );
        fileContents += `Content from ${file.name}:\n${text}\n\n`;
      }
    }

    // Construct the full message with contextual information
    const fullMessage = contextualInfo
      ? `Context:\n${contextualInfo}\n\nUser Question: ${message}\n\n${fileContents}\n\nPlease analyze the above content and respond to the user's question.`
      : fileContents
      ? `User Question: ${message}\n\n${fileContents}\n\nPlease analyze the above content and respond to the user's question.`
      : message;

    // Initialize chat model with streaming and system message
    const model = new ChatOpenAI({
      modelName: "gpt-4",
      streaming: true,
      temperature: 0.7,
    });

    // Prepare system message
    const defaultSystemMessage = "You are a helpful assistant.";
    console.log("System Prompt:", systemPrompt);
    const systemMessageContent = systemPrompt || defaultSystemMessage;
    const systemMessage = new SystemMessage(systemMessageContent);

    // Log the system message for debugging
    console.log("Final System Message:", systemMessageContent);

    // Create conversation chain with system message
    const chain = new ConversationChain({
      llm: model,
      memory: memory,
      prompt: ChatPromptTemplate.fromMessages([
        systemMessage,
        new MessagesPlaceholder("history"),
        ["human", "{input}"],
      ]),
    });

    // Create readable stream for response
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    const encoder = new TextEncoder();

    // Process the conversation
    chain.call(
      {
        input: fullMessage,
      },
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

    // Request processing time logging
    const requestProcessingTime = Date.now() - requestStartTime;
    console.log(`Request Processing Time: ${requestProcessingTime}ms`);
    console.log("------- END OF CHAT REQUEST -------");

    return new Response(stream.readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Unhandled Error in Chat API Route:", {
      errorName: error instanceof Error ? error.name : "Unknown Error",
      errorMessage: error instanceof Error ? error.message : "No details",
      errorStack: error instanceof Error ? error.stack : "No stack trace",
    });

    return NextResponse.json(
      {
        error: "An unexpected error occurred",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
