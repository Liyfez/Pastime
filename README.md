<div align="center">
  <img src="https://img.shields.io/badge/Made%20by-Liyfez-fbbf24?style=for-the-badge&logo=github" alt="Made by Liyfez" />
  
  <br/>
  
  # ✨ Pastime ✨
  **The Ultimate GitHub Activity Graph Customizer**
  
  [![Website](https://img.shields.io/badge/Launch-Live_Theme_Builder-27272a?style=for-the-badge&logo=vercel&color=fbbf24)](https://Liyfez.github.io/Pastime/)
  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

  <p align="center">
    <i>Crafted with ❤️ by <a href="https://github.com/Liyfez">Liyfez</a>. Stand out from the crowd with a fully customized, beautiful profile graph!</i>
  </p>
</div>

---

## 🌟 Why Pastime?

Most profile graph tools cannot read your **Private Commits** or perfectly map to the **Current Calendar Year**. Pastime is different. Created by **Liyfez**, Pastime runs natively inside your own GitHub Actions. 

This means:
- 🔒 **100% Private:** Your data never leaves your repository.
- 🎨 **Pixel Perfect Themes:** Uses exact mathematical quartiles to flawlessly match GitHub's native heat mapping.
- 🌗 **Auto-Adapting:** Supports both Light and Dark modes seamlessly.

---

## 🚀 Detailed Setup Guide

Follow this guide to get your beautiful customized graph running on your profile in less than 2 minutes!

### 🥇 Step 1: Fork this Repository
Since Pastime needs access to your private commits to generate an accurate graph, it must run on your own account.
1. Click the **Fork** button at the top right of this repository to copy it to your account.
2. Go to **Settings > Actions > General** in your new forked repository, and ensure **Read and write permissions** are enabled under "Workflow permissions".

### 🥈 Step 2: Create a Personal Access Token (PAT)
1. Go to your GitHub **Settings > Developer Settings > Personal Access Tokens > Tokens (classic)**.
2. Generate a new token with `read:user` and `repo` scopes.
3. Copy the token.
4. Go to your forked Pastime repository, navigate to **Settings > Secrets and variables > Actions**, and click **New repository secret**.
5. Name it `GH_TOKEN_FOR_GRAPH` and paste your token in the secret field.

### 🥉 Step 3: Design Your Theme
1. Visit the **[Pastime Live Theme Builder](https://Liyfez.github.io/Pastime/)** (created by Liyfez).
2. Pick your favorite brand color!
3. The site will generate a special block of code for you. Click **Copy Workflow YAML**.
4. Go to your forked repository, open the file `.github/workflows/update-graph.yml`.
5. Find the `env:` block, and **replace it** with the code you just copied! Commit the changes.
6. Go to the **Actions** tab in your repository and click **Run workflow** to generate your graph for the first time.

### 🏆 Step 4: Add to your Profile
1. On the [Theme Builder website](https://Liyfez.github.io/Pastime/), scroll down to Step 3 and type your GitHub Username.
2. Click **Copy Markdown Link**.
3. Go to your main GitHub Profile README (the one with just your username).
4. Paste the Markdown link exactly where you want the graph to appear!

---

## 📜 License & Credits

**Pastime** is an open-source project created by **[Liyfez](https://github.com/Liyfez)**.

This project is licensed under the **MIT License**. You are completely free to use it, fork it, and modify it for your own profile! However, the MIT License requires that you give credit to the original creator. Please do not claim this source code as your own original creation. 

<div align="center">
  <b>© 2026 Liyfez. All rights reserved.</b>
</div>
