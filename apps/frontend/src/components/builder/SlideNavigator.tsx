"use client";

import React, { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ISlide } from "@/types/slide";
import { PresentationTheme, resolveTheme } from "@/types/theme";
import {
  Plus,
  Trash2,
  Copy,
  Lock,
  EyeOff,
  GripVertical,
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
  MoreVertical,
  Layers,
} from "lucide-react";

const typeIcons: Record<string, React.ReactNode> = {
  title: <Type className="w-3.5 h-3.5" />,
  information: <AlignLeft className="w-3.5 h-3.5" />,
  question: <HelpCircle className="w-3.5 h-3.5" />,
  poll: <BarChart2 className="w-3.5 h-3.5" />,
  quiz: <List className="w-3.5 h-3.5" />,
  rating: <Star className="w-3.5 h-3.5" />,
  wordcloud: <Cloud className="w-3.5 h-3.5" />,
  opentext: <MessageSquare className="w-3.5 h-3.5" />,
  imagepoll: <ImageIcon className="w-3.5 h-3.5" />,
  leaderboard: <Trophy className="w-3.5 h-3.5" />,
  thankyou: <CheckCircle className="w-3.5 h-3.5" />,
};

interface SortableSlideProps {
  slide: ISlide;
  theme?: PresentationTheme | any;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onInsertAbove?: () => void;
  onInsertBelow?: () => void;
  index: number;
}

function SortableSlideItem({
  slide,
  theme,
  isActive,
  onSelect,
  onDelete,
  onDuplicate,
  onInsertAbove,
  onInsertBelow,
  index,
}: SortableSlideProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: slide._id,
    });
  const [menuOpen, setMenuOpen] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const resolvedTheme = resolveTheme(slide.themeOverrides || theme);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative flex items-center p-2 rounded-xl border cursor-pointer transition-all duration-200 hover-lift ${
        isActive
          ? "border-zinc-950 dark:border-white bg-zinc-100/90 dark:bg-zinc-800/90 shadow-sm"
          : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 bg-white dark:bg-zinc-900/60"
      }`}
      onClick={onSelect}
    >
      {/* Drag Grip Handle */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-1 mr-1"
      >
        <GripVertical className="w-3.5 h-3.5" />
      </div>

      {/* Index Number */}
      <div className="w-5 text-center text-xs font-mono font-bold text-zinc-400 mr-2 shrink-0">
        {index + 1}
      </div>

      {/* Mini Slide Thumbnail Preview */}
      <div
        className="w-12 h-7 rounded-md border mr-2.5 flex items-center justify-center shrink-0 overflow-hidden shadow-xs"
        style={{
          backgroundColor: resolvedTheme.bg,
          borderColor: resolvedTheme.border,
          color: resolvedTheme.primary,
        }}
      >
        <div className="scale-75">
          {typeIcons[slide.type] || <Type className="w-3.5 h-3.5" />}
        </div>
      </div>

      {/* Slide Details */}
      <div className="flex-1 min-w-0 pr-1">
        <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
          {slide.title || "Untitled Slide"}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">
            {slide.type}
          </span>
          {slide.isHidden && (
            <span title="Hidden from presentation">
              <EyeOff className="w-3 h-3 text-amber-500" />
            </span>
          )}
          {slide.isLocked && (
            <span title="Locked">
              <Lock className="w-3 h-3 text-red-500" />
            </span>
          )}
        </div>
      </div>

      {/* Action Menu Trigger */}
      <div className="relative shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen(!menuOpen);
          }}
          className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <MoreVertical className="w-3.5 h-3.5" />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-30 py-1 overflow-hidden animate-scale-in">
            {onInsertAbove && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  onInsertAbove();
                }}
                className="w-full text-left px-3 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2 font-medium"
              >
                <Plus className="w-3.5 h-3.5 text-zinc-900 dark:text-white" />{" "}
                Insert Above
              </button>
            )}
            {onInsertBelow && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  onInsertBelow();
                }}
                className="w-full text-left px-3 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2 font-medium"
              >
                <Plus className="w-3.5 h-3.5 text-zinc-900 dark:text-white" />{" "}
                Insert Below
              </button>
            )}
            <div className="my-1 border-t border-zinc-100 dark:border-zinc-800" />
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(false);
                onDuplicate();
              }}
              className="w-full text-left px-3 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2 font-medium"
            >
              <Copy className="w-3.5 h-3.5" /> Duplicate
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!slide.isLocked) {
                  setMenuOpen(false);
                  onDelete();
                }
              }}
              disabled={slide.isLocked}
              className={`w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 ${
                slide.isLocked
                  ? "text-zinc-400 cursor-not-allowed opacity-50"
                  : "text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
        )}
      </div>

      {menuOpen && (
        <div
          className="fixed inset-0 z-20"
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen(false);
          }}
        />
      )}
    </div>
  );
}

function InsertSlideDivider({
  onInsert,
  label = "Insert slide here",
}: {
  onInsert: () => void;
  label?: string;
}) {
  return (
    <div className="group/divider relative h-3 flex items-center justify-center my-0.5 z-10">
      <div className="absolute inset-x-2 h-0.5 bg-transparent group-hover/divider:bg-zinc-400/80 dark:group-hover/divider:bg-zinc-500/80 transition-all rounded-full" />
      <button
        onClick={(e) => {
          e.stopPropagation();
          onInsert();
        }}
        className="opacity-0 group-hover/divider:opacity-100 transition-all duration-150 scale-75 group-hover/divider:scale-100 px-2 py-0.5 bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 rounded-full text-[10px] font-bold flex items-center gap-1 shadow-md z-20 active-press cursor-pointer"
        title={label}
      >
        <Plus className="w-2.5 h-2.5" />
        <span>Add Slide</span>
      </button>
    </div>
  );
}

interface SlideNavigatorProps {
  slides: ISlide[];
  theme?: PresentationTheme | any;
  activeSlideId: string | null;
  onSelectSlide: (id: string) => void;
  onAddSlide: () => void;
  onAddSlideAt?: (targetIndex: number) => void;
  onDeleteSlide: (id: string) => void;
  onDuplicateSlide: (id: string) => void;
  onReorderSlides: (slideIds: string[]) => void;
  className?: string;
}

export function SlideNavigator({
  slides,
  theme,
  activeSlideId,
  onSelectSlide,
  onAddSlide,
  onAddSlideAt,
  onDeleteSlide,
  onDuplicateSlide,
  onReorderSlides,
  className = "",
}: SlideNavigatorProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = slides.findIndex((s) => s._id === active.id);
      const newIndex = slides.findIndex((s) => s._id === over.id);
      const newSlides = arrayMove(slides, oldIndex, newIndex);
      onReorderSlides(newSlides.map((s) => s._id));
    }
  };

  const handleInsertAt = (targetIndex: number) => {
    if (onAddSlideAt) {
      onAddSlideAt(targetIndex);
    } else {
      onAddSlide();
    }
  };

  return (
    <div
      className={`w-full md:w-64 flex flex-col h-full bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 shrink-0 ${className}`}
    >
      {/* Header */}
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
            <Layers className="w-4 h-4" />
          </div>
          <h2 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
            Slides ({slides.length})
          </h2>
        </div>
        <button
          onClick={onAddSlide}
          className="px-2.5 py-1.5 bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 rounded-xl transition-all shadow-xs flex items-center gap-1 text-xs font-bold active-press cursor-pointer"
          title="Add Slide to End"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Add</span>
        </button>
      </div>

      {/* Slide List */}
      <div className="flex-1 overflow-y-auto p-3">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={slides.map((s) => s._id)}
            strategy={verticalListSortingStrategy}
          >
            {slides.map((slide, index) => (
              <React.Fragment key={slide._id}>
                {/* Insert divider before first slide or between slides */}
                {index === 0 && (
                  <InsertSlideDivider
                    onInsert={() => handleInsertAt(0)}
                    label="Insert slide at start"
                  />
                )}

                <SortableSlideItem
                  slide={slide}
                  theme={theme}
                  index={index}
                  isActive={activeSlideId === slide._id}
                  onSelect={() => onSelectSlide(slide._id)}
                  onDelete={() => onDeleteSlide(slide._id)}
                  onDuplicate={() => onDuplicateSlide(slide._id)}
                  onInsertAbove={() => handleInsertAt(index)}
                  onInsertBelow={() => handleInsertAt(index + 1)}
                />

                {/* Insert divider after each slide */}
                <InsertSlideDivider
                  onInsert={() => handleInsertAt(index + 1)}
                  label={`Insert slide after #${index + 1}`}
                />
              </React.Fragment>
            ))}
          </SortableContext>
        </DndContext>

        {slides.length === 0 && (
          <div className="text-center p-6 text-zinc-400">
            <p className="text-xs">No slides yet.</p>
            <button
              onClick={onAddSlide}
              className="text-zinc-900 dark:text-white text-xs font-bold mt-2 hover:underline inline-flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add First Slide
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
