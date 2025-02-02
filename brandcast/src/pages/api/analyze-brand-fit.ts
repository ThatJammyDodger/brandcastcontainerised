export const maxDuration = 60;

import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { streamer, company } = req.body;

    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CLAUDE_API_KEY!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-opus-20240229',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: `You are a brand partnership analyst specializing in influencer marketing and Twitch streaming. Analyze this streamer's fit for the company and provide a detailed brand partnership analysis.

Streamer Data:
${JSON.stringify(streamer, null, 2)}

Company Profile:
${JSON.stringify(company, null, 2)}

Provide a JSON response with three fields:
1. "aiSummary": A concise one-sentence overview of the streamer's key metrics and content focus
2. "aiRecommendation": A brief 120 word-ish analysis covering:
   - Audience alignment (demographics, interests, engagement)
   - Content synergy (how their content style/topics align with the brand)
   - Partnership potential (specific opportunities, campaign ideas)
   - Risk factors or considerations
   - ROI potential based on reach and engagement
3. "brandFitScore": A score from 0 to 10 (can include one decimal place) representing how well this streamer fits with the brand. Consider:
   - Audience match (demographics, interests)
   - Content alignment with brand
   - Engagement and reach
   - Brand safety and tone match
   - Partnership potential
   Base this score on your expert analysis, not a simple algorithm.

DO NOT USE BULLET POINTS. Use continuous prose and do not speak too robotically - be creative and natural in your analysis.

Return ONLY the JSON object with these three fields, no other text. Each field should be a STRING except brandFitScore which should be a NUMBER.`
        }]
      })
    });

    if (!response.ok) {
      console.error('Claude API error:', await response.text());
      throw new Error('Failed to analyze with Claude');
    }

    const claudeResponse = await response.json();
    
    try {
      // The response is in claudeResponse.content[0].text
      const analysis = JSON.parse(claudeResponse.content[0].text);
      
      // Validate the response has the required fields
      if (!analysis.aiSummary || !analysis.aiRecommendation || analysis.brandFitScore === undefined) {
        throw new Error('Invalid response format from Claude');
      }
      
      return res.status(200).json({
        aiSummary: analysis.aiSummary,
        aiRecommendation: analysis.aiRecommendation,
        relevanceScore: analysis.brandFitScore / 10 // Convert 0-10 score to 0-1 for consistency
      });
    } catch (parseError) {
      console.error('Failed to parse Claude response:', claudeResponse.content[0].text);
      throw new Error('Failed to parse brand analysis response');
    }
  } catch (error) {
    console.error('Brand analysis error:', error);
    return res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Failed to analyze brand fit',
      success: false 
    });
  }
} 