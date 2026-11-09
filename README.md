# Anonymous Peer Mentorship Platform

A secure and pseudonymous peer mentorship platform designed to connect university students with seniors and peers for academic guidance, programming discussions, project assistance, and placement preparation.

## Live Demo

🔗 **Deployed Application:** https://lets-connect-f7yw.onrender.com

##  Overview

Students often hesitate to approach seniors due to fear of judgment when asking basic academic or technical questions. Existing messaging platforms lack structured discussions, effective searchability, and dedicated moderation.

The Anonymous Peer Mentorship Platform addresses these challenges by providing a centralized environment where verified university students can interact through pseudonymous profiles, share knowledge, and seek mentorship.

##  Features

- **Verified Student Authentication:** University email-based registration and authentication.
- **Pseudonymous Profiles:** Interact with other students without publicly revealing real identities.
- **Categorized Discussions:** Organize questions into DSA, placements, academics, projects, and career guidance.
- **Threaded Replies:** Maintain organized conversations and discussions.
- **Upvoting System:** Highlight useful answers and valuable contributions.
- **Reputation System:** Encourage students to contribute helpful academic knowledge.
- **AI-Assisted Moderation:** Integrate Google Gemini API for contextual content moderation.
- **Rule-Based Filtering:** Detect inappropriate content and suspicious messages.
- **Moderator Dashboard:** Support human review of flagged content.
- **Responsive Interface:** Provide a user-friendly experience across devices.

##  Tech Stack

| Category | Technologies |
|---|---|
| Frontend | React 18, TypeScript |
| Styling | Tailwind CSS v4 |
| Routing | Wouter |
| Data Fetching | TanStack React Query |
| Backend | Node.js, Express.js |
| Database | SQLite / libSQL |
| Authentication | JWT, HTTP-only Cookies |
| Password Security | bcrypt |
| AI Moderation | Google Gemini API |
| Deployment | Docker, Google Cloud Run |

##  System Architecture

The application follows a three-tier architecture:

1. **Presentation Layer:** React and TypeScript provide the user interface.
2. **Application Layer:** Node.js and Express handle business logic, authentication, API requests, and moderation.
3. **Data Layer:** SQLite/libSQL stores user information, discussions, replies, votes, and moderation records.

### Application Workflow

1. Students register and verify their university credentials.
2. Users access the platform through pseudonymous profiles.
3. Students create categorized academic discussions.
4. Other users contribute through threaded replies and upvotes.
5. Submitted content undergoes moderation checks.
6. Flagged content is reviewed through the moderation dashboard.

##  Security and Privacy

- University email verification for controlled access.
- JWT-based authentication for session management.
- bcrypt password hashing.
- HTTP-only cookies for authentication token protection.
- Pseudonymous public profiles to protect student identities.
- AI-assisted and rule-based content moderation.


##  Future Enhancements

- Migration to PostgreSQL for improved scalability.
- Real-time notifications for replies and mentions.
- Advanced AI-based toxicity detection.
- Automatic discussion categorization.
- Personalized mentor recommendations.
- Improved analytics for academic discussions.
- Mobile application support.

##  Project Objectives

- Encourage students to ask questions without fear of judgment.
- Improve academic knowledge sharing between juniors and seniors.
- Provide organized and searchable academic discussions.
- Promote a safe and respectful online learning environment.

##  Contributors

- G. Mohana Durga
- B. S. S. Prasanna Rameswari


##  References

- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Node.js Documentation](https://nodejs.org/docs/)
- [Express.js Documentation](https://expressjs.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Google Gemini API Documentation](https://ai.google.dev/gemini-api/docs)

---


