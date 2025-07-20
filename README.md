# CoWork3 Frontend

A React-based frontend application for coworking space management.

## Development

```bash
npm install
npm run dev
```

## Build for Production

```bash
npm run build
npm run preview
```

## Deploy to Netlify

### Option 1: Automatic Deployment
1. Connect your GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Deploy automatically on push

### Option 2: Manual Deployment
1. Run `npm run build`
2. Upload the `dist` folder to Netlify

### Environment Variables
No environment variables required for this project.

## Features
- User management
- Attendance tracking
- Course management
- Dashboard analytics
- RTL support (Persian/Arabic)
- Dark/Light theme
- Responsive design

## Tech Stack
- React 19
- Vite
- Material-UI
- Emotion
- LocalStorage for data persistence
