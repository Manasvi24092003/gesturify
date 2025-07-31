// js/main.js

console.log("Gesturify script started.");

// --- Configurable Server URL ---
const SERVER_URL = window.SERVER_URL || 'http://localhost:5000/command';

// --- DOM Element Selection ---
const videoElement = document.querySelector('.input_video');
const canvasElement = document.querySelector('.output_canvas');
const canvasCtx = canvasElement.getContext('2d');
const gestureDisplay = document.getElementById('gesture-display');
const errorDisplay = document.getElementById('error-display');
const mediaStatus = document.getElementById('media-status');

// --- State Variables ---
let lastGesture = null;
let gestureTimeout = null;

// --- MediaPipe Hands Initialization ---
const hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.6,
    minTrackingConfidence: 0.6
});

hands.onResults(onResults);

// --- Camera Initialization ---
const camera = new Camera(videoElement, {
    onFrame: async () => {
        await hands.send({ image: videoElement });
    },
    width: 1280,
    height: 720
});

// --- Core Functions ---
async function startCamera() {
    try {
        await camera.start();
    } catch (error) {
        console.error("CRITICAL: Failed to start camera.", error);
        if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
            gestureDisplay.classList.add('hidden');
            errorDisplay.classList.remove('hidden');
        }
    }
}

function onResults(results) {
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        for (let i = 0; i < results.multiHandLandmarks.length; i++) {
            const landmarks = results.multiHandLandmarks[i];
            drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 5 });
            drawLandmarks(canvasCtx, landmarks, { color: '#FF0000', lineWidth: 2 });

            const handedness = results.multiHandedness[i]?.label || 'Right';
            const gesture = classifyGesture(landmarks, handedness);
            gestureDisplay.textContent = gesture || 'No Gesture';

            if (gesture) {
                handleGesture(gesture);
            }
        }
    } else {
        gestureDisplay.textContent = 'No Hand Detected';
    }
    canvasCtx.restore();
}

function classifyGesture(landmarks, handedness) {
    const isFingerExtended = (tip, dip) => landmarks[tip].y < landmarks[dip].y;

    const isIndexExtended = isFingerExtended(8, 6);
    const isMiddleExtended = isFingerExtended(12, 10);
    const isRingExtended = isFingerExtended(16, 14);
    const isPinkyExtended = isFingerExtended(20, 18);
    const areFingersClosed = !isIndexExtended && !isMiddleExtended && !isRingExtended && !isPinkyExtended;

    const isThumbOut = (handedness === 'Left')
        ? landmarks[4].x > landmarks[3].x
        : landmarks[4].x < landmarks[3].x;

    const isThumbsUp = areFingersClosed && (landmarks[4].y < landmarks[2].y);
    if (isThumbsUp) return 'Thumbs Up';
    if (isIndexExtended && isMiddleExtended && isRingExtended && isPinkyExtended) return 'Open Palm';
    if (isIndexExtended && isMiddleExtended && !isRingExtended && !isPinkyExtended) return 'Two Fingers';
    if (isThumbOut && !isIndexExtended && !isMiddleExtended && !isRingExtended && isPinkyExtended) return 'Shaka';
    if (isIndexExtended && !isMiddleExtended && !isRingExtended && !isPinkyExtended) return 'Point';
    
    const isIndexPointingDown = landmarks[8].y > landmarks[6].y;
    if (isIndexPointingDown && !isMiddleExtended && !isRingExtended && !isPinkyExtended) return 'Point Down';

    if (areFingersClosed) return 'Fist';
    
    return null;
}

function handleGesture(gesture) {
    if (gesture === lastGesture) return;

    clearTimeout(gestureTimeout);
    lastGesture = gesture;
    
    console.log(`Recognized gesture: ${gesture}, sending command.`);
    sendCommandToPython(gesture);

    gestureTimeout = setTimeout(() => { lastGesture = null; }, 1000);
}

async function sendCommandToPython(gesture) {
    try {
        const response = await fetch(SERVER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ gesture: gesture })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const result = await response.json();
        
        if(result.status === 'success') {
            mediaStatus.textContent = `Command Sent: ${gesture} (${result.command_executed})`;
        } else {
            mediaStatus.textContent = `Gesture Ignored: ${gesture}`;
        }

    } catch (error) {
        console.error("Could not send command to Python server:", error);
        mediaStatus.textContent = "Error: Cannot connect to Python server.";
    }
}

startCamera();
