import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { streamers } = req.body;

    const prompt = `You are a brand partnership analyst specializing in Twitch streaming and influencer marketing. I will provide you with three Twitch streamers to analyze for potential brand partnerships.

For each streamer, I need:
1. A concise summary of their potential value as a brand partner
2. Specific partnership recommendations and campaign ideas
3. A relevance score from 0-1 (with up to 2 decimal places) based on their overall brand partnership potential

Here are the streamers to analyze:
${streamers.map((s: any, i: number) => `
Streamer ${i + 1}: ${s.username}
Initial Match Score: ${s.probability}
`).join('\n')}

Provide your analysis in the following JSON format:
{
  "analyses": [
    {
      "username": "streamer1",
      "aiSummary": "A concise one-paragraph summary of their brand partnership potential",
      "aiRecommendation": "A short summary of specific partnership ideas and campaign recommendations",
      "relevanceScore": 0.85
    }
  ]
}

Focus on actionable insights and creative campaign ideas. Consider factors like:
- Audience engagement and demographics
- Content style and brand safety
- Partnership history and professionalism
- Potential ROI and reach
- Unique opportunities or niches

Return ONLY the JSON object with no additional text or explanation. Do not include any newlines or other control characters in the output. Do not include any speech marks inside the field values, use only single quotes.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CLAUDE_API_KEY!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-opus-20240229',
        max_tokens: 999,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API error:', errorText);
      throw new Error('Failed to analyze with Claude');
    }

    const claudeResponse = await response.json();
    const analysisText = claudeResponse.content[0].text;
    
    try {
      const parsedAnalysis = JSON.parse(analysisText);
      if (!parsedAnalysis.analyses || !Array.isArray(parsedAnalysis.analyses)) {
        throw new Error('Invalid analysis format');
      }
      return res.status(200).json(parsedAnalysis);
    } catch (error) {
      console.error('Failed to parse Claude response:', analysisText);
      return res.status(500).json({ 
        message: 'Failed to parse analysis response',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  } catch (error) {
    console.error('Error in analyze-streamers:', error);
    return res.status(500).json({ 
      message: 'Failed to analyze streamers',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}