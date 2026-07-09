import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const getGeminiResponse = async (prompt: string, history: { role: 'user' | 'model', parts: { text: string }[] }[]) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: history.concat([{ role: 'user', parts: [{ text: prompt }] }]),
    config: {
      systemInstruction: "You are an expert email marketing assistant. Help the user draft, optimize, and strategize their email campaigns. Keep responses professional, concise, and focused on high conversion rates.",
    },
  });
  return response.text;
};

export const draftEmail = async (topic: string, audience: string, tone: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Draft a professional email about ${topic} for an audience of ${audience}. The tone should be ${tone}. Include a subject line.`,
  });
  return response.text;
};

export const generateLeadMagnet = async (business: string, targetAudience: string, offerType: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Generate a high-converting landing page copy and a lead magnet outline for a ${business} business targeting ${targetAudience}. The offer type is ${offerType}. Include a catchy headline, subheadline, 3-5 benefit bullet points, and a strong call-to-action.`,
  });
  return response.text;
};

export const extractEmails = async (source: string, isUrl: boolean, isDeepScan: boolean = false) => {
  const prompt = isUrl 
    ? `Analyze the public content of this URL: ${source}. 
       1. Extract all email addresses found.
       2. For each email, identify the likely department or role (e.g., Support, Sales, Personal).
       3. Identify the domain's primary business type.
       ${isDeepScan ? "4. Perform a DEEP SCAN: Identify executive names and titles if linked to emails. Find social media profile handles if visible. Note any regional indicators for each address." : ""}
       Return the results in a clean, professional markdown format with a table for the emails.`
    : `Analyze the following text: \n\n${source}\n\n
       1. Extract all email addresses found.
       2. For each email, identify the likely department or role.
       ${isDeepScan ? "3. Perform a DEEP SCAN: Look for hidden patterns, role associations, and potential secondary contacts. Analyze the context surrounding each address." : ""}
       Return the results in a clean, professional markdown format with a table for the emails.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      tools: isUrl ? [{ urlContext: {} }] : [],
      toolConfig: { includeServerSideToolInvocations: true },
    },
  });
  return response.text;
};

export const extractMobileNumbers = async (source: string, isUrl: boolean, isDeepScan: boolean = false) => {
  const prompt = isUrl 
    ? `Analyze the public content of this URL: ${source}. 
       1. Extract all mobile/phone numbers found.
       2. For each number, identify the likely region or country based on the prefix.
       3. Identify the context of the number (e.g., Office, Support, WhatsApp, Personal).
       ${isDeepScan ? "4. Perform a DEEP SCAN: Identify network carrier signatures from HTML metadata and list associated business names for each contact number." : ""}
       Return the results in a clean, professional markdown format with a table for the numbers.`
    : `Analyze the following text: \n\n${source}\n\n
       1. Extract all mobile/phone numbers found.
       2. For each number, identify the likely region or country.
       3. Identify the context of the number.
       ${isDeepScan ? "4. Perform a DEEP SCAN: Cross-reference regional indices to pinpoint specific carrier origins and potential user roles." : ""}
       Return the results in a clean, professional markdown format with a table for the numbers.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      tools: isUrl ? [{ urlContext: {} }] : [],
      toolConfig: { includeServerSideToolInvocations: true },
    },
  });
  return response.text;
};

export const verifyDeliverability = async (email: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Perform a simulated deliverability check for the email: ${email}. 
               Analyze the domain for common mail server configurations (SPF, DKIM, DMARC) and provide a "Deliverability Score" out of 100. 
               List potential risks (e.g., "Generic provider", "Likely spam trap", "High reputation domain").`,
  });
  return response.text;
};

export const generateVideoAd = async (prompt: string, onProgress?: (status: string) => void) => {
  // Create a fresh instance to use the latest API key (as per Veo guidelines)
  const videoAi = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY });
  
  onProgress?.("Initializing video generation...");
  
  let operation = await videoAi.models.generateVideos({
    model: 'veo-3.1-lite-generate-preview',
    prompt: prompt,
    config: {
      numberOfVideos: 1,
      resolution: '1080p',
      aspectRatio: '16:9'
    }
  });

  while (!operation.done) {
    onProgress?.("Processing video frames... (this may take a few minutes)");
    await new Promise(resolve => setTimeout(resolve, 10000));
    operation = await videoAi.operations.getVideosOperation({ operation: operation });
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!downloadLink) throw new Error("Video generation failed: No download link found.");

  // Fetch the video with the API key header
  const response = await fetch(downloadLink, {
    method: 'GET',
    headers: {
      'x-goog-api-key': process.env.API_KEY || process.env.GEMINI_API_KEY || '',
    },
  });

  if (!response.ok) throw new Error(`Failed to fetch video: ${response.statusText}`);
  
  const blob = await response.blob();
  return URL.createObjectURL(blob);
};

export const analyzeLeads = async (emails: string[]) => {
  const prompt = `Analyze this list of ${emails.length} email addresses:
  ${emails.slice(0, 100).join(', ')} ... (and ${emails.length - 100} more)
  
  Provide a sophisticated breakdown:
  1. Market Penetration: Which domains dominate?
  2. Professional Tier: Estimate the ratio of support/general vs personal vs high-value corporate emails.
  3. Strategic Recommendations: How should a marketer approach this specific audience?
  4. Potential Risks: Identify generic, high-bounce, or spam-trap patterns.
  
  Return the results in a structured markdown format.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  });
  return response.text;
};

export const identifyIdealLeads = async (leads: any[], idealPersona: string) => {
  const sample = leads.slice(0, 50).map(l => l.email).join(', ');
  const prompt = `You are an elite lead scout. Given the following "Ideal Lead Persona": "${idealPersona}"
  And the following sample of extracted leads: [${sample}]
  
  Identify the characteristics of leads that would be a "Gold Match". 
  Explain why specific domain patterns or sender patterns in the full list of ${leads.length} might match this persona.
  Provide a "Scouting Score" criteria (1-10) for the user to filter their list.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  });
  return response.text;
};

export const despamMessage = async (message: string) => {
  const prompt = `Rephrase the following message to make it sound professional, engaging, and specifically to AVOID being flagged by email spam filters. 
  Avoid common spam triggers like excessive urgency, "FREE", "WINNER", or suspicious financial claims. 
  Keep the core intent but make it deliverable.
  
  Message: "${message}"
  
  Return ONLY the rephrased message text.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  });
  return response.text;
};

export type ExtractionTask = 'pdf' | 'account' | 'phone' | 'address';

export const performTaskExtraction = async (url: string, task: ExtractionTask, sortMode: 'domain' | 'alpha' = 'domain') => {
  let prompt = '';
  const sortInstruction = sortMode === 'alpha' ? 'Sort the results alphabetically by the main identifier.' : 'Group and sort the results by domain/source.';
  
  switch (task) {
    case 'pdf':
      prompt = `Analyze the content and source of this URL: ${url}. 
                1. Identify all PDF files linked on this page.
                2. Provide the direct download links if possible.
                3. Briefly describe the content of each PDF based on its title or context.
                ${sortInstruction}
                Return the results in a clean markdown table with columns: File Name, Description, Link.`;
      break;
    case 'account':
      prompt = `Analyze the content of this URL: ${url}. 
                1. Extract all account-related details found (usernames, handles, role identifiers, support IDs, login contact info).
                2. Categorize them by platform or service mentioned.
                ${sortInstruction}
                Return the results in a professional markdown format.`;
      break;
    case 'phone':
      prompt = `Scrape this URL: ${url} for all phone numbers.
                1. Identify country/region for each number.
                2. Note the context (Sales, Support, personal, etc.).
                ${sortInstruction}
                Return the results in a markdown table.`;
      break;
    case 'address':
      prompt = `Extract all physical or corporate addresses found at this URL: ${url}. 
                1. Identify city, state/province, and country.
                2. Identify the type of location (Headquarters, branch, etc.).
                ${sortInstruction}
                Return the results in a markdown table.`;
      break;
  }

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      tools: [{ urlContext: {} }],
      toolConfig: { includeServerSideToolInvocations: true },
    },
  });
  return response.text;
};
