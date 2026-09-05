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

export async function generateReflection(
  title: string,
  content: string,
  mood: MoodType
): Promise<ReflectionData> {
  const client = getGeminiClient();

  if (client) {
    try {
      const prompt = `Journal Title: "${title || 'Untitled'}"
Selected Mood: ${mood}

Journal Content:
"""
${content}
"""

Please provide a compassionate, structured reflection on this journal entry.`;

      const response = await client.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: `You are the empathetic, reflective AI companion for "Personal Gemini Journal".
Your role is to support mindful personal reflection, clarity, and self-awareness.
ETHICAL & SAFETY GUIDELINES:
- You are an insightful personal journaling companion, NOT a doctor, therapist, psychiatrist, or medical professional.
- DO NOT provide clinical diagnosis, medical advice, therapy prescriptions, or medical treatment plans.
- Emphasize strengths, resilience, compassion, and gentle self-inquiry.
- Provide your response strictly in the JSON schema requested.`,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: {
                type: Type.STRING,
                description: 'A 2-3 sentence compassionate summary of the entry.',
              },
              detectedMood: {
                type: Type.STRING,
                description: 'The nuanced emotional tone detected from the writing.',
              },
              keyThemes: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '2 to 4 key conceptual or life themes identified.',
              },
              positiveObservations: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '2 to 3 strengths, resilience, or positive moments noted.',
              },
              reflectionQuestions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '2 to 3 gentle, open-ended questions for deeper contemplation.',
              },
              gentleSuggestions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '2 to 3 mindful, non-prescriptive, grounding suggestions.',
              },
            },
            required: [
              'summary',
              'detectedMood',
              'keyThemes',
              'positiveObservations',
              'reflectionQuestions',
              'gentleSuggestions',
            ],
          },
        },
      });

      const rawText = response.text;
      if (rawText) {
        const parsed = JSON.parse(rawText);
        return {
          summary: parsed.summary || 'A heartfelt personal reflection on today’s thoughts and experiences.',
          detectedMood: parsed.detectedMood || mood,
          keyThemes: Array.isArray(parsed.keyThemes) && parsed.keyThemes.length > 0 ? parsed.keyThemes : ['Personal Growth', 'Mindfulness'],
          positiveObservations: Array.isArray(parsed.positiveObservations) && parsed.positiveObservations.length > 0
            ? parsed.positiveObservations
            : ['Taking intentional time to write and reflect honors your inner journey.'],
          reflectionQuestions: Array.isArray(parsed.reflectionQuestions) && parsed.reflectionQuestions.length > 0
            ? parsed.reflectionQuestions
            : ['What feeling would you like to cultivate as you move forward today?'],
          gentleSuggestions: Array.isArray(parsed.gentleSuggestions) && parsed.gentleSuggestions.length > 0
            ? parsed.gentleSuggestions
            : ['Take three slow, deep breaths to integrate your thoughts.'],
          createdAt: new Date().toISOString(),
          modelUsed: 'gemini-3.8-flash',
        };
      }
    } catch (err) {
      console.warn('Gemini API call failed or encountered an error. Utilizing reflective fallback generator:', err);
    }
  }

  // Graceful fallback if GEMINI_API_KEY is not configured or temporary error occurs
  return generateLocalReflectionFallback(title, content, mood);
}

function generateLocalReflectionFallback(title: string, content: string, mood: MoodType): ReflectionData {
  const wordCount = content.split(/\s+/).filter(Boolean).length;
  const moodReflections: Record<MoodType, { detectedMood: string; themes: string[]; obs: string[]; questions: string[]; suggestions: string[] }> = {
    Happy: {
      detectedMood: 'Joyful & Appreciative',
      themes: ['Celebration', 'Gratitude', 'Positive Energy'],
      obs: [
        'You clearly savored this uplifting moment by taking the time to articulate it.',
        'Your words carry an infectious sense of lightness and openness to life.'
      ],
      questions: [
        'What specific element of this experience brought you the deepest sense of fulfillment?',
        'How can you anchor this joyous feeling so you can revisit it on harder days?'
      ],
      suggestions: [
        'Consider sharing a piece of your joy or gratitude with someone who contributed to it.',
        'Take a 30-second sensory snapshot right now to remember how good this feels.'
      ]
    },
    Calm: {
      detectedMood: 'Peaceful & Centered',
      themes: ['Stillness', 'Balance', 'Mindful Presence'],
      obs: [
        'You demonstrated high self-attunement by slowing down your pace.',
        'Your reflection reflects steady emotional regulation and grounded perspective.'
      ],
      questions: [
        'What conditions in your environment or routine helped you arrive at this peaceful state?',
        'How does this sense of quiet balance inform your next decisions?'
      ],
      suggestions: [
        'Protect this calm space by avoiding rapid context-switching for the next hour.',
        'Breathe gently into your abdomen and let this tranquil baseline settle in.'
      ]
    },
    Excited: {
      detectedMood: 'Energized & Motivated',
      themes: ['Ambition', 'Forward Momentum', 'Creative Spark'],
      obs: [
        'Your enthusiasm is a powerful catalyst for creative ideas and progress.',
        'You are actively leaning into curiosity and future possibilities.'
      ],
      questions: [
        'What single next step will channel this vibrant momentum most effectively?',
        'Who can you celebrate this spark of excitement with?'
      ],
      suggestions: [
        'Jot down the top 3 spontaneous ideas sparked by this energy before they fade.',
        'Remember to stay hydrated and pace your excitement steadily.'
      ]
    },
    Sad: {
      detectedMood: 'Gentle Vulnerability & Processing',
      themes: ['Emotional Release', 'Self-Compassion', 'Healing'],
      obs: [
        'Allowing yourself to name sadness on the page is an act of genuine bravery.',
        'You are giving your feelings a safe container without harsh judgment.'
      ],
      questions: [
        'What kind of gentleness or comfort does your heart need most right now?',
        'If a close friend felt this way, what supportive words would you offer them?'
      ],
      suggestions: [
        'Wrap yourself in a warm blanket, sip a calming tea, and lower your daily expectations.',
        'Remind yourself that feelings are like weather patterns: they arrive, and they gently pass.'
      ]
    },
    Angry: {
      detectedMood: 'Passionate & Boundary-Seeking',
      themes: ['Boundary Protection', 'Frustration Release', 'Clarity of Values'],
      obs: [
        'Anger often highlights a boundary that was crossed or a value that deeply matters to you.',
        'Channeling your intensity into honest writing rather than reactive confrontation is commendable.'
      ],
      questions: [
        'What core value or unmet expectation is asking to be respected here?',
        'What constructive, healthy boundary can help safeguard your peace moving forward?'
      ],
      suggestions: [
        'Engage in a physical release—a brisk walk, stretching, or shaking your arms out.',
        'Wait to respond to any triggers until your heart rate and emotional temperature normalize.'
      ]
    },
    Anxious: {
      detectedMood: 'Overstimulated yet Courageously Present',
      themes: ['Navigating Uncertainty', 'Grounding', 'Self-Soothing'],
      obs: [
        'Even in the midst of uncertainty, you took the initiative to pause and document your reality.',
        'Externalizing racing thoughts into written sentences brings order to internal chaos.'
      ],
      questions: [
        'Of all the concerns on your mind, which single piece is actually within your immediate control today?',
        'What has guided you safely through similar moments of tension in the past?'
      ],
      suggestions: [
        'Practice the 5-4-3-2-1 grounding technique or the 4-7-8 relaxing breath count.',
        'Choose just one micro-task to focus on right now and gently release the rest.'
      ]
    },
    Tired: {
      detectedMood: 'Weary & Seeking Restoration',
      themes: ['Restoration', 'Honoring Limits', 'Recharging'],
      obs: [
        'Listening to your physical fatigue is a vital skill that prevents chronic burnout.',
        'You are honoring your natural need to pause rather than needlessly powering through.'
      ],
      questions: [
        'What demands can you politely defer or take off your plate today?',
        'What does genuine replenishment look like for your mind and body tonight?'
      ],
      suggestions: [
        'Give yourself unconditional permission to stop working early today.',
        'Dim the lighting, disconnect from blue screens, and prepare for an early night of restful sleep.'
      ]
    }
  };

  const current = moodReflections[mood] || moodReflections.Calm;
  return {
    summary: `In this entry containing ${wordCount} words, you explored thoughts on "${title || 'your day'}". You gave voice to your inner thoughts with honest candor and created a valuable moment of self-witnessing.`,
    detectedMood: current.detectedMood,
    keyThemes: current.themes,
    positiveObservations: current.obs,
    reflectionQuestions: current.questions,
    gentleSuggestions: current.suggestions,
    createdAt: new Date().toISOString(),
    modelUsed: 'gemini-3.8-flash (fallback)',
  };
}
