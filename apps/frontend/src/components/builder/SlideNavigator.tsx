"use client";

import React, { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
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
} from "lucide-react";

const typeIcons: Record<string, React.ReactNode> = {
  title: <Type className="w-4 h-4" />,
  information: <AlignLeft className="w-4 h-4" />,
  question: <HelpCircle className="w-4 h-4" />,
  poll: <BarChart2 className="w-4 h-4" />,
  quiz: <List className="w-4 h-4" />,
  rating: <Star className="w-4 h-4" />,
  wordcloud: <Cloud className="w-4 h-4" />,
  opentext: <MessageSquare className="w-4 h-4" />,
  imagepoll: <ImageIcon className="w-4 h-4" />,
  leaderboard: <Trophy className="w-4 h-4" />,
  thankyou: <CheckCircle className="w-4 h-4" />,
};

interface SortableSlideProps {
  slide: ISlide;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  index: number;
}

function SortableSlideItem({
  slide,
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative flex items-center p-2 mb-2 rounded-lg border-2 cursor-pointer transition-colors ${
        isActive
          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
          : "border-transparent hover:border-gray-200 dark:hover:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
      }`}
      onClick={onSelect}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab hover:text-gray-900 dark:hover:text-gray-100 text-gray-400 p-1 mr-1"
      >
        <GripVertical className="w-4 h-4" />
      </div>

      <div className="flex flex-col items-center justify-center w-6 text-xs font-semibold text-gray-500 mr-2">
        {index + 1}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {typeIcons[slide.type] || <Type className="w-4 h-4" />}
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {slide.title || "Untitled Slide"}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-gray-500 capitalize">{slide.type}</span>
          {slide.isHidden && (
            <span title="Hidden">
              <EyeOff className="w-3 h-3 text-orange-500" />
            </span>
          )}
          {slide.isLocked && (
            <span title="Locked">
              <Lock className="w-3 h-3 text-red-500" />
            </span>
          )}
        </div>
      </div>

      <div className="relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen(!menuOpen);
          }}
          className="p-1.5 text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          <MoreVertical className="w-4 h-4" />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md shadow-lg z-10 py-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(false);
                onDuplicate();
              }}
              className="w-full text-left px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2"
            >
              <Copy className="w-4 h-4" /> Duplicate
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(false);
                onDelete();
              }}
              className="w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          </div>
        )}
      </div>

      {/* Click outside listener for menu */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-0"
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
  activeSlideId: string | null;
  onSelectSlide: (id: string) => void;
  onAddSlide: () => void;
  onDeleteSlide: (id: string) => void;
  onDuplicateSlide: (id: string) => void;
  onReorderSlides: (slideIds: string[]) => void;
}

export function SlideNavigator({
  slides,
  activeSlideId,
  onSelectSlide,
  onAddSlide,
  onDeleteSlide,
  onDuplicateSlide,
  onReorderSlides,
}: SlideNavigatorProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
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
    <div className="hidden md:flex w-full md:w-64 flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 shrink-0">
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100">
          Slides
        </h2>
        <button
          onClick={onAddSlide}
          className="p-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-md transition-colors"
          title="Add Slide"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
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
          <div className="text-center p-6 text-gray-500">
            <p className="text-sm">No slides yet.</p>
            <button
              onClick={onAddSlide}
              className="text-blue-600 text-sm mt-2 hover:underline"
            >
              Add your first slide
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
