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

- [Overview](#-overview)
- [Why CodeSpace?](#-why-codespace)
- [Core Features](#-core-features)
- [Application Flow](#-application-flow)
- [Collaboration Model](#-collaboration-model)
- [Permissions & Roles](#-permissions--roles)
- [File Locking](#-file-locking)
- [GitHub Integration](#-github-integration)
- [Project Settings](#-project-settings)
- [Architecture](#-architecture)
- [Frontend Architecture](#-frontend-architecture)
- [Backend Architecture](#-backend-architecture)
- [Real-Time Architecture](#-real-time-architecture)
- [Data Model](#-data-model)
- [Security](#-security)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Development Workflow](#-development-workflow)
- [Important Design Decisions](#-important-design-decisions)
- [Current Limitations](#-current-limitations)
- [Future Roadmap](#-future-roadmap)
- [What I Learned](#-what-i-learned)
- [Author](#-author)

---

# 🚀 Overview

**CodeSpace** is a full-stack collaborative code editing platform designed around the experience of working inside a lightweight browser-based IDE.

The goal is not simply to provide a text editor.

The application combines:

- project management
- file/folder navigation
- code editing
- authentication
- role-based access control
- file-level permissions
- edit locking
- real-time presence
- project chat
- project settings
- GitHub repository import

into a single workspace.

The interface is intentionally inspired by developer tools such as VS Code, while the backend is designed around a project/team collaboration model.

---

# 💡 Why CodeSpace?

Working on code collaboratively introduces problems that a normal text editor does not have to solve.

For example:

> Who is currently editing this file?

> Can this user modify the file?

> Should two users be allowed to edit the same file simultaneously?

> What happens if a user disconnects while holding a lock?

> How should project-level and file-level permissions interact?

> How can a GitHub repository become a CodeSpace project?

CodeSpace was built to explore these problems from both the **frontend UX** and **backend architecture** perspective.

---

# ✨ Core Features

## 🖥️ VS Code-Inspired Workspace

The main workspace provides a familiar developer experience with:

- file explorer
- folder navigation
- Monaco code editor
- syntax highlighting
- language detection
- save controls
- project header
- collaboration indicators
- chat
- settings

The interface follows a dark IDE-style design rather than a traditional dashboard layout.

---

## 📁 Project & File Management

Projects contain hierarchical files and folders.

Users can:

- create projects
- browse project files
- open files
- edit files
- save changes
- create folders/files
- manage project-level settings
- control access to files and folders

The file tree is separated from the editor so navigation remains independent from the currently opened file.

---

## 🧑‍🤝‍🧑 Real-Time Presence

CodeSpace tracks users currently connected to a project.

The workspace can show:

```text
● Akshay
● Rahul
● Priya