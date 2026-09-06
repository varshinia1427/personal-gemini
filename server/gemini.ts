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

      let promptText = `MULTIMODAL JOURNAL REFLECTION REQUEST:
Target Language: ${languageName} (code: ${language})
Journal Title: "${title || 'Untitled'}"
Selected Mood: ${mood}

WRITTEN JOURNAL CONTENT:
"""
${content}
"""`;

      if (voiceTranscription && voiceTranscription.trim()) {
        promptText += `\n\nSPOKEN VOICE JOURNAL TRANSCRIPTION:
"""
${voiceTranscription}
"""`;
      }

      if (images.length > 0) {
        promptText += `\n\nATTACHED IMAGES:
The user has attached ${images.length} photo(s) to this journal entry. Analyze their emotional tone, subjects, setting, and significance in tandem with the written and spoken words.`;
      }

      promptText += `\n\nCRITICAL MULTILINGUAL DIRECTIVE:
You MUST generate ALL fields of your reflection in ${languageName} (${language}). Every single explanation, question, theme, and summary MUST be in ${languageName}. If the entry text is in another language, translate your thoughts into ${languageName}.

Respond strictly in the provided JSON schema.`;

      contentsParts.push(promptText);

      const response = await client.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: contentsParts,
        config: {
          systemInstruction: `You are the empathetic, observant, multimodal AI companion for "Personal Gemini Journal".
Your role is to support mindful personal reflection, clarity, and self-awareness across text, voice recordings, and imagery.
ETHICAL & SAFETY GUIDELINES:
- You are a reflective journaling companion, NOT a doctor, psychiatrist, or medical professional.
- DO NOT provide clinical diagnosis, medical advice, or prescriptions.
- Emphasize emotional depth, gratitude, resilience, and compassionate self-inquiry.
- ALWAYS respond in the user's requested language (${languageName}).`,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              personalReflection: {
                type: Type.STRING,
                description: 'A compassionate, deep personal reflection connecting thoughts, voice, and visual memories.',
              },
              summary: {
                type: Type.STRING,
                description: 'A concise 2-3 sentence summary of the entry.',
              },
              keyThemes: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '2 to 4 key themes identified.',
              },
              moodInsight: {
                type: Type.STRING,
                description: 'An insightful analysis of the emotional current and what influenced it.',
              },
              positiveObservations: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '2 to 3 strengths, positive moments, or resilience noted.',
              },
              reflectionQuestions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '2 to 3 thoughtful questions for self-inquiry.',
              },
              gentleSuggestions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '2 to 3 gentle, non-prescriptive mindful suggestions.',
              },
              detectedMood: {
                type: Type.STRING,
                description: 'The nuanced emotional state detected.',
              },
            },
            required: [
              'personalReflection',
              'summary',
              'keyThemes',
              'moodInsight',
              'positiveObservations',
              'reflectionQuestions',
              'gentleSuggestions',
              'detectedMood',
            ],
          },
        },
      });

      const rawText = response.text;
      if (rawText) {
        const parsed = JSON.parse(rawText);
        return {
          personalReflection: parsed.personalReflection || parsed.summary,
          summary: parsed.summary || 'A thoughtful multimodal reflection on your thoughts and experiences.',
          detectedMood: parsed.detectedMood || mood,
          moodInsight: parsed.moodInsight || `Your expression resonates with a ${mood} state.`,
          keyThemes: Array.isArray(parsed.keyThemes) && parsed.keyThemes.length > 0 ? parsed.keyThemes : ['Mindful Reflection', 'Daily Life'],
          positiveObservations: Array.isArray(parsed.positiveObservations) && parsed.positiveObservations.length > 0
            ? parsed.positiveObservations
            : ['Honoring your journey with regular reflection fosters profound self-understanding.'],
          reflectionQuestions: Array.isArray(parsed.reflectionQuestions) && parsed.reflectionQuestions.length > 0
            ? parsed.reflectionQuestions
            : ['What aspect of today feels most meaningful to hold onto?'],
          gentleSuggestions: Array.isArray(parsed.gentleSuggestions) && parsed.gentleSuggestions.length > 0
            ? parsed.gentleSuggestions
            : ['Take a moment to pause and breathe in gratitude for this present moment.'],
          language,
          createdAt: new Date().toISOString(),
          modelUsed: 'gemini-3.8-flash',
        };
      }
    } catch (err) {
      console.warn('Multimodal Gemini API call encountered an issue:', err);
    }
  }

  return generateLocalMultimodalFallback(title, content, mood, language, languageName, voiceTranscription, images.length > 0);
}

// Translates a journal entry into a target language
export async function translateJournalEntry(
  title: string,
  content: string,
  targetLanguage: string,
  targetLanguageName: string
): Promise<{ translatedTitle: string; translatedContent: string }> {
  const client = getGeminiClient();
  if (client) {
    try {
      const prompt = `Translate the following journal entry into ${targetLanguageName} (${targetLanguage}).
Maintain the exact emotional nuance, personal voice, warmth, and sincerity of the original writer.
Return your response strictly in JSON format.

Original Title: "${title}"
Original Content:
"""
${content}
"""`;

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

      const parsed = JSON.parse(response.text || '{}');
      if (parsed.translatedTitle && parsed.translatedContent) {
        return {
          translatedTitle: parsed.translatedTitle,
          translatedContent: parsed.translatedContent,
        };
      }
    } catch (err) {
      console.error('Translation error with Gemini:', err);
    }
  }

  return {
    translatedTitle: title,
    translatedContent: content,
  };
}

// Transcribes recorded voice audio and detects language
export async function transcribeVoiceAudio(
  audioBase64: string,
  mimeType = 'audio/webm',
  preferredLanguage?: string
): Promise<{ transcription: string; detectedLanguage: string }> {
  const client = getGeminiClient();
  if (client) {
    try {
      const response = await client.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          {
            inlineData: {
              mimeType,
              data: audioBase64,
            },
          },
          `Please transcribe the speech in this audio recording accurately into text.
Identify the specific language being spoken (e.g. Tamil, Hindi, English, Spanish, Malayalam, Telugu, Bengali, Japanese, etc.).
${preferredLanguage ? `Preferred language hint: ${preferredLanguage}.` : ''}
Return strictly JSON matching:
{
  "transcription": "The transcribed speech text",
  "detectedLanguage": "The name of the detected language"
}`,
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              transcription: { type: Type.STRING },
              detectedLanguage: { type: Type.STRING },
            },
            required: ['transcription', 'detectedLanguage'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return {
        transcription: parsed.transcription || '',
        detectedLanguage: parsed.detectedLanguage || preferredLanguage || 'English',
      };
    } catch (err) {
      console.error('Audio transcription error:', err);
    }
  }

  return {
    transcription: 'Audio recording captured successfully.',
    detectedLanguage: preferredLanguage || 'English',
  };
}

// Generates synthesized weekly or monthly insights from entries
export async function generateSynthesizedInsights(
  entriesSummary: { title: string; content: string; mood: string; date: string }[],
  timeframe: 'weekly' | 'monthly',
  languageName = 'English'
): Promise<string> {
  const client = getGeminiClient();
  if (!client || entriesSummary.length === 0) {
    return timeframe === 'weekly'
      ? `Over the past week, you dedicated time to honor your inner experiences and ground yourself through personal journaling.`
      : `This month reflects meaningful continuity in self-reflection and emotional balance.`;
  }

  try {
    const listText = entriesSummary
      .map((e, idx) => `${idx + 1}. [${e.date}] Mood: ${e.mood} | Title: "${e.title}" | Excerpt: "${e.content.slice(0, 150)}..."`)
      .join('\n');

    const prompt = `You are a mindful journaling guide.
Synthesize the user's ${timeframe} journaling patterns based on these recent ${entriesSummary.length} entries:
${listText}

Generate a 2-3 paragraph compassionate, encouraging synthesis in ${languageName}.
Highlight emotional patterns, growth, and positive themes.
Keep it warm, non-clinical, and reflective.`;

    const response = await client.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    return response.text?.trim() || 'You have maintained thoughtful self-care through consistent reflective journaling.';
  } catch (err) {
    console.error('Insight synthesis error:', err);
    return `Your ${timeframe} journaling shows deliberate dedication to emotional well-being and mindful presence.`;
  }
}

function generateLocalMultimodalFallback(
  title: string,
  content: string,
  mood: MoodType,
  language: string,
  languageName: string,
  voiceTranscription?: string,
  hasImages = false
): ReflectionData {
  const hasVoice = Boolean(voiceTranscription && voiceTranscription.trim());

  return {
    personalReflection: `Reflecting on "${title || 'your thoughts'}", your entry demonstrates deep presence and intentional awareness. ${
      hasVoice ? 'Your spoken voice brings raw authenticity to this moment. ' : ''
    }${hasImages ? 'The accompanying photos visually anchor these cherished reflections.' : ''}`,
    summary: `A heartfelt capture of your thoughts and feelings, centered on a ${mood.toLowerCase()} mindset.`,
    detectedMood: `${mood} & Reflective`,
    moodInsight: `Your choice of words highlights a desire for clarity and authentic connection with yourself.`,
    keyThemes: ['Mindful Awareness', 'Authentic Expression', 'Self-Care'],
    positiveObservations: [
      'You created intentional space in your day to document your inner reality.',
      'Expressing thoughts across multiple modalities enriches emotional integration.',
    ],
    reflectionQuestions: [
      'What feels most grounding about this particular experience?',
      'How can you carry this sense of reflection forward into the rest of your week?',
    ],
    gentleSuggestions: [
      'Take a few mindful breaths and let these reflections settle gently.',
      'Acknowledge yourself for taking time to journal today.',
    ],
    language,
    createdAt: new Date().toISOString(),
    modelUsed: 'gemini-3.8-flash (local fallback)',
  };
}
