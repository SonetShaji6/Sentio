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
  index: number;
}

function SortableSlideItem({
  slide,
  theme,
  isActive,
  onSelect,
  onDelete,
  onDuplicate,
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
      className={`group relative flex items-center p-2 mb-2.5 rounded-xl border-2 cursor-pointer transition-all ${
        isActive
          ? "border-blue-600 bg-blue-50/80 dark:bg-blue-950/40 shadow-sm"
          : "border-zinc-200 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900/60"
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
          <div className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-30 py-1 overflow-hidden">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(false);
                onDuplicate();
              }}
              className="w-full text-left px-3 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2"
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

interface SlideNavigatorProps {
  slides: ISlide[];
  theme?: PresentationTheme | any;
  activeSlideId: string | null;
  onSelectSlide: (id: string) => void;
  onAddSlide: () => void;
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
  onDeleteSlide,
  onDuplicateSlide,
  onReorderSlides,
  className = "",
}: SlideNavigatorProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
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

  return (
    <div
      className={`w-full md:w-64 flex flex-col h-full bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 shrink-0 ${className}`}
    >
      {/* Header */}
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
            <Layers className="w-4 h-4" />
          </div>
          <h2 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
            Slides ({slides.length})
          </h2>
        </div>
        <button
          onClick={onAddSlide}
          className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-xs flex items-center gap-1 text-xs font-bold"
          title="Add Slide"
        >
          <Plus className="w-4 h-4" />
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
              <SortableSlideItem
                key={slide._id}
                slide={slide}
                theme={theme}
                index={index}
                isActive={activeSlideId === slide._id}
                onSelect={() => onSelectSlide(slide._id)}
                onDelete={() => onDeleteSlide(slide._id)}
                onDuplicate={() => onDuplicateSlide(slide._id)}
              />
            ))}
          </SortableContext>
        </DndContext>

        {slides.length === 0 && (
          <div className="text-center p-6 text-zinc-400">
            <p className="text-xs">No slides yet.</p>
            <button
              onClick={onAddSlide}
              className="text-blue-600 text-xs font-bold mt-2 hover:underline inline-flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add First Slide
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
