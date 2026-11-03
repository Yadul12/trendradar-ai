import { GoogleGenAI, Type } from '@google/genai';

function getAiClient() {
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export interface TrendAnalysisResult {
  verifiedSummary: string;
  whyGainingAttention: string;
  predictionMarketRelevance: string;
  audienceInterestAnalysis: string;
  suggestedContentAngle: string;
  recommendedPlatform: string;
  suggestedHook: string;
  scoreTrendRelevance: number;
  scoreRecency: number;
  scoreAudienceInterest: number;
  scoreEngagementPotential: number;
  scoreBrandRelevance: number;
  scoreExplanation: string;
  priority: string;
}

export async function analyzeTrendWithGemini(input: {
  title: string;
  category: string;
  sourceUrl: string;
  sourceType: string;
  contextNotes?: string;
}): Promise<TrendAnalysisResult> {
  const ai = getAiClient();

  const prompt = `Analyze the following emerging topic for Gravia, a prediction-market intelligence and financial analytics brand:
Topic Title: ${input.title}
Category: ${input.category}
Source URL: ${input.sourceUrl}
Source Type: ${input.sourceType}
Additional Context / Notes: ${input.contextNotes || 'None provided'}

CRITICAL INSTRUCTIONS:
1. Clearly separate verified factual context (based strictly on the provided topic/source without fabricating unverified real-time claims) from analytical commentary and market predictions.
2. Score each of the 5 opportunity dimensions from 0 to 100:
   - scoreTrendRelevance (25% weight)
   - scoreBrandRelevance (Relevance to Gravia's prediction market brand, 25% weight)
   - scoreRecency (20% weight)
   - scoreAudienceInterest (15% weight)
   - scoreEngagementPotential (15% weight)
3. Provide a clear, explainable breakdown in scoreExplanation showing how each factor contributes to the opportunity score.
4. Recommend the best social platform from: "X", "YouTube", "TikTok", "Instagram", "LinkedIn".
5. Assign priority from: "High", "Medium", "Low".`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: prompt,
    config: {
      systemInstruction:
        'You are the Lead Intelligence Architect at Gravia (TrendRadar AI). You produce rigorous, institutional-grade trend analyses for prediction markets, macroeconomics, cryptocurrency, global events, and internet culture. Never fabricate real-time statistics; clearly distinguish verified baseline context, analytical drivers, and forward-looking market predictions.',
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          verifiedSummary: {
            type: Type.STRING,
            description:
              'Short summary strictly stating the verified baseline context and source scope.',
          },
          whyGainingAttention: {
            type: Type.STRING,
            description:
              'Analytical explanation of why this topic is gaining traction across social and financial channels.',
          },
          predictionMarketRelevance: {
            type: Type.STRING,
            description:
              'How this topic affects prediction market event contracts, implied probabilities, or hedging demand.',
          },
          audienceInterestAnalysis: {
            type: Type.STRING,
            description:
              'Prediction of audience segment interest and expected engagement behavior.',
          },
          suggestedContentAngle: {
            type: Type.STRING,
            description: 'Specific editorial angle for Gravia content distribution.',
          },
          recommendedPlatform: {
            type: Type.STRING,
            description: 'One of: X, YouTube, TikTok, Instagram, LinkedIn',
          },
          suggestedHook: {
            type: Type.STRING,
            description: 'Compelling opening hook for a post or short-form video.',
          },
          scoreTrendRelevance: {
            type: Type.INTEGER,
            description: 'Score 0-100 for trend relevance.',
          },
          scoreRecency: {
            type: Type.INTEGER,
            description: 'Score 0-100 for recency and timing urgency.',
          },
          scoreAudienceInterest: {
            type: Type.INTEGER,
            description: 'Score 0-100 for target audience interest.',
          },
          scoreEngagementPotential: {
            type: Type.INTEGER,
            description: 'Score 0-100 for social engagement potential.',
          },
          scoreBrandRelevance: {
            type: Type.INTEGER,
            description: 'Score 0-100 for relevance to Gravia prediction market brand.',
          },
          scoreExplanation: {
            type: Type.STRING,
            description:
              'Explainable breakdown detailing how the 5 factors combine into the composite score.',
          },
          priority: {
            type: Type.STRING,
            description: 'One of: High, Medium, Low',
          },
        },
        required: [
          'verifiedSummary',
          'whyGainingAttention',
          'predictionMarketRelevance',
          'audienceInterestAnalysis',
          'suggestedContentAngle',
          'recommendedPlatform',
          'suggestedHook',
          'scoreTrendRelevance',
          'scoreRecency',
          'scoreAudienceInterest',
          'scoreEngagementPotential',
          'scoreBrandRelevance',
          'scoreExplanation',
          'priority',
        ],
      },
    },
  });

  const text = (response.text ?? '{}').trim();
  const parsed = JSON.parse(text) as TrendAnalysisResult;

  const clamp = (n: number) => Math.max(10, Math.min(100, Math.round(Number(n) || 75)));
  return {
    ...parsed,
    scoreTrendRelevance: clamp(parsed.scoreTrendRelevance),
    scoreRecency: clamp(parsed.scoreRecency),
    scoreAudienceInterest: clamp(parsed.scoreAudienceInterest),
    scoreEngagementPotential: clamp(parsed.scoreEngagementPotential),
    scoreBrandRelevance: clamp(parsed.scoreBrandRelevance),
    recommendedPlatform: ['X', 'YouTube', 'TikTok', 'Instagram', 'LinkedIn'].includes(
      parsed.recommendedPlatform
    )
      ? parsed.recommendedPlatform
      : 'X',
    priority: ['High', 'Medium', 'Low'].includes(parsed.priority)
      ? parsed.priority
      : 'High',
  };
}

export async function generateStrategicRecommendationsWithGemini(input: {
  trendsSummary: Array<{
    title: string;
    category: string;
    opportunityScore: number;
    recommendedPlatform: string;
    priority: string;
  }>;
  metricsSummary: Array<{
    platform: string;
    postTitle: string;
    category: string;
    contentFormat: string;
    reach: number;
    engagementRate: number;
    clickThroughRate: number;
    audienceRetention: number;
  }>;
}) {
  const ai = getAiClient();

  const prompt = `Analyze the following recorded TrendRadar AI dataset for Gravia (a prediction-market company) and generate 5 data-backed strategic recommendations.

ACTIVE MONITORED TRENDS:
${JSON.stringify(input.trendsSummary, null, 2)}

RECORDED SOCIAL PERFORMANCE METRICS:
${JSON.stringify(input.metricsSummary, null, 2)}

Generate exactly 5 recommendations, one for each of these exact recommendationType values:
1. "Topic Next" (Which topics should be covered next)
2. "Platform Priority" (Which platforms should receive priority)
3. "Format Winner" (What content formats are performing well)
4. "Underperforming Theme" (Which content themes are underperforming)
5. "Next Experiment" (What experiments should be conducted next)

Every recommendation MUST cite specific numbers, scores, engagement rates, CTRs, or categories from the provided data in its dataExplanation.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: prompt,
    config: {
      systemInstruction:
        'You are a Principal Data Analyst and Content Strategist for Gravia. Every recommendation you produce must be directly grounded in the provided trend scores and social performance telemetry.',
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            recommendationType: {
              type: Type.STRING,
              description:
                'Must be one of: Topic Next, Platform Priority, Format Winner, Underperforming Theme, Next Experiment',
            },
            title: {
              type: Type.STRING,
              description: 'Concise strategic recommendation headline.',
            },
            targetPlatform: {
              type: Type.STRING,
              description: 'One of: X, YouTube, TikTok, Instagram, LinkedIn',
            },
            impactEstimate: {
              type: Type.STRING,
              description: 'One of: High Impact, Medium Impact, Experimental',
            },
            dataExplanation: {
              type: Type.STRING,
              description:
                'Data-grounded explanation citing specific metrics, CTRs, retention rates, or opportunity scores from the input data.',
            },
            actionableStep: {
              type: Type.STRING,
              description: 'Concrete execution step for the editorial team.',
            },
          },
          required: [
            'recommendationType',
            'title',
            'targetPlatform',
            'impactEstimate',
            'dataExplanation',
            'actionableStep',
          ],
        },
      },
    },
  });

  const text = (response.text ?? '[]').trim();
  return JSON.parse(text) as Array<{
    recommendationType: string;
    title: string;
    targetPlatform: string;
    impactEstimate: string;
    dataExplanation: string;
    actionableStep: string;
  }>;
}
