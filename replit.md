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
- `VITE_GEMINI_API_KEY` - Google Gemini API key for AI features
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- `VITE_GOOGLE_CLIENT_ID` - (Optional) Google OAuth Client ID for SSO

## OAuth Configuration (Google & Microsoft Login)

The app supports Google and Microsoft (Azure AD) SSO login. These require configuration in your Supabase dashboard.

### Enabling Google OAuth

1. **Go to Supabase Dashboard**: Navigate to your project → Authentication → Providers
2. **Enable Google**: Click on Google provider and toggle it ON
3. **Configure Google Cloud Console**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create OAuth 2.0 credentials (Web Application type)
   - Add authorized redirect URI: `https://<your-supabase-project>.supabase.co/auth/v1/callback`
   - Copy the Client ID and Client Secret
4. **Add to Supabase**: Paste the Client ID and Client Secret in the Supabase Google provider settings
5. **Save** the configuration

### Enabling Microsoft (Azure AD) OAuth

1. **Go to Supabase Dashboard**: Navigate to your project → Authentication → Providers
2. **Enable Azure (Microsoft)**: Click on Azure provider and toggle it ON
3. **Configure Azure Portal**:
   - Go to [Azure Portal](https://portal.azure.com/) → Azure Active Directory → App registrations
   - Create a new registration
   - Add redirect URI: `https://<your-supabase-project>.supabase.co/auth/v1/callback`
   - Create a client secret under "Certificates & secrets"
   - Copy the Application (Client) ID and Client Secret
4. **Add to Supabase**: Paste the Client ID and Client Secret in the Supabase Azure provider settings
5. **Save** the configuration

### Troubleshooting

- **"provider is not enabled" error**: The OAuth provider hasn't been enabled in Supabase dashboard
- **Redirect errors**: Ensure the callback URL exactly matches what's configured in Google/Azure
- **Scope issues**: The app requests `email profile` scopes by default

## Admin Invitation System

When creating a new organization, the system can send invitation emails to the initial admin:

1. A secure invitation is created via Supabase's `signInWithOtp` which stores tenant/role info in trusted `user_metadata`
2. Supabase sends a magic link email to the admin
3. The admin clicks the link and Supabase creates their session with the trusted metadata
4. The Login component reads the trusted `user_metadata` (tenant_id, role) from the Supabase session
5. The admin is automatically logged into their assigned organization

**Security Note**: Tenant/role assignment uses Supabase's trusted `user_metadata` (set server-side during invitation), NOT the URL token. The URL token is only used for UX hints (welcome message, email pre-fill) and cannot be used to bypass authorization.

The invitation service is located at `services/invitationService.ts`.

## Deployment
Configured for static deployment with Vite build output in `dist/` directory.
