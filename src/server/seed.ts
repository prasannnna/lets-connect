import { db } from './db.js';
import { hashPassword } from './auth.js';

export async function seedDatabase() {
  const defaultPasswordHash = await hashPassword('Aditya@2025');

  // 1. Insert Initial Categories if missing
  const existingCategories = await db.execute('SELECT COUNT(*) as count FROM categories');
  if (Number(existingCategories.rows[0].count) === 0) {
    await db.execute({
      sql: `INSERT INTO categories (slug, name, description, accent) VALUES
        ('placement-prep', 'Placement Prep', 'Company-specific interview experiences, resume reviews, aptitude & HR advice for Aditya campus placements.', 'from-blue-600 to-indigo-600'),
        ('dsa-coding', 'DSA & Coding', 'Algorithms, LeetCode problem discussions, competitive programming contests & system design.', 'from-emerald-600 to-teal-600'),
        ('academic-projects', 'Academic & Projects', 'Major/minor project ideas, research papers, lab guidance, IoT/Web/AI project stacks & faculty advice.', 'from-purple-600 to-pink-600'),
        ('anonymous-qa', 'Anonymous Q&A', 'Ask honest questions about college life, hostel, branch change, attendance rules & peer advice without fear.', 'from-amber-600 to-orange-600');
      `,
      args: [],
    });
  }

  // 2. Ensure ONLY ApexModerator account exists as the demo account
  const modCheck = await db.execute({
    sql: 'SELECT id FROM students WHERE email = ?',
    args: ['moderator@aditya.ac.in'],
  });

  let moderatorId = 1;
  if (modCheck.rows.length === 0) {
    const modInsert = await db.execute({
      sql: `INSERT INTO students (email, password_hash, pseudonym, role, avatar_seed) 
            VALUES ('moderator@aditya.ac.in', ?, 'ApexModerator', 'Moderator', 'ApexModerator_101')`,
      args: [defaultPasswordHash],
    });
    moderatorId = Number(modInsert.lastInsertRowid);
  } else {
    moderatorId = Number(modCheck.rows[0].id);
    await db.execute({
      sql: `UPDATE students SET pseudonym = 'ApexModerator', role = 'Moderator' WHERE id = ?`,
      args: [moderatorId],
    });
  }

  // Remove any legacy student demo accounts so only ApexModerator is present
  await db.execute({
    sql: `DELETE FROM students WHERE email IN (
      'rahul.senior@aec.edu.in',
      'swetha.alumni@aditya.ac.in',
      'kiran.junior@aec.edu.in',
      'priya.senior@aditya.ac.in',
      'anand.junior@aec.edu.in'
    )`,
    args: [],
  });

  // Re-assign existing posts and comments to moderatorId
  await db.execute({
    sql: 'UPDATE posts SET student_id = ? WHERE student_id NOT IN (SELECT id FROM students)',
    args: [moderatorId],
  });
  await db.execute({
    sql: 'UPDATE comments SET student_id = ? WHERE student_id NOT IN (SELECT id FROM students)',
    args: [moderatorId],
  });

  // 3. Check if posts already exist
  const existingPosts = await db.execute('SELECT COUNT(*) as count FROM posts');
  if (Number(existingPosts.rows[0].count) > 0) {
    return; // Already has discussions
  }

  console.log('🌱 Seeding database with Aditya University initial discussions...');

  // Insert Posts
  await db.execute({
    sql: `
      INSERT INTO posts (student_id, category_id, title, body, tags, is_pinned, created_at) VALUES
      (?, 1, 'How I cracked Amazon SDE-1 On-Campus (Full Interview Experience & Tips)',
      'Hey Aditya folks! Sharing my 2025 on-campus placement experience to help juniors preparing for upcoming drive.\n\n### Round 1: Online Assessment (90 Mins)\n- 2 DSA questions on HackerEarth (1 Medium Sliding Window + 1 Hard Graph BFS).\n- Work style assessment (Leadership Principles are crucial—do not skip preparation on this!).\n\n### Round 2: Technical Interview 1 (60 Mins)\n- Started with project deep-dive on my React/Node.js web app.\n- DSA: Longest Substring Without Repeating Characters and Word Break.\n- Handled edge cases and explained time/space complexity.\n\n### Round 3: Technical + Bar Raiser (60 Mins)\n- Low-Level Design of a parking lot system.\n- Behavioral questions focused on "Customer Obsession" and "Bias for Action".\n\n### Key Takeaways for 3rd & 4th Years:\n1. Master Striver’s SDE Sheet completely.\n2. Do mock interviews with batchmates on weekends.\n3. Prepare 2 solid full-stack/AI projects with real architecture.\n\nFeel free to ask your questions below!',
      '["Placements", "Amazon", "SDE", "InterviewExperience"]', 1, datetime('now', '-3 days')),

      (?, 2, 'The 90-Day DSA Roadmap that took me from 0 to 400+ LeetCode problems',
      'When I was in 2nd year at AEC, I was completely overwhelmed by Dynamic Programming and Trees. Here is the structured breakdown that worked for me and several juniors I mentored:\n\n- **Month 1 (Basics & Linear DS):** Arrays, Two Pointers, Sliding Window, Strings, HashMaps, Recursion basics. Target: 100 problems.\n- **Month 2 (Non-linear DS):** Binary Trees, BSTs, Heaps, Graphs (BFS/DFS, Topological Sort, Dijkstra). Target: 150 problems.\n- **Month 3 (Advanced & Patterns):** 1D/2D Dynamic Programming, Greedy, Backtracking, Trie.\n\n**Best Resources:**\n- NeetCode 150\n- Take U Forward (Striver)\n- Aditya Verma DP Playlist (Legendary for beginners)\n\nConsistency > 8 hours on Sunday. Do 2 problems daily without missing!',
      '["DSA", "LeetCode", "Roadmap", "Coding"]', 0, datetime('now', '-2 days')),

      (?, 3, 'Unique Capstone Project Ideas for 2025 Final Year (Avoid Generic Clones)',
      'Every year, external reviewers see 50 hospital management and library management systems. If you want top grades and resume value, build something domain-specific:\n\n1. **Smart Campus Energy Monitoring with IoT & ML:** Anomaly detection in power usage using ESP32 sensor streams.\n2. **Decentralized Credential Verification:** Verify student transcripts on lightweight distributed ledger.\n3. **Multilingual Local Document QA:** Offline RAG system for Telugu/English university regulations using quantization.\n\nLet me know if you need help architecting any of these!',
      '["Projects", "FinalYear", "Ideas", "AI"]', 0, datetime('now', '-1 day')),

      (?, 4, 'Is maintaining a 8.5+ CGPA really necessary for Tier-1 company shortlists?',
      'I am currently in 2nd year CSE. My current CGPA is 7.8, but I have solved 250+ questions on LeetCode and built 2 nice projects. Some seniors tell me 8.0+ is a strict cutoff for TCS Digital/Amazon on campus, while others say skills matter more.\n\nCan seniors or alumni from AEC/Aditya give an honest picture about how cutoffs work during shortlisting?',
      '["CGPA", "Advice", "CampusCutoffs", "Academics"]', 0, datetime('now', '-8 hours'));
    `,
    args: [moderatorId, moderatorId, moderatorId, moderatorId],
  });

  // Insert Replies
  await db.execute({
    sql: `
      INSERT INTO comments (post_id, student_id, parent_id, body, created_at) VALUES
      (1, ?, NULL, 'Congratulations! How important is CS Fundamentals (OS, DBMS, CN) during the technical rounds?', datetime('now', '-2 days, +3 hours')),
      (1, ?, 1, 'Very important in Round 2! They asked me about ACID properties, Indexing in MySQL, and Virtual Memory paging. Spend at least 2 weeks reviewing Gate Smashers or Knowledge Gate playlists.', datetime('now', '-2 days, +5 hours')),
      (4, ?, NULL, 'Here is the reality: Having an 8.0+ CGPA keeps all doors open. Around 20% of super dream companies keep 8.0 as initial filter before OA. Try to pull your 7.8 to 8.1 over the next 2 semesters!', datetime('now', '-6 hours'));
    `,
    args: [moderatorId, moderatorId, moderatorId],
  });

  console.log('✅ Database initialized with ApexModerator and clean discussions.');
}
