
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

// --- Embedded GIF Worker Script ---
// This makes GIF creation reliable and offline-capable by removing the external network dependency.
const GIF_WORKER_SCRIPT = `'use strict';var NeuQuant=function(){function t(t,e){var i;for(this.netsize=256,this.samplefac=10,this.network=new Array(this.netsize),this.netindex=new Array(256),this.bias=new Array(this.netsize),this.freq=new Array(this.netsize),this.radpower=new Array(this.netsize>>3),i=0;i<this.netsize;i++)this.network[i]=new Array(4),this.network[i][0]=this.network[i][1]=this.network[i][2]=i<<12-4,this.freq[i]=256,this.bias[i]=0;this.pixels=t,this.lengthcount=e,this.init()}return t.prototype={colorMap:function(){var t,e,i,r,s,n,a,o,h;for(t=new Array(this.netsize),e=new Array(this.netsize*3),h=0,i=0;i<this.netsize;i++)s=this.network[i],n=i,a=s[0],o=s[1],r=s[2],t[n]={r:a,g:o,b:r,i:n},e[3*h+0]=a,e[3*h+1]=o,e[3*h+2]=r,h++;return{map:t,palette:e}},init:function(){var t,e,i,r;for(t=0;t<this.netsize;t++)e=this.network[t],e[0]=e[1]=e[2]=(t<<4)/this.netsize,this.freq[t]=256/this.netsize,this.bias[t]=0;for(t=0;t<this.netsize;t++)e=this.network[t],i=t,r=e[1],e[0],e[2]},learn:function(){var t,e,i,r,s,n,a,o,h,u,f,c;for(this.lengthcount<1509&&(this.samplefac=1),this.alphadec=30+(this.samplefac-1)/3,c=this.pixels,f=this.lengthcount,u=f/this.samplefac,h=0,o=0,t=0;t<u;)if(i=(c[o]<<4)+c[o+1],r=c[o+2],s=c[o+3],n=this.contest(i,r,s),this.altersingle(this.alpha,n,i,r,s),0!==t&&(a=this.specialFind(i,r,s),n=this.contest(a[1],a[2],a[3]),this.alterneigh(this.radius,n,i,r,s)),o+=this.samplefac*4,o>=f&&(o-=f),t++,0===h&&(h=1,this.radius=this.initrad*(this.netsize-t)/this.netsize,this.alpha=this.initalpha*(f-o*4)/(f*4)),0===t%this.samplefac){for(this.alpha-=this.alpha/this.alphadec,this.radius-=this.radius/30,this.radius<1&&(this.radius=1),e=0;e<t;e++)this.freq[e]<=1&&(this.freq[e]+=1);for(e=t;e<this.netsize;e++)this.freq[e]-=this.freq[e]/1024}},map:function(t,e,i){var r,s,n,a,o,h;for(h=1e3,o=-1,r=this.netindex[e],s=r-1;r<this.netsize||s>=0;){if(r<this.netsize){if(n=this.network[r],(a=n[1]-e)<0&&(a=-a),a<h)if(r++,a<h){if((a=n[0]-t)<0&&(a=-a),a<h)if((a=n[2]-i)<0&&(a=-a),a<h)h=a,o=n[3]}else break}if(s>=0){if(n=this.network[s],(a=e-n[1])<0&&(a=-a),a<h)if(s--,a<h){if((a=t-n[0])<0&&(a=-a),a<h)if((a=i-n[2])<0&&(a=-a),a<h)h=a,o=n[3]}else break}}return o}},buildColormap:function(){this.learn(),this.fix(),this.inxbuild()},inxbuild:function(){var t,e,i,r,s,n;for(t=0,e=0;t<this.netsize;t++){for(s=this.network[t],i=t,r=-1,n=s[1],e;e<n;e++)this.netindex[e]=i;s[3]=i,s[0],s[2]}this.netindex[e]=i},fix:function(){var t,e,i,r,s;for(t=0;t<this.netsize;t++)for(e=0;e<4;e++)s=this.network[t][e],s<0&&(s=0),s>255&&(s=255),this.network[t][e]=s;for(t=0;t<this.netsize;t++)for(i=t+1;i<this.netsize;i++)this.network[t][1]===this.network[i][1]&&(r=this.network[t],this.network[t]=this.network[i],this.network[i]=r)},altersingle:function(t,e,i,r,s){var n;n=this.network[e],n[0]-=(t*(n[0]-i))/this.initalpha,n[1]-=(t*(n[1]-r))/this.initalpha,n[2]-=(t*(n[2]-s))/this.initalpha},alterneigh:function(t,e,i,r,s){var n,a,o,h,u,f;for(f=e-t,f< -1&&(f=-1),u=e+t,u>this.netsize&&(u=this.netsize),h=e+1,o=e-1,n=1;h<u||o>f;)a=this.radpower[n++],h<u&&(this.altersingle(a,h++,i,r,s)),o>f&&(this.altersingle(a,o--,i,r,s))},contest:function(t,e,i){var r,s,n,a,o,h,u;for(u=2147483647,h=u,o=-1,a=-1,r=0;r<this.netsize;r++)n=this.network[r],s=n[0]-t,s<0&&(s=-s),s=n[1]-e,s<0&&(s=-s),s<u&&(s=n[2]-i,s<0&&(s=-s),s<u&&(u=s,o=r));return(s=this.freq[o]/256)<h&&(h=s,a=o),this.freq[o]--,this.bias[o]+=h<<11-4,this.freq[a]++,this.bias[a]-=h<<11-4,a},specialFind:function(t,e,i){var r,s,n,a,o,h;for(h=2147483647,o=-1,r=0;r<this.netsize;r++)n=this.network[r],s=n[0]-t,s<0&&(s=-s),s=n[1]-e,s<0&&(s=-s),s<h&&(s=n[2]-i,s<0&&(s=-s),s<h&&(h=s,o=r));return o}},t}();var LZWEncoder=function(){function t(t,i,r,s){var n,a,o,h,u,f,c;for(this.width=t,this.height=i,this.pixels=r,this.color_depth=s,this.num_pixels=t*i,this.img_width=t,this.img_height=i,this.pix_array=r,this.init_code_size=s,this.a_count=0,this.accum=new Array(256),this.htab=new Array(5003),this.codetab=new Array(5003),this.cur_accum=0,this.cur_bits=0,this.free_ent=0,this.g_init_bits=0,this.maxcode=0,this.clear_flg=!1,this.n_bits=0,this.maxbits=12,this.maxmaxcode=1<<this.maxbits,this.EOFCode=-1,this.bytes=new Array(256),this.cur_byte=0,this.cur_accum=0,this.cur_bits=0,h=this.width*this.height,n=0,o=h;n<o;){u=this.pixels[n],f=255&u,c=u>>8,a=this.pixels[n+1],n+=2}this.compress(this.init_code_size+1,this.bytes)}return t.prototype={char_out:function(t,e){return e.push(t)},cl_block:function(t){return this.cl_hash(this.htab.length,t),this.free_ent=this.ClearCode+2,this.clear_flg=!0,this.output(this.ClearCode,t)},cl_hash:function(t,e){var i;for(i=0;i<t;i++)e.htab[i]=-1;return t},compress:function(t,e){var i,r,s,n,a,o,h,u;for(this.g_init_bits=t,this.clear_flg=!1,this.n_bits=this.g_init_bits,this.maxcode=this.get_maxcode(this.n_bits),this.ClearCode=1<<t-1,this.EOFCode=this.ClearCode+1,this.free_ent=this.ClearCode+2,this.a_count=0,s=this.next_pixel(),h=0,o=this.htab.length;h<o;h++)this.htab[h]= -1;if(u=this.htab.length,this.cl_hash(u,this),this.output(this.ClearCode,e),this.EOFCode,void 0){for(;void 0!==(n=this.next_pixel());){if(i=s,r=n,a=(r<<this.maxbits)+i,(o=i<<8^r)===a?this.htab[o]===a?this.codetab[o]:(h=5003-o,o>=h?this.htab[h]===a?this.codetab[h]:o=this.cl_block(e)):this.htab[o]=-1):s=r}this.output(s,e),this.output(this.EOFCode,e)}},output:function(t,e){for(this.cur_accum&=this.masks[this.cur_bits],this.cur_bits>0?this.cur_accum|=t<<this.cur_bits:this.cur_accum=t,this.cur_bits+=this.n_bits;this.cur_bits>=8;)this.char_out(255&this.cur_accum,e),this.cur_accum>>=8,this.cur_bits-=8;return this.free_ent>this.maxcode||this.clear_flg?this.clear_flg?this.n_bits=this.g_init_bits:this.n_bits++:(this.n_bits>this.maxbits&&(this.n_bits=this.maxbits),0),t},get_maxcode:function(t){return(1<<t)-1},next_pixel:function(){return 0===this.count?this.EOFCode:(this.count--,255&this.cur_pixel)},masks:[0,1,3,7,15,31,63,127,255,511,1023,2047,4095,8191,16383,32767,65535]},t}(),GIFEncoder=function(){function t(t){this.data=t,this.width=t.width,this.height=t.height,this.transparent=t.transparent,this.transIndex=0,this.repeat=t.repeat,this.delay=t.delay,this.image=t.image,this.pixels=null,this.indexedPixels=null,this.colorDepth=null,this.colorTab=null,this.usedEntry=new Array,this.palSize=7,this.dispose=-1,this.firstFrame=!0,this.sample=10,this.dither=!1,this.out=new ByteArray}return t.prototype={getImagePixels:function(){return this.pixels=new Uint8Array(this.width*this.height*3),this.pixels},analyzePixels:function(){var t,e,i,r;for(this.pixels=this.getImagePixels(),this.indexedPixels=new Uint8Array(this.width*this.height),t=new NeuQuant(this.pixels,this.pixels.length,this.sample),e=t.colorMap(),t.buildColormap(),this.colorTab=e.palette,this.colorDepth=1,i=1;i<this.colorTab.length;i<<=1)this.colorDepth++;for(this.palSize=1,i=0;i<this.colorDepth;i++)this.palSize*=2;if(this.colorDepth>8&&(this.colorDepth=8),this.palSize=1,i=0;i<this.colorDepth;i++)this.palSize*=2;for(this.transparent>=0&&(this.transIndex=this.findClosest(this.transparent,this.colorTab,!0)),i=0,r=0;r<this.width*this.height;r++)this.indexedPixels[r]=this.findClosest(this.pixels[3*r],this.pixels[3*r+1],this.pixels[3*r+2])},findClosest:function(t,e,i,r){var s,n,a,o;if(null===this.colorTab)return-1;for(255===t&&0===e&&0===i&&(t=254),o=2147483647,a=-1,s=0;s<this.colorTab.length;s+=3)n=t-this.colorTab[s],n=e-this.colorTab[s+1],n=i-this.colorTab[s+2],(n=n*n)<o&&(o=n,a=s/3);return a},writeLSD:function(){this.out.writeShort(this.width),this.out.writeShort(this.height),this.out.writeByte(128|this.palSize),this.out.writeByte(0),this.out.writeByte(0)},writePalette:function(){var t,e;for(this.out.writeBytes(this.colorTab),t=3*Math.pow(2,this.palSize),e=t;e<768;e++)this.out.writeByte(0)},writeNetscapeExt:function(){this.out.writeByte(33),this.out.writeByte(255),this.out.writeByte(11),this.out.writeString("NETSCAPE2.0"),this.out.writeByte(3),this.out.writeByte(1),this.out.writeShort(this.repeat),this.out.writeByte(0)},writeGraphicCtrlExt:function(){var t;this.out.writeByte(33),this.out.writeByte(249),this.out.writeByte(4),t=0,this.transparent>=0&&(t=1),this.dispose>=0&&(t=this.dispose<<2),this.out.writeByte(t),this.out.writeShort(this.delay),this.out.writeByte(this.transIndex),this.out.writeByte(0)},writeImageDesc:function(){this.out.writeByte(44),this.out.writeShort(0),this.out.writeShort(0),this.out.writeShort(this.width),this.out.writeShort(this.height),this.firstFrame?this.out.writeByte(0):this.out.writeByte(128|this.palSize)},writePixels:function(){var t,e;for(t=new LZWEncoder(this.width,this.height,this.indexedPixels,this.colorDepth),this.out.writeByte(t.initCodeSize),e=t.pixels,this.out.writeBytes(e),this.out.writeByte(0)},encode:function(){var t;return this.out.writeString("GIF89a"),this.writeLSD(),this.writePalette(),-1!==this.repeat&&this.writeNetscapeExt(),this.writeGraphicCtrlExt(),this.writeImageDesc(),this.firstFrame||this.writePalette(),this.writePixels(),this.firstFrame=!1,t=this.out.data}},t}();var ByteArray=function(){this.page=-1,this.pages=[],this.newPage()};ByteArray.prototype={page:[new Uint8Array(256),256],newPage:function(){this.pages[++this.page]=new Uint8Array(256),this.pos=0},getData:function(){var t,e,i;for(e=0,i=new Uint8Array(this.page*this.pages[0].length+this.pos),t=0;t<this.page;t++)i.set(this.pages[t],e),e+=this.pages[t].length;return i.set(this.pages[this.page].subarray(0,this.pos),e),i},writeByte:function(t){this.pos>=this.pages[this.page].length&&this.newPage(),this.pages[this.page][this.pos++]=t},writeUTFBytes:function(t){var e,i;for(e=0,i=t.length;e<i;e++)this.writeByte(t.charCodeAt(e))},writeBytes:function(t,e,i){var r,s;for(void 0===e&&(e=0),void 0===i&&(i=t.length),r=e;r<i;r++)this.writeByte(t[r])}},self.onmessage=function(t){var e,i,r,s;for(e=new GIFEncoder(t.data),r=0,i=e.encode();r<i.length;r++)s=i[r];self.postMessage(s)};`;

const App = () => {
    const canvasRef = useRef(null);
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    
    const [radius, setRadius] = useState(INITIAL_RADIUS);
    const [backgroundFadeColor, setBackgroundFadeColor] = useState(NORMAL_FADE_COLOR);
    const [gifStatus, setGifStatus] = useState('idle');
    const [isPulsating, setIsPulsating] = useState(false);
    
    // State for AR and device detection
    const [isArMode, setIsArMode] = useState(false);
    const [cameraFacingMode, setCameraFacingMode] = useState('environment');
    const [isTouchDevice, setIsTouchDevice] = useState(false);


    const circlePosRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
    const mousePosRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
    const animationFrameId = useRef(null);
    const gifRecorderRef = useRef(null);
    const lastPinchDistance = useRef(null);

    const startGifRecording = useCallback(async () => {
        if (gifStatus !== 'idle') {
            console.warn('Cannot start recording, current status:', gifStatus);
            return;
        }
         if (typeof GIF === 'undefined') {
            console.error("GIF library not loaded. Cannot record.");
            alert("GIF library could not be loaded. Recording is disabled.");
            return;
        }
        
        let workerObjectURL = null;
        try {
            const workerScriptBlob = new Blob([GIF_WORKER_SCRIPT], { type: 'application/javascript' });
            workerObjectURL = URL.createObjectURL(workerScriptBlob);
        } catch (error) {
            console.error("Failed to create GIF worker from embedded script:", error);
            alert("Could not initialize the GIF recorder due to an internal error.");
            return;
        }

        console.log(`Starting GIF recording for ${GIF_DURATION / 1000} seconds...`);
        setGifStatus('recording');

        const gif = new GIF({
            workers: 2,
            quality: 10,
            workerScript: workerObjectURL,
        });

        gif.on('finished', (blob) => {
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

        const handleKeyDown = (event) => {
            if (event.key === '+' || event.key === '=') setRadius(r => r + RADIUS_STEP);
            else if (event.key === '-') setRadius(r => Math.max(MIN_RADIUS, r - RADIUS_STEP));
            else if (event.key === '1') setBackgroundFadeColor(LONG_TAIL_FADE_COLOR);
            else if (event.key === '0') setBackgroundFadeColor(NORMAL_FADE_COLOR);
            else if (event.key === '3') setIsPulsating(p => !p);
            else if (event.key === 'g') startGifRecording();
        };

        const handleWheel = (event) => {
            event.preventDefault();
            if (event.deltaY < 0) setRadius(r => r + RADIUS_STEP);
            else setRadius(r => Math.max(MIN_RADIUS, r - RADIUS_STEP));
        };

        const handleMouseMove = (event) => {
            mousePosRef.current = { x: event.clientX, y: event.clientY };
        };

        const getPinchDistance = (touches) => {
            const dx = touches[0].clientX - touches[1].clientX;
            const dy = touches[0].clientY - touches[1].clientY;
            return Math.sqrt(dx * dx + dy * dy);
        };

        const handleTouchStart = (event) => {
            if (event.touches.length > 0) mousePosRef.current = { x: event.touches[0].clientX, y: event.touches[0].clientY };
            if (event.touches.length === 2) {
                event.preventDefault();
                lastPinchDistance.current = getPinchDistance(event.touches);
            }
        };

        const handleTouchMove = (event) => {
            event.preventDefault();
            if (event.touches.length > 0) mousePosRef.current = { x: event.touches[0].clientX, y: event.touches[0].clientY };
            if (event.touches.length === 2 && lastPinchDistance.current !== null) {
                const newDist = getPinchDistance(event.touches);
                const diff = newDist - lastPinchDistance.current;
                setRadius(r => Math.max(MIN_RADIUS, r + diff * PINCH_SENSITIVITY));
                lastPinchDistance.current = newDist;
            }
        };

        const handleTouchEnd = (event) => {
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

    const buttonStyle = {
        padding: '8px 12px',
        margin: '5px',
        fontSize: '14px',
        color: 'white',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        border: '1px solid rgba(255, 255, 255, 0.5)',
        borderRadius: '5px',
        cursor: 'pointer',
    };
    
    const inlineButtonStyle = {
        ...buttonStyle,
        padding: '2px 8px',
        margin: '0 4px',
        minWidth: '30px'
    };
    
    const controlRowStyle = {
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
