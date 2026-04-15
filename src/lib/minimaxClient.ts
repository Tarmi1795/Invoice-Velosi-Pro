interface MiniMaxMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface MiniMaxRequest {
  model: string;
  messages: MiniMaxMessage[];
  temperature?: number;
}

export async function callMiniMax(prompt: string, systemPrompt?: string): Promise<string> {
  const baseUrl = process.env.BASE_URL || "https://api.minimax.io/v1";
  const apiKey = process.env.MINIMAX_API_KEY;

  if (!apiKey) {
    throw new Error("MINIMAX_API_KEY not configured in .env");
  }

  const messages: MiniMaxMessage[] = [];
  
  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }
  
  messages.push({ role: "user", content: prompt });

  const request: MiniMaxRequest = {
    model: "MiniMax-M2.7",
    messages,
    temperature: 0.3,
  };

  console.log("[MiniMax] Sending request to", `${baseUrl}/chat/completions`);
  console.log("[MiniMax] Model:", request.model);
  console.log("[MiniMax] Prompt length:", prompt.length, "chars");
  console.log("[MiniMax] System prompt length:", systemPrompt?.length || 0, "chars");

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    console.log("[MiniMax] Response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[MiniMax] Error response:", errorText);
      throw new Error(`MiniMax API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("[MiniMax] Response data keys:", Object.keys(data));
    
    if (data.choices && data.choices[0] && data.choices[0].message) {
      const content = data.choices[0].message.content;
      console.log("[MiniMax] Response content length:", content?.length);
      return content;
    }

    throw new Error("Invalid response structure from MiniMax API");
  } catch (error) {
    console.error("[MiniMax] API call failed:", error);
    throw error;
  }
}

export function extractJSONFromResponse(response: string): any {
  try {
    let cleaned = response;
    
    const thinkMatch = response.match(/<\/think>\s*([\s\S]*)$/);
    if (thinkMatch) {
      cleaned = thinkMatch[1].trim();
    }
    
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      return JSON.parse(arrayMatch[0]);
    }
    
    return null;
  } catch {
    return null;
  }
}