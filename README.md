# Weather Agent Chat Interface

A modern, responsive chat interface for interacting with a weather AI agent. Built with React, TypeScript, and Tailwind CSS.

## ✨ Features

- **ChatGPT-style Interface**: Modern chat bubbles and sidebar
- **Real-time Streaming**: Live responses from weather agent
- **Chat History**: Persistent conversation sessions
- **Mobile Responsive**: Works on all devices
- **Weather Intelligence**: Get weather information for any location

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/weather-agent-chat.git
cd weather-agent-chat
```

2. Install dependencies:
```bash
npm install
```

3. Update your college roll number in `src/components/ChatInterface.tsx`:
```typescript
threadId: 'YOUR_COLLEGE_ROLL_NUMBER',
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:5173](http://localhost:5173) in your browser

## 🛠️ Built With

- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Vite** - Build tool
- **Lucide React** - Icons

## 📱 Usage

1. **Ask Weather Questions**: Type any weather-related query
2. **Multiple Chats**: Create new conversations with the "New Chat" button
3. **Mobile Support**: Use the hamburger menu on mobile devices
4. **Chat History**: Access previous conversations from the sidebar

## 🌤️ Example Queries

- "What's the weather in London?"
- "Will it rain tomorrow in New York?"
- "Temperature in Tokyo right now"
- "Weather forecast for Paris this week"

## 🔧 Configuration

The app connects to a Mastra Cloud weather agent. Update the API endpoint in `ChatInterface.tsx` if needed:

```typescript
const response = await fetch('https://millions-screeching-vultur.mastra.cloud/api/agents/weatherAgent/stream', {
  // ... configuration
});
```

