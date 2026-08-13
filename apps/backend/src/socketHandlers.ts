import { Server, Socket } from "socket.io";
import { SOCKET_EVENTS } from "@sentio/shared";
import Session from "./models/Session";
import Challenge from "./models/Challenge";
import Experience from "./models/Experience";
import QnAQuestion from "./models/QnAQuestion";
import * as interactionService from "./services/interactionService";
import * as reactionService from "./services/reactionService";

export function registerSocketHandlers(io: Server): void {
  io.on("connection", (socket: Socket) => {
    console.log("A user connected:", socket.id);

    registerHostEvents(socket, io);
    registerAudienceEvents(socket, io);
    registerInteractionEvents(socket, io);
    registerReactionEvents(socket, io);
    registerQnAEvents(socket, io);
    registerUserRoomEvents(socket);
    registerDisconnectHandler(socket, io);
  });
}

function registerUserRoomEvents(socket: Socket): void {
  socket.on("user-room:join", ({ userId }) => {
    if (userId) {
      socket.join(`user:${userId}`);
    }
  });
}

// ── Host Events (Module 7 — preserved) ──

function registerHostEvents(socket: Socket, io: Server): void {
  socket.on(SOCKET_EVENTS.HOST_START, async ({ experienceId, joinCode }) => {
    try {
      let session = await Session.findOne({
        experienceId,
        status: { $ne: "ended" },
      });
      if (!session) {
        session = new Session({
          experienceId,
          joinCode,
          status: "live",
          startedAt: new Date(),
          hostSocketId: socket.id,
        });
      } else {
        session.status = "live";
        session.hostSocketId = socket.id;
      }
      await session.save();

      socket.join(joinCode);
      io.to(joinCode).emit(SOCKET_EVENTS.SESSION_STARTED, { session });

      // Start reaction flush for this session
      reactionService.startPeriodicFlush(session._id.toString());

      // Broadcast initial challenge data
      const challenges = await Challenge.find({ experience: experienceId });
      if (challenges.length > 0) {
        // Start with the first challenge for now (the AI loop will drive this later)
        session.currentChallengeId = challenges[0]._id;
        session.currentConceptId = challenges[0].conceptId;
        await session.save();
        broadcastChallengeData(io, joinCode, challenges[0], session);
      }
    } catch (error) {
      console.error("host-start error:", error);
    }
  });

  socket.on(
    SOCKET_EVENTS.HOST_STATE_TRANSITION,
    async ({ joinCode, conceptId, challengeId }) => {
      try {
        const session = await Session.findOneAndUpdate(
          { joinCode },
          { currentConceptId: conceptId, currentChallengeId: challengeId },
          { new: true },
        );
        if (session) {
          io.to(joinCode).emit(SOCKET_EVENTS.STATE_TRANSITION, {
            conceptId,
            challengeId,
          });

          // Broadcast the new challenge data to participants
          if (challengeId) {
            const challenge = await Challenge.findById(challengeId);
            if (challenge) {
              broadcastChallengeData(io, joinCode, challenge, session);
            }
          }
        }
      } catch (error) {
        console.error("host-state-transition error:", error);
      }
    },
  );

  socket.on(SOCKET_EVENTS.HOST_PAUSE, async ({ joinCode }) => {
    await Session.updateOne({ joinCode }, { status: "paused" });
    io.to(joinCode).emit(SOCKET_EVENTS.SESSION_PAUSED);
  });

  socket.on(SOCKET_EVENTS.HOST_RESUME, async ({ joinCode }) => {
    await Session.updateOne({ joinCode }, { status: "live" });
    io.to(joinCode).emit(SOCKET_EVENTS.SESSION_RESUMED);
  });

  socket.on(SOCKET_EVENTS.HOST_END, async ({ joinCode }) => {
    const session = await Session.findOneAndUpdate(
      { joinCode },
      { status: "ended", endedAt: new Date() },
      { new: true },
    );
    io.to(joinCode).emit(SOCKET_EVENTS.SESSION_ENDED);

    // Stop reaction flush and do final persist
    if (session) {
      reactionService.stopPeriodicFlush(session._id.toString());
    }
  });

  // ── Response Lock/Unlock ──
  socket.on(
    SOCKET_EVENTS.HOST_LOCK_RESPONSES,
    async ({ joinCode, slideId }) => {
      try {
        if (slideId) {
          // Per-slide lock
          await Session.updateOne(
            { joinCode },
            { $set: { [`slideResponseLocks.${slideId}`]: true } },
          );
        } else {
          // Global lock
          await Session.updateOne({ joinCode }, { responseLocked: true });
        }
        io.to(joinCode).emit(SOCKET_EVENTS.RESPONSE_LOCK, { slideId });
      } catch (error) {
        console.error("lock-responses error:", error);
      }
    },
  );

  socket.on(
    SOCKET_EVENTS.HOST_UNLOCK_RESPONSES,
    async ({ joinCode, slideId }) => {
      try {
        if (slideId) {
          await Session.updateOne(
            { joinCode },
            { $set: { [`slideResponseLocks.${slideId}`]: false } },
          );
        } else {
          await Session.updateOne({ joinCode }, { responseLocked: false });
        }
        io.to(joinCode).emit(SOCKET_EVENTS.RESPONSE_UNLOCK, { slideId });
      } catch (error) {
        console.error("unlock-responses error:", error);
      }
    },
  );

  // ── Open Text Moderation ──
  socket.on(
    SOCKET_EVENTS.RESPONSE_MODERATED,
    async ({ joinCode, interactionId, action }) => {
      try {
        const result = await interactionService.moderateResponse(
          interactionId,
          action,
        );
        if (result.error) {
          socket.emit(SOCKET_EVENTS.INTERACTION_ERROR, {
            message: result.error,
          });
          return;
        }
        io.to(joinCode).emit(SOCKET_EVENTS.RESPONSE_MODERATED, {
          interaction: result.interaction,
        });
      } catch (error) {
        console.error("moderation error:", error);
      }
    },
  );
}

// ── Audience Events (Module 7 — preserved) ──

function registerAudienceEvents(socket: Socket, io: Server): void {
  socket.on(SOCKET_EVENTS.JOIN_SESSION, async ({ joinCode, displayName }) => {
    try {
      const session = await Session.findOne({
        joinCode,
        status: { $ne: "ended" },
      });
      if (!session) {
        socket.emit(
          SOCKET_EVENTS.JOIN_ERROR,
          "Session not found or has ended.",
        );
        return;
      }

      socket.join(joinCode);

      const existingParticipant = session.participants.find(
        (p) => p.displayName === displayName,
      );

      if (existingParticipant) {
        existingParticipant.socketId = socket.id;
        existingParticipant.isOnline = true;
      } else {
        session.participants.push({
          socketId: socket.id,
          displayName,
          joinedAt: new Date(),
          isOnline: true,
          score: 0,
          responses: [],
        });
      }

      await session.save();

      // Send current challenge data to participant
      socket.emit(SOCKET_EVENTS.JOIN_SUCCESS, { session });

      if (session.currentChallengeId && session.status === "live") {
        const currentChallenge = await Challenge.findById(
          session.currentChallengeId,
        );
        if (currentChallenge) {
          broadcastChallengeData(
            io,
            joinCode,
            currentChallenge,
            session,
            socket,
          );
        }
      }

      io.to(joinCode).emit(SOCKET_EVENTS.AUDIENCE_UPDATED, {
        count: session.participants.filter((p) => p.isOnline).length,
      });
    } catch (error) {
      console.error("join-session error:", error);
      socket.emit(SOCKET_EVENTS.JOIN_ERROR, "An error occurred while joining.");
    }
  });
}

// ── Interaction Events (Module 8) ──

function registerInteractionEvents(socket: Socket, io: Server): void {
  socket.on(
    SOCKET_EVENTS.INTERACTION_SUBMIT,
    async ({ joinCode, slideId, type, payload }) => {
      try {
        let result;

        switch (type) {
          case "poll": {
            result = await interactionService.submitPollResponse(
              joinCode,
              slideId,
              socket.id,
              payload.selectedOptions,
            );
            if (!result.error) {
              io.to(joinCode).emit(SOCKET_EVENTS.POLL_UPDATE, result.result);
            }
            break;
          }

          case "quiz": {
            result = await interactionService.submitQuizResponse(
              joinCode,
              slideId,
              socket.id,
              payload.selectedOptions,
              payload.responseTimeMs,
            );
            if (!result.error) {
              // Send quiz result to room
              io.to(joinCode).emit(SOCKET_EVENTS.QUIZ_UPDATE, result.result);

              // Send individual feedback to participant
              socket.emit(SOCKET_EVENTS.INTERACTION_RESULT, {
                type: "quiz",
                isCorrect: result.isCorrect,
                scoreAwarded: result.scoreAwarded,
              });

              // Update leaderboard
              const session = await Session.findOne({ joinCode });
              if (session) {
                const leaderboard = await interactionService.getLeaderboard(
                  session._id.toString(),
                );
                io.to(joinCode).emit(
                  SOCKET_EVENTS.LEADERBOARD_UPDATE,
                  leaderboard,
                );
              }
            }
            break;
          }

          case "wordcloud": {
            result = await interactionService.submitWordCloudWord(
              joinCode,
              slideId,
              socket.id,
              payload.word,
            );
            if (!result.error) {
              io.to(joinCode).emit(
                SOCKET_EVENTS.WORDCLOUD_UPDATE,
                result.result,
              );
            }
            break;
          }

          case "opentext": {
            result = await interactionService.submitOpenTextResponse(
              joinCode,
              slideId,
              socket.id,
              payload.text,
            );
            if (!result.error) {
              io.to(joinCode).emit(SOCKET_EVENTS.OPENTEXT_UPDATE, {
                slideId,
                response: result.result,
              });
            }
            break;
          }

          case "rating": {
            result = await interactionService.submitRating(
              joinCode,
              slideId,
              socket.id,
              payload.rating,
            );
            if (!result.error) {
              io.to(joinCode).emit(SOCKET_EVENTS.RATING_UPDATE, result.result);
            }
            break;
          }

          default:
            result = { error: `Unknown interaction type: ${type}` };
        }

        if (result?.error) {
          socket.emit(SOCKET_EVENTS.INTERACTION_ERROR, {
            message: result.error,
          });
        } else {
          // Confirm successful submission to the participant
          socket.emit(SOCKET_EVENTS.INTERACTION_RESULT, {
            type,
            success: true,
            slideId,
          });
        }
      } catch (error) {
        console.error("interaction:submit error:", error);
        socket.emit(SOCKET_EVENTS.INTERACTION_ERROR, {
          message: "An error occurred processing your response",
        });
      }
    },
  );
}

// ── Reaction Events ──

function registerReactionEvents(socket: Socket, io: Server): void {
  socket.on(
    SOCKET_EVENTS.REACTION_SEND,
    async ({ joinCode, slideId, emoji }) => {
      try {
        const session = await Session.findOne({
          joinCode,
          status: { $in: ["live"] },
        });
        if (!session) return;

        const participant = session.participants.find(
          (p) => p.socketId === socket.id,
        );
        if (!participant) return;

        const participantId = `${session._id}-${participant.displayName}`;
        const result = reactionService.addReaction(
          session._id.toString(),
          slideId,
          emoji,
          participantId,
        );

        if (result.error) {
          socket.emit(SOCKET_EVENTS.INTERACTION_ERROR, {
            message: result.error,
          });
          return;
        }

        io.to(joinCode).emit(SOCKET_EVENTS.REACTION_UPDATE, {
          slideId,
          counts: result.counts,
          emoji, // which emoji was just sent (for animation)
        });
      } catch (error) {
        console.error("reaction error:", error);
      }
    },
  );
}

// ── Q&A Events ──

function registerQnAEvents(socket: Socket, io: Server): void {
  socket.on(SOCKET_EVENTS.QNA_SUBMIT, async ({ joinCode, questionText }) => {
    try {
      const session = await Session.findOne({
        joinCode,
        status: { $ne: "ended" },
      });
      if (!session) {
        socket.emit(SOCKET_EVENTS.INTERACTION_ERROR, {
          message: "Session not found",
        });
        return;
      }

      const participant = session.participants.find(
        (p) => p.socketId === socket.id,
      );
      if (!participant) {
        socket.emit(SOCKET_EVENTS.INTERACTION_ERROR, {
          message: "Not a participant",
        });
        return;
      }

      const trimmed = questionText?.trim();
      if (!trimmed || trimmed.length > 500) {
        socket.emit(SOCKET_EVENTS.INTERACTION_ERROR, {
          message: "Question must be between 1 and 500 characters",
        });
        return;
      }

      // Sanitize
      const sanitized = trimmed.replace(/</g, "&lt;").replace(/>/g, "&gt;");

      const question = await QnAQuestion.create({
        sessionId: session._id,
        participantId: `${session._id}-${participant.displayName}`,
        displayName: participant.displayName,
        questionText: sanitized,
      });

      io.to(joinCode).emit(SOCKET_EVENTS.QNA_UPDATE, {
        action: "new",
        question: {
          id: question._id.toString(),
          displayName: question.displayName,
          questionText: question.questionText,
          status: question.status,
          upvotes: question.upvotes,
          createdAt: question.createdAt.toISOString(),
        },
      });
    } catch (error) {
      console.error("qna:submit error:", error);
    }
  });

  socket.on(
    SOCKET_EVENTS.QNA_MODERATE,
    async ({ joinCode, questionId, action }) => {
      try {
        // Verify this socket is the host
        const session = await Session.findOne({ joinCode });
        if (!session || session.hostSocketId !== socket.id) {
          socket.emit(SOCKET_EVENTS.INTERACTION_ERROR, {
            message: "Only the presenter can moderate questions",
          });
          return;
        }

        const statusMap: Record<string, string> = {
          pin: "pinned",
          resolve: "resolved",
          hide: "hidden",
        };

        const newStatus = statusMap[action];
        if (!newStatus) {
          socket.emit(SOCKET_EVENTS.INTERACTION_ERROR, {
            message: "Invalid action",
          });
          return;
        }

        const question = await QnAQuestion.findByIdAndUpdate(
          questionId,
          { status: newStatus },
          { new: true },
        );

        if (question) {
          io.to(joinCode).emit(SOCKET_EVENTS.QNA_UPDATE, {
            action: "moderated",
            question: {
              id: question._id.toString(),
              displayName: question.displayName,
              questionText: question.questionText,
              status: question.status,
              upvotes: question.upvotes,
              createdAt: question.createdAt.toISOString(),
            },
          });
        }
      } catch (error) {
        console.error("qna:moderate error:", error);
      }
    },
  );
}

// ── Disconnect Handler ──

function registerDisconnectHandler(socket: Socket, io: Server): void {
  socket.on("disconnect", async () => {
    console.log("User disconnected:", socket.id);

    try {
      // Find session where this socket was a participant
      const session = await Session.findOne({
        "participants.socketId": socket.id,
      });
      if (session) {
        const participant = session.participants.find(
          (p) => p.socketId === socket.id,
        );
        if (participant) {
          participant.isOnline = false;
          await session.save();

          io.to(session.joinCode).emit(SOCKET_EVENTS.AUDIENCE_UPDATED, {
            count: session.participants.filter((p) => p.isOnline).length,
          });
        }
      }

      // Also check if this socket was a host
      const hostSession = await Session.findOne({
        hostSocketId: socket.id,
        status: { $ne: "ended" },
      });
      if (hostSession) {
        // Optionally emit something if the host drops
        // io.to(hostSession.joinCode).emit("host-disconnected");
      }
    } catch (error) {
      console.error("disconnect error:", error);
    }
  });
}

// ── Helper: Broadcast challenge data to participants ──

async function broadcastChallengeData(
  io: Server,
  joinCode: string,
  challenge: any,
  session: any,
  targetSocket?: Socket,
): Promise<void> {
  // Don't expose correct answers to participants
  const safeConfig = { ...challenge.content };
  delete safeConfig.correctAnswers;

  const challengeData = {
    challengeId: challenge._id.toString(),
    conceptId: challenge.conceptId,
    type: challenge.type,
    prompt: challenge.prompt,
    content: safeConfig,
    responseLocked:
      session.responseLocked ||
      session.slideResponseLocks?.get(challenge._id.toString()) ||
      false,
  };

  if (targetSocket) {
    targetSocket.emit(SOCKET_EVENTS.SLIDE_DATA, challengeData); // Still using SLIDE_DATA client-side for now to avoid breaking UI entirely immediately
  } else {
    io.to(joinCode).emit(SOCKET_EVENTS.SLIDE_DATA, challengeData);
  }
}
