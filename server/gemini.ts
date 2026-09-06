import { GoogleGenAI, Type } from '@google/genai';
import type { AgeGroup, MoodType, ReflectionData, StoryItem } from '../src/types';

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
  ageGroup?: AgeGroup;
  schoolReflection?: string;
  personalGrowth?: string;
  dailyQuestion?: string;
  dailyQuestionAnswer?: string;
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
    ageGroup = isKidsMode ? '3-6' : '18+',
    schoolReflection,
    personalGrowth,
    dailyQuestion,
    dailyQuestionAnswer,
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

      if (ageGroup === '3-6') {
        promptText = `LITTLE EXPLORER JOURNAL REFLECTION REQUEST (AGES 3–6):
Target Language: ${languageName} (code: ${language})
Entry Title: "${title || 'My Day'}"
Child's Feeling / Mood: ${mood}

CHILD'S THOUGHTS / WORDS:
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
The child made a colorful drawing (included as image above). Notice their imagination, shapes, and colors!`;
        }

        if (images.length > 0) {
          promptText += `\n\nCHILD'S PHOTO(S):
The child shared ${images.length} photo(s) of their day (included as images above). Celebrate what they captured!`;
        }

        promptText += `\n\nCRITICAL AGE 3-6 DIRECTIVES:
1. Generate a very short, super friendly, warm reflection (1-2 sentences) in very simple words for a little child.
2. Example tone: "It looks like you had so much fun today! Did you smile a lot?"
3. Ask exactly 1 fun, cute follow-up question.
4. STRICT SAFETY: NO medical, clinical, psychological, or diagnostic statements. NO scary or negative words.
5. All text MUST be in ${languageName} (${language}).
6. Respond strictly in the provided JSON schema.`;
      } else if (ageGroup === '7-12') {
        promptText = `YOUNG EXPLORER JOURNAL REFLECTION REQUEST (AGES 7–12):
Target Language: ${languageName} (code: ${language})
Entry Title: "${title || 'My Explorer Day'}"
Explorer's Feeling / Mood: ${mood}

WRITTEN WORDS:
"""
${content || '(No written text)'}
"""`;

        if (dailyQuestion && dailyQuestionAnswer) {
          promptText += `\n\nDAILY QUESTION ANSWERED:
Question: "${dailyQuestion}"
Answer: "${dailyQuestionAnswer}"`;
        }

        if (voiceTranscription && voiceTranscription.trim()) {
          promptText += `\n\nSPOKEN VOICE WORDS:
"""
${voiceTranscription}
"""`;
        }

        if (drawing) {
          promptText += `\n\nCREATIVE DRAWING:
The young explorer created a drawing (attached above). Celebrate their creative effort and storytelling!`;
        }

        if (images.length > 0) {
          promptText += `\n\nEXPLORER PHOTOS:
The explorer captured ${images.length} photo(s) of their day (attached above).`;
        }

        promptText += `\n\nCRITICAL AGE 7-12 DIRECTIVES:
1. Generate an encouraging, friendly, and curious reflection (2-3 sentences) suitable for ages 7-12.
2. Celebrate learning, friendship, adventure, curiosity, or achievements.
3. Ask 1 engaging question that sparks their imagination or memory.
4. STRICT SAFETY: NO clinical, psychological, or diagnostic judgments. Keep it safe and empowering.
5. All text MUST be in ${languageName} (${language}).
6. Respond strictly in the provided JSON schema.`;
      } else if (ageGroup === '13-17') {
        promptText = `TEEN JOURNAL REFLECTION REQUEST (AGES 13–17):
Target Language: ${languageName} (code: ${language})
Journal Title: "${title || 'Untitled'}"
Mood: ${mood}

TEEN JOURNAL CONTENT:
"""
${content}
"""`;

        if (schoolReflection && schoolReflection.trim()) {
          promptText += `\n\nSCHOOL & STUDY REFLECTION:
"""
${schoolReflection}
"""`;
        }

        if (personalGrowth && personalGrowth.trim()) {
          promptText += `\n\nPERSONAL GROWTH & HABITS:
"""
${personalGrowth}
"""`;
        }

        if (voiceTranscription && voiceTranscription.trim()) {
          promptText += `\n\nSPOKEN VOICE JOURNAL:
"""
${voiceTranscription}
"""`;
        }

        if (images.length > 0) {
          promptText += `\n\nATTACHED PHOTOS:
User attached ${images.length} photo(s).`;
        }

        promptText += `\n\nCRITICAL AGE 13-17 DIRECTIVES:
1. Use natural, mature, respectful, and supportive language suitable for teenagers.
2. Do NOT talk down to them like a toddler, and do NOT use cheesy slang.
3. Validate feelings (e.g. school stress, goals, friendships, creative ideas) and encourage healthy perspective.
4. STRICT SAFETY: You are a reflective journal companion, NOT a therapist or psychologist. No clinical or diagnostic labels.
5. All text MUST be in ${languageName} (${language}).
6. Respond strictly in the provided JSON schema.`;
      } else {
        // 18+ Adult Journal
        promptText = `MULTIMODAL JOURNAL REFLECTION REQUEST (ADULT 18+):
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

      let systemInstruction = '';

      if (ageGroup === '3-6') {
        systemInstruction = `You are a warm, kind, and joyful AI companion for a little child (ages 3–6) using "Personal Gemini Journal: Little Explorer".
RULES:
- Use very simple words and short, cheerful sentences (1-2 sentences).
- Celebrate what they wrote, drew, said, or photographed with excitement and love.
- Ask 1 simple, fun question.
- STRICT SAFETY RULE: NEVER make medical, psychological, or diagnostic conclusions.
- NEVER sound clinical or critical. Keep everything safe, positive, and gentle.
- ALWAYS respond in the selected language (${languageName}).`;
      } else if (ageGroup === '7-12') {
        systemInstruction = `You are an encouraging, curious, and friendly guide for a young explorer (ages 7–12) using "Personal Gemini Journal: Young Explorer".
RULES:
- Respond in simple, engaging, age-appropriate language (for ages 7-12).
- Celebrate curiosity, effort, learning, creativity, and kindness.
- Ask 1 interesting, thought-provoking question.
- STRICT SAFETY RULE: NEVER provide clinical or psychiatric diagnoses or sensitive conclusions.
- ALWAYS respond in the selected language (${languageName}).`;
      } else if (ageGroup === '13-17') {
        systemInstruction = `You are a respectful, thoughtful, and supportive AI companion for a teenager (ages 13–17) using "Personal Gemini Journal: Teen Journal".
RULES:
- Speak in natural, modern, validating language without being condescending or childish.
- Validate challenges (school, friendships, personal goals) with empathy and healthy perspective.
- Encourage self-awareness, resilience, and personal growth.
- STRICT SAFETY RULE: You are NOT a therapist, psychiatrist, or medical doctor. Do NOT provide clinical diagnoses or crisis interventions. Maintain a safe, supportive, non-judgmental space.
- ALWAYS respond in the user's selected language (${languageName}).`;
      } else {
        systemInstruction = `You are the empathetic, observant, multimodal AI companion for "Personal Gemini Journal".
Your role is to support mindful personal reflection, clarity, and self-awareness across text, voice recordings, and imagery.
ETHICAL & SAFETY GUIDELINES:
- You are a reflective journaling companion, NOT a doctor, psychiatrist, or medical professional.
- DO NOT provide clinical diagnosis, medical advice, or prescriptions.
- Emphasize emotional depth, gratitude, resilience, and compassionate self-inquiry.
- ALWAYS respond in the user's requested language (${languageName}).`;
      }

      const isYoung = ageGroup === '3-6' || ageGroup === '7-12';

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
                description: isYoung
                  ? 'A short, cheerful, friendly reflection for the child/young explorer with an encouraging question.'
                  : 'A compassionate, thoughtful personal reflection connecting thoughts, experiences, and emotions.',
              },
              summary: {
                type: Type.STRING,
                description: isYoung ? 'A simple 1-2 sentence summary of their day.' : 'A concise 2-3 sentence summary of the entry.',
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
                description: '2 to 3 strengths, positive moments, or praise.',
              },
              reflectionQuestions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '1 to 2 friendly questions for reflection.',
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
          summary: parsed.summary || (isYoung ? 'A fun day full of wonderful memories!' : 'A thoughtful reflection on your thoughts and experiences.'),
          detectedMood: parsed.detectedMood || mood,
          moodInsight: parsed.moodInsight || `You felt ${mood} today!`,
          keyThemes: Array.isArray(parsed.keyThemes) && parsed.keyThemes.length > 0 ? parsed.keyThemes : ['Creativity', 'My Day'],
          positiveObservations: Array.isArray(parsed.positiveObservations) && parsed.positiveObservations.length > 0
            ? parsed.positiveObservations
            : [isYoung ? 'You did such a wonderful job sharing your feelings and creativity!' : 'Honoring your journey with regular reflection fosters profound self-understanding.'],
          reflectionQuestions: Array.isArray(parsed.reflectionQuestions) && parsed.reflectionQuestions.length > 0
            ? parsed.reflectionQuestions
            : [isYoung ? 'What was your favorite part of today?' : 'What aspect of today feels most meaningful to hold onto?'],
          gentleSuggestions: Array.isArray(parsed.gentleSuggestions) && parsed.gentleSuggestions.length > 0
            ? parsed.gentleSuggestions
            : [isYoung ? 'Keep on exploring and having fun!' : 'Take a moment to pause and breathe in gratitude for this present moment.'],
          language,
          createdAt: new Date().toISOString(),
          modelUsed: 'gemini-3.8-flash',
          isKidsReflection: isYoung,
          ageGroup,
        };
      }
    } catch (err) {
      console.warn('Multimodal Gemini API call encountered an issue:', err);
    }
  }

  return ageGroup === '3-6' || ageGroup === '7-12'
    ? generateLocalKidsFallback(title, content, mood, language, voiceTranscription, Boolean(drawing), images.length > 0, ageGroup)
    : generateLocalMultimodalFallback(title, content, mood, language, languageName, voiceTranscription, images.length > 0, ageGroup);
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
  hasImages = false,
  ageGroup: AgeGroup = '18+'
): ReflectionData {
  const hasVoice = Boolean(voiceTranscription && voiceTranscription.trim());
  const isTeen = ageGroup === '13-17';

  return {
    personalReflection: isTeen
      ? `Reflecting on "${title || 'your day'}", your thoughts show honesty and self-awareness. Taking time to process how you're feeling and what you're experiencing is a great sign of resilience.`
      : `Reflecting on "${title || 'your thoughts'}", your entry demonstrates deep presence and intentional awareness. ${
          hasVoice ? 'Your spoken voice brings raw authenticity to this moment. ' : ''
        }${hasImages ? 'The accompanying photos visually anchor these cherished reflections.' : ''}`,
    summary: isTeen
      ? `A candid reflection capturing your thoughts and emotions, moving forward with clarity.`
      : `A heartfelt capture of your thoughts and feelings, centered on a ${mood.toLowerCase()} mindset.`,
    detectedMood: `${mood} & Reflective`,
    moodInsight: isTeen
      ? `You felt ${mood} today. Acknowledging your emotions gives you space to grow.`
      : `Your choice of words highlights a desire for clarity and authentic connection with yourself.`,
    keyThemes: isTeen ? ['Self-Expression', 'Perspective', 'Daily Growth'] : ['Mindful Awareness', 'Authentic Expression', 'Self-Care'],
    positiveObservations: isTeen
      ? [
          'You paused to express your honest thoughts and process your day.',
          'Setting space for your own feelings builds inner strength.',
        ]
      : [
          'You created intentional space in your day to document your inner reality.',
          'Expressing thoughts across multiple modalities enriches emotional integration.',
        ],
    reflectionQuestions: isTeen
      ? [
          'What was one thing today that made you feel proud or grounded?',
          'What is one small thing you look forward to tomorrow?',
        ]
      : [
          'What feels most grounding about this particular experience?',
          'How can you carry this sense of reflection forward into the rest of your week?',
        ],
    gentleSuggestions: isTeen
      ? [
          'Take a deep breath and give yourself credit for all you handled today.',
          'Stay true to who you are as you learn and grow.',
        ]
      : [
          'Take a few mindful breaths and let these reflections settle gently.',
          'Acknowledge yourself for taking time to journal today.',
        ],
    language,
    createdAt: new Date().toISOString(),
    modelUsed: 'gemini-3.8-flash (local fallback)',
    ageGroup,
  };
}

function generateLocalKidsFallback(
  title: string,
  content: string,
  mood: MoodType,
  language: string,
  voiceTranscription?: string,
  hasDrawing = false,
  hasImages = false,
  ageGroup: AgeGroup = '3-6'
): ReflectionData {
  const isYoungExplorer = ageGroup === '7-12';
  let friendlyReflection = isYoungExplorer
    ? `Awesome journal entry! It sounds like you had a great day full of adventures.`
    : `It sounds like you had such a special day!`;

  if (hasDrawing && hasImages) {
    friendlyReflection = isYoungExplorer
      ? `Your drawing and photos are fantastic! You did an awesome job documenting your day. What was the coolest part?`
      : `Wow, your drawing and photos look amazing! It sounds like you had so much fun today. What was your favorite part?`;
  } else if (hasDrawing) {
    friendlyReflection = isYoungExplorer
      ? `Your drawing shows great creativity and color! What inspired your artwork today?`
      : `I love your creative drawing! It sounds like you had a fun day creating art. What was your favorite part of today?`;
  } else if (hasImages) {
    friendlyReflection = isYoungExplorer
      ? `Great photos! These memories will be wonderful to look back on. What was the most exciting moment?`
      : `Look at those wonderful photos! It sounds like you made great memories today. What made you smile the biggest?`;
  } else if (voiceTranscription) {
    friendlyReflection = isYoungExplorer
      ? `It was awesome hearing your voice and listening to your thoughts! What was the highlight of your day?`
      : `It was so nice hearing you talk about your day! It sounds like you had lots of adventures. What made you happiest today?`;
  } else if (content) {
    friendlyReflection = isYoungExplorer
      ? `Thank you for writing down your thoughts! You are doing an awesome job journaling. What did you learn today?`
      : `Thank you for writing about your day! It sounds like you had fun. What was the best thing that happened today?`;
  }

  return {
    personalReflection: friendlyReflection,
    summary: isYoungExplorer
      ? `An exciting explorer day with great curiosity and feelings!`
      : `A fun and creative day celebrating your thoughts and feelings!`,
    detectedMood: `${mood}`,
    moodInsight: `You felt ${mood} today! It's wonderful to express how you feel.`,
    keyThemes: isYoungExplorer ? ['Adventure', 'Curiosity', 'Creativity'] : ['My Day', 'Fun', 'Creativity'],
    positiveObservations: [
      'You did an awesome job expressing your feelings today!',
      hasDrawing ? 'Your drawing is full of wonderful imagination!' : 'Sharing your thoughts helps you remember great days!',
    ],
    reflectionQuestions: [
      isYoungExplorer ? 'What is one new thing you want to try or explore tomorrow?' : 'What was the most fun thing you did today?',
    ],
    gentleSuggestions: [
      isYoungExplorer ? 'Keep exploring, asking questions, and writing your story!' : 'Keep smiling, exploring, and drawing!',
    ],
    language,
    createdAt: new Date().toISOString(),
    modelUsed: 'gemini-3.8-flash (kids fallback)',
    isKidsReflection: true,
    ageGroup,
  };
}

// ----------------------------------------------------
// STORY CORNER: GENERATE STORY FOR AGE GROUP
// ----------------------------------------------------

export interface GenerateStoryInput {
  ageGroup: AgeGroup;
  genre?: string;
  prompt?: string;
  language?: string;
  languageName?: string;
}

export async function generateStoryForAgeGroup(
  input: GenerateStoryInput
): Promise<StoryItem> {
  const client = getGeminiClient();
  const {
    ageGroup = '7-12',
    genre = 'Adventure',
    prompt = '',
    language = 'en',
    languageName = 'English',
  } = input;

  const storyId = 'story_' + Date.now();

  if (client) {
    try {
      let promptDirectives = '';
      let targetLength = '';
      let emojiOptions = '🌟 🚀 🦁 🎈 🎨';

      if (ageGroup === '3-6') {
        targetLength = '120 to 180 words';
        emojiOptions = '🧸 🐶 🐱 🎈 🌈 🦄 🍓';
        promptDirectives = `Target Audience: Little children (Ages 3–6).
Theme/Genre: ${genre}
User idea: "${prompt || 'A kind animal making a new friend'}"
Tone: Very gentle, sweet, warm, cheerful, simple vocabulary, short sentences.
Include a simple, positive moral lesson at the end.
STRICT SAFETY: Absolutely no scary elements, no villains, no danger. Pure wholesome joy.`;
      } else if (ageGroup === '7-12') {
        targetLength = '250 to 350 words';
        emojiOptions = '🚀 🧭 🏰 🐉 🔮 ⚽ 🏕️';
        promptDirectives = `Target Audience: Young Explorers (Ages 7–12).
Theme/Genre: ${genre}
User idea: "${prompt || 'An unexpected discovery during a neighborhood mystery'}"
Tone: Exciting, curious, imaginative, spirited, empowering.
Include teamwork, problem-solving, or bravery.
STRICT SAFETY: Age-appropriate adventure, no graphic danger.`;
      } else if (ageGroup === '13-17') {
        targetLength = '350 to 450 words';
        emojiOptions = '🎧 🌌 ⚡ 📚 🎭 🏔️ 🛸';
        promptDirectives = `Target Audience: Teenagers (Ages 13–17).
Theme/Genre: ${genre}
User idea: "${prompt || 'A journey of self-discovery or creative adventure'}"
Tone: Engaging narrative, relatable character growth, atmospheric, thoughtful.
STRICT SAFETY: No explicit content, mature but wholesome themes.`;
      } else {
        targetLength = '400 to 500 words';
        emojiOptions = '🌿 ☕ 📖 🌅 🎨 🕯️ 🧭';
        promptDirectives = `Target Audience: Adult (Age 18+).
Theme/Genre: ${genre}
User idea: "${prompt || 'A mindful reflection on time, connection, and purpose'}"
Tone: Evocative, reflective, literary, mindful.`;
      }

      const promptText = `GENERATE A COMPELLING ORIGINAL STORY:
Target Language: ${languageName} (${language})
Length: Approximately ${targetLength}

${promptDirectives}

CRITICAL:
1. Write the title and entire story in ${languageName}.
2. Choose one fitting emoji for the cover from: ${emojiOptions}
3. Provide an estimated reading time in minutes (1 to 5).
4. Provide a 1-sentence moral lesson or takeaway.`;

      const response = await client.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: promptText,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              content: { type: Type.STRING },
              coverEmoji: { type: Type.STRING },
              moralLesson: { type: Type.STRING },
              readTimeMinutes: { type: Type.NUMBER },
            },
            required: ['title', 'content', 'coverEmoji', 'moralLesson'],
          },
        },
      });

      const raw = response.text;
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          id: storyId,
          title: parsed.title || `${genre} Story`,
          content: parsed.content || 'Once upon a time in a sunny land...',
          coverEmoji: parsed.coverEmoji || '📚',
          moralLesson: parsed.moralLesson || 'Kindness brings light to every day.',
          ageGroup,
          genre,
          language: language as any,
          readTimeMinutes: parsed.readTimeMinutes || 2,
          createdAt: new Date().toISOString(),
        };
      }
    } catch (err) {
      console.warn('Gemini Story Generation fallback triggered:', err);
    }
  }

  // Fallback story if API is unavailable
  const fallbackStories: Record<AgeGroup, { title: string; content: string; emoji: string; moral: string }> = {
    '3-6': {
      title: 'Barnaby Bunny and the Rainbow Butterfly',
      content:
        'Once upon a sunny morning, Barnaby the little bunny hopped across the green meadow. He saw a fluttering butterfly with wings of purple, yellow, and sky blue! "Hello little butterfly!" Barnaby whispered. The butterfly landed gently on Barnaby\'s nose, making him giggle happily. Together, they hopped to the strawberry patch and shared fresh sweet berries with all the forest friends. Barnaby smiled, knowing that making new friends is the best adventure of all.',
      emoji: '🐰',
      moral: 'Sharing a smile makes everyone happy!',
    },
    '7-12': {
      title: 'The Mystery of the Whispering Compass',
      content:
        'Maya found an antique brass compass in her grandfather’s attic. But instead of pointing north, its glowing emerald needle swung toward the ancient oak tree behind the school. Maya grabbed her notebook and flashlight and hurried outdoors. Beneath the roots of the tree, she uncovered a carved wooden box containing an old star map. Working together with her best friend Leo, they decoded the secret constellations and discovered a secret observatory built by local astronomers sixty years ago. Maya smiled, realizing that curiosity always unlocks secret wonder in everyday places.',
      emoji: '🧭',
      moral: 'Great discoveries start with curiosity and good teamwork.',
    },
    '13-17': {
      title: 'The Echo of the Rooftop Studio',
      content:
        'Every Tuesday at dusk, Jordan climbed to the fire escape overlooking the city skyline with an acoustic guitar and a battered sketchbook. Between exam deadlines and expectations, this rooftop was the only place where the noise quieted down. One cool October evening, Jordan finally finished writing a melody that had been stuck in their head for weeks. Looking out at the illuminated city streets, Jordan realized that growth isn\'t about having all the answers at seventeen—it\'s about honoring your creative voice, being patient with yourself, and daring to write your own next verse.',
      emoji: '🎧',
      moral: 'Trust your unique creative voice even when the path ahead is uncertain.',
    },
    '18+': {
      title: 'The Architecture of Dawn',
      content:
        'Elena stepped into the garden as mist still hovered above the lavender bushes. The kettle whistled quietly from inside the kitchen, steam rising into the pale blue morning air. For years, she had measured life in project milestones, urgent notifications, and crowded schedules. But here, with a warm mug in her hands and the sun breaking across the stone path, she recognized the quiet luxury of pause. The day would soon arrive with its demands, but this stillness—this deliberate breath—belonged entirely to her soul.',
      emoji: '🌿',
      moral: 'Clarity is found not in running faster, but in the intentional courage to pause.',
    },
  };

  const selected = fallbackStories[ageGroup] || fallbackStories['18+'];
  return {
    id: storyId,
    title: selected.title,
    content: selected.content,
    coverEmoji: selected.emoji,
    moralLesson: selected.moral,
    ageGroup,
    genre,
    language: language as any,
    readTimeMinutes: ageGroup === '3-6' ? 1 : ageGroup === '7-12' ? 2 : 3,
    createdAt: new Date().toISOString(),
  };
}

// ----------------------------------------------------
// ASK GEMINI ABOUT MY JOURNAL (Q&A GROUNDED IN ENTRIES)
// ----------------------------------------------------

export async function askGeminiAboutJournal(params: {
  question: string;
  entriesSummary: { title: string; content: string; mood: string; date: string }[];
  languageName?: string;
  language?: string;
  ageGroup?: AgeGroup;
}): Promise<{ answer: string; relatedThemes: string[] }> {
  const client = getGeminiClient();
  const {
    question,
    entriesSummary,
    languageName = 'English',
    language = 'en',
    ageGroup = '18+',
  } = params;

  if (client && entriesSummary.length > 0) {
    try {
      const summaryText = entriesSummary
        .slice(0, 15)
        .map((e, idx) => `[Entry ${idx + 1}] Date: ${e.date} | Mood: ${e.mood} | Title: "${e.title}" | Text: "${e.content.slice(0, 300)}"`)
        .join('\n\n');

      const isTeen = ageGroup === '13-17';

      const prompt = `You are the private, mindful AI companion for "Personal Gemini Journal".
The user is asking a reflective question about their own private journal history.

USER QUESTION:
"${question}"

USER'S RECENT JOURNAL ENTRIES (STRICTLY CONFIDENTIAL):
${summaryText}

DIRECTIVES:
1. Answer the user's question directly and compassionately based on the patterns, thoughts, and reflections present in their journal entries.
2. Tone: ${isTeen ? 'Empathetic, validating, respectful, modern and encouraging for a teenager.' : 'Empathetic, observant, insightful, and supportive of personal growth.'}
3. STRICT SAFETY: You are an AI journal companion, NOT a medical doctor, psychiatrist, or therapist. Do NOT provide medical diagnoses.
4. Response MUST be in ${languageName} (${language}).
5. Return JSON format.`;

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
                description: 'A compassionate, grounded answer addressing their question based on their journal entries.',
              },
              relatedThemes: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '2 to 3 related themes or key topics from their entries.',
              },
            },
            required: ['answer', 'relatedThemes'],
          },
        },
      });

      const raw = response.text;
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          answer: parsed.answer,
          relatedThemes: Array.isArray(parsed.relatedThemes) ? parsed.relatedThemes : ['Reflection', 'Self-Care'],
        };
      }
    } catch (err) {
      console.warn('Ask Gemini journal fallback triggered:', err);
    }
  }

  return {
    answer: `Looking through your recent entries, your reflections show thoughtful awareness and dedication to taking care of yourself. As you continue journaling, you'll uncover even clearer patterns in what brings you peace, energy, and joy.`,
    relatedThemes: ['Self-Awareness', 'Daily Reflection', 'Well-being'],
  };
}

