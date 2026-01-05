
import React, { useState, useRef, useEffect } from 'react';
// @ts-ignore - No types available for this module, so we ignore the warning.
import GIF from 'https://esm.sh/gif.js.optimized';

// --- Configuration ---
const INITIAL_RADIUS = 60;
const RADIUS_STEP = 5;
const MIN_RADIUS = 10;
const CIRCLE_COLOR = '#ffae00'; // A glowing orange-yellow
const NORMAL_FADE_COLOR = 'rgba(0, 0, 0, 0.1)'; // Normal tail
const LONG_TAIL_FADE_COLOR = 'rgba(0, 0, 0, 0.05)'; // Longer tail
const EASING_FACTOR = 0.1; // How smoothly it follows the mouse
const SHAKE_INTENSITY = 1.5; // How much it vibrates
const GLOW_BLUR = 15; // The size of the glow effect
const GIF_DURATION = 10000; // 10 seconds in ms

type GifStatus = 'idle' | 'recording' | 'rendering' | 'error';

const App: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [radius, setRadius] = useState(INITIAL_RADIUS);
    const [backgroundFadeColor, setBackgroundFadeColor] = useState(NORMAL_FADE_COLOR);
    const [gifStatus, setGifStatus] = useState<GifStatus>('idle');

    const circlePosRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
    const mousePosRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
    const animationFrameId = useRef<number | null>(null);
    const gifRecorderRef = useRef<any | null>(null);

    // Effect to set up all window event listeners
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === '+' || event.key === '=') {
                setRadius(prev => prev + RADIUS_STEP);
            } else if (event.key === '-') {
                setRadius(prev => Math.max(MIN_RADIUS, prev - RADIUS_STEP));
            } else if (event.key === '1') {
                setBackgroundFadeColor(LONG_TAIL_FADE_COLOR);
            } else if (event.key === '0') {
                setBackgroundFadeColor(NORMAL_FADE_COLOR);
            } else if (event.key === 'g') {
                if (gifStatus !== 'idle') {
                    console.warn('Cannot start recording, current status:', gifStatus);
                    return;
                }
                 if (typeof GIF === 'undefined') {
                    console.error("GIF library not loaded. Cannot record.");
                    alert("GIF library could not be loaded from the internet. Recording is disabled.");
                    return;
                }
                
                console.log(`Starting GIF recording for ${GIF_DURATION / 1000} seconds...`);
                setGifStatus('recording');

                const gif = new GIF({
                    workers: 2,
                    quality: 10, // Lower is better quality
                    workerScript: 'https://esm.sh/gif.js.optimized/dist/gif.worker.js'
                });

                gif.on('finished', (blob: Blob) => {
                    console.log('GIF rendering finished, preparing download.');
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'wuslon.gif';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    gifRecorderRef.current = null;
                    setGifStatus('idle');
                });

                gifRecorderRef.current = gif;

                setTimeout(() => {
                    if (gifRecorderRef.current) {
                        console.log('Recording time finished, rendering GIF...');
                        setGifStatus('rendering');
                        gifRecorderRef.current.render();
                    } else {
                        setGifStatus('idle');
                    }
                }, GIF_DURATION);
            }
        };

        const handleWheel = (event: WheelEvent) => {
            event.preventDefault();
            if (event.deltaY < 0) {
                setRadius(prev => prev + RADIUS_STEP);
            } else {
                setRadius(prev => Math.max(MIN_RADIUS, prev - RADIUS_STEP));
            }
        };

        const handleMouseMove = (event: MouseEvent) => {
            mousePosRef.current = { x: event.clientX, y: event.clientY };
        };
        
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('wheel', handleWheel, { passive: false });
        window.addEventListener('mousemove', handleMouseMove);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('wheel', handleWheel);
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, [gifStatus]); // Re-run effect if gifStatus changes to avoid stale closure

    // Main animation and drawing loop effect
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx) return;

        const resizeCanvas = () => {
            if (canvas) {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
            }
        };
        resizeCanvas();

        const animate = () => {
            circlePosRef.current.x += (mousePosRef.current.x - circlePosRef.current.x) * EASING_FACTOR;
            circlePosRef.current.y += (mousePosRef.current.y - circlePosRef.current.y) * EASING_FACTOR;

            ctx.fillStyle = backgroundFadeColor;
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

            const shakeX = (Math.random() - 0.5) * SHAKE_INTENSITY * 2;
            const shakeY = (Math.random() - 0.5) * SHAKE_INTENSITY * 2;

            ctx.shadowBlur = GLOW_BLUR;
            ctx.shadowColor = CIRCLE_COLOR;

            ctx.fillStyle = CIRCLE_COLOR;
            ctx.beginPath();
            ctx.arc(
                circlePosRef.current.x + shakeX, 
                circlePosRef.current.y + shakeY, 
                radius, 
                0, 
                Math.PI * 2
            );
            ctx.fill();
            
            ctx.shadowBlur = 0;

            if (gifStatus === 'recording' && gifRecorderRef.current) {
                gifRecorderRef.current.addFrame(ctx.canvas, { copy: true, delay: 16 }); // ~60fps
            }

            animationFrameId.current = requestAnimationFrame(animate);
        };

        animate();

        window.addEventListener('resize', resizeCanvas);

        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
            window.removeEventListener('resize', resizeCanvas);
        };
    }, [radius, backgroundFadeColor, gifStatus]);

    const renderGifStatus = () => {
        switch (gifStatus) {
            case 'recording':
                return <div style={{ color: '#ff5555', marginTop: '5px' }}>RECORDING... ({GIF_DURATION/1000}s)</div>;
            case 'rendering':
                return <div style={{ color: '#f0ad4e', marginTop: '5px' }}>RENDERING GIF... Please wait.</div>;
            default:
                return null;
        }
    }

    return (
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0 }} />
          <div style={{
              position: 'absolute',
              bottom: '10px',
              left: '10px',
              color: 'rgba(255, 255, 255, 0.7)',
              fontFamily: 'monospace',
              fontSize: '14px',
              pointerEvents: 'none'
          }}>
              <div>Radius: {radius} ([+]/[-])</div>
              <div>Tail: {backgroundFadeColor === NORMAL_FADE_COLOR ? 'Normal' : 'Long'} ([0]/[1])</div>
              <div>Record GIF: [g]</div>
              {renderGifStatus()}
          </div>
      </div>
    );
};

export default App;
