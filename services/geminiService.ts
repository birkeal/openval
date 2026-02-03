
import { GoogleGenAI } from "@google/genai";
import { Round } from "../types";

export const analyzeCapTable = async (rounds: Round[], currencySymbol: string = '$'): Promise<string> => {
  // Safe access to process.env to prevent crashes in environments where process is not defined
  const apiKey = typeof process !== 'undefined' ? process.env.API_KEY : undefined;
  
  if (!apiKey) {
    return "AI Analysis is unavailable: API Key not found in environment.";
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const historyText = rounds.map(r => 
    `- ${r.name}: Valuation ${currencySymbol}${r.postMoneyValuation.toLocaleString()}, User Ownership ${r.userOwnershipPercentage.toFixed(2)}%, Value ${currencySymbol}${r.userValue.toLocaleString()}`
  ).join('\n');

  const prompt = `
    Analyze the following investment history for a startup. All values are in ${currencySymbol === '$' ? 'USD' : 'EUR'}.
    
    Investment Rounds:
    ${historyText}
    
    Provide a professional, concise summary of the dilution impact and the increase in stake value. 
    Explain if the user is in a healthy position or if dilution is aggressive relative to value growth. 
    Use a friendly but expert tone. Keep it under 150 words.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Could not generate analysis.";
  } catch (error) {
    console.error("AI Analysis Error:", error);
    return "The AI is currently unavailable to analyze your cap table.";
  }
};
