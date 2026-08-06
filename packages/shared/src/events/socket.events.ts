export const SOCKET_EVENTS = {
  CONNECT: "connect",
  DISCONNECT: "disconnect",
  ERROR: "error",
  JOIN_ROOM: "join_room",
  LEAVE_ROOM: "leave_room",
  PRESENTATION_UPDATE: "presentation_update",
  SLIDE_CHANGE: "slide_change",
  SUBMIT_RESPONSE: "submit_response",
  NEW_RESPONSE: "new_response",
  NOTIFICATION: "notification",
} as const;

export type SocketEventType =
  (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];
