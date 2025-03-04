# Wise Craft - AI-Powered Job Search Chrome Extension

![Wise Craft Logo](https://your-logo-url.com/logo.png)

## 🚀 Overview

Wise Craft is a powerful Chrome extension that streamlines your job search by generating tailored resumes and cover letters directly on job sites. With one click, Wise Craft analyzes job descriptions and provides AI-driven resume suggestions to improve your chances of landing an interview.

## 🎯 Features

-   📝 **AI Resume Optimization**: Get personalized resume suggestions based on job descriptions.
-   📄 **Instant Cover Letter Generation**: AI-generated cover letters tailored to each job posting.
-   📂 **File Management**: Upload and store your resume and supporting documents securely.
-   🌐 **Works on Any Job Site**: Supports all job boards and company career pages.
-   🎯 **Easy Side Panel Access**: Seamless integration with Chrome’s side panel.

## 🛠️ Tech Stack

-   **Framework**: React, TypeScript
-   **UI Library**: TailwindCSS, Radix UI
-   **State Management**: React Query
-   **Storage**: Chrome Local Storage
-   **Build Tool**: Plasmo Framework

## 📦 Installation

### 1️⃣ Clone the Repository

```sh
git clone https://github.com/your-username/wise-craft.git
cd wise-craft
```

### 2️⃣ Install Dependencies

```sh
npm install
```

### 3️⃣ Start Development Server

```sh
npm run dev
```

### 4️⃣ Build & Package the Extension

```sh
npm run build
npm run package
```

## 🖥️ File Structure

```
wise-craft/
│── src/
│   ├── background.ts       # Manages Chrome extension events
│   ├── contents/           # Content scripts for job page extraction
│   ├── sidepanel/          # UI for the extension side panel
│   ├── hooks/              # Custom React hooks
│   ├── utils/              # Helper functions
│   ├── types/              # TypeScript type definitions
│   ├── constants/          # Constants (e.g., API URLs, file limits)
│── manifest.json          # Chrome extension manifest
│── package.json           # Project metadata and dependencies
│── tsconfig.json          # TypeScript configuration
│── tailwind.config.js     # TailwindCSS configuration
│── README.md              # This file!
```

## ⚡ Usage

1. **Install the extension** in Chrome Developer Mode by loading the `/dist` folder.
2. **Navigate to a job posting** on any job site.
3. **Click the Wise Craft icon** in the Chrome toolbar.
4. **Upload your resume** and generate AI-powered suggestions instantly.

## 🔧 Development Notes

-   The extension leverages `chrome.sidePanel.setOptions()` to control panel visibility per tab.
-   The `content script` extracts job descriptions by stripping unnecessary HTML elements.
-   The `background script` manages Chrome API interactions.

## 🛠️ Contributing

We welcome contributions! To contribute:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature-branch`).
3. Make your changes and commit (`git commit -m 'Add feature'`).
4. Push to your branch (`git push origin feature-branch`).
5. Open a Pull Request.

## 📜 License

This project is licensed under the [MIT License](LICENSE).

## 📩 Contact

For questions, reach out to **Pillar.ai** at [calson.developer@gmail.com](mailto:calson.developer@gmail.com).

---

🚀 **Enhance your job search with AI-powered resume suggestions!**
