# VMEC Healthcare Web - Architecture & Status
- **Vercel Production URL**: https://vmec-healthcare-web.vercel.app
- **GitHub Repository**: Namnguyen3008/vmec-web-ui (main)
- **Supabase DB**: nntxlqchytvfmutmixea (2,670 vectors, 1,536 guardrails)
- **Google OAuth 2.0**: Client ID 542032071030-4qfe1tijf9tquebqlt0s46kmae8a02pt.apps.googleusercontent.com
- **Key Modules**:
  - `src/lib/api/chat.ts`: Triage Engine & Citations
  - `src/components/chat/ChatBubbles.tsx`: Medical Citations Card UI
  - `src/app/auth/callback/page.tsx`: Google OAuth2 callback handler
