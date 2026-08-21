import { useRef, useEffect, useCallback } from 'react';
import { Eraser } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from './Button';

interface SignaturePadProps {
  onChange: (dataUrl: string | null) => void;
  className?: string;
}

export function SignaturePad({ onChange, className }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  const getPoint = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const exportSignature = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const hasContent = pixels.some((p, i) => i % 4 === 3 && p > 0);
    onChange(hasContent ? canvas.toDataURL('image/png') : null);
  }, [onChange]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement!;
    canvas.width = parent.clientWidth * 2;
    canvas.height = 200 * 2;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(2, 2);
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    drawing.current = true;
    const ctx = canvasRef.current!.getContext('2d')!;
    const { x, y } = getPoint(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing.current) return;
    e.preventDefault();
    const ctx = canvasRef.current!.getContext('2d')!;
    const { x, y } = getPoint(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const endDraw = () => {
    if (!drawing.current) return;
    drawing.current = false;
    exportSignature();
  };

  const clear = () => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onChange(null);
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div className="relative rounded-xl border-2 border-dashed border-border bg-white">
        <canvas
          ref={canvasRef}
          className="h-[200px] w-full touch-none"
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />
        <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-gray-400">
          חתום כאן
        </p>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={clear}>
        <Eraser className="h-4 w-4" />
        נקה חתימה
      </Button>
    </div>
  );
}
