# Voxlink: Click-to-Call Web Plugin

Voxlink reinvents the voicemail in the age of AI. It's your Executive Assistant Software that takes care of the people calling you.

## What's Voxlink?

### Core Concept
Voxlink is an AI-powered voice assistant that allows users to initiate a call to a user and get assistance to leave a rich message to the user for a better experience.


### How it works
Voxlink is deployed as a web plugin in JavaScript that enables a click-to-call action on any webpage. The plugin will create an iframe that dynamically generates a user experience for initiating a call.
It's also available on a dedicated regular phone number.

## Workflow and Process:

### 1. Button Configuration:
- A configurable button with text such as "Call Me Now".
- When clicked, it opens a modal view.

### 2. Modal View Steps:

#### Step 1: Initial Setup
- User enters their name
- Shows "Let's prepare the call" screen
- Input field for name entry

#### Step 2: Microphone Access
- Request microphone permissions
- Shows microphone selection dropdown if available
- Displays waiting message while getting permissions

#### Step 3: Call Preparation
- Shows "Calling..." screen
- Plays ringtone
- Displays "Hold on, the call is being prepared"
- Maximum ringtone duration is 10 seconds (MAX_RINGTONE_DURATION = 10000)

#### Step 4: Active Call
- Shows "Call in Progress" screen
- Displays call duration timer
- Allows user to stop the call


The steps progress sequentially (1 → 2 → 3 → 4) and can be stopped at any point using the stop/close buttons, though steps 3 and 4 require explicit stopping via the "Stop Call" button (clicking outside won't close the modal during these steps).


#### Step 5: Feedback Collection
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