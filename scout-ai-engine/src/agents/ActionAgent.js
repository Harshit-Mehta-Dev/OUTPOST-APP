/**
 * ==============================================================================
 * ACTION EXECUTION & CONVERSATIONAL WORKFLOW AGENT (ActionAgent)
 * ==============================================================================
 * Enables Ai-Scout to automate operations across Outpost HQ:
 * 1. Create a New Campsite (Group / Bootcamp)
 * 2. Initiate an Expedition (Text / Voice / Forum Channel)
 * 3. Pin a Sticky Note on the Basecamp Board
 *
 * Pattern:
 * - Collects missing requirements interactively step-by-step
 * - When all slots are filled, asks for user confirmation
 * - Executes action automatically on confirmation ('yes', 'confirm', 'proceed')
 * ==============================================================================
 */

class ActionAgent {
  constructor() {
    // Session state per user: { [userId]: { actionType, step, data } }
    this.sessions = new Map();
  }

  getSession(userId) {
    return this.sessions.get(userId) || null;
  }

  setSession(userId, state) {
    this.sessions.set(userId, state);
  }

  clearSession(userId) {
    this.sessions.delete(userId);
  }

  /**
   * Main evaluation entry point
   * @param {string} text User input
   * @param {string} userId Unique identifier
   * @param {object} context Environment context (activeCampsiteId, username, etc.)
   */
  evaluate(text, userId = 'scout_user', context = {}) {
    const clean = text.trim();
    const lower = clean.toLowerCase();
    const session = this.getSession(userId);

    // Cancel command
    if (session && /^(cancel|abort|stop|nevermind|no\s+cancel|exit)$/i.test(lower)) {
      this.clearSession(userId);
      return {
        text: "🛑 Operation cancelled. Your draft has been cleared. What would you like to do instead?",
        action: null
      };
    }

    // --------------------------------------------------------------------------
    // ACTIVE WORKFLOW DISPATCHER
    // --------------------------------------------------------------------------
    if (session) {
      if (session.actionType === 'create_campsite') {
        return this.handleCampsiteWorkflow(clean, lower, userId, session);
      }
      if (session.actionType === 'create_channel') {
        return this.handleChannelWorkflow(clean, lower, userId, session, context);
      }
      if (session.actionType === 'create_note') {
        return this.handleNoteWorkflow(clean, lower, userId, session, context);
      }
    }

    // --------------------------------------------------------------------------
    // WORKFLOW INITIATION TRIGGERS
    // --------------------------------------------------------------------------

    // Trigger 1: Create Campsite / Group / Basecamp
    const isCampsiteTrigger = /(create|build|make|ignite|start|setup|new)\s+(a\s+)?(campsite|camp|group|bootcamp|outpost|basecamp(\s+group)?)/i.test(lower) &&
      !/(sticky\s+note|board\s+note|channel|expedition)/i.test(lower);

    if (isCampsiteTrigger) {
      // Check if user already supplied the name in the prompt: e.g. "create a new campsite named Dev Tavern"
      const nameMatch = clean.match(/(?:named|called|with name)\s+["']?([^"']+)["']?/i);
      const initialName = nameMatch ? nameMatch[1].trim() : '';

      this.setSession(userId, {
        actionType: 'create_campsite',
        step: initialName ? 'ask_template' : 'ask_name',
        data: {
          name: initialName,
          template: 'casual',
          isPublic: true
        }
      });

      if (initialName) {
        return {
          text: `🏕️ **Initiating New Campsite:** **"${initialName}"**!\n\n` +
            `What layout template would you like?\n` +
            `1️⃣ **Gaming** (Lobby, patch-notes, Frontlines voice)\n` +
            `2️⃣ **Dev** (general-dev, code-review, Pair-Programming voice)\n` +
            `3️⃣ **Casual** (chit-chat, memes, Around the Fire voice)\n\n` +
            `*Reply with "Gaming", "Dev", or "Casual" (or say "cancel" to abort).*`,
          action: null
        };
      }

      return {
        text: `🏕️ **Let's establish a brand new Campsite (Group)!**\n\n` +
          `I will guide you step-by-step and create it automatically once you confirm.\n\n` +
          `**Step 1:** What would you like to name your new Campsite?\n` +
          `*(e.g., "The Cyber Lounge" or "Indie Devs Guild")*`,
        action: null
      };
    }

    // Trigger 2: Initiate Expedition / Create Channel
    const isChannelTrigger = /(create|initiate|start|add|new|make)\s+(a\s+)?(expedition|channel|room|voice\s+room|chat\s+room)/i.test(lower);

    if (isChannelTrigger) {
      const nameMatch = clean.match(/(?:named|called|with name)\s+["']?([^"']+)["']?/i);
      const initialName = nameMatch ? nameMatch[1].trim().replace(/\s+/g, '-').toLowerCase() : '';

      const isVoice = /\b(voice|audio|call|hearth)\b/i.test(lower);
      const initialType = isVoice ? 'voice' : 'text';

      this.setSession(userId, {
        actionType: 'create_channel',
        step: initialName ? 'confirm' : 'ask_name',
        data: {
          name: initialName,
          type: initialType,
          topic: ''
        }
      });

      if (initialName) {
        return {
          text: `🚀 **Initiating Expedition:** **#${initialName}** (${initialType.toUpperCase()})\n\n` +
            `Should I ignite this expedition in your active campsite right now?\n` +
            `*Reply **"Yes"** to confirm and create, or reply with a channel topic.*`,
          action: null
        };
      }

      return {
        text: `🚀 **Let's ignite a new Expedition (Channel)!**\n\n` +
          `**Step 1:** What should be the channel name?\n` +
          `*(e.g., "general-chat", "game-clips", or "standup-voice")*`,
        action: null
      };
    }

    // Trigger 3: Create Sticky Note on Basecamp Board
    const isNoteTrigger = /(create|post|pin|add|new|write)\s+(a\s+)?(sticky\s+note|note|wall\s+note|board\s+note)/i.test(lower);

    if (isNoteTrigger) {
      this.setSession(userId, {
        actionType: 'create_note',
        step: 'ask_title',
        data: {
          title: '',
          body: '',
          color: '#fef3c7'
        }
      });

      return {
        text: `📌 **Pinning a new Sticky Note to Basecamp Board!**\n\n` +
          `**Step 1:** What is the Title of your note?\n` +
          `*(e.g., "Hackathon this Weekend!" or "Welcome New Scouts")*`,
        action: null
      };
    }

    return null;
  }

  // ----------------------------------------------------------------------------
  // CAMPSITE WORKFLOW
  // ----------------------------------------------------------------------------
  handleCampsiteWorkflow(clean, lower, userId, session) {
    const { step, data } = session;

    if (step === 'ask_name') {
      const name = clean.replace(/^(name\s+is|it('?s)?\s+called|call\s+it)\s+/i, '').trim();
      if (!name) {
        return { text: "Please provide a valid name for your campsite:" };
      }
      data.name = name;
      session.step = 'ask_template';
      return {
        text: `Awesome! **"${name}"** sounds great.\n\n` +
          `**Step 2:** Choose a layout template for your camp:\n` +
          `1️⃣ **Gaming** (Lobby, patch-notes, Frontlines voice)\n` +
          `2️⃣ **Dev** (general-dev, code-review, Pair-Programming voice)\n` +
          `3️⃣ **Casual** (chit-chat, memes, Around the Fire voice)\n\n` +
          `*Reply with "Gaming", "Dev", or "Casual".*`
      };
    }

    if (step === 'ask_template') {
      let template = 'casual';
      if (/gaming|game|guild|1/i.test(lower)) template = 'gaming';
      else if (/dev|developer|code|tavern|tech|2/i.test(lower)) template = 'dev';
      else if (/casual|camp|chat|3/i.test(lower)) template = 'casual';
      else {
        return { text: "Please choose one of the available templates: **Gaming**, **Dev**, or **Casual**." };
      }

      data.template = template;
      session.step = 'ask_visibility';
      return {
        text: `Got it — template set to **${template.toUpperCase()}**.\n\n` +
          `**Step 3:** Should this campsite be **Public** (visible in Discover) or **Hidden** (invite-only)?\n` +
          `*Reply "Public" or "Hidden".*`
      };
    }

    if (step === 'ask_visibility') {
      const isPublic = !/hidden|private|invite|secret/i.test(lower);
      data.isPublic = isPublic;
      session.step = 'confirm';

      return {
        text: `📋 **Campsite Requirements Summary:**\n\n` +
          `• **Name:** ${data.name}\n` +
          `• **Layout Template:** ${data.template.toUpperCase()}\n` +
          `• **Visibility:** ${data.isPublic ? '🌐 Public Basecamp' : '🔒 Hidden Outpost'}\n` +
          `• **Creator:** Administrator\n\n` +
          `👉 **Ready to establish?** Reply **"Yes"** or **"Confirm"** to ignite it automatically, or **"Cancel"** to abort.`,
        action: {
          type: 'CONFIRMATION_REQUIRED',
          payload: { actionType: 'create_campsite', ...data }
        }
      };
    }

    if (step === 'confirm') {
      if (/^(yes|yep|confirm|proceed|create|ignite|do\s+it|ok|sure|affirmative)$/i.test(lower)) {
        this.clearSession(userId);
        return {
          text: `🔥 **Campfire Ignited!** Your new campsite **"${data.name}"** (${data.template.toUpperCase()}) is being established right now.\n\n` +
            `Scout-Guardian has approved the automated provisioning. It has been added to your Outpost sidebar!`,
          action: {
            type: 'CREATE_CAMPSITE',
            payload: {
              name: data.name,
              template: data.template,
              isPublic: data.isPublic,
              imageUrl: ''
            }
          }
        };
      } else {
        return {
          text: `Please reply **"Yes"** to confirm and establish **"${data.name}"**, or say **"Cancel"** to abort.`
        };
      }
    }

    return null;
  }

  // ----------------------------------------------------------------------------
  // CHANNEL WORKFLOW
  // ----------------------------------------------------------------------------
  handleChannelWorkflow(clean, lower, userId, session, context) {
    const { step, data } = session;

    if (step === 'ask_name') {
      const rawName = clean.replace(/^(name\s+is|it('?s)?\s+called|call\s+it|#)\s*/i, '').trim();
      const channelName = rawName.replace(/\s+/g, '-').toLowerCase();
      if (!channelName) {
        return { text: "Please provide a valid channel name:" };
      }
      data.name = channelName;
      session.step = 'ask_type';
      return {
        text: `Got it! **#${channelName}**.\n\n` +
          `**Step 2:** Select the channel type:\n` +
          `💬 **Text** — Standard real-time messaging\n` +
          `🔊 **Voice** — The Hearth voice lobby\n` +
          `📋 **Forum** — Asynchronous threaded forum\n\n` +
          `*Reply with "Text", "Voice", or "Forum".*`
      };
    }

    if (step === 'ask_type') {
      let type = 'text';
      if (/voice|audio|call|hearth/i.test(lower)) type = 'voice';
      else if (/forum|thread|board/i.test(lower)) type = 'forum';
      data.type = type;

      session.step = 'confirm';
      return {
        text: `📋 **Expedition Requirements Summary:**\n\n` +
          `• **Channel:** #${data.name}\n` +
          `• **Type:** ${data.type.toUpperCase()}\n` +
          `• **Location:** Active Campsite\n\n` +
          `👉 **Ready to launch?** Reply **"Yes"** or **"Confirm"** to ignite this expedition!`,
        action: {
          type: 'CONFIRMATION_REQUIRED',
          payload: { actionType: 'create_channel', ...data }
        }
      };
    }

    if (step === 'confirm') {
      if (/^(yes|yep|confirm|proceed|ignite|create|do\s+it|ok|sure|affirmative)$/i.test(lower)) {
        this.clearSession(userId);
        return {
          text: `🚀 **Expedition Ignited!** **#${data.name}** (${data.type.toUpperCase()}) is now active in your campsite!`,
          action: {
            type: 'CREATE_CHANNEL',
            payload: {
              name: data.name,
              type: data.type,
              topic: data.topic || ''
            }
          }
        };
      } else {
        return {
          text: `Please reply **"Yes"** to confirm and ignite **#${data.name}**, or say **"Cancel"** to abort.`
        };
      }
    }

    return null;
  }

  // ----------------------------------------------------------------------------
  // STICKY NOTE WORKFLOW
  // ----------------------------------------------------------------------------
  handleNoteWorkflow(clean, lower, userId, session, context) {
    const { step, data } = session;

    if (step === 'ask_title') {
      data.title = clean.trim();
      session.step = 'ask_body';
      return {
        text: `Title: **"${data.title}"**.\n\n` +
          `**Step 2:** What message should be written on the sticky note?\n` +
          `*(Write your announcement, greeting, or memo)*`
      };
    }

    if (step === 'ask_body') {
      data.body = clean.trim();
      session.step = 'ask_color';
      return {
        text: `**Step 3:** Pick a pastel color for your note:\n` +
          `🟡 **Yellow**\n` +
          `🔴 **Peach/Red**\n` +
          `🟢 **Mint Green**\n` +
          `🔵 **Sky Blue**\n` +
          `🟣 **Lavender**\n\n` +
          `*Reply with your favorite color (or say "default").*`
      };
    }

    if (step === 'ask_color') {
      let color = '#fef3c7'; // yellow default
      if (/peach|red|pink/i.test(lower)) color = '#fecaca';
      else if (/green|mint/i.test(lower)) color = '#bbf7d0';
      else if (/blue|sky/i.test(lower)) color = '#bfdbfe';
      else if (/purple|lavender|violet/i.test(lower)) color = '#e9d5ff';
      data.color = color;

      session.step = 'confirm';
      return {
        text: `📋 **Sticky Note Preview:**\n\n` +
          `📌 **${data.title}**\n` +
          `"${data.body}"\n\n` +
          `👉 Ready to pin on Basecamp Board? Reply **"Yes"** to confirm, or **"Cancel"** to abort.`,
        action: {
          type: 'CONFIRMATION_REQUIRED',
          payload: { actionType: 'create_note', ...data }
        }
      };
    }

    if (step === 'confirm') {
      if (/^(yes|yep|confirm|proceed|pin|post|do\s+it|ok|sure|affirmative)$/i.test(lower)) {
        this.clearSession(userId);
        return {
          text: `📌 **Pinned!** Your sticky note **"${data.title}"** has been posted to the Basecamp Board for all Scouts to see!`,
          action: {
            type: 'CREATE_NOTE',
            payload: {
              title: data.title,
              body: data.body,
              color: data.color
            }
          }
        };
      } else {
        return {
          text: `Please reply **"Yes"** to pin your sticky note, or say **"Cancel"** to abort.`
        };
      }
    }

    return null;
  }
}

module.exports = ActionAgent;
