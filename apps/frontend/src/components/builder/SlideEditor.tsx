"use client";

import React, { useState } from "react";
import { ISlide } from "@/types/slide";
import { PresentationTheme, resolveTheme } from "@/types/theme";
import {
  MonitorPlay,
  Type,
  AlignLeft,
  HelpCircle,
  BarChart2,
  List,
  Star,
  Cloud,
  MessageSquare,
  Image as ImageIcon,
  Trophy,
  CheckCircle,
  Timer,
  Award,
  Sparkles,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Users,
  Radio,
  Quote,
} from "lucide-react";
import { SlideCanvas } from "./SlideCanvas";

interface SlideEditorProps {
  slide: ISlide | null;
  theme?: PresentationTheme | any;
  joinCode?: string;
  isHost?: boolean;
  showToolbar?: boolean;
  leaderboard?: any[];
}

export function SlideEditor({
  slide,
  theme,
  joinCode = "SENTIO",
  isHost = false,
  showToolbar = true,
  leaderboard,
}: SlideEditorProps) {
  const [zoom, setZoom] = useState<"fit" | number>("fit");

  const baseTheme = resolveTheme(slide?.themeOverrides || theme);

  if (!slide) {
    return (
      <div className="flex-1 flex items-center justify-center bg-zinc-100 dark:bg-zinc-950 p-8">
        <div className="text-center text-zinc-400 dark:text-zinc-600 max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-zinc-200 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 flex items-center justify-center mx-auto mb-4">
            <MonitorPlay className="w-8 h-8 opacity-60 text-zinc-500" />
          </div>
          <h2 className="text-lg font-bold text-zinc-800 dark:text-zinc-200 mb-1">
            No Slide Selected
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Select a slide from the navigator on the left or add a new slide to
            begin crafting your presentation.
          </p>
        </div>
      </div>
    );
  }

  // Calculate resolved styles incorporating slide-level configuration overrides
  const cfg = slide.config || {};
  const textColor = cfg.textColor || baseTheme.text;
  const textMuted = cfg.textMutedColor || baseTheme.textMuted;
  const primaryColor = cfg.accentColor || baseTheme.primary;
  const accentColor = baseTheme.accent || primaryColor;
  const cardBg = cfg.cardBgColor || baseTheme.cardBg;
  const slideBg = cfg.bgColor || baseTheme.bg;
  const borderColor = baseTheme.border;
  const textAlign =
    cfg.align ||
    (slide.type === "title" ||
    slide.type === "question" ||
    slide.type === "thankyou"
      ? "center"
      : "left");
  const layoutStyle = cfg.layoutStyle || (cfg.mediaUrl ? "split" : "standard");

  const getFontSizeClass = (size?: string) => {
    switch (size) {
      case "small":
        return "text-5xl";
      case "large":
        return "text-8xl";
      case "huge":
        return "text-9xl";
      case "normal":
      default:
        return slide.type === "title" || slide.type === "thankyou"
          ? "text-8xl"
          : "text-6xl";
    }
  };

  const getFontFamilyStyle = (font?: string) => {
    switch (font) {
      case "serif":
        return "Georgia, Cambria, 'Times New Roman', Times, serif";
      case "mono":
        return "'JetBrains Mono', 'Fira Code', Menlo, Monaco, Consolas, monospace";
      case "display":
        return "'Outfit', 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif";
      case "sans":
      default:
        return "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    }
  };

  const getRadiusStyle = (radius?: string) => {
    switch (radius) {
      case "none":
        return "0px";
      case "md":
        return "12px";
      case "xl":
        return "20px";
      case "3xl":
        return "36px";
      case "full":
        return "9999px";
      case "2xl":
      default:
        return "28px";
    }
  };

  const getShadowStyle = (shadow?: string) => {
    switch (shadow) {
      case "none":
        return "none";
      case "sm":
        return "0 4px 12px rgba(0,0,0,0.08)";
      case "lg":
        return "0 12px 28px rgba(0,0,0,0.18)";
      case "glow":
        return `0 0 40px ${primaryColor}40`;
      case "2xl":
      default:
        return "0 25px 50px -12px rgba(0,0,0,0.35)";
    }
  };

  const activeFontFamily = cfg.fontFamily || baseTheme.fontFamily || "sans";
  const fontFamilyStyle = getFontFamilyStyle(activeFontFamily);
  const titleFontSizeClass = getFontSizeClass(cfg.fontSize);

  const hasMedia = Boolean(cfg.mediaUrl);
  const mediaPosition =
    cfg.mediaPosition || (layoutStyle === "split" ? "right" : "card");
  const mediaWidthPercent =
    cfg.mediaWidth || (mediaPosition === "top" ? 100 : 45);
  const mediaRadiusStyle = getRadiusStyle(cfg.mediaRadius);
  const mediaShadowStyle = getShadowStyle(cfg.mediaShadow);
  const mediaFit = cfg.mediaFit || "cover";

  // Reusable Media Component with custom sizing, radius and shadows
  const renderMedia = (extraClass = "w-full h-full") => {
    if (!hasMedia) return null;
    return (
      <div
        className={`relative overflow-hidden border transition-all ${extraClass}`}
        style={{
          borderRadius: mediaRadiusStyle,
          boxShadow: mediaShadowStyle,
          borderColor,
          backgroundColor: cardBg,
        }}
      >
        <img
          src={cfg.mediaUrl}
          alt={cfg.mediaAlt || "Slide Visual"}
          className="w-full h-full"
          style={{ objectFit: mediaFit }}
        />
      </div>
    );
  };

  // Render element-based slide
  const renderElements = () => {
    return slide.elements?.map((el) => {
      return (
        <div
          key={el.id}
          className="absolute border border-dashed rounded-xl flex items-center justify-center transition-all"
          style={{
            left: el.x,
            top: el.y,
            width: el.width,
            height: el.height,
            transform: `rotate(${el.rotation}deg)`,
            zIndex: el.zIndex,
            display: el.visible === false ? "none" : "flex",
            borderColor: primaryColor,
            backgroundColor: `${cardBg}80`,
          }}
        >
          {el.type}
        </div>
      );
    });
  };

  // Modern minimal slide renderer for all slide types
  const renderMinimalSlideContent = () => {
    switch (slide.type) {
      case "title":
        return (
          <div
            className={`flex flex-col justify-between h-full p-28 relative ${
              textAlign === "center"
                ? "items-center text-center"
                : "items-start text-left"
            }`}
          >
            {/* Top kicker badge */}
            <div className="flex items-center gap-3">
              <span
                className="px-5 py-2 rounded-full text-xl font-bold uppercase tracking-widest flex items-center gap-2 shadow-xs"
                style={{
                  backgroundColor: `${primaryColor}20`,
                  color: primaryColor,
                  border: `1.5px solid ${primaryColor}40`,
                }}
              >
                <Sparkles className="w-5 h-5" />
                {cfg.kicker || "Presentation"}
              </span>
            </div>

            {/* Top Banner Media placement */}
            {hasMedia && mediaPosition === "top" && (
              <div className="w-full h-72 my-4">{renderMedia()}</div>
            )}

            {/* Split Media / Main Content */}
            {hasMedia &&
            (mediaPosition === "right" ||
              mediaPosition === "left" ||
              mediaPosition === "card") ? (
              <div className="flex gap-12 my-auto w-full items-center">
                {mediaPosition === "left" && (
                  <div
                    className="h-[480px] shrink-0"
                    style={{ width: `${mediaWidthPercent}%` }}
                  >
                    {renderMedia()}
                  </div>
                )}
                <div className="flex-1 space-y-6">
                  <h1
                    className={`${titleFontSizeClass} font-black tracking-tight leading-[1.08]`}
                    style={{ color: textColor }}
                  >
                    {slide.title || "Untitled Presentation"}
                  </h1>
                  {slide.description && (
                    <p
                      className="text-3xl font-normal leading-relaxed"
                      style={{ color: textMuted }}
                    >
                      {slide.description}
                    </p>
                  )}
                  {mediaPosition === "card" && (
                    <div className="h-64 mt-6 max-w-2xl">{renderMedia()}</div>
                  )}
                </div>
                {mediaPosition === "right" && (
                  <div
                    className="h-[480px] shrink-0"
                    style={{ width: `${mediaWidthPercent}%` }}
                  >
                    {renderMedia()}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-8 my-auto max-w-5xl">
                <h1
                  className={`${titleFontSizeClass} font-black tracking-tight leading-[1.08]`}
                  style={{ color: textColor }}
                >
                  {slide.title || "Untitled Presentation"}
                </h1>
                {slide.description && (
                  <p
                    className="text-4xl font-normal leading-relaxed max-w-4xl"
                    style={{ color: textMuted }}
                  >
                    {slide.description}
                  </p>
                )}
              </div>
            )}

            {/* Bottom metadata / presenter */}
            <div
              className="flex items-center justify-between pt-8 border-t w-full"
              style={{ borderColor }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-2xl shadow-md"
                  style={{
                    backgroundColor: primaryColor,
                    color: slideBg,
                  }}
                >
                  {cfg.author?.charAt(0) || "S"}
                </div>
                <div>
                  <div
                    className="text-2xl font-bold"
                    style={{ color: textColor }}
                  >
                    {cfg.author || "Presenter"}
                  </div>
                  <div className="text-xl" style={{ color: textMuted }}>
                    {cfg.authorRole || "Sentio Live Session"}
                  </div>
                </div>
              </div>

              <div
                className="text-xl font-mono tracking-wider px-5 py-2.5 rounded-xl border"
                style={{
                  backgroundColor: cardBg,
                  color: textMuted,
                  borderColor,
                }}
              >
                16 : 9 Widescreen
              </div>
            </div>
          </div>
        );

      case "information":
        const bulletPoints: string[] = cfg.bulletPoints || [];
        return (
          <div className="flex flex-col h-full p-28 justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span
                  className="px-4 py-1.5 rounded-full text-lg font-bold uppercase tracking-wider"
                  style={{
                    backgroundColor: `${primaryColor}20`,
                    color: primaryColor,
                  }}
                >
                  Overview
                </span>
              </div>
              <h1
                className={`${titleFontSizeClass} font-extrabold tracking-tight mb-4`}
                style={{ color: textColor, textAlign }}
              >
                {slide.title || "Key Information"}
              </h1>
              {slide.description && (
                <p
                  className="text-3xl leading-relaxed max-w-5xl"
                  style={{ color: textMuted, textAlign }}
                >
                  {slide.description}
                </p>
              )}
            </div>

            {/* Split Media with Bullet Points or Grid */}
            {hasMedia &&
            (mediaPosition === "right" ||
              mediaPosition === "left" ||
              mediaPosition === "card") ? (
              <div className="flex gap-10 my-auto items-center">
                {mediaPosition === "left" && (
                  <div
                    className="h-[440px] shrink-0"
                    style={{ width: `${mediaWidthPercent}%` }}
                  >
                    {renderMedia()}
                  </div>
                )}
                <div className="flex-1 space-y-4">
                  {bulletPoints.map((point, idx) => (
                    <div
                      key={idx}
                      className="p-6 rounded-2xl flex items-start gap-4 border"
                      style={{ backgroundColor: cardBg, borderColor }}
                    >
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-lg"
                        style={{
                          backgroundColor: `${primaryColor}25`,
                          color: primaryColor,
                        }}
                      >
                        {idx + 1}
                      </div>
                      <div
                        className="text-2xl font-medium leading-relaxed"
                        style={{ color: textColor }}
                      >
                        {point}
                      </div>
                    </div>
                  ))}
                  {mediaPosition === "card" && (
                    <div className="h-60 mt-4">{renderMedia()}</div>
                  )}
                </div>
                {mediaPosition === "right" && (
                  <div
                    className="h-[440px] shrink-0"
                    style={{ width: `${mediaWidthPercent}%` }}
                  >
                    {renderMedia()}
                  </div>
                )}
              </div>
            ) : bulletPoints.length > 0 ? (
              <div className="grid grid-cols-2 gap-8 my-auto pt-6">
                {bulletPoints.map((point, idx) => (
                  <div
                    key={idx}
                    className="p-8 rounded-2xl flex items-start gap-5 border transition-all"
                    style={{
                      backgroundColor: cardBg,
                      borderColor,
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-xl mt-1"
                      style={{
                        backgroundColor: `${primaryColor}25`,
                        color: primaryColor,
                      }}
                    >
                      {idx + 1}
                    </div>
                    <div
                      className="text-2xl font-medium leading-relaxed"
                      style={{ color: textColor }}
                    >
                      {point}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                className="p-12 rounded-3xl border my-auto flex items-center gap-6"
                style={{ backgroundColor: cardBg, borderColor }}
              >
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: `${primaryColor}20`,
                    color: primaryColor,
                  }}
                >
                  <AlignLeft className="w-8 h-8" />
                </div>
                <div className="text-2xl" style={{ color: textMuted }}>
                  Add bullet points or customize media in the Customizer panel.
                </div>
              </div>
            )}

            <div className="text-xl" style={{ color: textMuted }}>
              Key Takeaways
            </div>
          </div>
        );

      case "question":
        return (
          <div
            className={`flex flex-col justify-center h-full p-28 relative ${
              textAlign === "center"
                ? "items-center text-center"
                : "items-start text-left"
            }`}
          >
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-lg"
              style={{
                backgroundColor: `${primaryColor}25`,
                color: primaryColor,
                border: `2px solid ${primaryColor}50`,
              }}
            >
              <HelpCircle className="w-10 h-10" />
            </div>

            <span
              className="px-5 py-2 rounded-full text-xl font-bold uppercase tracking-widest mb-6"
              style={{
                backgroundColor: `${accentColor}20`,
                color: accentColor,
              }}
            >
              Discussion Prompt
            </span>

            <h1
              className={`${titleFontSizeClass} font-extrabold tracking-tight leading-tight max-w-5xl mb-6`}
              style={{ color: textColor }}
            >
              {slide.title || "What is your main takeaway from today?"}
            </h1>

            {slide.description && (
              <p
                className="text-3xl max-w-3xl leading-relaxed mb-6"
                style={{ color: textMuted }}
              >
                {slide.description}
              </p>
            )}

            {hasMedia &&
              mediaPosition !== "background" &&
              mediaPosition !== "custom" && (
                <div
                  className="h-64 my-4"
                  style={{ width: `${mediaWidthPercent}%` }}
                >
                  {renderMedia()}
                </div>
              )}
          </div>
        );

      case "poll":
      case "imagepoll":
        const pollOptions =
          cfg.options && cfg.options.length > 0
            ? cfg.options
            : ["Option A", "Option B", "Option C", "Option D"];
        const isMulti = cfg.allowMultiple;

        return (
          <div className="flex flex-col h-full p-24 justify-between">
            {/* Header */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span
                  className="px-4 py-1.5 rounded-full text-lg font-bold uppercase tracking-wider flex items-center gap-2"
                  style={{
                    backgroundColor: `${primaryColor}20`,
                    color: primaryColor,
                  }}
                >
                  <BarChart2 className="w-5 h-5" />
                  Live Poll {isMulti && "• Multi-Choice"}
                </span>
              </div>
              <h1
                className={`${titleFontSizeClass} font-extrabold tracking-tight mb-4`}
                style={{ color: textColor, textAlign }}
              >
                {slide.title || "Cast your vote"}
              </h1>
              {slide.description && (
                <p className="text-2xl" style={{ color: textMuted, textAlign }}>
                  {slide.description}
                </p>
              )}
            </div>

            {/* Layout with Image or Full Grid */}
            {hasMedia &&
            (mediaPosition === "right" || mediaPosition === "left") ? (
              <div className="flex gap-8 my-auto items-center">
                {mediaPosition === "left" && (
                  <div
                    className="h-[440px] shrink-0"
                    style={{ width: `${mediaWidthPercent}%` }}
                  >
                    {renderMedia()}
                  </div>
                )}
                <div className="flex-1 grid grid-cols-1 gap-4">
                  {pollOptions.map((opt: string, i: number) => (
                    <div
                      key={i}
                      className="p-6 rounded-2xl border flex items-center gap-5 transition-all shadow-sm"
                      style={{ backgroundColor: cardBg, borderColor }}
                    >
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl shrink-0"
                        style={{
                          backgroundColor: `${primaryColor}25`,
                          color: primaryColor,
                        }}
                      >
                        {String.fromCharCode(65 + i)}
                      </div>
                      <div
                        className="text-2xl font-semibold truncate"
                        style={{ color: textColor }}
                      >
                        {opt || `Option ${i + 1}`}
                      </div>
                    </div>
                  ))}
                </div>
                {mediaPosition === "right" && (
                  <div
                    className="h-[440px] shrink-0"
                    style={{ width: `${mediaWidthPercent}%` }}
                  >
                    {renderMedia()}
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-6 my-auto">
                {pollOptions.map((opt: string, i: number) => {
                  const letters = ["A", "B", "C", "D", "E", "F", "G", "H"];
                  return (
                    <div
                      key={i}
                      className="p-8 rounded-2xl border flex items-center gap-6 transition-all shadow-sm"
                      style={{
                        backgroundColor: cardBg,
                        borderColor,
                      }}
                    >
                      <div
                        className="w-14 h-14 rounded-xl flex items-center justify-center font-bold text-2xl shrink-0 shadow-xs"
                        style={{
                          backgroundColor: `${primaryColor}25`,
                          color: primaryColor,
                        }}
                      >
                        {letters[i] || i + 1}
                      </div>
                      <div
                        className="text-3xl font-semibold flex-1 truncate"
                        style={{ color: textColor }}
                      >
                        {opt || `Option ${i + 1}`}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div
              className="flex items-center justify-between text-xl font-medium"
              style={{ color: textMuted }}
            >
              <span>{pollOptions.length} Options</span>
              <span>Vote via phone or web</span>
            </div>
          </div>
        );

      case "quiz":
        const quizOptions =
          cfg.options && cfg.options.length > 0
            ? cfg.options
            : ["Answer 1", "Answer 2", "Answer 3", "Answer 4"];
        const correctAnswers = cfg.correctAnswers || [];
        const timerSeconds = cfg.timer || 30;
        const points = cfg.points || 1000;

        return (
          <div className="flex flex-col h-full p-24 justify-between">
            {/* Quiz Top Header */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span
                    className="px-4 py-1.5 rounded-full text-lg font-bold uppercase tracking-wider flex items-center gap-2"
                    style={{
                      backgroundColor: `${primaryColor}20`,
                      color: primaryColor,
                    }}
                  >
                    <List className="w-5 h-5" /> Quiz Question
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-lg font-bold border shadow-xs"
                    style={{
                      backgroundColor: cardBg,
                      borderColor,
                      color: textColor,
                    }}
                  >
                    <Timer className="w-5 h-5 text-amber-500" />
                    <span>{timerSeconds}s</span>
                  </div>
                  <div
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-lg font-bold border shadow-xs"
                    style={{
                      backgroundColor: cardBg,
                      borderColor,
                      color: primaryColor,
                    }}
                  >
                    <Award className="w-5 h-5" />
                    <span>{points} pts</span>
                  </div>
                </div>
              </div>

              <h1
                className={`${titleFontSizeClass} font-extrabold tracking-tight mb-4`}
                style={{ color: textColor, textAlign }}
              >
                {slide.title || "Which of the following is correct?"}
              </h1>
              {slide.description && (
                <p className="text-2xl" style={{ color: textMuted, textAlign }}>
                  {slide.description}
                </p>
              )}
            </div>

            {/* Split Media with Quiz Choices */}
            {hasMedia &&
            (mediaPosition === "right" || mediaPosition === "left") ? (
              <div className="flex gap-8 my-auto items-center">
                {mediaPosition === "left" && (
                  <div
                    className="h-[440px] shrink-0"
                    style={{ width: `${mediaWidthPercent}%` }}
                  >
                    {renderMedia()}
                  </div>
                )}
                <div className="flex-1 grid grid-cols-1 gap-4">
                  {quizOptions.map((opt: string, i: number) => {
                    const isCorrect = correctAnswers.includes(i);
                    return (
                      <div
                        key={i}
                        className="p-6 rounded-2xl border flex items-center gap-5 transition-all shadow-sm relative overflow-hidden"
                        style={{
                          backgroundColor: cardBg,
                          borderColor: isCorrect ? primaryColor : borderColor,
                          borderWidth: isCorrect ? "2.5px" : "1px",
                        }}
                      >
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl shrink-0"
                          style={{
                            backgroundColor: isCorrect
                              ? primaryColor
                              : `${primaryColor}20`,
                            color: isCorrect ? slideBg : primaryColor,
                          }}
                        >
                          {String.fromCharCode(65 + i)}
                        </div>
                        <div
                          className="text-2xl font-semibold flex-1 truncate"
                          style={{ color: textColor }}
                        >
                          {opt || `Choice ${i + 1}`}
                        </div>
                        {isCorrect && (
                          <span
                            className="px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider"
                            style={{
                              backgroundColor: `${primaryColor}20`,
                              color: primaryColor,
                            }}
                          >
                            Correct
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
                {mediaPosition === "right" && (
                  <div
                    className="h-[440px] shrink-0"
                    style={{ width: `${mediaWidthPercent}%` }}
                  >
                    {renderMedia()}
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-6 my-auto">
                {quizOptions.map((opt: string, i: number) => {
                  const letters = ["A", "B", "C", "D", "E", "F"];
                  const isCorrect = correctAnswers.includes(i);
                  return (
                    <div
                      key={i}
                      className="p-8 rounded-2xl border flex items-center gap-6 transition-all shadow-sm relative overflow-hidden"
                      style={{
                        backgroundColor: cardBg,
                        borderColor: isCorrect ? primaryColor : borderColor,
                        borderWidth: isCorrect ? "2.5px" : "1px",
                      }}
                    >
                      <div
                        className="w-14 h-14 rounded-xl flex items-center justify-center font-bold text-2xl shrink-0 shadow-xs"
                        style={{
                          backgroundColor: isCorrect
                            ? primaryColor
                            : `${primaryColor}20`,
                          color: isCorrect ? slideBg : primaryColor,
                        }}
                      >
                        {letters[i] || i + 1}
                      </div>
                      <div
                        className="text-3xl font-semibold flex-1 truncate"
                        style={{ color: textColor }}
                      >
                        {opt || `Choice ${i + 1}`}
                      </div>
                      {isCorrect && (
                        <span
                          className="px-3 py-1 rounded-md text-sm font-bold uppercase tracking-wider shadow-xs"
                          style={{
                            backgroundColor: `${primaryColor}20`,
                            color: primaryColor,
                          }}
                        >
                          Correct
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div
              className="flex items-center justify-between text-xl font-medium"
              style={{ color: textMuted }}
            >
              <span>Fastest correct answer wins top score</span>
              <span>Quiz Mode</span>
            </div>
          </div>
        );

      case "rating":
        const maxRating = cfg.ratingRange?.max || 5;
        const lowLabel = cfg.lowLabel || "Needs Work";
        const highLabel = cfg.highLabel || "Outstanding";

        return (
          <div className="flex flex-col h-full p-28 justify-between text-center">
            <div>
              <span
                className="px-4 py-1.5 rounded-full text-lg font-bold uppercase tracking-wider inline-flex items-center gap-2 mb-4"
                style={{
                  backgroundColor: `${primaryColor}20`,
                  color: primaryColor,
                }}
              >
                <Star className="w-5 h-5 fill-current" /> Rating Scale
              </span>
              <h1
                className={`${titleFontSizeClass} font-extrabold tracking-tight mb-4`}
                style={{ color: textColor }}
              >
                {slide.title || "How would you rate this experience?"}
              </h1>
              {slide.description && (
                <p
                  className="text-2xl max-w-3xl mx-auto"
                  style={{ color: textMuted }}
                >
                  {slide.description}
                </p>
              )}
            </div>

            {/* Rating Scale Mockup */}
            <div className="my-auto max-w-4xl mx-auto w-full">
              <div className="flex items-center justify-center gap-6 mb-8">
                {Array.from({ length: maxRating }).map((_, i) => (
                  <div
                    key={i}
                    className="flex flex-col items-center gap-3 group"
                  >
                    <div
                      className="w-24 h-24 rounded-3xl border flex items-center justify-center text-4xl font-extrabold shadow-md transition-transform transform group-hover:scale-110"
                      style={{
                        backgroundColor: cardBg,
                        borderColor:
                          i === maxRating - 1 ? primaryColor : borderColor,
                        color: i === maxRating - 1 ? primaryColor : textColor,
                      }}
                    >
                      <Star
                        className="w-12 h-12"
                        style={{
                          fill: i < 4 ? primaryColor : "transparent",
                          color: primaryColor,
                        }}
                      />
                    </div>
                    <span
                      className="text-xl font-bold"
                      style={{ color: textMuted }}
                    >
                      {i + 1}
                    </span>
                  </div>
                ))}
              </div>

              <div
                className="flex items-center justify-between text-2xl font-semibold px-4"
                style={{ color: textMuted }}
              >
                <span>← {lowLabel}</span>
                <span>{highLabel} →</span>
              </div>
            </div>

            <div className="text-xl" style={{ color: textMuted }}>
              Audience rates on a scale of 1 to {maxRating}
            </div>
          </div>
        );

      case "wordcloud":
        const sampleWords = [
          { text: "Innovative", size: "text-6xl", weight: "font-black" },
          { text: "Fast", size: "text-5xl", weight: "font-bold" },
          { text: "Modern", size: "text-7xl", weight: "font-black" },
          { text: "Collaborative", size: "text-5xl", weight: "font-semibold" },
          { text: "Dynamic", size: "text-4xl", weight: "font-medium" },
          { text: "Engaging", size: "text-6xl", weight: "font-extrabold" },
          { text: "Intuitive", size: "text-5xl", weight: "font-bold" },
          { text: "Minimal", size: "text-4xl", weight: "font-medium" },
        ];

        return (
          <div className="flex flex-col h-full p-28 justify-between text-center">
            <div>
              <span
                className="px-4 py-1.5 rounded-full text-lg font-bold uppercase tracking-wider inline-flex items-center gap-2 mb-4"
                style={{
                  backgroundColor: `${primaryColor}20`,
                  color: primaryColor,
                }}
              >
                <Cloud className="w-5 h-5" /> Word Cloud
              </span>
              <h1
                className={`${titleFontSizeClass} font-extrabold tracking-tight mb-4`}
                style={{ color: textColor }}
              >
                {slide.title || "In one word, describe your thoughts"}
              </h1>
              {slide.description && (
                <p className="text-2xl" style={{ color: textMuted }}>
                  {slide.description}
                </p>
              )}
            </div>

            {/* Word Cloud Cluster */}
            <div
              className="my-auto p-12 rounded-3xl border flex flex-wrap items-center justify-center gap-8 max-w-5xl mx-auto shadow-sm"
              style={{ backgroundColor: cardBg, borderColor }}
            >
              {sampleWords.map((word, i) => (
                <span
                  key={i}
                  className={`${word.size} ${word.weight} tracking-tight px-4 py-2 rounded-2xl transition-transform hover:scale-105`}
                  style={{
                    color: i % 2 === 0 ? primaryColor : textColor,
                    backgroundColor:
                      i % 3 === 0 ? `${primaryColor}15` : "transparent",
                  }}
                >
                  {word.text}
                </span>
              ))}
            </div>

            <div className="text-xl" style={{ color: textMuted }}>
              Responses appear and grow dynamically in real time
            </div>
          </div>
        );

      case "opentext":
        return (
          <div className="flex flex-col h-full p-24 justify-between">
            <div>
              <span
                className="px-4 py-1.5 rounded-full text-lg font-bold uppercase tracking-wider inline-flex items-center gap-2 mb-4"
                style={{
                  backgroundColor: `${primaryColor}20`,
                  color: primaryColor,
                }}
              >
                <MessageSquare className="w-5 h-5" /> Open Response
              </span>
              <h1
                className={`${titleFontSizeClass} font-extrabold tracking-tight mb-4`}
                style={{ color: textColor, textAlign }}
              >
                {slide.title || "Share your feedback or questions"}
              </h1>
              {slide.description && (
                <p className="text-2xl" style={{ color: textMuted, textAlign }}>
                  {slide.description}
                </p>
              )}
            </div>

            {/* Open text mockup responses */}
            <div className="grid grid-cols-2 gap-6 my-auto">
              {[
                "Love the real-time engagement and clean design!",
                "Can we integrate this with our company SSO?",
                "The responsive slide view is super smooth.",
                "How do we export analytics after the session?",
              ].map((msg, i) => (
                <div
                  key={i}
                  className="p-8 rounded-2xl border flex flex-col justify-between gap-4 shadow-sm"
                  style={{
                    backgroundColor: cardBg,
                    borderColor,
                  }}
                >
                  <p
                    className="text-2xl font-medium leading-relaxed"
                    style={{ color: textColor }}
                  >
                    &ldquo;{msg}&rdquo;
                  </p>
                  <div
                    className="flex items-center gap-3 text-lg"
                    style={{ color: textMuted }}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
                      style={{
                        backgroundColor: `${primaryColor}20`,
                        color: primaryColor,
                      }}
                    >
                      {i + 1}
                    </div>
                    <span>Audience Participant</span>
                  </div>
                </div>
              ))}
            </div>

            <div
              className="flex items-center justify-between text-xl font-medium"
              style={{ color: textMuted }}
            >
              <span>Submissions stream live onto the presenter screen</span>
              <span>Anonymous or Named</span>
            </div>
          </div>
        );

      case "leaderboard": {
        const hasLiveLeaderboard = leaderboard && leaderboard.length > 0;
        const first = hasLiveLeaderboard
          ? leaderboard[0]
          : { displayName: "Sarah K.", score: 3400 };
        const second = hasLiveLeaderboard
          ? leaderboard[1]
          : { displayName: "Alex M.", score: 2850 };
        const third = hasLiveLeaderboard
          ? leaderboard[2]
          : { displayName: "David L.", score: 2410 };
        const runnersUp = hasLiveLeaderboard ? leaderboard.slice(3, 7) : [];

        return (
          <div className="flex flex-col h-full p-20 justify-between text-center">
            <div>
              <span
                className="px-4 py-1.5 rounded-full text-lg font-bold uppercase tracking-wider inline-flex items-center gap-2 mb-4"
                style={{
                  backgroundColor: `${primaryColor}20`,
                  color: primaryColor,
                }}
              >
                <Trophy className="w-5 h-5 text-amber-400" /> Live Leaderboard
              </span>
              <h1
                className={`${titleFontSizeClass} font-extrabold tracking-tight mb-2`}
                style={{ color: textColor }}
              >
                {slide.title || "Top Performers"}
              </h1>
              {hasLiveLeaderboard && (
                <p className="text-xl font-medium" style={{ color: textMuted }}>
                  {leaderboard.length} participant
                  {leaderboard.length === 1 ? "" : "s"} connected
                </p>
              )}
            </div>

            {/* Podium */}
            <div className="flex items-end justify-center gap-6 my-auto max-w-4xl mx-auto w-full pt-4">
              {/* 2nd Place */}
              {second && (
                <div className="flex-1 flex flex-col items-center">
                  <div
                    className="text-2xl font-bold mb-2 truncate max-w-[200px]"
                    style={{ color: textColor }}
                  >
                    {second.displayName}
                  </div>
                  <div
                    className="text-xl mb-3 font-mono"
                    style={{ color: textMuted }}
                  >
                    {second.score?.toLocaleString() || 0} pts
                  </div>
                  <div
                    className="w-full h-44 rounded-t-3xl border-t-4 border-l-2 border-r-2 flex flex-col items-center justify-center text-4xl font-black shadow-lg"
                    style={{
                      backgroundColor: cardBg,
                      borderColor: "#94A3B8",
                      color: "#94A3B8",
                    }}
                  >
                    🥈 2nd
                  </div>
                </div>
              )}

              {/* 1st Place */}
              {first && (
                <div className="flex-1 flex flex-col items-center">
                  <div
                    className="text-3xl font-extrabold mb-2 truncate max-w-[220px]"
                    style={{ color: textColor }}
                  >
                    {first.displayName} 👑
                  </div>
                  <div
                    className="text-2xl mb-3 font-mono font-bold"
                    style={{ color: primaryColor }}
                  >
                    {first.score?.toLocaleString() || 0} pts
                  </div>
                  <div
                    className="w-full h-64 rounded-t-3xl border-t-4 border-l-2 border-r-2 flex flex-col items-center justify-center text-5xl font-black shadow-2xl"
                    style={{
                      backgroundColor: `${primaryColor}20`,
                      borderColor: primaryColor,
                      color: primaryColor,
                    }}
                  >
                    🥇 1st
                  </div>
                </div>
              )}

              {/* 3rd Place */}
              {third && (
                <div className="flex-1 flex flex-col items-center">
                  <div
                    className="text-2xl font-bold mb-2 truncate max-w-[200px]"
                    style={{ color: textColor }}
                  >
                    {third.displayName}
                  </div>
                  <div
                    className="text-xl mb-3 font-mono"
                    style={{ color: textMuted }}
                  >
                    {third.score?.toLocaleString() || 0} pts
                  </div>
                  <div
                    className="w-full h-36 rounded-t-3xl border-t-4 border-l-2 border-r-2 flex flex-col items-center justify-center text-4xl font-black shadow-md"
                    style={{
                      backgroundColor: cardBg,
                      borderColor: "#D97706",
                      color: "#D97706",
                    }}
                  >
                    🥉 3rd
                  </div>
                </div>
              )}
            </div>

            {/* Runners Up List */}
            {runnersUp.length > 0 && (
              <div className="flex items-center justify-center gap-4 flex-wrap max-w-4xl mx-auto w-full my-3">
                {runnersUp.map((entry, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2.5 px-4 py-2 rounded-xl border text-sm font-semibold shadow-xs"
                    style={{
                      backgroundColor: cardBg,
                      borderColor,
                      color: textColor,
                    }}
                  >
                    <span className="w-5 h-5 rounded-md bg-zinc-800 text-zinc-300 text-xs flex items-center justify-center font-bold">
                      {entry.rank || idx + 4}
                    </span>
                    <span>{entry.displayName}</span>
                    <span style={{ color: primaryColor }}>
                      {entry.score || 0} pts
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="text-lg font-medium" style={{ color: textMuted }}>
              Rankings update live as participants score in quiz challenges
            </div>
          </div>
        );
      }

      case "thankyou":
        return (
          <div
            className={`flex flex-col justify-center h-full p-28 relative ${
              textAlign === "center"
                ? "items-center text-center"
                : "items-start text-left"
            }`}
          >
            <div
              className="w-24 h-24 rounded-3xl flex items-center justify-center mb-8 shadow-xl"
              style={{
                backgroundColor: `${primaryColor}25`,
                color: primaryColor,
                border: `2px solid ${primaryColor}40`,
              }}
            >
              <CheckCircle className="w-12 h-12" />
            </div>

            <h1
              className={`${titleFontSizeClass} font-black tracking-tight mb-6`}
              style={{ color: textColor }}
            >
              {slide.title || "Thank You!"}
            </h1>

            <p
              className="text-3xl max-w-3xl leading-relaxed mb-12"
              style={{ color: textMuted }}
            >
              {slide.description ||
                "Questions, feedback, or further discussion?"}
            </p>

            {hasMedia &&
              mediaPosition !== "background" &&
              mediaPosition !== "custom" && (
                <div
                  className="h-56 mb-8"
                  style={{ width: `${mediaWidthPercent}%` }}
                >
                  {renderMedia()}
                </div>
              )}

            <div
              className="flex items-center gap-6 px-8 py-4 rounded-2xl border text-2xl font-semibold shadow-md"
              style={{
                backgroundColor: cardBg,
                borderColor,
                color: textColor,
              }}
            >
              <span>{cfg.callToAction || "sentio.app"}</span>
              <span style={{ color: textMuted }}>•</span>
              <span style={{ color: primaryColor }}>Session Finished</span>
            </div>
          </div>
        );

      default:
        return (
          <div className="flex flex-col h-full p-24 justify-between">
            <h1
              className={`${titleFontSizeClass} font-extrabold tracking-tight`}
              style={{ color: textColor, textAlign }}
            >
              {slide.title || "Slide Title"}
            </h1>
            {slide.description && (
              <p className="text-3xl" style={{ color: textMuted, textAlign }}>
                {slide.description}
              </p>
            )}
            <div
              className="flex-1 my-8 border-2 border-dashed rounded-3xl flex items-center justify-center text-3xl font-medium"
              style={{ borderColor, color: textMuted }}
            >
              {slide.type} layout
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-zinc-100 dark:bg-zinc-950 overflow-hidden relative select-none">
      {/* Editor Canvas Container */}
      <div className="flex-1 p-2 sm:p-4 md:p-6 flex items-center justify-center overflow-hidden min-h-0 min-w-0">
        <SlideCanvas theme={baseTheme} zoom={zoom}>
          <div
            className="w-full h-full relative overflow-hidden transition-all"
            style={{
              backgroundColor: slideBg,
              fontFamily: fontFamilyStyle,
            }}
          >
            {/* Background Backdrop Image if selected */}
            {hasMedia && mediaPosition === "background" && (
              <div className="absolute inset-0 z-0">
                <img
                  src={cfg.mediaUrl}
                  alt=""
                  className="w-full h-full"
                  style={{ objectFit: mediaFit }}
                />
                <div
                  className="absolute inset-0 backdrop-blur-xs"
                  style={{
                    backgroundColor: `${slideBg}${Math.round(
                      ((100 - (cfg.mediaOpacity || 40)) / 100) * 255,
                    )
                      .toString(16)
                      .padStart(2, "0")}`,
                  }}
                />
              </div>
            )}

            {/* Floating / Movable Image Layer if custom placement */}
            {hasMedia && mediaPosition === "custom" && (
              <div
                className="absolute z-20 transition-all pointer-events-none"
                style={{
                  left: `${cfg.mediaX ?? 55}%`,
                  top: `${cfg.mediaY ?? 20}%`,
                  width: `${mediaWidthPercent}%`,
                  height: "auto",
                  maxHeight: "65%",
                }}
              >
                {renderMedia("w-full h-auto max-h-[500px]")}
              </div>
            )}

            {/* Slide Content Layer */}
            <div className="relative z-10 w-full h-full">
              {slide.elements && slide.elements.length > 0
                ? renderElements()
                : renderMinimalSlideContent()}
            </div>

            {/* Minimal Join Code Badge */}
            {joinCode && (
              <div
                className="absolute bottom-8 left-8 z-20 flex items-center gap-3.5 px-6 py-3 rounded-full text-xl font-bold shadow-2xl backdrop-blur-xl border transition-all"
                style={{
                  backgroundColor: `${cardBg}E6`,
                  borderColor,
                  color: textColor,
                }}
              >
                <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                <span>
                  Join at{" "}
                  <strong style={{ color: primaryColor }}>sentio.app</strong>{" "}
                  with code{" "}
                  <span className="font-mono font-black tracking-wider">
                    {joinCode}
                  </span>
                </span>
              </div>
            )}
          </div>
        </SlideCanvas>
      </div>

      {/* Editor Floating Bottom Zoom Bar */}
      {showToolbar && !isHost && (
        <div className="absolute bottom-3 right-4 z-20 flex items-center gap-1.5 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-800 shadow-lg text-xs font-medium text-zinc-600 dark:text-zinc-300">
          <button
            onClick={() => setZoom("fit")}
            className={`px-2.5 py-1 rounded-full transition-colors ${
              zoom === "fit"
                ? "bg-blue-600 text-white font-bold"
                : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
            title="Fit to Screen"
          >
            Fit
          </button>
          <button
            onClick={() => setZoom(0.5)}
            className={`px-2 py-1 rounded-full transition-colors ${
              zoom === 0.5
                ? "bg-blue-600 text-white font-bold"
                : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
            title="50% Zoom"
          >
            50%
          </button>
          <button
            onClick={() => setZoom(0.75)}
            className={`px-2 py-1 rounded-full transition-colors ${
              zoom === 0.75
                ? "bg-blue-600 text-white font-bold"
                : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
            title="75% Zoom"
          >
            75%
          </button>
          <button
            onClick={() => setZoom(1.0)}
            className={`px-2 py-1 rounded-full transition-colors ${
              zoom === 1.0
                ? "bg-blue-600 text-white font-bold"
                : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
            title="100% Zoom"
          >
            100%
          </button>
        </div>
      )}
    </div>
  );
}
