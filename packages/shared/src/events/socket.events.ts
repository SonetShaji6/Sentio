export const SOCKET_EVENTS = {
  // ── Core ──
  CONNECT: "connect",
  DISCONNECT: "disconnect",
  ERROR: "error",

  // ── Room Management ──
  JOIN_ROOM: "join_room",
  LEAVE_ROOM: "leave_room",

  // ── Session Lifecycle (Module 7) ──
  HOST_START: "host-start",
  HOST_END: "host-end",
  HOST_PAUSE: "host-pause",
  HOST_RESUME: "host-resume",
  HOST_STATE_TRANSITION: "host-state-transition", // Replaces slide-change
  JOIN_SESSION: "join-session",
  JOIN_SUCCESS: "join-success",
  JOIN_ERROR: "join-error",
  SESSION_STARTED: "session-started",
  SESSION_ENDED: "session-ended",
  SESSION_PAUSED: "session-paused",
  SESSION_RESUMED: "session-resumed",
  STATE_TRANSITION: "state-transition", // Replaces slide-changed
  AUDIENCE_UPDATED: "audience-updated",

  // ── Presentation & Slides ──
  PRESENTATION_UPDATE: "presentation_update",
  SLIDE_CHANGE: "slide_change",
  HOST_SLIDE_CHANGE: "host-slide-change",
  SLIDE_CHANGED: "slide-changed",
  SUBMIT_RESPONSE: "submit_response",
  NEW_RESPONSE: "new_response",
  NOTIFICATION: "notification",

  // ── Module 8: Interaction System ──
  SLIDE_DATA: "slide-data",
  INTERACTION_SUBMIT: "interaction:submit",
  INTERACTION_RESULT: "interaction:result",
  INTERACTION_ERROR: "interaction:error",

  // Poll
  POLL_UPDATE: "poll:update",

  // Quiz
  QUIZ_UPDATE: "quiz:update",
  LEADERBOARD_UPDATE: "leaderboard:update",

  // Word Cloud
  WORDCLOUD_UPDATE: "wordcloud:update",

  // Open Text
  OPENTEXT_UPDATE: "opentext:update",
  RESPONSE_MODERATED: "response:moderated",

  // Rating
  RATING_UPDATE: "rating:update",

  // Response Lock
  RESPONSE_LOCK: "response:lock",
  RESPONSE_UNLOCK: "response:unlock",
  HOST_LOCK_RESPONSES: "host-lock-responses",
  HOST_UNLOCK_RESPONSES: "host-unlock-responses",

  // Emoji Reactions
  REACTION_SEND: "reaction:send",
  REACTION_UPDATE: "reaction:update",

  // Q&A
  QNA_SUBMIT: "qna:submit",
  QNA_UPDATE: "qna:update",
  QNA_MODERATE: "qna:moderate",

  // Results (legacy compat)
  RESULTS_UPDATED: "results-updated",
} as const;

export type SocketEventType =
  (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];
