# Nouns Admin Dashboard

A comprehensive administrative dashboard for Nouns DAO, featuring AI-powered proposal analysis, treasury monitoring, and governance tools.

## Core Features

### 🤖 AI-Powered Proposal Analysis
- Multiple AI perspectives (Moderate, Hawkish, Innovative)
- Detailed compliance checking
- Risk assessment and scoring
- Automated modification suggestions

### 💰 Treasury Management
- Real-time treasury activity monitoring
- Transaction history tracking
- Balance monitoring across contracts
- Auction house integration

### 📊 Dashboard Overview
- Intuitive navigation
- Quick access to key tools
- Status monitoring
- Comprehensive data visualization

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Environment variables (see Configuration section)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-org/nouns-admin-dashboard.git
cd nouns-admin-dashboard
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Start the development server:
```bash
npm run dev
# or
yarn dev
```

## Configuration

Create a `.env.local` file with the following variables:

```env
# API Configuration
NEXT_PUBLIC_API_URL=your_api_url
NEXT_PUBLIC_SUBGRAPH_URL=your_subgraph_url

# AI Service Configuration
AI_SERVICE_KEY=your_ai_service_key
AI_MODEL_VERSION=your_model_version

# Web3 Configuration
NEXT_PUBLIC_RPC_URL=your_ethereum_rpc_url
```

## Project Structure

```
├── components/          # Reusable React components
├── hooks/              # Custom React hooks
├── pages/              # Next.js pages
│   ├── analyze.tsx     # Proposal analysis page
│   ├── treasury.tsx    # Treasury monitoring page
│   └── index.tsx       # Dashboard homepage
├── utils/              # Utility functions
├── types/              # TypeScript type definitions
└── public/             # Static assets
```

## Key Features Documentation

### Proposal Analysis

The analysis tool provides multiple AI perspectives:

- **Moderate Analysis**: Balanced evaluation focusing on compliance
- **Hawkish Analysis**: Strict interpretation of rules and risks
- **Innovative Analysis**: Forward-thinking perspective on proposals

### Treasury Monitoring

Real-time monitoring of:

- ETH and USDC transactions
- Contract interactions
- Auction house activity
- Balance changes

## Development

### Running Tests

```bash
npm test
# or
yarn test
```

### Building for Production

```bash
npm run build
# or
yarn build
```

### Deployment

The application is configured for deployment on Vercel:

```bash
vercel deploy
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please open an issue in the GitHub repository or contact the development team.