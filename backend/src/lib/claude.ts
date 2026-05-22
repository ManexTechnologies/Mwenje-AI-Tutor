import axios from 'axios'

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/complete'

export async function askClaude(prompt: string, subject: string) {
  if (!process.env.CLAUDE_API_KEY) {
    return {
      reply: `Mwenje stub: I can help you with ${subject}. Please configure CLAUDE_API_KEY to enable the full AI tutor experience.`,
      prompt,
      subject
    }
  }

  const systemPrompt = `You are Mwenje, a warm and brilliant AI tutor helping a high school student in Zimbabwe. Answer clearly and gently with step-by-step explanations. Subject: ${subject}.`

  const response = await axios.post(
    CLAUDE_API_URL,
    {
      model: 'claude-sonnet-4-20250514',
      prompt: `${systemPrompt}\n\n${prompt}`,
      max_tokens_to_sample: 800
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.CLAUDE_API_KEY}`
      }
    }
  )

  return response.data
}
