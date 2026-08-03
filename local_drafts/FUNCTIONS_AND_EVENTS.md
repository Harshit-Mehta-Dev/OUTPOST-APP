# Outpost App — Functions & Events

> Last updated: 2026-08-01 (XP Sync Fix, 3-Strike Security, Redis Fixes)

---

## HTTP API Routes (Express)

### Users (`/api/users`)
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/register` | No | Register with email, username, password. Captcha required. |
| POST | `/login` | No | Login. Returns JWT. Captcha required. |
| POST | `/sync` | No | Google Auth sync — creates user if not exists. |
| GET | `/me` | ✅ | **[NEW]** Fetch fresh user data (XP, Level, profilePic) from DB. |
| GET | `/` | ✅ | Fetch all users (admin/developer view). Returns basic fields only. |
| PUT | `/profile` | ✅ | Update username, avatar, password. |
| PATCH | `/:email/disable` | ✅ | Temporarily disable account. |
| DELETE | `/:email` | ✅ | Permanently delete account. |
| GET | `/:username/alerts` | No | Fetch system alerts for a user. |
| DELETE | `/:username/alerts` | ✅ | Clear all system alerts. |
| PUT | `/global-restrict` | ✅ Dev | Globally restrict a user (developer only). |
| POST | `/2fa/setup` | ✅ | Generate 2FA QR code. |
| POST | `/2fa/verify` | ✅ | Verify and enable 2FA. |
| POST | `/forgot-password` | No | Send password reset email (Captcha required). |
| POST | `/reset-password` | No | Reset password with token + 2FA code. |

### Campsites (`/api/campsites`)
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/user/:username/:email` | No | Get all campsites for a user. |
| POST | `/create` | ✅ | Create a new campsite. |
| POST | `/join` | ✅ | Join a campsite by invite code. |
| PUT | `/:id` | ✅ | Update campsite details. |
| DELETE | `/:id` | ✅ | Delete a campsite. |

### Messages (`/api/messages`)
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/:channelKey` | No | Fetch last 100 messages for a channel. Decrypts on-the-fly. |
| QUERY | `/search` | No | Advanced search using HTTP QUERY method with JSON filter body. |

### AI Scout (`/api/ai`)
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/chat` | ✅ | Send a message to Ai-Scout. Includes 3-Strike Security system. |

### Other Routes
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/health` | Keep-alive health check. |
| GET | `/api/auth/captcha` | Generate a signed SVG captcha. |
| GET | `/api/help` | Help desk ticketing. |
| GET | `/api/operator` | Developer-level operator controls. |
| GET | `/api/admin` | Admin management routes. |
| GET | `/api-docs` | Swagger UI (protected by Basic Auth). |

---

## WebSocket Events (Socket.io)

### Client → Server (Emitted by Frontend)
| Event | Payload | Description |
|-------|---------|-------------|
| `join_channel` | `channelKey` | Subscribe to a chat room. |
| `join_campsite_room` | `campsiteId` | Subscribe to campsite-level events. |
| `join_admin_room` | `email` | Subscribe to admin notifications (by email). |
| `join_user_room` | `username` | Subscribe to personal events (XP, kick, ban). |
| `send_message` | message data | Send a chat message. Triggers XP engine + fan-out. |
| `submit-scout-vote` | poll data | Submit a poll vote. |
| `like_message` | `{ messageId, channelKey, username }` | Like/unlike a message. |
| `pin_message` | `{ messageId, channelKey, isPinned }` | Pin/unpin a message. |
| `delete_message_for_all` | `{ messageId, channelKey, username }` | Delete a message (author or mod). |
| `scout-typing-start` | `{ channelId, scoutName }` | Typing indicator on. |
| `scout-typing-stop` | `{ channelId, scoutName }` | Typing indicator off. |

### Server → Client (Emitted by Server)
| Event | Payload | Description |
|-------|---------|-------------|
| `receive_message` | full message object | Broadcasts processed + decrypted message to channel room. |
| `xp_update` | `{ level, xp }` | **[NEW]** Fires after EVERY message. Keeps sidebar level badge in sync. |
| `level_up_alert` | `{ newLevel, xp }` | Fires ONLY when the user gains a new level. |
| `incoming-signal-alert` | notification data | Fan-out push notification to members not in the channel. |
| `message_liked` | `{ messageId, likes }` | Broadcast updated like state. |
| `message_pinned` | `{ messageId, isPinned }` | Broadcast pin state change. |
| `message_deleted` | `{ messageId, channelKey }` | Broadcast deletion to all in channel. |
| `broadcast-typing-start/stop` | `{ scoutName }` | Broadcast typing state to channel. |
| `broadcast-updated-vote` | poll data | Broadcast updated poll vote counts. |
| `force_logout` | `{ reason }` | **[NEW]** 3-Strike: Forces user client to log out. |
| `user_kicked` | kick data | Notifies user they were kicked. |
| `user_banned` | ban data | Notifies user they were banned. |
| `global-restricted` | `{ targetUsername }` | Notifies user of global restriction. |
| `permission_denied` | `{ message }` | Access denied notification. |
| `server_alert` | `{ message }` | Rate-limit or general warning from server. |

---

## XP & Levelling Engine

**Formula:** `Level = floor(sqrt(XP * 0.1)) + 1`

| Message Type | XP Gain |
|-------------|---------|
| Text message | +10 XP |
| Media message | +15 XP |
| Poll creation | +20 XP |

**Flow:**
1. User sends message → Server saves to MongoDB.
2. XP is incremented in DB (`User.xp += xpGain`).
3. New level is calculated via formula.
4. `xp_update` event is **always** emitted to the sender's user room.
5. If levelled up, `level_up_alert` event is also emitted (triggers UI celebration).
6. Frontend `handleXpUpdate` → updates `localStorage` + `setCurrentUser` state immediately.
7. Scout Registry fetches fresh data from `GET /api/users/me` when opened.

*This file is restricted to your local machine and will not be pushed to GitHub.*
