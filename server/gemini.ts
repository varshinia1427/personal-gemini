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
  isKidsMode?: boolean;
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
    drawing,
    isKidsMode = false,
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

      // Add drawing as an inline image part if provided
      if (drawing) {
        const drawMatch = drawing.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
        if (drawMatch) {
          contentsParts.push({
            inlineData: {
              mimeType: drawMatch[1],
              data: drawMatch[2],
            },
          });
        }
      }

      let promptText = '';

      if (isKidsMode) {
        promptText = `KIDS MODE JOURNAL REFLECTION REQUEST:
Target Language: ${languageName} (code: ${language})
Entry Title: "${title || 'My Day'}"
Child's Feeling / Mood: ${mood}

CHILD'S WRITTEN THOUGHTS:
"""
${content || '(No written text)'}
"""`;

        if (voiceTranscription && voiceTranscription.trim()) {
          promptText += `\n\nCHILD'S SPOKEN VOICE WORDS:
"""
${voiceTranscription}
"""`;
        }

        if (drawing) {
          promptText += `\n\nCHILD'S DRAWING:
The child created a personal drawing (included as an image above). Please notice the creativity, colors, and effort in their art!`;
        }

        if (images.length > 0) {
          promptText += `\n\nCHILD'S PHOTO(S):
The child shared ${images.length} photo(s) of their day (included as images above). Celebrate what they captured!`;
        }

        promptText += `\n\nCRITICAL KIDS MODE DIRECTIVES:
1. Generate a short, friendly, and age-appropriate reflection (1-3 sentences) suitable for children.
   For example: "It sounds like you had a fun day at the park! What was your favorite part?"
2. Keep the response positive, simple, warm, and encouraging.
3. STRICT SAFETY RULE: Do NOT make medical, psychological, diagnostic, or sensitive conclusions about the child.
4. All text MUST be in ${languageName} (${language}).
5. Respond strictly in the provided JSON schema.`;
      } else {
        promptText = `MULTIMODAL JOURNAL REFLECTION REQUEST:
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
      }

      contentsParts.push(promptText);

      const systemInstruction = isKidsMode
        ? `You are a warm, kind, encouraging, and friendly companion for a child using "Personal Gemini Journal: Kids Mode".
Your role is to celebrate the child's daily experiences, drawings, and feelings with positivity and enthusiasm.
RULES FOR KIDS MODE:
- Respond in simple, cheerful, age-appropriate language (for ages 5-12).
- Celebrate what they wrote, said, drew, or photographed with genuine warmth.
- Ask 1 friendly, fun follow-up question.
- STRICT SAFETY RULE: Do NOT make medical, psychological, diagnostic, or sensitive conclusions about the child.
- NEVER sound clinical, formal, or critical.
- ALWAYS respond in the child's selected language (${languageName}).`
        : `You are the empathetic, observant, multimodal AI companion for "Personal Gemini Journal".
Your role is to support mindful personal reflection, clarity, and self-awareness across text, voice recordings, and imagery.
ETHICAL & SAFETY GUIDELINES:
- You are a reflective journaling companion, NOT a doctor, psychiatrist, or medical professional.
- DO NOT provide clinical diagnosis, medical advice, or prescriptions.
- Emphasize emotional depth, gratitude, resilience, and compassionate self-inquiry.
- ALWAYS respond in the user's requested language (${languageName}).`;

      const response = await client.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: contentsParts,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              personalReflection: {
                type: Type.STRING,
                description: isKidsMode
                  ? 'A short, cheerful, friendly reflection for the child with an encouraging question.'
                  : 'A compassionate, deep personal reflection connecting thoughts, voice, and visual memories.',
              },
              summary: {
                type: Type.STRING,
                description: isKidsMode ? 'A simple 1-2 sentence happy summary of their day.' : 'A concise 2-3 sentence summary of the entry.',
              },
              keyThemes: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '2 to 4 key themes identified.',
              },
              moodInsight: {
                type: Type.STRING,
                description: 'An insightful analysis of the emotional current.',
              },
              positiveObservations: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '2 to 3 strengths, positive moments, or praise for their creativity.',
              },
              reflectionQuestions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '1 to 2 friendly questions for the child or self-inquiry.',
              },
              gentleSuggestions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '1 to 2 gentle suggestions.',
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
          summary: parsed.summary || (isKidsMode ? 'A fun day full of wonderful memories!' : 'A thoughtful multimodal reflection on your thoughts and experiences.'),
          detectedMood: parsed.detectedMood || mood,
          moodInsight: parsed.moodInsight || `You felt ${mood} today!`,
          keyThemes: Array.isArray(parsed.keyThemes) && parsed.keyThemes.length > 0 ? parsed.keyThemes : ['Creativity', 'My Day'],
          positiveObservations: Array.isArray(parsed.positiveObservations) && parsed.positiveObservations.length > 0
            ? parsed.positiveObservations
            : [isKidsMode ? 'You did such a wonderful job sharing your feelings and creativity!' : 'Honoring your journey with regular reflection fosters profound self-understanding.'],
          reflectionQuestions: Array.isArray(parsed.reflectionQuestions) && parsed.reflectionQuestions.length > 0
            ? parsed.reflectionQuestions
            : [isKidsMode ? 'What was your favorite part of today?' : 'What aspect of today feels most meaningful to hold onto?'],
          gentleSuggestions: Array.isArray(parsed.gentleSuggestions) && parsed.gentleSuggestions.length > 0
            ? parsed.gentleSuggestions
            : [isKidsMode ? 'Keep on drawing and having fun!' : 'Take a moment to pause and breathe in gratitude for this present moment.'],
          language,
          createdAt: new Date().toISOString(),
          modelUsed: 'gemini-3.8-flash',
          isKidsReflection: isKidsMode,
        };
      }
    } catch (err) {
      console.warn('Multimodal Gemini API call encountered an issue:', err);
    }
  }

  return isKidsMode
    ? generateLocalKidsFallback(title, content, mood, language, voiceTranscription, Boolean(drawing), images.length > 0)
    : generateLocalMultimodalFallback(title, content, mood, language, languageName, voiceTranscription, images.length > 0);
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

function generateLocalKidsFallback(
  title: string,
  content: string,
  mood: MoodType,
  language: string,
  voiceTranscription?: string,
  hasDrawing = false,
  hasImages = false
): ReflectionData {
  let friendlyReflection = `It sounds like you had such a special day!`;
  if (hasDrawing && hasImages) {
    friendlyReflection = `Wow, your drawing and photos look amazing! It sounds like you had so much fun today. What was your favorite part?`;
  } else if (hasDrawing) {
    friendlyReflection = `I love your creative drawing! It sounds like you had a fun day creating art. What was your favorite part of today?`;
  } else if (hasImages) {
    friendlyReflection = `Look at those wonderful photos! It sounds like you made great memories today. What made you smile the biggest?`;
  } else if (voiceTranscription) {
    friendlyReflection = `It was so nice hearing you talk about your day! It sounds like you had lots of adventures. What made you happiest today?`;
  } else if (content) {
    friendlyReflection = `Thank you for writing about your day! It sounds like you had fun. What was the best thing that happened today?`;
  }

  return {
    personalReflection: friendlyReflection,
    summary: `A fun and creative day celebrating your thoughts and feelings!`,
    detectedMood: `${mood}`,
    moodInsight: `You felt ${mood} today! It's wonderful to express how you feel.`,
    keyThemes: ['My Day', 'Fun', 'Creativity'],
    positiveObservations: [
      'You did an awesome job expressing your feelings today!',
      hasDrawing ? 'Your drawing is full of wonderful imagination!' : 'Sharing your thoughts helps you remember great days!',
    ],
    reflectionQuestions: ['What was the most fun thing you did today?'],
    gentleSuggestions: ['Keep smiling, exploring, and drawing!'],
    language,
    createdAt: new Date().toISOString(),
    modelUsed: 'gemini-3.8-flash (kids fallback)',
    isKidsReflection: true,
  };
}

