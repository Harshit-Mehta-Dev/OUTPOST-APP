# Outpost App Functions & Events

## HTTP API Routes (Express)
- **`/api/users`**: Handles `/login`, `/register`, and profile updates. Protected by `authLimiter`.
- **`/api/campsites`**: Handles `/join`, `/create`, and fetching lists of campsites. Protected by `actionLimiter` and `dataLimiter`.
- **`/api/messages`**: Advanced search using custom `QUERY` HTTP method. Uses `dataLimiter`.
- **`/api/ai`**: Handles `/chat` for communicating with Ai-Scout.
- **`/api/help`**: Help Desk ticketing routes.
- **`/api/operator`**: God-mode admin routes.

## WebSocket Events (Socket.io)
### Outbound (Client to Server)
- `join_channel`: Subscribes a user to a specific chat room.
- `send_message`: Processes incoming messages, runs XP Engine logic, broadcasts fan-out notifications.
- `submit-scout-vote`: Processes poll interactions.
- `like_message`, `pin_message`, `delete_message_for_all`: Message management events.
- `scout-typing-start` / `stop`: Live typing indicators.

### Inbound (Server to Client)
- `receive_message`: Emits decrypted/processed message to all connected clients in a room.
- `incoming-signal-alert`: Fan-out push notifications for users not actively viewing the channel.
- `force_logout`: Security event fired by Ai-Scout 3-Strike rule.

*This file is restricted to your local machine and will not be pushed to GitHub.*
