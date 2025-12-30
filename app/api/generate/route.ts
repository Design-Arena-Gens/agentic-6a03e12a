import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export const runtime = 'nodejs'
export const maxDuration = 60

const crimeStoryPrompts = [
  "Generate a true crime story about a mysterious disappearance in a small American town in the 1980s",
  "Create a true crime story about an unsolved bank heist in the 1970s with intricate planning",
  "Generate a true crime story about a cold case murder investigation that was solved decades later using DNA evidence",
  "Create a true crime story about an infamous con artist who orchestrated elaborate fraud schemes",
  "Generate a true crime story about a serial burglar who targeted wealthy neighborhoods in the 1990s",
  "Create a true crime story about a kidnapping case with an unexpected twist",
  "Generate a true crime story about corporate espionage and white-collar crime",
  "Create a true crime story about a mysterious death that was initially ruled an accident",
  "Generate a true crime story about art theft from a prestigious museum",
  "Create a true crime story about witness protection and organized crime in the mob era"
]

export async function POST(req: NextRequest) {
  try {
    const { apiKey, customPrompt } = await req.json()

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      )
    }

    const openai = new OpenAI({ apiKey })

    const storyPrompt = customPrompt || crimeStoryPrompts[Math.floor(Math.random() * crimeStoryPrompts.length)]

    // Step 1: Generate the crime story script
    const scriptCompletion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are an expert true crime storyteller for YouTube. Create engaging, dramatic, and well-researched true crime stories in English.

Your stories should:
- Be 8-12 minutes when narrated (approximately 1200-1800 words)
- Follow a clear narrative structure: setup, investigation, revelation, conclusion
- Include specific dates, locations, and character names (fictional but realistic)
- Build suspense and maintain viewer engagement
- Be factually plausible and respectful to real crime victims
- Include interesting twists and investigative details
- Use dramatic but professional language suitable for YouTube

Format the story as a complete video script with clear sections.`
        },
        {
          role: 'user',
          content: storyPrompt
        }
      ],
      temperature: 0.8,
      max_tokens: 3000
    })

    const script = scriptCompletion.choices[0]?.message?.content || ''

    // Step 2: Generate video title
    const titleCompletion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at creating compelling YouTube video titles for true crime content. Create titles that are attention-grabbing, mysterious, and SEO-friendly. Maximum 60 characters.'
        },
        {
          role: 'user',
          content: `Based on this true crime story, create an engaging YouTube video title:\n\n${script.substring(0, 500)}...`
        }
      ],
      temperature: 0.7,
      max_tokens: 100
    })

    const title = titleCompletion.choices[0]?.message?.content?.trim() || 'Untitled Crime Story'

    // Step 3: Generate scene descriptions for visuals
    const scenesCompletion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are a video production expert. Break down the story into 8-12 key visual scenes that would work for a YouTube video.

Each scene description should:
- Be detailed enough for stock footage selection or AI image generation
- Include time period, location, mood, and key visual elements
- Be suitable for dramatic crime documentary footage
- Avoid graphic violence but maintain suspense

Format: Return ONLY a JSON array of scene description strings.`
        },
        {
          role: 'user',
          content: `Create visual scene descriptions for this true crime story:\n\n${script}`
        }
      ],
      temperature: 0.7,
      max_tokens: 1500
    })

    let sceneDescriptions: string[] = []
    try {
      const scenesContent = scenesCompletion.choices[0]?.message?.content || '[]'
      sceneDescriptions = JSON.parse(scenesContent)
    } catch {
      // Fallback if JSON parsing fails
      const scenesText = scenesCompletion.choices[0]?.message?.content || ''
      sceneDescriptions = scenesText
        .split('\n')
        .filter(line => line.trim().length > 20)
        .slice(0, 10)
    }

    // Step 4: Generate narration script (optimized for voice-over)
    const narrationCompletion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are a professional voice-over script writer for true crime documentaries. Convert the story into a natural, conversational narration script.

The narration should:
- Sound natural when read aloud
- Use dramatic pauses (indicated by "...")
- Include emphasis markers (CAPS for stressed words)
- Have clear pacing and rhythm
- Be approximately 8-12 minutes when narrated at normal pace
- Include intro hook and outro call-to-action

Format with clear paragraph breaks for pacing.`
        },
        {
          role: 'user',
          content: `Convert this crime story into a professional narration script:\n\n${script}`
        }
      ],
      temperature: 0.7,
      max_tokens: 3000
    })

    const narration = narrationCompletion.choices[0]?.message?.content || ''

    return NextResponse.json({
      title,
      script,
      sceneDescriptions,
      narration,
      wordCount: script.split(/\s+/).length,
      estimatedDuration: `${Math.round(script.split(/\s+/).length / 150)}-${Math.round(script.split(/\s+/).length / 130)} minutes`
    })

  } catch (error: any) {
    console.error('Error generating video:', error)
    return NextResponse.json(
      {
        error: error?.message || 'Failed to generate video content',
        details: error?.response?.data || error?.toString()
      },
      { status: 500 }
    )
  }
}
