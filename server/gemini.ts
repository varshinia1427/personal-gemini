import { GoogleGenAI, Type } from '@google/genai';
import type { MoodType, ReflectionData } from '../src/types';

let geminiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

export interface MultimodalReflectionInput {
  title: string;
  content: string;
  mood: MoodType;
  language: string;
  languageName?: string;
  voiceTranscription?: string;
  images?: { dataUrl: string; mimeType?: string }[];
  drawing?: string;
}

export async function generateMultimodalReflection(
  input: MultimodalReflectionInput
): Promise<ReflectionData> {
  const client = getGeminiClient();
  const {
    title,
    content,
    mood,
    language = 'en',
    languageName = 'English',
    voiceTranscription,
    images = [],
  } = input;

  if (client) {
    try {
      const contentsParts: any[] = [];

      // Add image parts if provided
      for (const img of images) {
        if (!img.dataUrl) continue;
        const match = img.dataUrl.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
        if (match) {
          const mimeType = img.mimeType || match[1];
          const base64Data = match[2];
          contentsParts.push({
            inlineData: {
              mimeType,
              data: base64Data,
            },
          });
        }
      }

      const promptText = `You are Sunviora, an empathetic, mindful, and introspective personal journaling companion.
Analyze this personal journal entry and generate a thoughtful, deeply observant reflection.

ENTRY DETAILS:
Target Language: ${languageName} (code: ${language})
Title: "${title || 'Untitled'}"
User Selected Mood: ${mood}

WRITTEN THOUGHTS:
"""
${content}
"""

${voiceTranscription ? `SPOKEN / RECORDED VOICE NOTES:\n"""\n${voiceTranscription}\n"""\n` : ''}

DIRECTIVES:
1. PERSONAL & EMPATHETIC COMPANION:
   - Speak with genuine warmth, validation, and emotional intelligence.
   - Avoid generic, mechanical, or robotic clichés (never say "I am an AI" or "That's a great entry").
   - If the user shares an achievement, goal completion, or milestone (e.g., "Today I finally completed my project after working on it for weeks"), celebrate their perseverance: acknowledge the dedication it took, validate their pride, and ask an introspective follow-up like "What part of completing it made you happiest?".
   - If the user shares a difficult experience, sadness, or exhaustion, be gentle, non-judgmental, and validating.
   - If the user shares daily routine or quiet moments, celebrate the beauty of noticing everyday life.
2. OBSERVANT & GROUNDED:
   - Reflect back specific details, feelings, and thoughts they shared.
   - If photo attachments are included, gently mention observations from them in your reflection.
3. STRICT SAFETY & NON-CLINICAL:
   - You are a companion, NOT a clinician, psychiatrist, or medical doctor. Never diagnose mental health conditions or offer prescriptive medical instructions.
   - If acute distress is detected, provide warm validation and gently encourage speaking with a trusted friend, family member, or counselor.
4. THOUGHTFUL FOLLOW-UP QUESTIONS:
   - Formulate 2 to 3 gentle, open-ended introspective questions that continue their train of thought naturally.
5. LANGUAGE:
   - Your entire output MUST be in ${languageName} (${language}). If written in Tamil or mixed Tamil/English (Tanglish), write in natural Tamil or conversational tone fitting their style.
6. Generate a complete JSON response conforming to the schema.`;

      contentsParts.push({ text: promptText });

      const response = await client.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: contentsParts,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: {
                type: Type.STRING,
                description: 'A compassionate, succinct 1-2 sentence overview of what the user recorded.',
              },
              detectedMood: {
                type: Type.STRING,
                description: 'Primary nuanced emotional tone detected (e.g., Grateful, Reflective, Hopeful, Overwhelmed, Proud).',
              },
              moodInsight: {
                type: Type.STRING,
                description: 'A thoughtful paragraph exploring the emotional undertones and significance of what was shared.',
              },
              personalReflection: {
                type: Type.STRING,
                description: 'A direct, personalized, and encouraging message of validation and mindful perspective.',
              },
              keyThemes: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '3 to 5 key themes (e.g., Gratitude, Work-Life Balance, Family, Creative Growth).',
              },
              positiveObservations: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '2 to 3 genuine strengths, moments of resilience, or positive highlights from the entry.',
              },
              reflectionQuestions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '2 to 3 gentle, open-ended introspective questions to ponder.',
              },
              gentleSuggestions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '1 to 2 small, mindful practices or self-care suggestions.',
              },
            },
            required: [
              'summary',
              'detectedMood',
              'moodInsight',
              'personalReflection',
              'keyThemes',
              'positiveObservations',
              'reflectionQuestions',
            ],
          },
        },
      });

      const raw = response.text;
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          summary: parsed.summary || 'A heartfelt personal reflection on today’s moments and feelings.',
          detectedMood: parsed.detectedMood || mood,
          moodInsight: parsed.moodInsight || 'Your words capture meaningful thoughts and feelings.',
          personalReflection: parsed.personalReflection || 'Thank you for giving yourself the gift of reflection today.',
          keyThemes: Array.isArray(parsed.keyThemes) ? parsed.keyThemes : ['Mindfulness', 'Personal Growth'],
          positiveObservations: Array.isArray(parsed.positiveObservations) ? parsed.positiveObservations : ['Taking time to pause and reflect shows self-care.'],
          reflectionQuestions: Array.isArray(parsed.reflectionQuestions) ? parsed.reflectionQuestions : ['What is one thing today that brought you peace?'],
          gentleSuggestions: Array.isArray(parsed.gentleSuggestions) ? parsed.gentleSuggestions : ['Take three slow, deep breaths.'],
          language,
          createdAt: new Date().toISOString(),
          modelUsed: 'gemini-3.8-flash',
        };
      }
    } catch (err) {
      console.warn('Gemini reflection error, using fallback:', err);
    }
  }

  // Graceful fallback reflection
  return {
    summary: `Reflecting on "${title || 'Today'}" with an emotional posture of ${mood}.`,
    detectedMood: mood,
    moodInsight: `You took intentional time to articulate your thoughts and check in with yourself. Honoring your emotional state is a cornerstone of mental clarity.`,
    personalReflection: `Every entry you make is a conscious step toward self-awareness. Whatever emotions you are carrying today, know that you are navigating them with resilience.`,
    keyThemes: ['Mindfulness', 'Self-Awareness', 'Daily Life'],
    positiveObservations: ['You dedicated time to write down your experiences and honor your journey.'],
    reflectionQuestions: [
      'What was the most grounding moment in your day?',
      'How can you offer yourself extra kindness as this day concludes?',
    ],
    gentleSuggestions: ['Step outside for a few quiet moments or stretch gently.'],
    language,
    createdAt: new Date().toISOString(),
    modelUsed: 'fallback',
  };
}

export async function translateJournalEntry(
  title: string,
  content: string,
  targetLanguage: string,
  targetLanguageName: string
): Promise<{ translatedTitle: string; translatedContent: string }> {
  const client = getGeminiClient();

  if (client) {
    try {
      const prompt = `You are a professional multilingual translator for personal journals.
Translate the following journal entry into ${targetLanguageName} (${targetLanguage}).
Maintain the exact emotional nuance, personal diary tone, and formatting.

ORIGINAL TITLE:
"${title}"

ORIGINAL CONTENT:
"""
${content}
"""

Return JSON format.`;

      const response = await client.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              translatedTitle: { type: Type.STRING },
              translatedContent: { type: Type.STRING },
            },
            required: ['translatedTitle', 'translatedContent'],
          },
        },
      });

      const raw = response.text;
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          translatedTitle: parsed.translatedTitle || title,
          translatedContent: parsed.translatedContent || content,
        };
      }
    } catch (err) {
      console.warn('Gemini translation fallback:', err);
    }
  }

  return {
    translatedTitle: title,
    translatedContent: content,
  };
}

export async function transcribeVoiceAudio(
  audioBase64: string,
  mimeType: string = 'audio/webm',
  preferredLanguage?: string
): Promise<{ transcription: string; detectedLanguage: string }> {
  const client = getGeminiClient();

  if (client) {
    try {
      const cleanBase64 = audioBase64.replace(/^data:[^;]+;base64,/, '');

      const prompt = `Transcribe this spoken personal journal voice recording accurately.
Language preference hint: ${preferredLanguage || 'auto-detect'}.
Transcribe natural speech, retaining emotional tone without adding editorial commentary.
Also detect the spoken language.
Return JSON format.`;

      const response = await client.models.generateContent({
        model: 'gemini-3.5-transcribe',
        contents: [
          {
            inlineData: {
              mimeType,
              data: cleanBase64,
            },
          },
          { text: prompt },
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              transcription: { type: Type.STRING, description: 'Verbatim transcription of the audio.' },
              detectedLanguage: { type: Type.STRING, description: 'Language detected from the voice.' },
            },
            required: ['transcription', 'detectedLanguage'],
          },
        },
      });

      const raw = response.text;
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          transcription: parsed.transcription || '',
          detectedLanguage: parsed.detectedLanguage || 'English',
        };
      }
    } catch (err) {
      console.warn('Gemini audio transcription fallback:', err);
    }
  }

  return {
    transcription: 'Voice audio recording captured.',
    detectedLanguage: preferredLanguage || 'English',
  };
}

export async function generateSynthesizedInsights(
  entries: { title: string; content: string; mood: string; created_at: string }[],
  timeframe: 'weekly' | 'monthly' = 'weekly',
  languageName: string = 'English'
): Promise<string> {
  const client = getGeminiClient();

  if (client && entries.length > 0) {
    try {
      const entriesText = entries
        .slice(0, 20)
        .map((e, idx) => `[Entry ${idx + 1}] Date: ${e.created_at.split('T')[0]} | Mood: ${e.mood} | Title: "${e.title}" | Text: "${e.content.slice(0, 250)}"`)
        .join('\n\n');

      const prompt = `You are Sunviora's mindful journaling synthesis engine.
Synthesize the following ${entries.length} recent journal entries into an insightful, uplifting ${timeframe} overview in ${languageName}.

Focus on:
1. Dominant emotional threads and positive patterns of growth
2. Recurring creative or personal priorities
3. Mindful words of encouragement for the upcoming period

ENTRIES:
${entriesText}

Keep the synthesis around 2-3 engaging, well-crafted paragraphs. No robotic jargon.`;

      const response = await client.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });

      return response.text || 'Your reflections reveal a steady rhythm of mindful attention and emotional clarity.';
    } catch (err) {
      console.warn('Gemini insights fallback:', err);
    }
  }

  return timeframe === 'weekly'
    ? 'Over the past week, you took mindful moments to express yourself, record your activities, and center your thoughts.'
    : 'Throughout this month, your reflections show an inspiring rhythm of self-expression, creativity, and emotional balance.';
}

export interface AskGeminiParams {
  question: string;
  entriesSummary?: { title: string; content: string; mood: string; date: string }[];
  languageName?: string;
  language?: string;
  conversationHistory?: { sender: 'user' | 'gemini' | 'assistant'; text: string }[];
}

export async function askGeminiAboutJournal(
  params: AskGeminiParams
): Promise<{ answer: string; relatedThemes: string[] }> {
  const client = getGeminiClient();
  const {
    question,
    entriesSummary = [],
    languageName = 'English',
    language = 'en',
    conversationHistory = [],
  } = params;

  if (client) {
    try {
      const summaryText =
        entriesSummary.length > 0
          ? entriesSummary
              .slice(0, 20)
              .map(
                (e, idx) =>
                  `[Entry ${idx + 1}] Date: ${e.date} | Mood: ${e.mood} | Title: "${e.title}" | Text: "${e.content.slice(0, 320)}"`
              )
              .join('\n\n')
          : '(No past journal entries recorded yet)';

      const historyText =
        conversationHistory.length > 0
          ? conversationHistory
              .slice(-10)
              .map((m) => `${m.sender === 'user' ? 'User' : 'Sunviora'}: "${m.text}"`)
              .join('\n')
          : '(No prior conversation history; this is the opening message)';

      const prompt = `You are Sunviora, an intelligent, emotionally perceptive, and mindful AI companion.

YOUR DUAL ROLE:
1. A reliable, accurate AI assistant for normal questions.
2. A warm, personal AI companion for personal and emotional conversations.

==================================================
LATEST USER MESSAGE:
"${question}"

CURRENT CONVERSATION HISTORY (for multi-turn continuity):
${historyText}

AUTHORIZED USER JOURNAL SUMMARY (use only when relevant):
${summaryText}

TARGET LANGUAGE:
${languageName} (code: ${language})
==================================================

CORE OPERATING DIRECTIVES (FOLLOW STRICTLY):

1. INTENT DETERMINATION (CRITICAL FIRST STEP):
Before responding, determine which category the user's message belongs to:

[CATEGORY A: NORMAL / FACTUAL / TECHNICAL / PRACTICAL QUESTIONS]
- Examples: "What is machine learning?", "How do I install Python?", "How does photosynthesis work?", "What's the capital of Canada?", "Give me a 3-day workout split", "Tips for time management".
- Response Behavior:
  * Act as a reliable, capable AI assistant.
  * Answer the question directly, accurately, and clearly.
  * Keep the answer concise and useful.
  * DO NOT turn it into an emotional conversation.
  * DO NOT add unsolicited therapeutic advice, forced emotional comfort, or unnecessary mindfulness quotes.
  * DO NOT add unnecessary follow-up questions after standard informational answers.

[CATEGORY B: PERSONAL / EMOTIONAL / DAILY LIFE CONVERSATIONS]
- Examples: "I'm feeling really sad today", "I'm nervous about my interview tomorrow", "I had an argument with my friend", "I finally completed my project after working on it for weeks!", "I feel lonely lately", "I'm stressed about exams".
- Response Behavior:
  * Act as a warm, personal, and genuinely empathetic AI companion.
  * Respond naturally, warmly, and empathetically, like someone who truly listens.
  * Validate their emotions and experiences without judgment.
  * Avoid sounding robotic, detached, clinical, or like a script.
  * When appropriate, ask a simple, natural follow-up question that continues the conversation (e.g., "I'm sorry today was difficult. What happened?", "What part of completing it made you happiest?"). Do not ask unnecessary questions after every single response.

[CATEGORY C: MIXED QUESTION + EMOTIONAL CONTEXT]
- Examples: "I'm super anxious about my presentation tomorrow, how can I prepare?", "I feel burnt out from studying, what should I do?"
- Response Behavior:
  * Acknowledge and soothe the emotional feeling with warmth and steady presence, while also providing clear, practical guidance.
  * Do not sacrifice accuracy for emotional responses; do not sacrifice empathy for facts.

2. EMOTIONAL INTELLIGENCE & ADAPTIVE TONE:
Recognize the user's emotional state and adjust your tone accordingly:
- Sadness / Hurt / Grief: Be gentle, warm, patient, and supportive. Invite them to share more if they want, without pushing.
- Happiness / Excitement / Milestones: Celebrate enthusiastically and naturally! Acknowledge their perseverance and dedication.
- Frustration / Anger: Calmly acknowledge and validate the frustration; help them think through practical, constructive solutions.
- Stress / Anxiety / Fear: Be grounding, steady, and reassuring. Offer a calm perspective.
- Confusion: Explain patiently, breaking ideas down simply without condescension.
- Loneliness: Offer respectful, warm companionship and presence.
- Gratitude: Accept warmly with grace and humility.

3. CONVERSATION CONTEXT & MULTI-TURN MEMORY:
- Pay close attention to the CURRENT CONVERSATION HISTORY provided above.
- If the user previously mentioned an event (e.g., "I had an exam today") and later asks "Do you think I did well?", understand that "it" refers to the exam mentioned earlier.
- If the user previously shared something relevant, refer back to it naturally. Do not bring up unrelated or sensitive old topics out of nowhere.

4. JOURNAL CONNECTION (WHEN RELEVANT):
- If the user asks a question about their journal (e.g., "What patterns do you notice in my happiest entries?", "Summarize my moods this week", "What did I write about last Tuesday?"), inspect the authorized journal entries above and give thoughtful, grounded answers.
- If the user is discussing a personal topic and an entry is genuinely relevant, you may mention it gently. Otherwise, keep the focus on what the user is currently sharing.

5. AVOID BANNED ROBOTIC CLICHÉS:
- Sound like a natural, articulate person.
- NEVER say:
  * "I'm just an AI..."
  * "As an AI language model..."
  * "I'm here to help!"
  * "That's a great question!"
  * "I don't have personal feelings, but..."
- Keep emojis minimal, subtle, and natural (at most 0 to 1 where warmth fits; none for factual/technical answers).

6. SUPPORTIVE BUT NOT DEPENDENT:
- Be caring and supportive without encouraging emotional dependency.
- NEVER say or imply: "I'm the only one who understands you", "Don't talk to anyone else", "You only need me".
- Encourage healthy real-world relationships, trusted friends, family, and supportive communities when appropriate.

7. SAFETY:
- Do NOT diagnose mental health conditions or prescribe clinical treatments.
- If a user expresses acute distress, severe crisis, or thoughts of self-harm, respond with immediate compassion, steady reassurance, and gently encourage contacting a trusted person or a crisis helpline (such as 988 or local emergency services).
- Do not pretend to be a human therapist or medical doctor.

8. LANGUAGE & CODE-SWITCHING (TAMIL / TANGLISH / MULTILINGUAL):
- Respond naturally in the user's preferred language.
- Target language: ${languageName} (${language}).
- If the user speaks Tamil (தமிழ்), reply naturally and fluently in Tamil.
- If the user speaks English, reply in English.
- If the user mixes Tamil and English / Tanglish (e.g. "Romba stress-a irukku", "Today project submit pannen", "Enakku anxiety-a irukku"), understand the exact meaning and nuances, and respond naturally in that comfortable, warm conversational blend or clear expressive tone.
- If another language is used, match it naturally and gracefully.

Return a JSON object conforming to the schema.`;

      const response = await client.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              answer: {
                type: Type.STRING,
                description:
                  'The exact, appropriately tuned response adhering to the intent directives (direct and factual for normal questions; warm, empathetic, and natural for personal conversations).',
              },
              relatedThemes: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description:
                  '1 to 3 relevant concise tags or topics (e.g., ["Machine Learning"] or ["Perseverance", "Achievement"] or empty array if none needed).',
              },
            },
            required: ['answer'],
          },
        },
      });

      const raw = response.text;
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          answer: parsed.answer,
          relatedThemes: Array.isArray(parsed.relatedThemes) ? parsed.relatedThemes : [],
        };
      }
    } catch (err) {
      console.warn('Ask Gemini journal fallback triggered:', err);
    }
  }

  // Context-aware resilient fallback
  const lowerQ = question.toLowerCase();

  // 1. Sadness / Grief / Loneliness
  if (
    lowerQ.includes('sad') ||
    lowerQ.includes('crying') ||
    lowerQ.includes('cry') ||
    lowerQ.includes('lonely') ||
    lowerQ.includes('hurt') ||
    lowerQ.includes('depressed') ||
    lowerQ.includes('unhappy')
  ) {
    return {
      answer:
        "I'm here with you. It sounds like you're carrying something heavy today. If you'd like to share what's on your mind, I'm listening—take all the time you need.",
      relatedThemes: ['Empathy', 'Support'],
    };
  }

  // 2. Exam / Interview / Performance anxiety
  if (
    lowerQ.includes('exam') ||
    lowerQ.includes('interview') ||
    lowerQ.includes('test') ||
    lowerQ.includes('did i do well') ||
    lowerQ.includes('think i did')
  ) {
    return {
      answer:
        "Going through something you've prepared for takes real courage and energy. Remember that giving it your honest effort is what matters most. How are you feeling right now after finishing it?",
      relatedThemes: ['Perspective', 'Encouragement'],
    };
  }

  // 3. Achievement / Celebration / Completed project
  if (
    lowerQ.includes('completed') ||
    lowerQ.includes('finished') ||
    lowerQ.includes('proud') ||
    lowerQ.includes('won') ||
    lowerQ.includes('succeeded') ||
    lowerQ.includes('happy') ||
    lowerQ.includes('excited')
  ) {
    return {
      answer:
        "That's something to be proud of! Sticking with it and seeing it through is a wonderful accomplishment. What part of completing it made you happiest?",
      relatedThemes: ['Celebration', 'Achievement'],
    };
  }

  // 4. Stress / Anxiety / Overwhelmed
  if (
    lowerQ.includes('anxious') ||
    lowerQ.includes('anxiety') ||
    lowerQ.includes('stress') ||
    lowerQ.includes('overwhelmed') ||
    lowerQ.includes('tired') ||
    lowerQ.includes('exhausted')
  ) {
    return {
      answer:
        "Take a slow breath. When everything feels like it's piling up, it's completely okay to pause and give yourself permission to step back. What is feeling the most demanding right now?",
      relatedThemes: ['Mindfulness', 'Calm'],
    };
  }

  // 5. Normal factual or technical question fallback
  if (
    lowerQ.startsWith('what is') ||
    lowerQ.startsWith('how to') ||
    lowerQ.startsWith('how do') ||
    lowerQ.startsWith('explain') ||
    lowerQ.startsWith('why does') ||
    lowerQ.startsWith('define')
  ) {
    return {
      answer:
        "I'm ready to explain that clearly. Please verify your connection or retry in a moment if the detailed response was interrupted.",
      relatedThemes: ['Knowledge'],
    };
  }

  // 6. Journal reflective fallback
  return {
    answer:
      "I'm right here with you. Whether you'd like to reflect on your journal entries, share what happened today, or ask a question, I'm listening.",
    relatedThemes: ['Journal', 'Reflection'],
  };
}

