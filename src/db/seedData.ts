export const INITIAL_KEYWORDS = [
  {
    keyword: 'FOMC Rate Cut Odds & Fed Dot Plot',
    category: 'Macro & Finance',
    priority: 'High',
    active: true,
  },
  {
    keyword: 'ETH Spot ETF Staking Approval Timeline',
    category: 'Cryptocurrency',
    priority: 'High',
    active: true,
  },
  {
    keyword: 'Sovereign AI Compute Export Controls',
    category: 'Global Events',
    priority: 'High',
    active: true,
  },
  {
    keyword: 'Prediction Market CFTC Event Contract Rulings',
    category: 'Prediction Markets',
    priority: 'High',
    active: true,
  },
  {
    keyword: 'Creator-Led Micro-Bets & Live Stream Polling',
    category: 'Social Media Trends',
    priority: 'Medium',
    active: true,
  },
  {
    keyword: 'Memecoin Liquidity Rotation vs Event Contracts',
    category: 'Internet Culture',
    priority: 'Medium',
    active: true,
  },
];

export const INITIAL_TRENDS = [
  {
    title: 'Federal Reserve Emergency Repo Facility Usage Spikes Ahead of CPI Print',
    category: 'Macro & Finance',
    sourceUrl: 'https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm',
    sourceType: 'Sample Demo Data',
    isVerifiedSource: true,
    priority: 'High',
    status: 'Peak Velocity',
    scoreTrendRelevance: 94,
    scoreRecency: 96,
    scoreAudienceInterest: 91,
    scoreEngagementPotential: 89,
    scoreBrandRelevance: 95,
    opportunityScore: 93,
    scoreExplanation:
      'Weighted 93/100: Macro rate contracts represent 38% of Gravia weekly volume. High recency (96) and brand alignment (95) make this an immediate tier-1 distribution priority.',
    verifiedSummary:
      '[DEMO DATA - VERIFIED BASELINE] Federal Reserve daily operations data published at 13:15 UTC shows overnight standing repo facility inquiries rose $14.2B week-over-week ahead of the upcoming Consumer Price Index release.',
    whyGainingAttention:
      'Macro desks and fixed-income analysts on X and LinkedIn are debating whether short-term funding tightness will force a dovish shift in the next FOMC statement.',
    predictionMarketRelevance:
      'Direct repricing catalyst for "25bps vs 50bps Cut at Next FOMC" and "US Headline CPI YoY > 2.6%" event contracts. Order book depth increased 42% in 6 hours.',
    audienceInterestAnalysis:
      'High institutional and retail trader crossover. Historical data shows macro probability breakdown charts generate 2.4x higher save rates than text-only commentary.',
    suggestedContentAngle:
      'Compare implied Treasury futures probabilities against Gravia live prediction market order book odds to highlight where retail and institutional consensus diverge.',
    recommendedPlatform: 'X',
    suggestedHook:
      'Bond traders and prediction markets just diverged by 18 percentage points on next month’s Fed decision. Here is what the repo liquidity data actually shows:',
    supportingLinks: JSON.stringify([
      {
        title: 'Federal Reserve FOMC Calendar & Releases',
        url: 'https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm',
        verified: true,
      },
      {
        title: 'BLS CPI Release Schedule',
        url: 'https://www.bls.gov/cpi/',
        verified: true,
      },
    ]),
    detectedAt: '2026-11-02 14:20 UTC',
  },
  {
    title: 'Institutional Hedging via Regulated Event Contracts Surpasses $1.8B Monthly Notional',
    category: 'Prediction Markets',
    sourceUrl: 'https://www.cftc.gov/PressRoom/PressReleases',
    sourceType: 'Sample Demo Data',
    isVerifiedSource: true,
    priority: 'High',
    status: 'Emerging',
    scoreTrendRelevance: 96,
    scoreRecency: 88,
    scoreAudienceInterest: 87,
    scoreEngagementPotential: 92,
    scoreBrandRelevance: 98,
    opportunityScore: 92,
    scoreExplanation:
      'Weighted 92/100: Maximum Gravia brand relevance (98/100) and trend relevance (96/100). Demonstrates prediction markets maturing into an institutional hedging asset class.',
    verifiedSummary:
      '[DEMO DATA - VERIFIED BASELINE] Publicly filed clearinghouse volume disclosures indicate regulated event contracts across macro, energy, and geopolitical outcomes exceeded $1.8B in monthly notional turnover.',
    whyGainingAttention:
      'Fintech newsletters and quantitative portfolio managers are sharing case studies of using binary event contracts to hedge supply-chain and tariff risks with zero basis drift.',
    predictionMarketRelevance:
      'Validates Gravia core thesis: prediction markets are information aggregation engines for real-world corporate risk management, not just retail speculation.',
    audienceInterestAnalysis:
      'Strong resonance on LinkedIn and YouTube among fintech executives, quant researchers, and macro allocators seeking B2B hedging workflows.',
    suggestedContentAngle:
      'Publish a 3-slide visual case study showing how a logistics firm hedges Red Sea transit delays or tariff announcements using binary outcome contracts.',
    recommendedPlatform: 'LinkedIn',
    suggestedHook:
      'Why are supply-chain CFOs watching prediction market order books before earnings calls? A breakdown of the $1.8B shift toward event-based hedging:',
    supportingLinks: JSON.stringify([
      {
        title: 'CFTC Market Data & Public Filings',
        url: 'https://www.cftc.gov/MarketReports/index.htm',
        verified: true,
      },
    ]),
    detectedAt: '2026-11-02 09:45 UTC',
  },
  {
    title: 'Solana & L2 Restaking Protocols Introduce On-Chain Oracle Resolution Benchmarks',
    category: 'Cryptocurrency',
    sourceUrl: 'https://defillama.com/oracles',
    sourceType: 'Sample Demo Data',
    isVerifiedSource: true,
    priority: 'High',
    status: 'Peak Velocity',
    scoreTrendRelevance: 89,
    scoreRecency: 92,
    scoreAudienceInterest: 90,
    scoreEngagementPotential: 88,
    scoreBrandRelevance: 86,
    opportunityScore: 89,
    scoreExplanation:
      'Weighted 89/100: High recency (92) and crypto-native audience interest (90). Directly addresses settlement speed and oracle dispute resolution in prediction markets.',
    verifiedSummary:
      '[DEMO DATA - VERIFIED BASELINE] Total Value Secured (TVS) across optimistic and cryptographic oracle networks rose 19% over the past 14 days following new sub-second dispute resolution upgrades.',
    whyGainingAttention:
      'Crypto developers and prediction market traders are scrutinized over how high-value ambiguous markets resolve without governance latency.',
    predictionMarketRelevance:
      'Settlement integrity is the #1 trust factor for crypto prediction market participants. Highlighting deterministic resolution criteria builds user confidence.',
    audienceInterestAnalysis:
      'DeFi and crypto-native audiences on X and YouTube engage heavily with technical explainer threads comparing oracle dispute mechanisms.',
    suggestedContentAngle:
      'Technical deep-dive comparing human committee arbitration vs. cryptographic data attestation in high-volume market settlements.',
    recommendedPlatform: 'YouTube',
    suggestedHook:
      'When $50M rides on a single word in a press release, who decides the truth? Inside the oracle architecture powering modern prediction markets:',
    supportingLinks: JSON.stringify([
      {
        title: 'DeFiLlama Oracle TVS Metrics',
        url: 'https://defillama.com/oracles',
        verified: true,
      },
    ]),
    detectedAt: '2026-11-01 18:10 UTC',
  },
  {
    title: 'EU AI Act Compute Threshold Audits Trigger Semiconductor Supply Chain Repricing',
    category: 'Global Events',
    sourceUrl: 'https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai',
    sourceType: 'Sample Demo Data',
    isVerifiedSource: true,
    priority: 'Medium',
    status: 'Sustained',
    scoreTrendRelevance: 84,
    scoreRecency: 82,
    scoreAudienceInterest: 81,
    scoreEngagementPotential: 79,
    scoreBrandRelevance: 85,
    opportunityScore: 82,
    scoreExplanation:
      'Weighted 82/100: Strong relevance to Gravia tech & geopolitical market categories (85). Sustained multi-week narrative ideal for analytical video breakdowns.',
    verifiedSummary:
      '[DEMO DATA - VERIFIED BASELINE] European AI Office published updated compliance guidelines for frontier models exceeding 10^25 FLOPs, establishing mandatory reporting milestones.',
    whyGainingAttention:
      'AI researchers and tech policy analysts are debating whether frontier lab release schedules in Q1 will shift to accommodate compliance audits.',
    predictionMarketRelevance:
      'Impacts active markets on frontier AI model release dates, semiconductor quarterly revenue targets, and regulatory milestone contracts.',
    audienceInterestAnalysis:
      'AI builders and tech investors actively share timeline probability graphics tracking frontier model release windows.',
    suggestedContentAngle:
      'Map out the exact probability curve for next-gen frontier model releases in Q4/Q1 based on regulatory filing windows.',
    recommendedPlatform: 'X',
    suggestedHook:
      'Will compliance filings leak the next frontier AI launch date before the press release? Here is what prediction markets are pricing in:',
    supportingLinks: JSON.stringify([
      {
        title: 'European Commission AI Regulatory Framework',
        url: 'https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai',
        verified: true,
      },
    ]),
    detectedAt: '2026-10-31 11:30 UTC',
  },
  {
    title: 'Live-Streamed "Fact-Check by Odds" Clips Go Viral on Short-Form Video Platforms',
    category: 'Internet Culture',
    sourceUrl: 'https://trends.google.com/trends/',
    sourceType: 'Sample Demo Data',
    isVerifiedSource: false,
    priority: 'Medium',
    status: 'Emerging',
    scoreTrendRelevance: 86,
    scoreRecency: 90,
    scoreAudienceInterest: 93,
    scoreEngagementPotential: 95,
    scoreBrandRelevance: 88,
    opportunityScore: 90,
    scoreExplanation:
      'Weighted 90/100: Exceptional engagement potential (95) and audience interest (93) on TikTok and Instagram Reels. Organic format perfectly showcases Gravia real-time charts.',
    verifiedSummary:
      '[DEMO DATA - VERIFIED BASELINE] Short-form creators overlaying live prediction market probability charts onto breaking news clips recorded a 3.1x surge in hashtag usage over 7 days.',
    whyGainingAttention:
      'Gen-Z and millennial audiences increasingly distrust pundit commentary and look at real-money probability curves as an instant "skin-in-the-game" fact check.',
    predictionMarketRelevance:
      'Positions Gravia probability charts as the default visual overlay for creators reacting to earnings, sports, policy, and pop-culture events.',
    audienceInterestAnalysis:
      'Extremely high completion rate (68%+ audience retention) on vertical 35-second split-screen videos showing odds moving in real time.',
    suggestedContentAngle:
      'Create a downloadable "Live Odds Green-Screen Kit" and publish a series of 30-second reaction breakdowns of the week’s biggest probability swings.',
    recommendedPlatform: 'TikTok',
    suggestedHook:
      'Watch the exact second the market realized the rumor was false—live probability swing from 74% to 12% in 90 seconds:',
    supportingLinks: JSON.stringify([
      {
        title: 'Google Trends Search Interest Index',
        url: 'https://trends.google.com/trends/',
        verified: true,
      },
    ]),
    detectedAt: '2026-11-02 16:05 UTC',
  },
  {
    title: 'Creator-Led Community Tournaments Drive Micro-Forecasting Leaderboards',
    category: 'Social Media Trends',
    sourceUrl: 'https://www.youtube.com/trends/',
    sourceType: 'Sample Demo Data',
    isVerifiedSource: false,
    priority: 'Low',
    status: 'Sustained',
    scoreTrendRelevance: 76,
    scoreRecency: 78,
    scoreAudienceInterest: 82,
    scoreEngagementPotential: 84,
    scoreBrandRelevance: 79,
    opportunityScore: 80,
    scoreExplanation:
      'Weighted 80/100: Solid community engagement driver (84) for Instagram Carousels and YouTube Community polls, building top-of-funnel forecasting literacy.',
    verifiedSummary:
      '[DEMO DATA - VERIFIED BASELINE] Finance and macro creators hosting monthly forecasting accuracy leaderboards among their subscribers have grown participation by 28% month-over-month.',
    whyGainingAttention:
      'Audiences want verifiable track records from commentators ("show your Brier score") rather than unverified hot takes.',
    predictionMarketRelevance:
      'Introduces calibration and probabilistic thinking to broader social audiences, converting passive viewers into active forecasters.',
    audienceInterestAnalysis:
      'Interactive carousel quizzes ("What probability would you assign?") drive 3.4x higher comment velocity on Instagram and LinkedIn.',
    suggestedContentAngle:
      'Launch a weekly "Forecaster Calibration Challenge" carousel comparing community poll results against live Gravia market probabilities.',
    recommendedPlatform: 'Instagram',
    suggestedHook:
      '90% of commentators got last week’s macro print wrong—but top calibrated forecasters priced it at 78% three days early. How does your forecast compare?',
    supportingLinks: JSON.stringify([
      {
        title: 'YouTube Culture & Trends Report',
        url: 'https://www.youtube.com/trends/',
        verified: true,
      },
    ]),
    detectedAt: '2026-10-29 12:00 UTC',
  },
];

export const INITIAL_SOCIAL_METRICS = [
  {
    platform: 'X',
    postTitle: 'FOMC Rate Cut Implied Probability Breakdown vs Treasury Futures',
    category: 'Macro & Finance',
    contentFormat: 'Data Chart Graphic',
    publishedDate: '2026-10-12',
    reach: 148200,
    impressions: 215400,
    likes: 4820,
    comments: 612,
    shares: 1390,
    engagementRate: 4.6,
    clickThroughRate: 3.1,
    audienceRetention: 78.5,
    dataOrigin: 'Sample Demo Data',
  },
  {
    platform: 'TikTok',
    postTitle: '90-Second Replay: How the Market Priced the CPI Surprise in Real Time',
    category: 'Prediction Markets',
    contentFormat: 'Short-Form Video',
    publishedDate: '2026-10-15',
    reach: 312000,
    impressions: 389000,
    likes: 24600,
    comments: 1420,
    shares: 5180,
    engagementRate: 8.02,
    clickThroughRate: 1.9,
    audienceRetention: 71.4,
    dataOrigin: 'Sample Demo Data',
  },
  {
    platform: 'LinkedIn',
    postTitle: 'How Supply-Chain CFOs Use Regulated Event Contracts to Hedge Tariff Risk',
    category: 'Prediction Markets',
    contentFormat: 'Carousel',
    publishedDate: '2026-10-18',
    reach: 64500,
    impressions: 89200,
    likes: 2190,
    comments: 348,
    shares: 615,
    engagementRate: 4.89,
    clickThroughRate: 3.85,
    audienceRetention: 82.0,
    dataOrigin: 'Sample Demo Data',
  },
  {
    platform: 'YouTube',
    postTitle: 'Inside Oracle Resolution: How $100M Prediction Markets Settle Deterministic Truth',
    category: 'Cryptocurrency',
    contentFormat: 'Live Stream / Breakdown',
    publishedDate: '2026-10-21',
    reach: 92400,
    impressions: 134000,
    likes: 5840,
    comments: 790,
    shares: 1120,
    engagementRate: 6.29,
    clickThroughRate: 4.4,
    audienceRetention: 64.8,
    dataOrigin: 'Sample Demo Data',
  },
  {
    platform: 'Instagram',
    postTitle: 'Weekly Forecaster Calibration Challenge: 5 Global Events Changing Odds',
    category: 'Global Events',
    contentFormat: 'Carousel',
    publishedDate: '2026-10-24',
    reach: 78900,
    impressions: 104500,
    likes: 4120,
    comments: 530,
    shares: 980,
    engagementRate: 5.39,
    clickThroughRate: 2.15,
    audienceRetention: 74.2,
    dataOrigin: 'Sample Demo Data',
  },
  {
    platform: 'X',
    postTitle: 'ETH ETF Staking Odds & On-Chain Validator Queue Correlation Thread',
    category: 'Cryptocurrency',
    contentFormat: 'Thread / Long-Form Post',
    publishedDate: '2026-10-27',
    reach: 184500,
    impressions: 268000,
    likes: 6490,
    comments: 845,
    shares: 1920,
    engagementRate: 5.02,
    clickThroughRate: 3.62,
    audienceRetention: 79.1,
    dataOrigin: 'Sample Demo Data',
  },
  {
    platform: 'TikTok',
    postTitle: 'Pundits vs. Prediction Markets: Why Skin-in-the-Game Beat Polls Again',
    category: 'Internet Culture',
    contentFormat: 'Short-Form Video',
    publishedDate: '2026-10-30',
    reach: 428000,
    impressions: 512000,
    likes: 36400,
    comments: 2310,
    shares: 8420,
    engagementRate: 9.2,
    clickThroughRate: 2.45,
    audienceRetention: 75.6,
    dataOrigin: 'Sample Demo Data',
  },
  {
    platform: 'YouTube',
    postTitle: 'Q4 Macro & Geopolitical Risk Radar: Top 10 Mispriced Event Contracts',
    category: 'Macro & Finance',
    contentFormat: 'Live Stream / Breakdown',
    publishedDate: '2026-11-01',
    reach: 118000,
    impressions: 169000,
    likes: 7420,
    comments: 960,
    shares: 1540,
    engagementRate: 5.87,
    clickThroughRate: 4.75,
    audienceRetention: 68.9,
    dataOrigin: 'Sample Demo Data',
  },
];

export const INITIAL_RECOMMENDATIONS = [
  {
    recommendationType: 'Topic Next',
    title: 'Prioritize FOMC Repo Liquidity & CPI Implied Probability Divergence',
    targetPlatform: 'X',
    impactEstimate: 'High Impact',
    dataExplanation:
      'Trend carries a 93/100 Opportunity Score (95 Brand Relevance, 96 Recency). Macro & Finance posts on X currently average a 3.36% CTR and 166K reach in recorded performance data.',
    actionableStep:
      'Publish a 5-part thread with dual-axis probability charts comparing Treasury futures vs. Gravia order book depth 24 hours before the CPI print.',
  },
  {
    recommendationType: 'Platform Priority',
    title: 'Scale Vertical Odds-Reaction Video Distribution on TikTok & YouTube',
    targetPlatform: 'TikTok',
    impactEstimate: 'High Impact',
    dataExplanation:
      'TikTok delivers the highest recorded engagement rate (8.61% average across sample dataset) and 370K average reach per video, while YouTube drives the highest click-through rate (4.58% average CTR).',
    actionableStep:
      'Allocate 40% of weekly production bandwidth to 60-second TikTok probability replay clips and repurpose them as YouTube Shorts with deep-dive links.',
  },
  {
    recommendationType: 'Format Winner',
    title: 'Double Down on Data Chart Graphics & Interactive B2B Carousels',
    targetPlatform: 'LinkedIn',
    impactEstimate: 'High Impact',
    dataExplanation:
      'LinkedIn Carousels and X Data Chart Graphics achieve 80.2% average audience retention and 3.48% CTR—outperforming generic text updates by 2.1x in link clicks.',
    actionableStep:
      'Standardize a 4-slide "Institutional Hedging Case Study" carousel template for LinkedIn every Tuesday and Thursday.',
  },
  {
    recommendationType: 'Underperforming Theme',
    title: 'Refine Generic Global Event Recaps into Specific Contract Mispricing Angles',
    targetPlatform: 'Instagram',
    impactEstimate: 'Medium Impact',
    dataExplanation:
      'Broad Global Events recaps show lower click-through rates (2.15% CTR) compared to specific Prediction Market or Cryptocurrency contract breakdowns (3.85%–4.75% CTR).',
    actionableStep:
      'Replace broad news summaries on Instagram with interactive "What Odds Would You Assign?" calibration carousels tied to a specific binary milestone.',
  },
  {
    recommendationType: 'Next Experiment',
    title: 'A/B Test Live 90-Second "Order Book Tape Replay" With Creator Green-Screen Kit',
    targetPlatform: 'YouTube',
    impactEstimate: 'Experimental',
    dataExplanation:
      'Internet Culture trends around "Fact-Check by Odds" scored 95/100 in Engagement Potential. Combining TikTok’s 75.6% retention hook style with YouTube’s 4.75% CTR funnel presents a high-upside conversion test.',
    actionableStep:
      'Run a 7-day experiment publishing 3 side-by-side "Press Conference vs. Live Market Probability" clips and measure referral CTR against baseline threads.',
  },
];

export const INITIAL_CALENDAR_ITEMS = [
  {
    title: 'FOMC Repo Spike vs. CPI Implied Odds Divergence Thread',
    scheduledDate: '2026-11-04',
    scheduledTime: '13:30 UTC',
    platform: 'X',
    contentFormat: 'Data Chart Graphic',
    status: 'Scheduled',
    priority: 'High',
    category: 'Macro & Finance',
    hookDraft:
      'Bond traders and prediction markets just diverged by 18 percentage points on next month’s Fed decision. Here is what the repo liquidity data actually shows:',
    checklistJson: JSON.stringify([
      { id: 'c1', label: 'Verify Federal Reserve repo source link & timestamp', done: true },
      { id: 'c2', label: 'Separate verified BLS/Fed facts from market predictions', done: true },
      { id: 'c3', label: 'Export high-contrast dual-axis Gravia probability chart', done: true },
      { id: 'c4', label: 'Attach UTM tracking parameter for market contract link', done: false },
    ]),
  },
  {
    title: '90-Second Replay: How Live Odds Priced the Macro Print in Real Time',
    scheduledDate: '2026-11-05',
    scheduledTime: '16:00 UTC',
    platform: 'TikTok',
    contentFormat: 'Short-Form Video',
    status: 'Drafting',
    priority: 'High',
    category: 'Internet Culture',
    hookDraft:
      'Watch the exact second the market realized the rumor was false—live probability swing from 74% to 12% in 90 seconds:',
    checklistJson: JSON.stringify([
      { id: 'c1', label: 'Verify timestamped order-book replay capture', done: true },
      { id: 'c2', label: 'Add on-screen disclaimer separating historical data from advice', done: true },
      { id: 'c3', label: 'Render 9:16 captions with tabular probability callouts', done: false },
      { id: 'c4', label: 'Cross-post vertical cut to YouTube Shorts & Reels', done: false },
    ]),
  },
  {
    title: 'Institutional Hedging Case Study: $1.8B Regulated Event Contract Milestone',
    scheduledDate: '2026-11-06',
    scheduledTime: '14:00 UTC',
    platform: 'LinkedIn',
    contentFormat: 'Carousel',
    status: 'Review',
    priority: 'High',
    category: 'Prediction Markets',
    hookDraft:
      'Why are supply-chain CFOs watching prediction market order books before earnings calls? A breakdown of the $1.8B shift toward event-based hedging:',
    checklistJson: JSON.stringify([
      { id: 'c1', label: 'Cite CFTC clearinghouse volume disclosure report', done: true },
      { id: 'c2', label: 'Review 4-slide PDF layout for mobile legibility', done: true },
      { id: 'c3', label: 'Include B2B institutional research whitepaper link', done: false },
      { id: 'c4', label: 'Schedule executive team comment amplification', done: false },
    ]),
  },
  {
    title: 'Oracle Dispute Architecture: How Cryptographic Attestation Settles Markets',
    scheduledDate: '2026-11-08',
    scheduledTime: '17:00 UTC',
    platform: 'YouTube',
    contentFormat: 'Live Stream / Breakdown',
    status: 'Ideation',
    priority: 'Medium',
    category: 'Cryptocurrency',
    hookDraft:
      'When $50M rides on a single word in a press release, who decides the truth? Inside the oracle architecture powering modern prediction markets:',
    checklistJson: JSON.stringify([
      { id: 'c1', label: 'Verify DeFiLlama TVS oracle metrics & protocol docs', done: true },
      { id: 'c2', label: 'Prepare architecture diagram comparing dispute windows', done: false },
      { id: 'c3', label: 'Record 12-minute technical walkthrough', done: false },
      { id: 'c4', label: 'Add chapter markers & source citations in description', done: false },
    ]),
  },
];
