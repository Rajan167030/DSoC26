<div align="center">
  <h1>🚀 DSoC 2026</h1>
  <h3>Devnovate Summer of Code 2026</h3>
  <p>Empowering the next generation of open-source contributors</p>
  
  [![GitHub](https://img.shields.io/badge/GitHub-hackwithindia-181717?style=for-the-badge&logo=github)](https://github.com/hackwithindia)
  [![Discord](https://img.shields.io/badge/Discord-Join%20Us-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/hackwithindia)
  [![LinkedIn](https://img.shields.io/badge/LinkedIn-Follow-0A66C2?style=for-the-badge&logo=linkedin)](https://linkedin.com/company/hackwithindia)
</div>

---

## 📖 About DSoC 2026

**Devnovate Summer of Code (DSoC '26)** is an open-source program crafted for real collaboration, real contributions, and real growth. It helps students and early-stage developers move from tutorials to production-ready projects.

Over a focused summer timeline, you work with mentors, maintainers, and a friendly community to ship meaningful code, polish documentation, and understand how real open-source projects run.

### 🎯 Our Mission

DSoC '26 exists to help students and new developers gain practical open-source experience in a structured, supportive space. The goal is simple: **contribute, learn, and leave with visible work and a stronger GitHub profile.**

### 🌟 Our Vision

We're building a long-term ecosystem where contributors, mentors, and maintainers grow together. DSoC is a launchpad into global open-source communities, internships, and programs like GSoC and more.

---

## ✨ What You'll Get

- 🎓 **Official Certificates** - Blockchain-verified certificates upon successful completion
- 🏆 **Recognition** - Community showcases and visibility among peers and employers
- 👨‍🏫 **Mentorship** - 1:1 and group sessions with experienced mentors
- 💻 **Real Projects** - Work on impactful open-source projects
- 🎁 **Exclusive Swags** - Limited edition DSoC '26 merchandise for top contributors
- 🎟️ **Event Access** - Premium tech conference and workshop tickets
- 💼 **LinkedIn Badge** - Official contribution badge for your professional profile

---

## 🚀 Program Roles

### 👨‍💻 Contributors
Work on curated open-source projects, submit PRs, and earn points on the leaderboard.

### 👨‍🏫 Mentors
Guide contributors through their open-source journey and review contributions.

### 🔧 Project Admins
Maintain projects, review PRs, and ensure quality contributions.

---

## 📊 Leaderboard System

DSoC features a dynamic leaderboard that tracks contributions:
- **3 points** per merged PR with the `DSoC26` label
- Real-time GitHub webhook integration
- Automated point calculation
- Public profile pages for all participants

---

## 🛠️ Tech Stack

- **Framework:** Next.js 16 (App Router)
- **UI:** React 19, Tailwind CSS, Framer Motion
- **Database:** MongoDB
- **Authentication:** NextAuth with GitHub OAuth
- **Deployment:** Vercel-ready

---

## 💻 Getting Started

### Prerequisites
- Node.js 18.17 or later
- npm, yarn, pnpm, or bun
- MongoDB database

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/hackwithindia/dsoc-2026.git
cd dsoc-2026
```

2. **Install dependencies**
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. **Set up environment variables**

Create a `.env.local` file in the root directory:

```env
# Database
MONGODB_URI=your_mongodb_connection_string

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret_key

# GitHub OAuth
GITHUB_ID=your_github_oauth_client_id
GITHUB_SECRET=your_github_oauth_client_secret

# GitHub API
GITHUB_TOKEN=your_github_personal_access_token

# Email (if using)
EMAIL_USER=your_email
EMAIL_PASS=your_email_password
```

4. **Run the development server**
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

5. **Open your browser**

Navigate to [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
DSoC2026/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── api/            # API routes
│   │   ├── apply/          # Application pages
│   │   ├── leaderboard/    # Leaderboard pages
│   │   ├── profile/        # User profiles
│   │   └── ...
│   ├── components/         # React components
│   ├── lib/               # Utility functions
│   ├── models/            # MongoDB models
│   └── hooks/             # Custom React hooks
├── public/                # Static assets
└── ...
```

---

## 🤝 Contributing

We welcome contributions to improve the DSoC platform! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add some amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### Contribution Guidelines
- Follow the existing code style
- Write clear commit messages
- Test your changes thoroughly
- Update documentation as needed

---

## 📝 Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

---

## 🔗 Important Links

- **Website:** Coming Soon
- **GitHub:** [github.com/hackwithindia](https://github.com/hackwithindia)
- **Discord:** [discord.gg/hackwithindia](https://discord.gg/hackwithindia)
- **LinkedIn:** [linkedin.com/company/hackwithindia](https://linkedin.com/company/hackwithindia)
- **Email:** hello@hackwithindia.tech

---

## 👥 Program Managers

- **Rajan Jha** - Program Manager
- **Aviral** - Program Manager

---

## 📜 License

This project is part of DSoC 2026 - Devnovate Summer of Code.

---

## 🙏 Acknowledgments

- All contributors and participants
- Our amazing mentors and project admins
- Partner communities and sponsors
- The open-source community

---

<div align="center">
  <p>Made with ❤️ by the Devnovate Team</p>
  <p>DSoC 2026 - Empowering Open Source Contributors</p>
</div>
