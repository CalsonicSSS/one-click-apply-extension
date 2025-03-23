# Wise Craft Chrome Extension

A Chrome extension that helps job seekers tailor their resumes and generate cover letters based on job postings. Built with TypeScript, React, Shadcn/UI, and Tailwind CSS.

![Wise Craft Logo](path/to/logo.png)

## Features

-   🔍 **Job Posting Analysis**: Automatically extracts key information from any job posting
-   📝 **Resume Tailoring**: Provides targeted suggestions to customize your resume for each job
-   ✉️ **Cover Letter Generation**: Creates personalized cover letters based on your resume and the job description
-   💬 **Application Question Answers**: Generates responses for common application questions
-   📂 **Document Management**: Upload and manage your resume and supporting documents
-   💾 **Tab-specific Storage**: Keeps your data organized by tab/job posting
-   📱 **Responsive Side Panel**: Seamless integration with your browsing experience

## Tech Stack

-   **Framework**: [Plasmo](https://www.plasmo.com/) - Browser extension framework
-   **Language**: TypeScript
-   **UI Library**: React
-   **Component Library**: [Shadcn/UI](https://ui.shadcn.com/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **Package Manager**: [pnpm](https://pnpm.io/)
-   **State Management**: [TanStack Query](https://tanstack.com/query/latest)
-   **Document Generation**: jsPDF, docx

## Project Structure

```
src/
├── api/                 # API client functions
├── components/          # Reusable UI components
│   ├── SuggestionResults/  # Components for displaying generated content
│   └── ui/              # Shadcn UI components
├── constants/           # Application constants
├── contents/            # Content scripts
├── hooks/               # Custom React hooks
├── lib/                 # Utility libraries
├── sidepanel/           # Side panel UI
│   └── tabs/            # Tab components for the side panel
├── types/               # TypeScript type definitions
└── utils/               # Helper functions
```

## Core Components

### Background Script

The `background.ts` file manages the extension's lifecycle and handles the side panel on a per-tab basis. It tracks which tabs have the side panel enabled and cleans up tab-specific data when tabs are closed.

### Side Panel

The side panel is the main interface of the extension, consisting of two main tabs:

1. **Profile Tab**: For uploading and managing documents, and initiating the generation process
2. **Suggestion Tab**: For viewing and using the generated suggestions, with sub-tabs for:
    - Resume suggestions
    - Cover letter
    - Application questions

### API Integration

The application communicates with a backend API for content generation, with endpoints for:

-   Job posting evaluation
-   Resume suggestion generation
-   Cover letter generation
-   Application question answering

### Document Management

Users can upload and manage:

-   Resume (required)
-   Supporting documents (optional, up to 4)

Files are stored as base64-encoded strings in Chrome's local storage.

### Content Extraction

The `jobPageExtractor.ts` content script extracts relevant content from job posting pages for analysis.

## Installation for Development

1. Clone the repository:

    ```bash
    git clone https://github.com/your-username/wise-craft.git
    cd wise-craft
    ```

2. Install dependencies:

    ```bash
    pnpm install
    ```

3. Build the extension:

    ```bash
    pnpm dev
    ```

4. Load the extension in Chrome:
    - Go to `chrome://extensions/`
    - Enable "Developer mode"
    - Click "Load unpacked"
    - Select the `build/chrome-mv3-dev` directory

## Backend Integration

This extension requires a backend API with the following endpoints:

-   `/api/v1/generation/job-posting/evaluate`
-   `/api/v1/generation/resume/suggestions-generate`
-   `/api/v1/generation/cover-letter/generate`
-   `/api/v1/generation/application-question/answer`

Configure the API domain in `src/constants/environments.ts`.

## Storage Architecture

The extension uses Chrome's local storage with the following structure:

-   `fileStorage`: User's documents (resume and supporting files)
-   `usedSuggestionCreditsCount`: Tracks the number of suggestions generated
-   `tabSuggestions`: Stores generated content per tab
-   `tabApplicationQuestions`: Stores application question answers per tab

## Credit System

The extension implements a credit system for tracking usage:

-   Free tier: 15 credits
-   Tier one: 40 credits

Each generation consumes one credit.

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add some amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a pull request

## License

This project is licensed under the [MIT License](LICENSE).

## Acknowledgements

-   [Plasmo Framework](https://www.plasmo.com/)
-   [Shadcn/UI](https://ui.shadcn.com/)
-   [Tailwind CSS](https://tailwindcss.com/)
-   [TanStack Query](https://tanstack.com/query/latest)
