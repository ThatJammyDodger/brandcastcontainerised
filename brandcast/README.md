# Brandcast - AI-Powered Streamer Partnership Platform

Brandcast helps companies find and evaluate Twitch streamers for brand partnerships using AI analysis. Get instant brand fit scores, partnership recommendations, and detailed analysis powered by Claude AI.

![Brandcast Demo](public/images/logo-dark.png)

## ✨ Key Features

### Streamer Discovery & Analysis
- **Smart Explore**: Discover new streamers with AI analysis from multiple brand perspectives
- **Brand Fit Scoring**: Get detailed compatibility scores and recommendations
- **Multi-Brand Analysis**: See how streamers match with different industries (Tech, Food, Fashion)
- **Historical Tracking**: Keep track of analyzed streamers and their performance

### AI-Powered Insights
- **Automated Analysis**: Get instant AI analysis of streamer-brand fit
- **Partnership Recommendations**: Receive specific campaign ideas and opportunities
- **Risk Assessment**: Identify potential challenges before partnerships
- **Audience Alignment**: Understand demographic and interest matching

### Company Profile Management
- **Custom Brand Profiles**: Set up your company's preferences and requirements
- **Target Audience**: Define your ideal viewer demographics and interests
- **Brand Voice**: Specify your brand's tone and marketing style

## 🚀 Quick Start

### Prerequisites
```bash
Node.js >= 18
Firebase Account
Anthropic API Key (Claude)
```

### Setup
1. Clone and install:
```bash
git clone https://github.com/yourusername/brandcast.git
cd brandcast
npm install
```

2. Create `.env.local`:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
CLAUDE_API_KEY=your_claude_key
```

3. Run it:
```bash
npm run dev
```

Visit `http://localhost:3000` and sign in to start exploring streamers!

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js + React
- **UI**: Chakra UI
- **Auth/Database**: Firebase
- **AI**: Claude 3 Opus
- **State**: React Context

### Key Components
```
src/
├── components/          # UI components
│   ├── Layout.tsx      # Main app layout
│   └── StreamerCard.tsx # Streamer display card
├── pages/
│   ├── api/            # API routes
│   │   ├── analyze-brand-fit.ts   # AI analysis endpoint
│   │   └── get-random-streamers.ts # Streamer discovery
│   ├── explore.tsx     # Streamer discovery page
│   └── evaluate.tsx    # Detailed analysis page
├── hooks/
│   └── useStreamers.ts # Streamer data management
└── utils/
    └── scoring.ts      # Scoring algorithms
```

## 🔍 How It Works

1. **Streamer Discovery**
   - Fetch random streamers not yet analyzed
   - Filter based on user's analysis history
   - Present 3 new potential partnerships

2. **Brand Analysis**
   - Send streamer data to Claude AI
   - Analyze fit with different brand types
   - Generate scores and recommendations

3. **Scoring System**
   - Brand Fit Score (0-10): Compatibility with specific brand
   - Reach Score (0-10): Overall influence and audience
   - Combined Score: Weighted average for ranking

## 🛠️ Development

### Running Tests
```bash
npm run test
```

### Local Development
```bash
npm run dev
```

### Building for Production
```bash
npm run build
npm start
```

## 📝 API Endpoints

### `GET /api/get-random-streamers`
Get new streamers for analysis
```typescript
Query: { userId: string }
Response: Streamer[]
```

### `POST /api/analyze-brand-fit`
Get AI analysis for streamer-brand fit
```typescript
Body: {
  streamer: Streamer
  company?: CompanyProfile
  companyIndex?: number
}
Response: {
  aiSummary: string
  aiRecommendation: string
  relevanceScore: number
}
```

## 🤝 Contributing

1. Fork the repo
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) for details

## 🙏 Acknowledgments

- [Chakra UI](https://chakra-ui.com/) for the beautiful components
- [Firebase](https://firebase.google.com/) for backend services
- [Anthropic](https://www.anthropic.com/) for Claude AI
- [Next.js](https://nextjs.org/) team for the framework
