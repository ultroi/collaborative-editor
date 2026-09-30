# CodeSpace

> A browser-based collaborative code workspace for creating, managing, and editing projects with a VS Code-inspired interface, real-time collaboration, role-based permissions, file locking, project chat, and GitHub repository import.

<p align="center">
  <img src="https://img.shields.io/badge/React-18+-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express.js-Backend-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express.js" />
  <img src="https://img.shields.io/badge/MongoDB-Database-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Monaco%20Editor-Code%20Editor-007ACC?style=for-the-badge&logo=visual-studio-code&logoColor=white" alt="Monaco Editor" />
  <img src="https://img.shields.io/badge/Socket.IO-Real--Time-010101?style=for-the-badge&logo=socketdotio&logoColor=white" alt="Socket.IO" />
</p>

<p align="center">
  <strong>Build. Edit. Collaborate. Ship.</strong>
</p>

---

## 📌 Table of Contents

- [🚀 Overview](#-overview)
- [🎯 Problem Statement](#-problem-statement)
- [✨ Features](#-features)
  - [🔐 Authentication & Authorization](#-authentication--authorization)
  - [📝 Monaco Code Editor & File Management](#-monaco-code-editor--file-management)
  - [👥 Real-Time Collaboration & Presence](#-real-time-collaboration--presence)
  - [🐙 GitHub Repository Import](#-github-repository-import)
- [🏗️ System Architecture](#️-system-architecture)
- [🚀 Getting Started](#-getting-started)
  - [1. Clone the Repository](#1-clone-the-repository)
  - [2. Install Dependencies](#2-install-dependencies)
  - [3. Configure Environment Variables](#3-configure-environment-variables)
  - [4. Start the Application](#4-start-the-application)
- [🧠 What I Learned](#-what-i-learned)
- [👨‍💻 Author](#-author)

---

## 🚀 Overview
**CodeSpace** is a full-stack browser-based collaborative development workspace designed around a VS Code-inspired coding experience. The application combines project management, file management, code editing, real-time collaboration, access control, project communication, and GitHub repository importing into a single workspace. 

Instead of switching between multiple tools, CodeSpace brings these workflows together inside one development environment.

## 🎯 Problem Statement
Traditional browser-based code editors often focus primarily on editing code in isolation. However, collaborative development introduces additional problems such as tracking active users, handling simultaneous file edits, managing hierarchical project permissions, and integrating team communication close to the code. CodeSpace was built to explore and solve these problems from both the frontend application and backend system architecture perspectives.

## ✨ Features

### 🔐 Authentication & Authorization
CodeSpace strictly separates user authentication (identity) from project-level authorization (access). 
* **Role-Based Access Control (RBAC):** Supports hierarchical project roles including Owner, Admin, Editor, and Viewer[cite: 1].
* **File & Folder Permissions:** Permissions can be inherited from the project level down to specific folders and files, with the backend resolving the effective permission.

### 📝 Monaco Code Editor & File Management
* **Rich Editing Experience:** Powered by Monaco Editor, featuring syntax highlighting, language-aware editing, keyboard shortcuts, word wrapping, and minimap configuration.
* **Dirty-State Management:** Tracks unsaved changes by comparing editor modifications against the saved baseline content.

### 👥 Real-Time Collaboration & Presence
* **Live Presence:** Users connected to the same project can instantly see other active collaborators via Socket.IO.
* **File Locking:** Utilizes a heartbeat-monitored, file-level locking mechanism to prevent conflicting edits.
* **Project Team Chat:** Built-in real-time chat scoped to the project environment.

### 🐙 GitHub Repository Import
* Seamlessly import existing GitHub repositories directly into CodeSpace projects.
* Automatically skips common generated or dependency directories (e.g., `.git`, `node_modules`, `dist`).

## 🏗️ System Architecture
Security and state management are designed with the core engineering principle that the **backend is authoritative**. 
* **Frontend:** Orchestrates project loading, selected files, editor content, and socket state.
* **Backend:** Enforces protected operations, validates project roles, resolves effective access permissions, and handles lock mechanisms.
* **Real-Time Layer:** Instead of HTTP polling, the architecture relies on Socket.IO events to broadcast file updates, lock acquisitions, and chat messages.