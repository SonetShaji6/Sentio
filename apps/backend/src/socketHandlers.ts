import { Server, Socket } from "socket.io";
import { SOCKET_EVENTS } from "@sentio/shared";
import Session from "./models/Session";
import Challenge from "./models/Challenge";
import Experience from "./models/Experience";
import Slide from "./models/Slide";
import Presentation from "./models/Presentation";
import QnAQuestion from "./models/QnAQuestion";
import * as interactionService from "./services/interactionService";
import * as reactionService from "./services/reactionService";
import * as reportService from "./services/reportService";

type UserRoomJoinPayload = { userId?: string };
type HostJoinPayload = { joinCode?: string; presentationId?: string };
type HostStartPayload = {
  experienceId?: any;
  presentationId?: any;
  joinCode?: string;
};
type HostSlideChangePayload = { joinCode: string; slideIndex: number };
type HostStateTransitionPayload = {
  joinCode: string;
  conceptId?: string;
  challengeId?: string;
};
type JoinCodePayload = { joinCode: string };
type HostLockPayload = { joinCode: string; slideId?: string };
type ResponseModeratedPayload = {
  joinCode: string;
  interactionId: string;
  action: "hide" | "approve" | "highlight";
};
type JoinSessionPayload = { joinCode: string; displayName: string };
type InteractionSubmitPayload = {
  joinCode: string;
  slideId: string;
  type: string;
  payload: any;
};
type ReactionSendPayload = {
  joinCode: string;
  slideId: string;
  emoji: string;
};
type QnaSubmitPayload = { joinCode: string; questionText: string };
type QnaModeratePayload = {
  joinCode: string;
  questionId: string;
  action: string;
  answerText?: string;
};

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
  socket.on("user-room:join", ({ userId }: UserRoomJoinPayload) => {
    if (userId) {
      socket.join(`user:${userId}`);
    }
  });
}

// ── Host Events ──

function registerHostEvents(socket: Socket, io: Server): void {
  socket.on(
    "host-join",
    async ({ joinCode, presentationId }: HostJoinPayload) => {
      try {
        const cleanCode = (joinCode || "").trim().toUpperCase();
        if (cleanCode) {
          socket.join(cleanCode);

          // Find or create session in waiting status
          let session = await Session.findOne({
            $or: [
              { joinCode: cleanCode, status: { $ne: "ended" } },
              ...(presentationId
                ? [
                    {
                      presentationId: presentationId as any,
                      status: { $ne: "ended" },
                    },
                  ]
                : []),
            ],
          } as any);

          if (!session) {
            session = new Session({
              presentationId: presentationId || undefined,
              joinCode: cleanCode,
              status: "waiting",
              startedAt: new Date(),
              hostSocketId: socket.id,
              currentSlideIndex: 0,
            });
            await session.save();

            if (presentationId) {
              await Presentation.findByIdAndUpdate(presentationId, {
                sessionCode: cleanCode,
              });
            }
          } else {
            session.hostSocketId = socket.id;
            if (presentationId && !session.presentationId) {
              session.presentationId = presentationId as any;
            }
            if (cleanCode) session.joinCode = cleanCode;
            await session.save();
          }
        }
      } catch (error) {
        console.error("host-join error:", error);
      }
    },
  );

  socket.on(
    SOCKET_EVENTS.HOST_START,
    async ({ experienceId, presentationId, joinCode }: HostStartPayload) => {
      try {
        const cleanCode = (joinCode || "").trim().toUpperCase();
        const orConditions: any[] = [];
        if (cleanCode) orConditions.push({ joinCode: cleanCode });
        if (presentationId) {
          orConditions.push({ presentationId, status: { $ne: "ended" } });
        }
        if (experienceId) {
          orConditions.push({ experienceId, status: { $ne: "ended" } });
        }

        let session =
          orConditions.length > 0
            ? await Session.findOne({ $or: orConditions } as any)
            : null;

        if (!session) {
          session = new Session({
            presentationId: presentationId || undefined,
            experienceId: experienceId || undefined,
            joinCode:
              cleanCode ||
              Math.random().toString(36).substring(2, 8).toUpperCase(),
            status: "live",
            startedAt: new Date(),
            hostSocketId: socket.id,
            currentSlideIndex: 0,
          });
        } else {
          session.status = "live";
          session.hostSocketId = socket.id;
          if (presentationId) session.presentationId = presentationId;
          if (cleanCode) session.joinCode = cleanCode;
          if (session.currentSlideIndex === undefined) {
            session.currentSlideIndex = 0;
          }
        }
        await session.save();

        if (presentationId) {
          await Presentation.findByIdAndUpdate(presentationId, {
            status: "live",
            sessionCode: session.joinCode,
          });
        }

        socket.join(session.joinCode);
        io.to(session.joinCode).emit(SOCKET_EVENTS.SESSION_STARTED, {
          session,
        });

        // Start reaction flush for this session
        reactionService.startPeriodicFlush(session._id.toString());

        // Broadcast initial slide if presentation
        if (presentationId || session.presentationId) {
          const pId = presentationId || session.presentationId;
          const slides = await Slide.find({ presentationId: pId }).sort({
            order: 1,
          });
          if (slides.length > 0) {
            const currentIdx = session.currentSlideIndex || 0;
            const slide = slides[currentIdx] || slides[0];
            await broadcastSlideData(io, session.joinCode, slide, session);
          }
        } else if (experienceId || session.experienceId) {
          const expId = experienceId || session.experienceId;
          const challenges = await Challenge.find({ experience: expId });
          if (challenges.length > 0) {
            session.currentChallengeId = challenges[0]._id;
            session.currentConceptId = challenges[0].conceptId;
            await session.save();
            broadcastChallengeData(
              io,
              session.joinCode,
              challenges[0],
              session,
            );
          }
        }
      } catch (error) {
        console.error("host-start error:", error);
      }
    },
  );

  socket.on(
    SOCKET_EVENTS.HOST_SLIDE_CHANGE,
    async ({ joinCode, slideIndex }: HostSlideChangePayload) => {
      try {
        const cleanCode = (joinCode || "").toUpperCase();
        const session = await Session.findOne({
          joinCode: cleanCode,
          status: { $ne: "ended" },
        });
        if (!session) return;

        session.currentSlideIndex = slideIndex;
        await session.save();

        io.to(session.joinCode).emit(SOCKET_EVENTS.SLIDE_CHANGED, {
          slideIndex,
        });

        if (session.presentationId) {
          const slides = await Slide.find({
            presentationId: session.presentationId,
          }).sort({ order: 1 });
          if (slides[slideIndex]) {
            await broadcastSlideData(
              io,
              session.joinCode,
              slides[slideIndex],
              session,
            );
          }
        }
      } catch (error) {
        console.error("host-slide-change error:", error);
      }
    },
  );

  socket.on(
    SOCKET_EVENTS.HOST_STATE_TRANSITION,
    async ({
      joinCode,
      conceptId,
      challengeId,
    }: HostStateTransitionPayload) => {
      try {
        const session = await Session.findOneAndUpdate(
          { joinCode },
          { currentConceptId: conceptId, currentChallengeId: challengeId },
          { returnDocument: "after" },
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

  socket.on(SOCKET_EVENTS.HOST_PAUSE, async ({ joinCode }: JoinCodePayload) => {
    await Session.updateOne({ joinCode }, { status: "paused" });
    io.to(joinCode).emit(SOCKET_EVENTS.SESSION_PAUSED);
  });

  socket.on(
    SOCKET_EVENTS.HOST_RESUME,
    async ({ joinCode }: JoinCodePayload) => {
      await Session.updateOne({ joinCode }, { status: "live" });
      io.to(joinCode).emit(SOCKET_EVENTS.SESSION_RESUMED);
    },
  );

  socket.on(SOCKET_EVENTS.HOST_END, async ({ joinCode }: JoinCodePayload) => {
    const session = await Session.findOneAndUpdate(
      { joinCode },
      { status: "ended", endedAt: new Date() },
      { returnDocument: "after" },
    );
    io.to(joinCode).emit(SOCKET_EVENTS.SESSION_ENDED);

    // Stop reaction flush and do final persist
    if (session) {
      reactionService.stopPeriodicFlush(session._id.toString());

      // Auto-generate session intelligence report and save to Knowledge Base
      reportService
        .generateAndSaveSessionReport(session._id.toString())
        .catch((err) => {
          console.error("Auto session report generation error:", err);
        });
    }
  });

  // ── Response Lock/Unlock ──
  socket.on(
    SOCKET_EVENTS.HOST_LOCK_RESPONSES,
    async ({ joinCode, slideId }: HostLockPayload) => {
      try {
        let correctAnswers: number[] = [];
        if (slideId) {
          await Session.updateOne(
            { joinCode },
            { $set: { [`slideResponseLocks.${slideId}`]: true } },
          );
          const slide = await Slide.findById(slideId);
          if (slide && slide.type === "quiz") {
            correctAnswers = slide.config?.correctAnswers || [];
          }
        } else {
          await Session.updateOne({ joinCode }, { responseLocked: true });
        }
        io.to(joinCode).emit(SOCKET_EVENTS.RESPONSE_LOCK, {
          slideId,
          correctAnswers,
        });
      } catch (error) {
        console.error("lock-responses error:", error);
      }
    },
  );

  socket.on(
    SOCKET_EVENTS.HOST_UNLOCK_RESPONSES,
    async ({ joinCode, slideId }: HostLockPayload) => {
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
    async ({ joinCode, interactionId, action }: ResponseModeratedPayload) => {
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
  socket.on(
    SOCKET_EVENTS.HOST_KICK_PARTICIPANT,
    async ({ joinCode, socketId, displayName }: any) => {
      try {
        const cleanCode = (joinCode || "").trim().toUpperCase();
        const session = await Session.findOne({ joinCode: cleanCode });
        if (!session || session.hostSocketId !== socket.id) {
          socket.emit(SOCKET_EVENTS.INTERACTION_ERROR, {
            message: "Only the presenter can kick participants",
          });
          return;
        }

        const cleanName = (displayName || "").toLowerCase().trim();
        if (!session.bannedParticipants) session.bannedParticipants = [];
        if (cleanName && !session.bannedParticipants.includes(cleanName)) {
          session.bannedParticipants.push(cleanName);
        }

        const participantIndex = session.participants.findIndex(
          (p) => p.socketId === socketId || p.displayName === displayName,
        );

        let targetSocketId = socketId;
        if (participantIndex !== -1) {
          targetSocketId =
            session.participants[participantIndex].socketId || socketId;
          session.participants.splice(participantIndex, 1);
        }

        await session.save();

        if (targetSocketId) {
          io.to(targetSocketId).emit(SOCKET_EVENTS.PARTICIPANT_KICKED, {
            message:
              "You have been removed from this session by the presenter and cannot rejoin.",
          });
          const targetSocket = io.sockets.sockets.get(targetSocketId);
          if (targetSocket) {
            targetSocket.leave(cleanCode);
          }
        }

        const onlineParticipants = session.participants.filter(
          (p) => p.isOnline && p.isApproved !== false,
        );
        io.to(cleanCode).emit(SOCKET_EVENTS.AUDIENCE_UPDATED, {
          count: onlineParticipants.length,
        });
        io.to(cleanCode).emit(SOCKET_EVENTS.PARTICIPANTS_UPDATE, {
          requireApproval: session.requireApproval !== false,
          participants: session.participants.map((p) => ({
            socketId: p.socketId,
            displayName: p.displayName,
            isOnline: p.isOnline,
            isApproved: p.isApproved !== false,
            joinedAt: p.joinedAt,
            score: p.score,
          })),
        });
      } catch (error) {
        console.error("host:kick-participant error:", error);
      }
    },
  );

  // Presenter admits a single pending participant
  socket.on(
    SOCKET_EVENTS.HOST_ADMIT_PARTICIPANT,
    async ({ joinCode, socketId, displayName }: any) => {
      try {
        const cleanCode = (joinCode || "").trim().toUpperCase();
        const session = await Session.findOne({ joinCode: cleanCode });
        if (!session || session.hostSocketId !== socket.id) return;

        const participant = session.participants.find(
          (p) => p.socketId === socketId || p.displayName === displayName,
        );

        if (participant) {
          participant.isApproved = true;
          await session.save();

          let presTheme = null;
          if (session.presentationId) {
            const pres = await Presentation.findById(
              session.presentationId,
            ).select("theme");
            if (pres && pres.theme) presTheme = pres.theme;
          }

          if (participant.socketId) {
            io.to(participant.socketId).emit(SOCKET_EVENTS.ADMISSION_APPROVED, {
              session: {
                ...session.toObject(),
                theme: presTheme,
              },
            });
            io.to(participant.socketId).emit(SOCKET_EVENTS.JOIN_SUCCESS, {
              session: {
                ...session.toObject(),
                theme: presTheme,
              },
            });

            // If presentation is live, send current slide data
            if (session.presentationId && session.status === "live") {
              const slides = await Slide.find({
                presentationId: session.presentationId,
              }).sort({ order: 1 });
              const slideIndex = session.currentSlideIndex || 0;
              if (slides[slideIndex]) {
                const targetSock = io.sockets.sockets.get(participant.socketId);
                if (targetSock) {
                  await broadcastSlideData(
                    io,
                    cleanCode,
                    slides[slideIndex],
                    session,
                    targetSock,
                  );
                }
              }
            }
          }

          const approvedOnline = session.participants.filter(
            (p) => p.isOnline && p.isApproved !== false,
          );
          io.to(cleanCode).emit(SOCKET_EVENTS.AUDIENCE_UPDATED, {
            count: approvedOnline.length,
          });
          io.to(cleanCode).emit(SOCKET_EVENTS.PARTICIPANTS_UPDATE, {
            requireApproval: session.requireApproval !== false,
            participants: session.participants.map((p) => ({
              socketId: p.socketId,
              displayName: p.displayName,
              isOnline: p.isOnline,
              isApproved: p.isApproved !== false,
              joinedAt: p.joinedAt,
              score: p.score,
            })),
          });
        }
      } catch (err) {
        console.error("host:admit-participant error:", err);
      }
    },
  );

  // Presenter rejects a pending participant
  socket.on(
    SOCKET_EVENTS.HOST_REJECT_PARTICIPANT,
    async ({ joinCode, socketId, displayName }: any) => {
      try {
        const cleanCode = (joinCode || "").trim().toUpperCase();
        const session = await Session.findOne({ joinCode: cleanCode });
        if (!session || session.hostSocketId !== socket.id) return;

        const cleanName = (displayName || "").toLowerCase().trim();
        if (!session.bannedParticipants) session.bannedParticipants = [];
        if (cleanName && !session.bannedParticipants.includes(cleanName)) {
          session.bannedParticipants.push(cleanName);
        }

        const idx = session.participants.findIndex(
          (p) => p.socketId === socketId || p.displayName === displayName,
        );
        let targetSocketId = socketId;
        if (idx !== -1) {
          targetSocketId = session.participants[idx].socketId || socketId;
          session.participants.splice(idx, 1);
          await session.save();
        }

        if (targetSocketId) {
          io.to(targetSocketId).emit(SOCKET_EVENTS.ADMISSION_REJECTED, {
            message:
              "Your request to join this session was declined by the presenter.",
          });
          const targetSocket = io.sockets.sockets.get(targetSocketId);
          if (targetSocket) {
            targetSocket.leave(cleanCode);
          }
        }

        io.to(cleanCode).emit(SOCKET_EVENTS.PARTICIPANTS_UPDATE, {
          requireApproval: session.requireApproval !== false,
          participants: session.participants.map((p) => ({
            socketId: p.socketId,
            displayName: p.displayName,
            isOnline: p.isOnline,
            isApproved: p.isApproved !== false,
            joinedAt: p.joinedAt,
            score: p.score,
          })),
        });
      } catch (err) {
        console.error("host:reject-participant error:", err);
      }
    },
  );

  // Presenter admits all pending participants
  socket.on(SOCKET_EVENTS.HOST_ADMIT_ALL, async ({ joinCode }: any) => {
    try {
      const cleanCode = (joinCode || "").trim().toUpperCase();
      const session = await Session.findOne({ joinCode: cleanCode });
      if (!session || session.hostSocketId !== socket.id) return;

      let presTheme = null;
      if (session.presentationId) {
        const pres = await Presentation.findById(session.presentationId).select(
          "theme",
        );
        if (pres && pres.theme) presTheme = pres.theme;
      }

      for (const p of session.participants) {
        if (p.isApproved === false) {
          p.isApproved = true;
          if (p.socketId) {
            io.to(p.socketId).emit(SOCKET_EVENTS.ADMISSION_APPROVED, {
              session: { ...session.toObject(), theme: presTheme },
            });
            io.to(p.socketId).emit(SOCKET_EVENTS.JOIN_SUCCESS, {
              session: { ...session.toObject(), theme: presTheme },
            });
          }
        }
      }
      await session.save();

      if (session.presentationId && session.status === "live") {
        const slides = await Slide.find({
          presentationId: session.presentationId,
        }).sort({ order: 1 });
        const slideIndex = session.currentSlideIndex || 0;
        if (slides[slideIndex]) {
          await broadcastSlideData(io, cleanCode, slides[slideIndex], session);
        }
      }

      const approvedOnline = session.participants.filter(
        (p) => p.isOnline && p.isApproved !== false,
      );
      io.to(cleanCode).emit(SOCKET_EVENTS.AUDIENCE_UPDATED, {
        count: approvedOnline.length,
      });
      io.to(cleanCode).emit(SOCKET_EVENTS.PARTICIPANTS_UPDATE, {
        requireApproval: session.requireApproval !== false,
        participants: session.participants.map((p) => ({
          socketId: p.socketId,
          displayName: p.displayName,
          isOnline: p.isOnline,
          isApproved: p.isApproved !== false,
          joinedAt: p.joinedAt,
          score: p.score,
        })),
      });
    } catch (err) {
      console.error("host:admit-all error:", err);
    }
  });

  // Toggle requireApproval setting
  socket.on(
    SOCKET_EVENTS.HOST_TOGGLE_APPROVAL,
    async ({ joinCode, requireApproval }: any) => {
      try {
        const cleanCode = (joinCode || "").trim().toUpperCase();
        const session = await Session.findOne({ joinCode: cleanCode });
        if (!session || session.hostSocketId !== socket.id) return;

        session.requireApproval = Boolean(requireApproval);
        await session.save();

        io.to(cleanCode).emit(SOCKET_EVENTS.PARTICIPANTS_UPDATE, {
          requireApproval: session.requireApproval,
          participants: session.participants.map((p) => ({
            socketId: p.socketId,
            displayName: p.displayName,
            isOnline: p.isOnline,
            isApproved: p.isApproved !== false,
            joinedAt: p.joinedAt,
            score: p.score,
          })),
        });
      } catch (err) {
        console.error("host:toggle-approval error:", err);
      }
    },
  );
}

// ── Audience Events ──

function registerAudienceEvents(socket: Socket, io: Server): void {
  socket.on(
    SOCKET_EVENTS.JOIN_SESSION,
    async ({ joinCode, displayName }: JoinSessionPayload) => {
      try {
        const cleanCode = (joinCode || "").trim().toUpperCase();
        const cleanName = (displayName || "").trim();
        const cleanNameLower = cleanName.toLowerCase();

        let session = await Session.findOne({
          joinCode: cleanCode,
          status: { $ne: "ended" },
        });

        if (!session) {
          // Check if there is an active presentation with this code
          const presentation = await Presentation.findOne({
            $or: [
              { sessionCode: cleanCode, isDeleted: false },
              {
                shareId: { $regex: new RegExp(`^${cleanCode}`, "i") },
                isDeleted: false,
              },
            ],
          });

          if (presentation) {
            session = new Session({
              presentationId: presentation._id,
              joinCode: cleanCode,
              status: presentation.status === "live" ? "live" : "waiting",
              startedAt: new Date(),
              currentSlideIndex: 0,
              requireApproval: true,
              bannedParticipants: [],
            });
            await session.save();
          } else {
            socket.emit(
              SOCKET_EVENTS.JOIN_ERROR,
              "Session not found or has ended.",
            );
            return;
          }
        }

        // Check if participant is banned / kicked
        if (
          session.bannedParticipants &&
          session.bannedParticipants.includes(cleanNameLower)
        ) {
          socket.emit(
            SOCKET_EVENTS.JOIN_ERROR,
            "You have been removed from this session by the presenter and cannot rejoin.",
          );
          return;
        }

        socket.join(cleanCode);

        // Resolve presentation theme
        let presTheme = null;
        if (session.presentationId) {
          const pres = await Presentation.findById(
            session.presentationId,
          ).select("theme");
          if (pres && pres.theme) {
            presTheme = pres.theme;
          }
        }

        const requiresApproval = session.requireApproval !== false;
        const existingParticipant = session.participants.find(
          (p) => p.displayName === cleanName,
        );

        // If approval is required, check if user was already approved previously
        const isApproved = requiresApproval
          ? Boolean(existingParticipant?.isApproved)
          : true;

        if (existingParticipant) {
          existingParticipant.socketId = socket.id;
          existingParticipant.isOnline = true;
          existingParticipant.isApproved = isApproved;
        } else {
          session.participants.push({
            socketId: socket.id,
            displayName: cleanName,
            joinedAt: new Date(),
            isOnline: true,
            isApproved,
            score: 0,
            responses: [],
          });
        }

        await session.save();

        if (!isApproved) {
          // Put user into pending approval state
          socket.emit(SOCKET_EVENTS.ADMISSION_PENDING, {
            joinCode: cleanCode,
            displayName: cleanName,
            session: {
              ...session.toObject(),
              theme: presTheme,
            },
          });

          // Notify presenter of the join request
          io.to(cleanCode).emit(SOCKET_EVENTS.PARTICIPANTS_UPDATE, {
            requireApproval: session.requireApproval !== false,
            participants: session.participants.map((p) => ({
              socketId: p.socketId,
              displayName: p.displayName,
              isOnline: p.isOnline,
              isApproved: p.isApproved !== false,
              joinedAt: p.joinedAt,
              score: p.score,
            })),
          });
          return;
        }

        // Participant is approved — emit success & send slide data
        socket.emit(SOCKET_EVENTS.JOIN_SUCCESS, {
          session: {
            ...session.toObject(),
            theme: presTheme,
          },
        });

        // If presentation is live, immediately send current slide data to participant
        if (session.presentationId && session.status === "live") {
          const slides = await Slide.find({
            presentationId: session.presentationId,
          }).sort({ order: 1 });
          const slideIndex = session.currentSlideIndex || 0;
          if (slides[slideIndex]) {
            await broadcastSlideData(
              io,
              cleanCode,
              slides[slideIndex],
              session,
              socket,
            );
          }
        } else if (session.currentChallengeId && session.status === "live") {
          const currentChallenge = await Challenge.findById(
            session.currentChallengeId,
          );
          if (currentChallenge) {
            broadcastChallengeData(
              io,
              cleanCode,
              currentChallenge,
              session,
              socket,
            );
          }
        }

        const approvedOnline = session.participants.filter(
          (p) => p.isOnline && p.isApproved !== false,
        );
        io.to(cleanCode).emit(SOCKET_EVENTS.AUDIENCE_UPDATED, {
          count: approvedOnline.length,
        });
        io.to(cleanCode).emit(SOCKET_EVENTS.PARTICIPANTS_UPDATE, {
          requireApproval: session.requireApproval !== false,
          participants: session.participants.map((p) => ({
            socketId: p.socketId,
            displayName: p.displayName,
            isOnline: p.isOnline,
            isApproved: p.isApproved !== false,
            joinedAt: p.joinedAt,
            score: p.score,
          })),
        });

        // Broadcast updated live leaderboard with all joined users
        const leaderboard = await interactionService.getLeaderboard(
          session._id.toString(),
        );
        io.to(cleanCode).emit(SOCKET_EVENTS.LEADERBOARD_UPDATE, leaderboard);
      } catch (error) {
        console.error("join-session error:", error);
        socket.emit(
          SOCKET_EVENTS.JOIN_ERROR,
          "An error occurred while joining.",
        );
      }
    },
  );
}

// ── Interaction Events (Module 8) ──

function registerInteractionEvents(socket: Socket, io: Server): void {
  socket.on(
    SOCKET_EVENTS.INTERACTION_SUBMIT,
    async ({ joinCode, slideId, type, payload }: InteractionSubmitPayload) => {
      try {
        let result;
        const cleanCode = (joinCode || "").trim().toUpperCase();

        switch (type) {
          case "poll": {
            result = await interactionService.submitPollResponse(
              cleanCode,
              slideId,
              socket.id,
              payload.selectedOptions,
            );
            if (!result.error) {
              const session = await Session.findOne({ joinCode: cleanCode });
              const onlineCount =
                session?.participants.filter(
                  (p) => p.isOnline && p.isApproved !== false,
                ).length || 0;
              const totalResponses =
                result.result?.totalResponses ??
                result.result?.totalSubmissions ??
                0;
              const allAnswered =
                onlineCount > 0 && totalResponses >= onlineCount;

              io.to(cleanCode).emit(SOCKET_EVENTS.POLL_UPDATE, {
                ...result.result,
                allAnswered,
                audienceCount: onlineCount,
              });
            }
            break;
          }

          case "quiz": {
            result = await interactionService.submitQuizResponse(
              cleanCode,
              slideId,
              socket.id,
              payload.selectedOptions,
              payload.responseTimeMs,
            );
            if (!result.error) {
              const session = await Session.findOne({ joinCode: cleanCode });
              const onlineCount =
                session?.participants.filter(
                  (p) => p.isOnline && p.isApproved !== false,
                ).length || 0;
              const totalResponses =
                result.result?.totalResponses ??
                result.result?.totalSubmissions ??
                0;
              const allAnswered =
                onlineCount > 0 && totalResponses >= onlineCount;

              const correctAnswers =
                result.result?.correctAnswers || result.correctAnswers || [];

              // Send quiz result to room with correct answers and allAnswered flag
              io.to(cleanCode).emit(SOCKET_EVENTS.QUIZ_UPDATE, {
                ...result.result,
                allAnswered,
                audienceCount: onlineCount,
                correctAnswers,
              });

              // Send individual feedback to participant
              socket.emit(SOCKET_EVENTS.INTERACTION_RESULT, {
                type: "quiz",
                isCorrect: Boolean(result.isCorrect),
                scoreAwarded: result.scoreAwarded ?? 0,
                correctAnswers,
                selectedOptions: payload.selectedOptions ?? [],
                slideId,
                success: true,
              });

              // Update leaderboard
              if (session) {
                const leaderboard = await interactionService.getLeaderboard(
                  session._id.toString(),
                );
                io.to(cleanCode).emit(
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
        } else if (type !== "quiz") {
          // Confirm successful submission to the participant for non-quiz interactions
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
    async ({ joinCode, slideId, emoji }: ReactionSendPayload) => {
      try {
        const cleanCode = (joinCode || "").trim().toUpperCase();
        const session = await Session.findOne({
          joinCode: cleanCode,
          status: { $in: ["live", "waiting", "paused"] },
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

        io.to(cleanCode).emit(SOCKET_EVENTS.REACTION_UPDATE, {
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
  socket.on(
    SOCKET_EVENTS.QNA_SUBMIT,
    async ({ joinCode, questionText }: QnaSubmitPayload) => {
      try {
        const cleanCode = (joinCode || "").trim().toUpperCase();
        const session = await Session.findOne({
          joinCode: cleanCode,
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
          answerText: "",
        });

        io.to(cleanCode).emit(SOCKET_EVENTS.QNA_UPDATE, {
          action: "new",
          question: {
            id: question._id.toString(),
            displayName: question.displayName,
            questionText: question.questionText,
            answerText: question.answerText || "",
            answeredBy: question.answeredBy || "",
            answeredAt: question.answeredAt
              ? question.answeredAt.toISOString()
              : undefined,
            status: question.status,
            upvotes: question.upvotes,
            createdAt: question.createdAt.toISOString(),
          },
        });
      } catch (error) {
        console.error("qna:submit error:", error);
      }
    },
  );

  socket.on(
    SOCKET_EVENTS.QNA_MODERATE,
    async ({
      joinCode,
      questionId,
      action,
      answerText,
    }: QnaModeratePayload) => {
      try {
        const cleanCode = (joinCode || "").trim().toUpperCase();
        // Verify this socket is the host
        const session = await Session.findOne({ joinCode: cleanCode });
        if (!session || session.hostSocketId !== socket.id) {
          socket.emit(SOCKET_EVENTS.INTERACTION_ERROR, {
            message: "Only the presenter can moderate or reply to questions",
          });
          return;
        }

        let updateData: any = {};

        if (action === "reply" || action === "answer") {
          const sanitizedAnswer = (answerText || "")
            .trim()
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
          updateData = {
            answerText: sanitizedAnswer,
            answeredBy: "Presenter",
            answeredAt: new Date(),
            status: "resolved",
          };
        } else {
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
          updateData = { status: newStatus };
        }

        const question = await QnAQuestion.findByIdAndUpdate(
          questionId,
          updateData,
          { returnDocument: "after" },
        );

        if (question) {
          io.to(cleanCode).emit(SOCKET_EVENTS.QNA_UPDATE, {
            action:
              action === "reply" || action === "answer"
                ? "replied"
                : "moderated",
            question: {
              id: question._id.toString(),
              displayName: question.displayName,
              questionText: question.questionText,
              answerText: question.answerText || "",
              answeredBy: question.answeredBy || "",
              answeredAt: question.answeredAt
                ? question.answeredAt.toISOString()
                : undefined,
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
          io.to(session.joinCode).emit(SOCKET_EVENTS.PARTICIPANTS_UPDATE, {
            participants: session.participants.map((p) => ({
              socketId: p.socketId,
              displayName: p.displayName,
              isOnline: p.isOnline,
              joinedAt: p.joinedAt,
              score: p.score,
            })),
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

// ── Helper: Broadcast slide data to presentation participants ──

async function broadcastSlideData(
  io: Server,
  joinCode: string,
  slide: any,
  session: any,
  targetSocket?: Socket,
): Promise<void> {
  const safeConfig = { ...(slide.config || {}) };

  // Ensure mediaUrl is properly resolved from slide or elements if not in config
  if (!safeConfig.mediaUrl && slide.mediaUrl) {
    safeConfig.mediaUrl = slide.mediaUrl;
  } else if (!safeConfig.mediaUrl && slide.imageUrl) {
    safeConfig.mediaUrl = slide.imageUrl;
  } else if (!safeConfig.mediaUrl && Array.isArray(slide.elements)) {
    const imgEl = slide.elements.find(
      (el: any) =>
        el.type === "image" && (el.properties?.src || el.properties?.url),
    );
    if (imgEl) {
      safeConfig.mediaUrl = imgEl.properties?.src || imgEl.properties?.url;
    }
  }

  // Ensure teaching paragraph or content is available
  if (!safeConfig.paragraph && slide.content) {
    safeConfig.paragraph = slide.content;
  }

  // If slide is quiz, do not reveal isCorrect to audience on initial broadcast
  if (slide.type === "quiz" && Array.isArray(safeConfig.options)) {
    safeConfig.options = safeConfig.options.map((opt: any) => {
      if (typeof opt === "object" && opt !== null) {
        const { isCorrect, ...rest } = opt;
        return rest;
      }
      return opt;
    });
  }

  // Resolve presentation theme
  let presentationTheme = slide.theme || slide.config?.theme;
  if (!presentationTheme && session.presentationId) {
    const pres = await Presentation.findById(session.presentationId).select(
      "theme",
    );
    if (pres && pres.theme) {
      presentationTheme = pres.theme;
    }
  }

  const slideData = {
    slideId: slide._id.toString(),
    type: slide.type,
    title: slide.title,
    description: slide.description,
    content: slide.content || safeConfig.paragraph,
    config: safeConfig,
    theme: presentationTheme,
    responseLocked:
      session.responseLocked ||
      session.slideResponseLocks?.get(slide._id.toString()) ||
      false,
  };

  if (targetSocket) {
    targetSocket.emit(SOCKET_EVENTS.SLIDE_DATA, slideData);
  } else {
    io.to(joinCode).emit(SOCKET_EVENTS.SLIDE_DATA, slideData);
  }
}
