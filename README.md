# One-Click Craft

One-Click Craft is a professional resume and cover letter tailoring assistant that helps job seekers optimize their application materials for specific job postings. The project consists of a browser extension (Chrome/Edge) and a backend API server.

## 🚀 Features

-   **Job Posting Analysis**: Automatically extracts and analyzes job posting details from any website
-   **Resume Tailoring**: Generates tailored suggestions to improve resumes for specific job applications
-   **Cover Letter Generation**: Creates personalized cover letters that match job requirements
-   **Full Resume Generation**: Creates optimized resumes from scratch for specific job postings
-   **Application Question Answering**: Helps craft effective answers to job application questions
-   **Document Management**: Upload and manage your resume and supporting documents
-   **DOCX & PDF Export**: Download professionally formatted documents ready for submission
-   **Credit System**: Free credits for new users with affordable packages for continued use

## 🏗️ Project Structure

The project consists of two main components:

1. **Browser Extension (Frontend)**: Chrome/Edge extension built with Plasmo, React, TailwindCSS
2. **API Server (Backend)**: FastAPI application powered by Claude AI

## 🌐 Browser Extension (Frontend)

### Tech Stack

-   **Plasmo**: Framework for building browser extensions
-   **React**: Frontend UI library
-   **TypeScript**: Type-safe JavaScript
-   **TailwindCSS**: Utility-first CSS framework
-   **ShadcnUI**: Reusable UI components
-   **React Query**: Data fetching and state management
-   **Chrome/Browser APIs**: File handling, storage, and side panel integration

### Directory Structure

```
src/
├── api/                  # API integration with backend
├── components/           # React components
│   ├── SuggestionResults/  # Result display components
│   ├── ui/               # Shadcn UI components
│   ├── CreditManager.tsx # Credit display and purchases
│   └── ...
├── constants/            # Configuration constants
├── hooks/                # Custom React hooks
├── lib/                  # Utility libraries
├── sidepanel/            # Side panel UI components
│   ├── tabs/             # Tab components
│   └── ...
├── types/                # TypeScript type definitions
├── utils/                # Helper functions
│   ├── coverletterFormatDownload.ts  # Cover letter export
│   ├── resumeFormatDownload.ts       # Resume export
│   └── ...
├── background.ts        # Extension background script
└── globals.css          # Global styles
```

### Extension Features

-   **Side Panel Integration**: Non-intrusive UI that appears alongside job posting pages
-   **Document Management**: Upload and manage resume and supporting documents
-   **File Type Support**: Handles PDF, DOCX, and TXT files
-   **Browser ID Based User System**: Anonymously identifies users without requiring login
-   **Local Storage**: Efficiently stores user data in browser storage
-   **Stripe Integration**: Secure payment processing for credit purchases
-   **Download Options**: Export in both DOCX (raw) and PDF (formatted) formats

## 🖥️ API Server (Backend)

### Tech Stack

-   **FastAPI**: Modern, high-performance web framework for building APIs
-   **MongoDB**: NoSQL database for storing user information and credits
-   **Claude API**: Powers the AI capabilities using Anthropic's Claude models
-   **Stripe**: Payment processing for the credit system
-   **Firecrawl**: Web scraping service to extract job posting details
-   **Pydantic**: Data validation and settings management

### Directory Structure

```
app/
├── config.py             # Application configuration using Pydantic
├── constants.py          # Application constants and credit packages
├── custom_exceptions.py  # Custom HTTP exceptions
├── db/                   # Database operations
│   └── database.py       # MongoDB connection and operations
├── main.py               # Application entry point and FastAPI setup
├── models/               # Pydantic models for request/response validation
├── routes/               # API endpoints
├── services/             # Business logic
└── utils/                # Utility functions and helpers
    ├── claude_handler/   # Claude API integration
    ├── data_parsing.py   # JSON response parsing
    └── firecrawl.py      # Web scraping integration
```

### API Endpoints

-   **Health Check**: `GET /health`
-   **User Management**: `GET /api/v1/users/get-or-create`
-   **Job Posting Evaluation**: `POST /api/v1/generation/job-posting/evaluate`
-   **Resume Tailoring**:
    -   `POST /api/v1/generation/resume-suggestions/generate`
    -   `POST /api/v1/generation/resume/generate`
-   **Cover Letter Generation**: `POST /api/v1/generation/cover-letter/generate`
-   **Application Questions**: `POST /api/v1/generation/application-question/answer`
-   **Payment Processing**:
    -   `POST /api/v1/payments/create-session`
    -   `POST /api/v1/payments/webhook`
    -   `GET /api/v1/payments/success`
    -   `GET /api/v1/payments/cancel`

## 🔧 Setup and Installation

### Backend (API Server)

#### Prerequisites

-   Python 3.9+
-   MongoDB
-   API keys for:
    -   Anthropic Claude
    -   Stripe
    -   Firecrawl

#### Environment Variables

Create a `.env` file in the root directory with the following variables:

```
# App Configuration
PROJECT_NAME=Resume Tailor Assistant API
VERSION=1.0.0
API_V1_STR=/api/v1

# API Keys
CLAUDE_API_KEY=your_claude_api_key
FIRECRAWL_API_KEY=your_firecrawl_api_key

# MongoDB Configuration
MONGO_URI=your_mongodb_connection_string
MONGO_DB_NAME=one_click_craft

# Stripe Configuration
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# CORS Configuration (for development)
ALLOWED_ORIGINS=["*"]
```

#### Installation Steps

1. Clone the repository:

    ```
    git clone https://github.com/your-username/one-click-craft.git
    cd one-click-craft/server
    ```

2. Create and activate a virtual environment:

    ```
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```

3. Install dependencies:

    ```
    pip install -r requirements.txt
    ```

4. Start the server:

    ```
    uvicorn app.main:app --reload
    ```

5. The API will be available at `http://localhost:8000`

### Frontend (Browser Extension)

#### Prerequisites

-   Node.js 16+
-   pnpm (recommended) or npm

#### Installation Steps

1. Navigate to the extension directory:

    ```
    cd one-click-craft/extension
    ```

2. Install dependencies:

    ```
    pnpm install
    ```

3. Start the development server:

    ```
    pnpm dev
    ```

4. Load the extension in Chrome/Edge:
    - Go to `chrome://extensions/`
    - Enable "Developer mode"
    - Click "Load unpacked"
    - Select the `build/chrome-mv3-dev` directory

## 💰 Credit System

The application uses a credit-based system to manage usage:

-   New users receive 10 free credits upon registration
-   Additional credits can be purchased through Stripe integration (20 credits for $3.99, 50 credits for $7.99)
-   Each generation (cover letter, resume, etc.) consumes one credit
-   Credits are tied to a browser ID for persistent identification

## 🧠 AI Integration

The application uses Anthropic's Claude API to power its AI capabilities:

-   `claude-3-5-haiku-20241022`: Used for most operations to balance performance and cost
-   `claude-3-7-sonnet-20250219`: More powerful model for complex tasks

## 🔐 Data Security

-   No login required - users are identified by a unique browser ID
-   Documents are stored securely in Chrome's local storage
-   Documents are only temporarily stored on the server during processing
-   No long-term storage of user documents or personal data
-   Stripe handles all payment processing securely

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

## 🌐 Deployment

-   Backend API is deployed on Render at `https://one-click-craft-server-project.onrender.com/`
-   Extension is available for Chrome and Edge browsers

## 👥 Developers

-   [Developer Name](https://github.com/developer-handle)

## ⚠️ Notes

-   For development, CORS is configured to allow all origins. In production, this should be restricted to specific frontend domains.
-   The `.env` file should never be committed to the repository.
-   For browser extension development, refer to the [Plasmo documentation](https://docs.plasmo.com/) for additional guidance.
