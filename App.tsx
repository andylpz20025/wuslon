
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
const PULSE_AMPLITUDE = 5; // How many pixels the radius will change by
const PULSE_SPEED = 0.005; // Controls the speed of the pulsation
const PINCH_SENSITIVITY = 1; // Controls how sensitive pinch-to-zoom is

type GifStatus = 'idle' | 'recording' | 'rendering' | 'error';

const App: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [radius, setRadius] = useState(INITIAL_RADIUS);
    const [backgroundFadeColor, setBackgroundFadeColor] = useState(NORMAL_FADE_COLOR);
    const [gifStatus, setGifStatus] = useState<GifStatus>('idle');
    const [isPulsating, setIsPulsating] = useState(false);

    const circlePosRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
    const mousePosRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
    const animationFrameId = useRef<number | null>(null);
    const gifRecorderRef = useRef<any | null>(null);
    const lastPinchDistance = useRef<number | null>(null);

    // Effect to set up all window event listeners
    useEffect(() => {
        const handleKeyDown = async (event: KeyboardEvent) => {
            if (event.key === '+' || event.key === '=') {
                setRadius(prev => prev + RADIUS_STEP);
            } else if (event.key === '-') {
                setRadius(prev => Math.max(MIN_RADIUS, prev - RADIUS_STEP));
            } else if (event.key === '1') {
                setBackgroundFadeColor(LONG_TAIL_FADE_COLOR);
            } else if (event.key === '0') {
                setBackgroundFadeColor(NORMAL_FADE_COLOR);
            } else if (event.key === '3') {
                setIsPulsating(prev => !prev);
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
                
                let workerObjectURL: string | null = null;
                try {
                    const workerScriptResponse = await fetch('https://esm.sh/gif.js.optimized/dist/gif.worker.js');
                    if (!workerScriptResponse.ok) throw new Error('Network response was not ok.');
                    const workerScriptBlob = new Blob([await workerScriptResponse.text()], { type: 'application/javascript' });
                    workerObjectURL = URL.createObjectURL(workerScriptBlob);
                } catch (error) {
                    console.error("Failed to fetch or create GIF worker script:", error);
                    alert("Could not initialize the GIF recorder. Please check your internet connection and console for errors.");
                    return;
                }

                console.log(`Starting GIF recording for ${GIF_DURATION / 1000} seconds...`);
                setGifStatus('recording');

                const gif = new GIF({
                    workers: 2,
                    quality: 10,
                    workerScript: workerObjectURL,
                });

                gif.on('finished', (blob: Blob) => {
                    console.log('GIF rendering finished, preparing download.');
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'zini.gif';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    
                    if (workerObjectURL) {
                        URL.revokeObjectURL(workerObjectURL);
                    }
                    
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
                        if (workerObjectURL) {
                            URL.revokeObjectURL(workerObjectURL);
                        }
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

        const getPinchDistance = (touches: TouchList) => {
            const dx = touches[0].clientX - touches[1].clientX;
            const dy = touches[0].clientY - touches[1].clientY;
            return Math.sqrt(dx * dx + dy * dy);
        };

        const handleTouchStart = (event: TouchEvent) => {
            if (event.touches.length > 0) {
                mousePosRef.current = { x: event.touches[0].clientX, y: event.touches[0].clientY };
            }
            if (event.touches.length === 2) {
                event.preventDefault();
                lastPinchDistance.current = getPinchDistance(event.touches);
            }
        };

        const handleTouchMove = (event: TouchEvent) => {
            event.preventDefault();
            if (event.touches.length > 0) {
                mousePosRef.current = { x: event.touches[0].clientX, y: event.touches[0].clientY };
            }
            if (event.touches.length === 2 && lastPinchDistance.current !== null) {
                const newDist = getPinchDistance(event.touches);
                const diff = newDist - lastPinchDistance.current;
                
                setRadius(prev => Math.max(MIN_RADIUS, prev + diff * PINCH_SENSITIVITY));
                
                lastPinchDistance.current = newDist;
            }
        };

        const handleTouchEnd = (event: TouchEvent) => {
             if (event.touches.length < 2) {
                lastPinchDistance.current = null;
            }
        };
        
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('wheel', handleWheel, { passive: false });
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('touchstart', handleTouchStart, { passive: false });
        window.addEventListener('touchmove', handleTouchMove, { passive: false });
        window.addEventListener('touchend', handleTouchEnd);


        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('wheel', handleWheel);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('touchstart', handleTouchStart);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleTouchEnd);
        };
    }, [gifStatus]);

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
            
            const pulseOffset = isPulsating ? Math.sin(Date.now() * PULSE_SPEED) * PULSE_AMPLITUDE : 0;
            const currentRadius = radius + pulseOffset;

            ctx.shadowBlur = GLOW_BLUR;
            ctx.shadowColor = CIRCLE_COLOR;

            ctx.fillStyle = CIRCLE_COLOR;
            ctx.beginPath();
            ctx.arc(
                circlePosRef.current.x + shakeX, 
                circlePosRef.current.y + shakeY, 
                currentRadius, 
                0, 
                Math.PI * 2
            );
            ctx.fill();
            
            ctx.shadowBlur = 0;

            if (gifStatus === 'recording' && gifRecorderRef.current) {
                gifRecorderRef.current.addFrame(ctx.canvas, { copy: true, delay: 16 });
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
    }, [radius, backgroundFadeColor, gifStatus, isPulsating]);

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
              pointerEvents: 'none',
              textShadow: '1px 1px 2px #000',
          }}>
              <div>Radius: {Math.round(radius)} ([+]/[-])</div>
              <div>Tail: {backgroundFadeColor === NORMAL_FADE_COLOR ? 'Normal' : 'Long'} ([0]/[1])</div>
              <div>Pulsate: {isPulsating ? 'On' : 'Off'} ([3])</div>
              <div>Record GIF: [g]</div>
              <div style={{ marginTop: '10px', color: 'rgba(255, 255, 255, 0.6)' }}>
                  Touch: Drag to move, Pinch to resize
              </div>
              {renderGifStatus()}
          </div>
      </div>
    );
};

export default App;
