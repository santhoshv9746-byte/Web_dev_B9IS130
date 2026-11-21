# ChatApp – Real-Time Messaging Application
# B9IS130 – Web Development for Information Systems

ChatApp is a web-based messaging application developed with React, Firebase, and Cloudinary. It allows registered users to find one another, exchange text messages and images, and update their personal profiles. Firestore listeners keep conversation data synchronized without manually refreshing the page.

Source code: https://github.com/santhoshv9746-byte/Web_dev_B9IS130
Live application: https://web-dev-b9-is-130.vercel.app/chat
## Table of Contents
1. Project Overview
2. Technology Stack
3. System Architecture
4. Application Features
5. Firestore Data Structure
6. Project Directory Structure
7. Local Setup and Installation
8. Deployment
9. Security and Current Limitations
10. Testing
11. References and Development Acknowledgements
## 1. Project Overview
The objective of ChatApp is to provide a straightforward interface for communication between registered users. The application supports account creation, authentication, user search, one-to-one conversations, text and image messages, and profile management.

The application is built with React on the frontend and Firebase Authentication and Cloud Firestore as managed backend services. Cloudinary provides image hosting. This is a JavaScript-based application using Backend-as-a-Service (BaaS), not a conventional MERN stack with an Express server and MongoDB.
Project objectives
- Build an interactive single-page application using React.
- Implement registration, login, logout, and password reset.
- Store application data in a cloud-hosted database.
- Display conversations and messages in real time.
- Implement Create, Read, Update and Delete (CRUD) operations for text messages.
- Integrate an external service for image uploads.
- Deploy the frontend and maintain the project using Git and GitHub.

## 2. Technology Stack
Layer	Technology	Purpose
Frontend	React 19, JavaScript, CSS	User interface and interaction
Build tooling	Vite 8	Local development and production builds
Routing	React Router	Login, chat, and profile routes
Authentication	Firebase Authentication	Account registration, login, logout, password reset
Database	Cloud Firestore	Profiles, chat lists, and message history
Real-time updates	Firestore onSnapshot	Live conversations and message updates
Image hosting	Cloudinary Upload API	Profile photos and chat images
HTTP client	Axios	Upload requests to Cloudinary
Notifications	React Toastify	User feedback and error messages
Version control	Git and GitHub	Source-code management
Frontend hosting	Vercel	Application deployment


## 3. System Architecture
Browser (React + Vite)
   |
   +-- Firebase Authentication
   |      +-- Sign up / Sign in / Sign out / Reset password
   |
   +-- Cloud Firestore
   |      +-- users/{uid}       (profile and lastSeen)
   |      +-- chats/{uid}       (conversation summaries)
   |      +-- messages/{id}     (conversation messages)
   |
   +-- Cloudinary Upload API
          +-- Profile and chat images
          +-- Hosted image URLs stored in Firestore
React components interact with Firebase directly through the Firebase client SDK. Firestore snapshot listeners update the interface when documents change. For image messages, the app uploads the selected image to Cloudinary and stores the returned URL with the message in Firestore.

## 4. Application Features
### 4.1 Registration and Login
Main files: src/pages/Login/Login.jsx, src/config/firebase.js
- New users register with a username, email address, and password.
- Firebase Authentication manages account credentials.
- The app creates a matching user profile and an empty chat-list document in Firestore.
- Existing users can sign in, log out, and request a password-reset email.
### 4.2 User Search and Conversation Creation
Main file: src/components/LeftSidebar/LeftSidebar.jsx
- Users can search for another account by username.
- Selecting a search result creates a one-to-one conversation.
- A Firestore transaction writes the initial conversation document and updates both chat lists.
- The sidebar displays conversation previews ordered by their latest update time.

### 4.3 Real-Time Text Messaging and CRUD
Main files: src/components/Chatbox/Chatbox.jsx, src/context/AppContext.jsx
- **Create:** Users send new text messages, each assigned a unique ID with `crypto.randomUUID()`.
- **Read:** Firestore `onSnapshot` listeners display conversations and message changes in real time.
- **Update:** Users can edit their own newer text messages. A Firestore transaction updates the message and adds an `editedAt` timestamp; the interface shows an edited indicator.
- **Delete:** Users can delete their own newer text messages after confirmation. A Firestore transaction removes the message from the conversation.
- Messages store a sender ID and creation timestamp. The chat preview is also updated when the latest message is sent, edited or deleted.
- Edit and Delete controls are available only for the signed-in user's own text messages that have unique IDs. Older messages without IDs remain readable.
- The CRUD implementation applies to **text messages**, not all Firestore records or uploaded images.
### 4.4 Image Sharing and Media Gallery
Main files: src/config/upload.js, src/components/Chatbox/Chatbox.jsx, src/components/RightSidebar/RightSidebar.jsx
- Users can send JPG or PNG image files up to 5 MB.
- Axios sends selected images to Cloudinary.
- The returned hosted image URL is saved in Firestore.
- Images shared within a conversation can be viewed in the right sidebar's media section.
### 4.5 User Profile Management
Main file: src/pages/ProfileUpdate/ProfileUpdate.jsx
- Users can update their display name, biography, and profile image.
- Profile details are stored in their Firestore user document.
- The app provides Save and Cancel controls.
### 4.6 Online Status
Main file: src/context/AppContext.jsx
- The app periodically updates a user's lastSeen value.
- A green status indicator appears when the selected user's recent activity is within the configured time window.
- This is an approximate activity indicator, not a guaranteed connection-presence system.
### 4.7 Routes
Route	Page
/	Registration, login, and password reset interface
/chat	Main chat interface
/profile	Edit profile interface


## 5. Firestore Data Structure
The application uses three principal Firestore collections:
users/{uid}
Stores account profile information, including id, username, email, name, avatar, bio, and lastSeen.
chats/{uid}
Stores a user's chatsData array. Each conversation entry may include:
- messageId – corresponding conversation document ID
- rId – the other user's UID
- lastMessage – text shown in the sidebar preview
- updatedAt – time used to sort chats
- messageSeen – message-view status used by the interface
messages/{messageId}
Stores the conversation's createdAt timestamp, participants array, and messages array. Individual messages contain sId, createdAt, and either text or image. Newly created messages also have a unique id; edited text messages have an editedAt timestamp. Older messages may not have these additional fields.

## 6. Project Directory Structure
Web_dev_B9IS130/
├── public/
├── src/
│   ├── assets/                         # Icons and static images
│   ├── components/
│   │   ├── Chatbox/                     # Messages and message input
│   │   ├── LeftSidebar/                 # Search and conversations
│   │   └── RightSidebar/                # Profile details and media
│   ├── config/
│   │   ├── firebase.js                  # Firebase setup and authentication
│   │   └── upload.js                    # Cloudinary image upload
│   ├── context/
│   │   └── AppContext.jsx               # Shared app state and listeners
│   ├── pages/
│   │   ├── Chat/                         # Chat page
│   │   ├── Login/                        # Login / registration page
│   │   └── ProfileUpdate/               # Profile editor
│   ├── App.jsx                           # Application routes
│   ├── index.css                         # Global styles
│   └── main.jsx                          # React entry point
├── .gitignore
├── package.json
├── package-lock.json
├── vite.config.js
└── README.md
## 7. Local Setup and Installation
Requirements
- A recent Node.js version compatible with the project's Vite version
- npm
- Git
- A Firebase project with Authentication and Cloud Firestore configured
- A Cloudinary account and an upload preset
Installation
git clone https://github.com/santhoshv9746-byte/Web_dev_B9IS130.git
cd Web_dev_B9IS130
npm install
npm run dev
Open the local URL displayed by Vite (normally http://localhost:5173).
Build commands
npm run dev       # Start development server
npm run build     # Create a production build
npm run preview   # Preview production build
npm run lint      # Run ESLint
Service configuration
- Firebase is initialized in src/config/firebase.js. Configure Firebase Authentication (Email/Password) and Firestore for the intended project.
- Cloudinary upload details are configured in src/config/upload.js.
- Firebase authentication authorized domains must include the domain used to access the app.
- Firestore rules must be configured and tested before exposing the app to real users.
This repository currently keeps client-side service configuration in source files; it does not include a separate Express or Node.js API server.

## 8. Deployment
The React frontend is deployed using Vercel, with GitHub used to track code changes. A production build is generated using npm run build and served from the Vite dist output.

For a new deployment, import the GitHub repository into Vercel and verify that its build command and output directory match the Vite application. Add the deployed hostname to the Firebase Authentication authorized-domains list. Check direct access to /chat and /profile, including page refresh behavior, because client-side routes may require a hosting rewrite rule.
Live URL:(https://web-dev-b9-is-130.vercel.app/chat)

## 9. Security and Current Limitations
- Firebase Authentication verifies account sign-in. Passwords are handled by Firebase Authentication rather than stored in Firestore user documents.
- User documents may only be edited by their owner under the current development rules.
- Important outstanding issue: The currently used temporary Firestore rules allow any authenticated account to read and write other users' chat lists and message documents. They do not provide conversation-level privacy and should not be presented as production-ready authorization.
- Cloudinary uploads use an unsigned client-side upload preset. Hosted image URLs must not be assumed to be private; secure upload controls and access restrictions are needed for sensitive content.
- The project does not currently include an independent Express backend or role-based permission system.
- The application now implements full Create, Read, Update and Delete (CRUD) functionality for text messages. This does not extend to every Firestore record or image message. Sender ownership is checked in the interface and transaction code, but is not yet enforced by the current Firestore Security Rules.
- Chat presence is based on recent timestamps and may be delayed or inaccurate when a browser closes unexpectedly.
Before production use: Enforce participant-level access to Firestore chat/message data, tighten profile visibility and validation, protect image uploads, and test security rules with multiple accounts. Until then, use only test accounts and non-sensitive data.

## 10. Testing
The application has been exercised manually with two test accounts. Relevant functional checks include:
Area	Manual test
Authentication	Register, log in, log out, and request password reset
User discovery	Search for another registered username
Conversation setup	Start a new one-to-one conversation
Messaging	Send text and receive replies between two accounts
Text-message CRUD	Create and read a new text message, edit it, then confirm deletion; verify the changes in both accounts
Message ownership (interface)	Check that Edit and Delete controls appear only on the signed-in user's own text messages with IDs
Media	Send an image and view it in the sidebar gallery
Profiles	Update display name, biography, and image
Online status	Observe activity indicator after login/logout
Deployment	Open the deployed frontend and check navigation

<img width="1907" height="988" alt="image" src="https://github.com/user-attachments/assets/4f111b8e-0864-475e-96ef-7128f50f8509" />

<img width="1853" height="920" alt="image" src="https://github.com/user-attachments/assets/365ede82-4c8f-48b1-816e-d3cf4c0c266e" />


## 11. References and Development Acknowledgements
Technical documentation
- React documentation: https://react.dev/
- Vite documentation: https://vite.dev/guide/
- Firebase Authentication documentation: https://firebase.google.com/docs/auth
- Cloud Firestore documentation: https://firebase.google.com/docs/firestore
- Firestore Security Rules documentation: https://firebase.google.com/docs/firestore/security/get-started
- Cloudinary image upload documentation: https://cloudinary.com/documentation/image_upload_api_reference
- React Router documentation: https://reactrouter.com/
- Vercel documentation: https://vercel.com/docs
Tutorial and AI assistance disclosure

This application was developed with the help of tutorial [https://www.youtube.com/watch?v=gbocZlm71nE](https://youtu.be/Vi9bxu-M-ag) . The codebase was subsequently used for the B9IS130 project, including adjustments to Firebase integration, messaging, profiles, online status, and deployment.

OpenAI ChatGPT was used as a development assistant for explaining React/Firebase concepts, debugging application errors, reviewing code

Google Gemini was also used as an AI assistance tool to help understand and troubleshoot technical parts of the project. The areas supported by AI assistance included:
- Firestore transactions for creating conversations and editing or deleting messages.
- Real-time messaging and Firestore `onSnapshot` listeners.
- Firebase Authentication, authorization concepts, and Firestore Security Rules.
- Cloudinary API integration for image uploads.
- Online/offline activity indicators based on timestamps.
- React Context API for sharing application state.
- Firestore database collections and document structure.
- Synchronizing chat previews after messaging changes.
- React hooks and state management, including `useState` and `useEffect`.
- Error handling and input validation.

AI resources were used to support learning, implementation and debugging; the application's functionality was tested through the project. Shared Gemini conversation reference: https://share.gemini.google/bXHMUuIa08wN
