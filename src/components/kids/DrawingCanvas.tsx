import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Paintbrush,
  Eraser,
  RotateCcw,
  RotateCw,
  Trash2,
  Check,
  X,
  Sparkles,
} from 'lucide-react';

interface DrawingCanvasProps {
  initialDrawing?: string | null;
  onSaveDrawing: (dataUrl: string) => void;
  onCancel?: () => void;
}

const BRUSH_SIZES = [
  { id: 'fine', label: 'Thin', size: 4, iconSize: 6 },
  { id: 'medium', label: 'Medium', size: 10, iconSize: 12 },
  { id: 'bold', label: 'Thick', size: 20, iconSize: 18 },
  { id: 'super', label: 'Giant', size: 36, iconSize: 26 },
];

const COLORS = [
  { hex: '#ef4444', name: 'Red' },
  { hex: '#f97316', name: 'Orange' },
  { hex: '#eab308', name: 'Yellow' },
  { hex: '#22c55e', name: 'Green' },
  { hex: '#06b6d4', name: 'Cyan' },
  { hex: '#3b82f6', name: 'Blue' },
  { hex: '#8b5cf6', name: 'Purple' },
  { hex: '#ec4899', name: 'Pink' },
  { hex: '#78350f', name: 'Brown' },
  { hex: '#0f172a', name: 'Black' },
  { hex: '#ffffff', name: 'White' },
];

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  initialDrawing,
  onSaveDrawing,
  onCancel,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [selectedColor, setSelectedColor] = useState<string>('#3b82f6');
  const [selectedSize, setSelectedSize] = useState<number>(10);
  const [isEraser, setIsEraser] = useState<boolean>(false);

  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  const isDrawingRef = useRef<boolean>(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  // Initialize canvas size and history
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // Use container width or reasonable default
    const rect = container.getBoundingClientRect();
    const width = Math.min(800, Math.max(320, rect.width - 32));
    const height = Math.min(500, Math.max(340, Math.round(width * 0.65)));

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Default white paper background for vibrant kids drawings
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    if (initialDrawing) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height);
        const snapshot = canvas.toDataURL('image/png');
        setHistory([snapshot]);
        setHistoryIndex(0);
      };
      img.src = initialDrawing;
    } else {
      const snapshot = canvas.toDataURL('image/png');
      setHistory([snapshot]);
      setHistoryIndex(0);
    }
  }, [initialDrawing]);

  useEffect(() => {
    initCanvas();
  }, [initCanvas]);

  const saveToHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const snapshot = canvas.toDataURL('image/png');
    setHistory((prev) => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(snapshot);
      if (newHistory.length > 20) {
        newHistory.shift();
        return newHistory;
      }
      return newHistory;
    });
    setHistoryIndex((prev) => Math.min(prev + 1, 19));
  }, [historyIndex]);

  const undo = () => {
    if (historyIndex > 0) {
      const targetIndex = historyIndex - 1;
      const targetData = history[targetIndex];
      const canvas = canvasRef.current;
      if (!canvas || !targetData) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        setHistoryIndex(targetIndex);
      };
      img.src = targetData;
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const targetIndex = historyIndex + 1;
      const targetData = history[targetIndex];
      const canvas = canvasRef.current;
      if (!canvas || !targetData) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        setHistoryIndex(targetIndex);
      };
      img.src = targetData;
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveToHistory();
  };

  // Coordinates helper
  const getCoordinates = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);

    const coords = getCoordinates(e);
    isDrawingRef.current = true;
    lastPointRef.current = coords;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.arc(coords.x, coords.y, selectedSize / 2, 0, Math.PI * 2);
    ctx.fillStyle = isEraser ? '#ffffff' : selectedColor;
    ctx.fill();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawingRef.current || !lastPointRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentCoords = getCoordinates(e);

    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(currentCoords.x, currentCoords.y);
    ctx.strokeStyle = isEraser ? '#ffffff' : selectedColor;
    ctx.lineWidth = selectedSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    lastPointRef.current = currentCoords;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (isDrawingRef.current) {
      isDrawingRef.current = false;
      lastPointRef.current = null;
      saveToHistory();
    }
  };

  const handleDone = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    onSaveDrawing(dataUrl);
  };

  return (
    <div
      id="kids-drawing-canvas-container"
      ref={containerRef}
      className="flex flex-col items-center w-full max-w-3xl mx-auto rounded-3xl bg-slate-900/80 backdrop-blur-xl border border-indigo-500/30 p-4 md:p-6 shadow-2xl space-y-4"
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between w-full px-2">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white tracking-wide">Draw Your Day! 🎨</h3>
            <p className="text-xs text-slate-300">Use your finger or mouse to draw anything you like</p>
          </div>
        </div>

        {onCancel && (
          <button
            id="btn-close-canvas"
            type="button"
            onClick={onCancel}
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Drawing Board */}
      <div className="relative rounded-2xl overflow-hidden shadow-inner border-4 border-indigo-400/40 bg-white">
        <canvas
          id="kids-paint-canvas"
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="cursor-crosshair touch-none select-none block"
          style={{ touchAction: 'none' }}
        />
      </div>

      {/* Palette and Controls */}
      <div className="w-full space-y-4 bg-slate-800/60 rounded-2xl p-4 border border-white/10">
        {/* Colors Row */}
        <div>
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 block">
            Pick a Color:
          </span>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {COLORS.map((col) => {
              const isSelected = !isEraser && selectedColor === col.hex;
              return (
                <button
                  key={col.hex}
                  id={`color-pick-${col.name.toLowerCase()}`}
                  type="button"
                  onClick={() => {
                    setSelectedColor(col.hex);
                    setIsEraser(false);
                  }}
                  title={col.name}
                  className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full transition-all transform active:scale-90 shadow-md ${
                    isSelected
                      ? 'scale-110 ring-4 ring-white ring-offset-2 ring-offset-slate-900'
                      : 'hover:scale-105 border border-white/20'
                  }`}
                  style={{ backgroundColor: col.hex }}
                />
              );
            })}

            {/* Eraser Tool */}
            <button
              id="btn-tool-eraser"
              type="button"
              onClick={() => setIsEraser(true)}
              className={`flex items-center space-x-1 px-3 py-2 rounded-2xl font-medium text-xs sm:text-sm transition-all ${
                isEraser
                  ? 'bg-rose-500 text-white ring-4 ring-rose-400/40 shadow-lg scale-105'
                  : 'bg-white/10 text-slate-200 hover:bg-white/20'
              }`}
            >
              <Eraser className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Eraser</span>
            </button>
          </div>
        </div>

        {/* Brush Sizes and Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/10">
          {/* Sizes */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-300 mr-1">Brush:</span>
            {BRUSH_SIZES.map((b) => (
              <button
                key={b.id}
                id={`brush-size-${b.id}`}
                type="button"
                onClick={() => setSelectedSize(b.size)}
                className={`p-2 rounded-xl flex items-center justify-center transition-all ${
                  selectedSize === b.size
                    ? 'bg-indigo-600 text-white ring-2 ring-indigo-400'
                    : 'bg-white/10 text-slate-300 hover:bg-white/20'
                }`}
                title={b.label}
              >
                <div
                  className="rounded-full bg-current"
                  style={{ width: b.iconSize, height: b.iconSize }}
                />
              </button>
            ))}
          </div>

          {/* Undo, Redo, Clear */}
          <div className="flex items-center space-x-2">
            <button
              id="btn-draw-undo"
              type="button"
              onClick={undo}
              disabled={historyIndex <= 0}
              className="p-2.5 rounded-xl bg-white/10 text-slate-200 hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              title="Undo"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              id="btn-draw-redo"
              type="button"
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              className="p-2.5 rounded-xl bg-white/10 text-slate-200 hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              title="Redo"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <button
              id="btn-draw-clear"
              type="button"
              onClick={clearCanvas}
              className="p-2.5 rounded-xl bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30 transition-all"
              title="Clear Drawing"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Save Action */}
      <div className="flex items-center justify-end space-x-3 w-full pt-2">
        {onCancel && (
          <button
            id="btn-cancel-drawing"
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-slate-300 font-medium text-sm transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          id="btn-save-drawing"
          type="button"
          onClick={handleDone}
          className="flex items-center space-x-2 px-7 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-base shadow-lg shadow-emerald-500/25 hover:from-emerald-400 hover:to-teal-400 active:scale-95 transition-all"
        >
          <Check className="w-5 h-5" />
          <span>Keep My Drawing! ✨</span>
        </button>
      </div>
    </div>
  );
};
