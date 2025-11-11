# Discord Class Notifier Dashboard

A 24/7 Discord bot with web dashboard for managing class schedules and automated reminders.

## Features

### Core Functionality
- **Automated Reminders**: Discord bot sends reminders 10 minutes before and at class start time
- **Public Schedule Viewer**: Anyone can view the weekly class schedule in a beautiful calendar grid
- **Admin Dashboard**: Password-protected admin panel for managing classes
- **CRUD Operations**: Add, edit, and delete classes through the admin interface
- **Force Announce**: Manually trigger class announcements to Discord channel
- **Asia/Manila Timezone**: All scheduling uses Philippine timezone

### Tech Stack
- **Frontend**: React, TypeScript, Tailwind CSS, Shadcn UI
- **Backend**: Express.js, Node.js
- **Bot**: Discord.js with cron scheduling
- **Storage**: In-memory storage (MemStorage)
- **Styling**: Dark mode by default with theme toggle

## Environment Variables

Required secrets (configured in Replit Secrets):
- `DISCORD_BOT_TOKEN`: Your Discord bot authentication token
- `ADMIN_PASSWORD`: Password for admin panel access
- `CHANNEL_ID`: Discord channel ID for announcements (default: 1425346539559063702)
- `ROLE_ID`: Discord role ID to mention (default: 1285478881964589130)

## Project Structure

```
├── client/               # React frontend
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Page components
│   │   └── lib/         # Utilities
├── server/              # Express backend
│   ├── discord-bot.ts   # Discord bot service
│   ├── routes.ts        # API routes
│   └── storage.ts       # Data storage
├── shared/              # Shared types and schemas
└── design_guidelines.md # UI/UX design system
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Admin login

### Classes
- `GET /api/classes` - Get all classes
- `GET /api/classes/:id` - Get single class
- `GET /api/classes/day/:day` - Get classes by day
- `POST /api/classes` - Create new class
- `PATCH /api/classes/:id` - Update class
- `DELETE /api/classes/:id` - Delete class

### Announcements
- `POST /api/announce` - Force announce to Discord
  - Body: `{ classId?: string, customMessage?: string }`

## How It Works

1. **Discord Bot**: Connects on server start, runs cron job every minute to check for upcoming classes
2. **Reminders**: Sends 10-minute warning and start-time announcements to configured Discord channel
3. **Web Dashboard**: 
   - Public view: Read-only calendar of all classes
   - Admin view: Full CRUD operations with sidebar navigation
4. **Force Announce**: Admins can manually trigger announcements for any class or custom message

## Initial Data

The app is pre-loaded with a complete class schedule (Monday-Friday) including:
- Course codes and names
- Class times
- Google Meet links

## Design System

- **Colors**: Discord-inspired blue (#5865F2) with dark slate backgrounds
- **Typography**: Inter for UI, Roboto Mono for times/codes
- **Components**: Shadcn UI with custom theming
- **Spacing**: Consistent 4px, 8px, 12px, 16px, 24px grid
- **Dark Mode**: Default theme with light mode toggle

## Development

The app runs on a single port with:
- Express server serving API routes
- Vite dev server for frontend (proxied through Express)
- Discord bot running in background with cron scheduler

## User Preferences

- Dark mode is the default theme
- Admin authentication is password-only (no username)
- All times are in 12-hour format (e.g., "10:00 AM")
- Weekly schedule spans Monday-Sunday
