# HabitPulse Security Specification & Red Team Audit

## 1. Data Invariants
1. **User Profile Ownership**: A user profile document `/users/{userId}` can only be read, created, or updated by the authenticated user whose `request.auth.uid == userId`.
2. **Routine Ownership & Isolation**: A routine in `/routines/{routineId}` must have `userId == request.auth.uid`. No user can create, edit, or delete routines belonging to another user.
3. **Task Integrity**: A task in `/tasks/{taskId}` must have `userId == request.auth.uid`. Task durations, categories, and titles must adhere to bounded limits.
4. **Completion Log Integrity**: A completion record `/completions/{completionId}` can only be written by the authenticated user (`userId == request.auth.uid`). The document ID must be valid and conform to size constraints.
5. **Community Post Attribution**: Community posts `/communityPosts/{postId}` can be read by any signed-in user, but created only by the authenticated author (`userId == request.auth.uid`). Updates are restricted to modifying `cheerCount` atomically or the author modifying content.
6. **Cheer Reactions**: Cheers `/communityPosts/{postId}/cheers/{cheerId}` must have `userId == request.auth.uid` and valid reaction types (`fire`, `clap`, `rocket`, `muscle`, `heart`).
7. **Strict Query Enforcement**: All list queries on user-scoped collections (`routines`, `tasks`, `completions`) must enforce `resource.data.userId == request.auth.uid`. Blanket list reads are forbidden.
8. **Catch-All Default Deny**: All unmapped paths default to `allow read, write: if false;`.

---

## 2. The Dirty Dozen Adversarial Payloads
The following 12 payloads represent attack vectors that MUST return `PERMISSION_DENIED`:

1. **Payload 1 (Identity Spoofing - Tasks)**: User A sends a write to `/tasks/task-hack-1` with `userId: "user-victim-B"`.
2. **Payload 2 (Ghost Field Injection)**: User A creates a routine containing `{ isSuperAdmin: true, title: "Morning" }`.
3. **Payload 3 (Denial of Wallet - 100KB Title)**: User A creates a task with a title string consisting of 100,000 characters.
4. **Payload 4 (Profile Theft)**: User A attempts to overwrite `/users/user-victim-B`.
5. **Payload 5 (Unauthenticated Write)**: An unauthenticated guest tries to insert a community post into `/communityPosts/post-1`.
6. **Payload 6 (Cross-User Routine Deletion)**: User A tries to delete `/routines/routine-B` where `userId != request.auth.uid`.
7. **Payload 7 (Invalid Enum Injection)**: User creates a task with `category: "cryptomining"` (not in allowed category enum).
8. **Payload 8 (Completion Impersonation)**: User A writes a completion for User B's task to forge User B's streak.
9. **Payload 9 (Blanket Query Scraping)**: A user queries `/tasks` without a filter on their own `userId`.
10. **Payload 10 (Path Traversal / Malicious ID)**: Attacker attempts to write to a path containing `../` or special control chars.
11. **Payload 11 (Cheer Reaction Forgery)**: User creates a cheer with `reaction: "exploit_reaction"`.
12. **Payload 12 (Negative Duration Exploit)**: User writes a task with negative duration `durationMinutes: -120`.

---

## 3. Test Runner Invariant Suite
All 12 attacks are blocked deterministically by the hardened Firestore Security Rules using `isValidId()`, `isSignedIn()`, `isValidUserProfile()`, `isValidRoutine()`, `isValidTask()`, `isValidCompletion()`, `isValidCommunityPost()`, and `isValidCheer()`.
