# InvoiceFlow - Support at Home Automation

## Overview
InvoiceFlow is a React + TypeScript application for invoice management with AI-powered auditing capabilities. It provides secure access to a Support at Home dashboard with features for invoice scanning, client management, compliance reports, and AI-assisted validation.

## Tech Stack
- **Frontend**: React 19 with TypeScript
- **Build Tool**: Vite 6
- **Styling**: Tailwind CSS (via CDN)
- **Charts**: Recharts
- **Icons**: Lucide React
- **Backend Services**: Supabase (authentication & database)
- **AI**: Google Gemini API for invoice auditing

## Project Structure
```
/
├── components/          # React components
│   ├── ClientDetail.tsx
│   ├── ClientList.tsx
│   ├── ComplianceReports.tsx
│   ├── Dashboard.tsx
│   ├── FloatingAgent.tsx
│   ├── HelpCenter.tsx
│   ├── InvoiceDetail.tsx
│   ├── InvoiceList.tsx
│   ├── InvoiceScanner.tsx
│   ├── Login.tsx
│   ├── Reports.tsx
│   ├── Settings.tsx
│   ├── Sidebar.tsx
│   └── ...
├── contexts/            # React contexts
│   ├── ChatContext.tsx
│   ├── NotificationContext.tsx
│   └── TenantContext.tsx
├── services/            # API and service integrations
│   ├── alayaCareService.ts
│   ├── dbService.ts
│   ├── emailService.ts
│   ├── geminiService.ts
│   ├── supabaseClient.ts
│   └── ...
├── App.tsx              # Main app component
├── index.tsx            # Entry point
├── index.html           # HTML template
├── types.ts             # TypeScript types
└── vite.config.ts       # Vite configuration
```

## Development
- **Dev Server**: `npm run dev` (runs on port 5000)
- **Build**: `npm run build`
- **Preview**: `npm run preview`

## Environment Variables
The app expects the following environment variables:
- `GEMINI_API_KEY` - Google Gemini API key for AI features
- Supabase credentials (configured in supabaseClient.ts)

## Deployment
Configured for static deployment with Vite build output in `dist/` directory.
