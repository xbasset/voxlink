# Voxlink: Click-to-Call Web Plugin

Voxlink reinvents the voicemail in the age of AI. It's your Executive Assistant Software that takes care of the people calling you.

## What's Voxlink?

### Core Concept
Voxlink is an AI-powered voice assistant that allows users to initiate a call to a user and get assistance to leave a rich message to the user for a better experience.


### How it works
Voxlink is deployed as a web plugin in JavaScript that enables a click-to-call action on any webpage. The plugin will create an iframe that dynamically generates a user experience for initiating a call.
It's also available on a dedicated regular phone number.


## Integration Example with a personal website:

1. Click the "Call Me Now" button on any webpage.
![Click the "Call Me Now" button](docs/img/image.png)

2. Enter your name.
![Enter your name](docs/img/image-1.png)

3. Select a microphone.
![Authorize microphone access](docs/img/image-2.png)

![Select a microphone](docs/img/image-3.png)

4. Click "Start the Call".

![Click "Start the Call"](docs/img/image-4.png)

5. When the user is not available, the voice assistant will help the caller in any way possible.

![Get guided by the voice assistant](docs/img/image-5.png)



6. Click "Stop Call" to end the call.


## Architecture

See more details in the [architecture](./docs/architecture.md) document.

## How to run the project

1. Clone the repository
2. Run `npm install`
3. Run `npm run dev`
4. Navigate to `http://localhost:3000`