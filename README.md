# SEOCrates 📦

**SEOCrates** is a lightweight, high-performance Chrome extension designed for modern SEO analysis. It brings powerful semantic capabilities directly into your browser, allowing you to audit content structure and topical alignment without ever sending data to external servers.

---

## 🚀 Key Features

- **Semantic Cohesion Scoring**: Uses machine learning to calculate how well your content aligns with its core objective.
- **Heading Outline & Analytics**: Instantly visualize your page hierarchy (H1-H6) and identify structural issues.
- **Link Auditing**: Quickly scan for internal and external links to ensure a healthy backlink profile.
- **Local-First Privacy**: All analysis is performed **locally on your device** using WebAssembly (WASM) and ONNX. No data is ever transmitted to external servers.
- **Zero Configuration**: Works out of the box with the `all-MiniLM-L6-v2` transformer model embedded directly in the extension.

## 🛠️ Tech Stack

- **Framework**: React 19 + TypeScript + Vite
- **ML Engine**: Transformers.js (@xenova/transformers)
- **Runtime**: ONNX Runtime Web (WASM)
- **Styling**: Vanilla CSS with modern tokens

## 🏗️ Getting Started

### Installation
1. Clone this repository.
2. Run `npm install` to install dependencies.
3. Run `npm run build` to generate the production extension in the `dist/` folder.
4. Open Chrome and navigate to `chrome://extensions/`.
5. Enable "Developer mode" and click "Load unpacked", then select the `dist/` folder.

---

## 🛡️ Privacy Policy

Your privacy is paramount. SEOCrates is built on the principle of data sovereignty.
- **No Data Collection**: We do not collect or store any browsing data.
- **Local Processing**: All ML embeddings and analysis happen in your browser.
- **Read our full Privacy Policy**: [https://tlhornbe.github.io/seocrates/privacy.html](https://tlhornbe.github.io/seocrates/privacy.html)

---

## About the Author 👨‍💻

**Taylor Hornberger** - Product Manager & Builder

Connect with me on [LinkedIn](https://www.linkedin.com/in/taylorhornberger/) to see more of my work in product and development.

---

*Built with ❤️ for SEOs and Builders.*
