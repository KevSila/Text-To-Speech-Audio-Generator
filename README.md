
# 🎙️ AI Text-To-Speech Audio Generator
A modern, web-based tool that transforms text into natural-sounding speech using Google Gemini AI. This application provides a seamless interface for generating, playing, and managing audio content from written input, making it ideal for content creators, accessibility tools, and developers.

## 🚀 Core Functionalities
🔊 Instant Text-to-Audio: Converts any text input into clear, spoken audio in real-time.

🤖 Gemini-Powered Processing: Leverages advanced AI to ensure natural phrasing and intonation.

📥 Audio Export: Easily generate and download audio files for offline use or integration into other projects.

⚡ Live Preview: Listen to the generated speech instantly within the browser before finalizing.

📱 Responsive Design: Optimized for both desktop and mobile users for on-the-go audio generation.

## 🛠️ Technical Implementation
Frontend: React.js for a dynamic and responsive user interface.

Type Safety: TypeScript for cleaner, more reliable code.

AI Core: Google Gemini API for intelligent text analysis and audio synthesis.

Build System: Vite for ultra-fast development and optimized production builds.

## 📂 Repository Structure
src/services: Contains the API logic for communicating with Google Gemini.

src/utils: Helper functions for audio processing and data handling.

App.tsx: The primary application component and UI structure.

types.ts: Centralized TypeScript definitions for consistent data structures.

## ⚙️ Installation & Setup
Get the generator running on your local machine:

Clone the repository:

Bash
git clone https://github.com/KevSila/Text-To-Speech-Audio-Generator.git
cd Text-To-Speech-Audio-Generator
Install all dependencies:

Bash
npm install
Configure API Access:

Create a file named .env.local in the project root.

Add your Gemini API key:

Code snippet
VITE_GEMINI_API_KEY=your_actual_api_key_here
Launch the development server:

Bash
npm run dev
## 💡 How to Use
Input: Type or paste your desired text into the main input field.

Generate: Click the 'Generate Audio' button to start the AI conversion process.

Playback: Use the built-in player to listen to your new audio clip.

Download: Save the resulting file directly to your device.

## 👨‍💻 Developed By
Kevin Sila Software Developer & Data Specialist
