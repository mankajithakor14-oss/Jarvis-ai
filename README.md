# JARVIS Full Setup

Full-stack starter for a personal Android JARVIS assistant.

Included:
- OpenAI Responses API backend
- Gujarati/Hindi/English assistant brain
- Conversation history from Android client
- Market quote + basic technical analysis endpoint
- Android voice input (SpeechRecognizer)
- Android voice output (TextToSpeech)
- Safe app-launch commands for apps installed on the phone
- Vercel-ready serverless API
- Secure environment variables

## 1. Vercel
Deploy the `api` folder as part of this repository.

Environment variables:
OPENAI_API_KEY=your_key
OPENAI_MODEL=gpt-6-luna
MARKET_SYMBOL_DEFAULT=RELIANCE.NS

Do NOT put the OpenAI key inside Android code.

## 2. Android
Open the `android` folder in Android Studio.

Change:
`android/app/src/main/java/com/jarvis/ai/BuildConfig.java`

Actually, do not create that file manually. Put your deployed API base URL in:
`android/app/build.gradle`:
`buildConfigField "String", "JARVIS_API_BASE", "\"https://YOUR-VERCEL-DOMAIN.vercel.app\""`

Then build the APK.

## 3. Important
App launching only launches apps that Android allows your app to launch. It does not bypass Android security, permissions, locks, banking protections, or other app restrictions.

Market analysis is informational only and not financial advice.
