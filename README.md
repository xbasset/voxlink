# Voxlink: Click-to-Call Web Plugin

Voxlink reinvents the voicemail in the age of AI. It's your Executive Assistant Software that takes care of the people calling you.

## What's Voxlink?

### Core Concept
Voxlink is an AI-powered voice assistant that allows users to initiate a call to a user and get assistance to leave a rich message to the user for a better experience.


### How it works
Voxlink is deployed as a web plugin in JavaScript that enables a click-to-call action on any webpage. The plugin will create an iframe that dynamically generates a user experience for initiating a call.
It's also available on a dedicated regular phone number.


## Demo

Here's an example with a personal website. Let's say you have a personal website and you want to add a click-to-call button to it.

Here it is:

https://github.com/user-attachments/assets/43521bd3-12d4-4bbb-885f-4b035df83a36



## Architecture

See more details in the [architecture](./docs/architecture.md) document.

## How to run the project

1. Clone the repository
2. Create a .env.local file with the following variables: `OPENAI_API_KEY`. See [.env.example](.env.example).
3. Run `npm install`
4. Run `npm run init-db` to initialize the database
5. Run `npm run dev`
6. Navigate to `http://localhost:3000`
