# Voxlink: Click-to-Call Web Plugin

Voxlink reinvents the voicemail in the age of AI. It's your Executive Assistant Software that takes care of the people calling you.

## What's Voxlink?

### Core Concept
Voxlink is an AI-powered voice assistant that allows users to initiate a call to a user and get assistance to leave a rich message to the user for a better experience.


### How it works
Voxlink is deployed as a web plugin in JavaScript that enables a click-to-call action on any webpage. The plugin will create an iframe that dynamically generates a user experience for initiating a call.
It's also available on a dedicated regular phone number.

## Workflow and Process:

1. Button Configuration:
- A configurable button with text such as "Call Me Now".
- When clicked, it opens a modal view.

2. Modal View Steps:

### Step 1: User Name Input
- Display a single line asking the user for their name.
- Provide a text box for the user to enter their name.
- Include a "Next" button to proceed to the next step.

### Step 2: Microphone Access Authorization
- Inform the user that microphone access is required to make the call.
- Display a message: "Hey, I need access to the microphone for you to talk to me."
- Include a "Grant Access" button.
- Trigger a JavaScript action to request microphone permission.
- Handle the browser pop-up for microphone access.
- If access is granted, show a validation with a green checkbox.
- Provide a drop-down list to select the microphone for the call.
- Include a "Start the Call" button to proceed.

### Step 3: Initialization and Connection
- Display a loading spinning icon.
- Play a music simulating a phone call notification.
- After 3 seconds, proceed to the next step.

### Step 4: Video Recording Playback
- Display a video recording of the user with a personalized message.
- Inform the user that they will be connected to an Executive Assistant Software for further assistance.

### Step 5: AI Assistant Connection
- Automatically switch to the AI Assistant Software.
- Allow the user to talk directly to the voice assistant.
- Provide an "End Call" button to stop the conversation.

### Step 6: Feedback Collection
- Ask for user feedback with a rating system from 1 to 5.

## Backend
The backend of Voxlink is built with:

- NextJS: A React framework for production that enables features like:
  - Server-side rendering
  - API routes
  - File-based routing
  - Built-in optimization

- OpenAI Integration:
  - Realtime API conversation processing via WebRTC

The backend handles:
- User session management
- Audio streaming and processing
- AI model interactions
- Call state management
- Analytics and logging

## Frontend
The frontend of Voxlink is built with:
- React: A JavaScript library for building user interfaces
  - Component-based architecture 
  - Virtual DOM and hooks
  - Context API

- TailwindCSS: A utility-first CSS framework
  - Responsive design utilities
  - Custom design system
  - Dark mode support

The frontend handles:
- UI rendering and state management
- Real-time audio streaming
- Responsive layouts