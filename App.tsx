
import React, { useState, useRef, useEffect, useCallback } from 'react';
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
type FacingMode = 'user' | 'environment';

const App: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    
    const [radius, setRadius] = useState(INITIAL_RADIUS);
    const [backgroundFadeColor, setBackgroundFadeColor] = useState(NORMAL_FADE_COLOR);
    const [gifStatus, setGifStatus] = useState<GifStatus>('idle');
    const [isPulsating, setIsPulsating] = useState(false);
    
    // State for AR and device detection
    const [isArMode, setIsArMode] = useState(false);
    const [cameraFacingMode, setCameraFacingMode] = useState<FacingMode>('environment');
    const [isTouchDevice, setIsTouchDevice] = useState(false);


    const circlePosRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
    const mousePosRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
    const animationFrameId = useRef<number | null>(null);
    const gifRecorderRef = useRef<any | null>(null);
    const lastPinchDistance = useRef<number | null>(null);

    const startGifRecording = useCallback(async () => {
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
    }, [gifStatus]);
    
    // Effect for input event listeners
    useEffect(() => {
        // Detect if it's a touch device on mount
        setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === '+' || event.key === '=') setRadius(r => r + RADIUS_STEP);
            else if (event.key === '-') setRadius(r => Math.max(MIN_RADIUS, r - RADIUS_STEP));
            else if (event.key === '1') setBackgroundFadeColor(LONG_TAIL_FADE_COLOR);
            else if (event.key === '0') setBackgroundFadeColor(NORMAL_FADE_COLOR);
            else if (event.key === '3') setIsPulsating(p => !p);
            else if (event.key === 'g') startGifRecording();
        };

        const handleWheel = (event: WheelEvent) => {
            event.preventDefault();
            if (event.deltaY < 0) setRadius(r => r + RADIUS_STEP);
            else setRadius(r => Math.max(MIN_RADIUS, r - RADIUS_STEP));
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
            if (event.touches.length > 0) mousePosRef.current = { x: event.touches[0].clientX, y: event.touches[0].clientY };
            if (event.touches.length === 2) {
                event.preventDefault();
                lastPinchDistance.current = getPinchDistance(event.touches);
            }
        };

        const handleTouchMove = (event: TouchEvent) => {
            event.preventDefault();
            if (event.touches.length > 0) mousePosRef.current = { x: event.touches[0].clientX, y: event.touches[0].clientY };
            if (event.touches.length === 2 && lastPinchDistance.current !== null) {
                const newDist = getPinchDistance(event.touches);
                const diff = newDist - lastPinchDistance.current;
                setRadius(r => Math.max(MIN_RADIUS, r + diff * PINCH_SENSITIVITY));
                lastPinchDistance.current = newDist;
            }
        };

        const handleTouchEnd = (event: TouchEvent) => {
             if (event.touches.length < 2) lastPinchDistance.current = null;
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
    }, [startGifRecording]);

    // Effect for camera management in AR mode
    useEffect(() => {
        const stopStream = () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }
        };

        if (isArMode) {
            const constraints = { video: { facingMode: cameraFacingMode } };
            navigator.mediaDevices.getUserMedia(constraints)
                .then(stream => {
                    streamRef.current = stream;
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                    }
                })
                .catch(err => {
                    console.error("Error accessing camera:", err);
                    alert("Could not access camera. Please check permissions and try again.");
                    setIsArMode(false);
                });
        } else {
            stopStream();
        }

        return () => stopStream();
    }, [isArMode, cameraFacingMode]);


    // Effect for canvas animation
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

            // AR background or normal background
            if (isArMode && videoRef.current && videoRef.current.readyState >= 2) {
                ctx.drawImage(videoRef.current, 0, 0, ctx.canvas.width, ctx.canvas.height);
            } else {
                ctx.fillStyle = backgroundFadeColor;
                ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            }

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
            if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
            window.removeEventListener('resize', resizeCanvas);
        };
    }, [radius, backgroundFadeColor, gifStatus, isPulsating, isArMode]);

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

    const buttonStyle: React.CSSProperties = {
        padding: '8px 12px',
        margin: '5px',
        fontSize: '14px',
        color: 'white',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        border: '1px solid rgba(255, 255, 255, 0.5)',
        borderRadius: '5px',
        cursor: 'pointer',
    };
    
    const inlineButtonStyle: React.CSSProperties = {
        ...buttonStyle,
        padding: '2px 8px',
        margin: '0 4px',
        minWidth: '30px'
    };
    
    const controlRowStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        marginBottom: '5px'
    };

    return (
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, zIndex: 1 }} />
          <video ref={videoRef} autoPlay playsInline style={{ display: 'none' }} />
          
          <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 2, display: 'flex' }}>
              <button style={buttonStyle} onClick={() => setIsArMode(a => !a)}>{isArMode ? 'Exit' : 'Enter'} AR</button>
              {isArMode && <button style={buttonStyle} onClick={() => setCameraFacingMode(m => m === 'user' ? 'environment' : 'user')}>Switch Cam</button>}
          </div>

          <div style={{
              position: 'absolute',
              bottom: '10px',
              left: '10px',
              color: 'rgba(255, 255, 255, 0.9)',
              fontFamily: 'monospace',
              fontSize: '14px',
              textShadow: '1px 1px 3px #000',
              zIndex: 2
          }}>
              <div style={controlRowStyle}>
                  Radius: {Math.round(radius)} 
                  {isTouchDevice ? (
                      <span style={{ marginLeft: '10px'}}>
                          <button style={inlineButtonStyle} onClick={() => setRadius(r => Math.max(MIN_RADIUS, r - RADIUS_STEP))}>-</button>
                          <button style={inlineButtonStyle} onClick={() => setRadius(r => r + RADIUS_STEP)}>+</button>
                      </span>
                  ) : (
                      <span> ([+]/[-])</span>
                  )}
              </div>
              <div style={controlRowStyle}>
                  Tail: {backgroundFadeColor === NORMAL_FADE_COLOR ? 'Normal' : 'Long'}
                  {isTouchDevice ? (
                      <span style={{ marginLeft: '10px'}}>
                          <button style={inlineButtonStyle} onClick={() => setBackgroundFadeColor(NORMAL_FADE_COLOR)}>0</button>
                          <button style={inlineButtonStyle} onClick={() => setBackgroundFadeColor(LONG_TAIL_FADE_COLOR)}>1</button>
                      </span>
                  ) : (
                      <span> ([0]/[1])</span>
                  )}
              </div>
              <div style={controlRowStyle}>
                  Pulsate: {isPulsating ? 'On' : 'Off'}
                  {isTouchDevice ? (
                      <span style={{ marginLeft: '10px'}}>
                          <button style={inlineButtonStyle} onClick={() => setIsPulsating(p => !p)}>Toggle</button>
                      </span>
                  ) : (
                      <span> ([3])</span>
                  )}
              </div>
               <div style={controlRowStyle}>
                  Record GIF
                  {isTouchDevice ? (
                      <span style={{ marginLeft: '10px'}}>
                          <button style={inlineButtonStyle} onClick={startGifRecording}>Start</button>
                      </span>
                  ) : (
                      <span> ([g])</span>
                  )}
              </div>

              <div style={{ marginTop: '10px', color: 'rgba(255, 255, 255, 0.7)', pointerEvents: 'none' }}>
                  Touch: Drag to move, Pinch to resize
              </div>
              {renderGifStatus()}
          </div>
      </div>
    );
};

export default App;
