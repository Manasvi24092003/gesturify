// js/main.js (with extra debugging)

console.log("Gesturify script started.");

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
console.log("Initializing MediaPipe Hands...");
const hands = new Hands({
    locateFile: (file) => {
        console.log(`Locating MediaPipe file: ${file}`);
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
    }
});

// Configuration for the Hands model.
hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.6,
    minTrackingConfidence: 0.6
});

// Set the callback function to run when hand landmarks are detected.
hands.onResults(onResults);
console.log("MediaPipe Hands initialized.");

// --- Camera Initialization ---
console.log("Initializing Camera utility...");
const camera = new Camera(videoElement, {
    onFrame: async () => {
        await hands.send({ image: videoElement });
    },
    width: 1280,
    height: 720
});
console.log("Camera utility initialized.");

// --- Core Functions ---

/**
 * Starts the camera and handles potential permission errors.
 */
async function startCamera() {
    console.log("Attempting to start camera...");
    try {
        await camera.start();
        console.log("Camera started successfully.");
    } catch (error) {
        console.error("CRITICAL: Failed to start camera.", error);
        // If permission is denied, show the error message to the user.
        if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
            gestureDisplay.classList.add('hidden');
            errorDisplay.classList.remove('hidden');
        }
    }
}

/**
 * Callback function executed every time MediaPipe processes a frame.
 * @param {object} results - The hand tracking results from MediaPipe.
 */
function onResults(results) {
    // This log can be spammy, but it's good for checking if MediaPipe is working.
    // console.log("onResults fired."); 
    
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        for (const landmarks of results.multiHandLandmarks) {
            drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 5 });
            drawLandmarks(canvasCtx, landmarks, { color: '#FF0000', lineWidth: 2 });
        }
        
        const gesture = classifyGesture(results.multiHandLandmarks[0]);
        gestureDisplay.textContent = gesture || 'No Gesture';
        
        if (gesture) {
            handleGesture(gesture);
        }
    } else {
        gestureDisplay.textContent = 'No Hand Detected';
    }
    canvasCtx.restore();
}

/**
 * Analyzes hand landmarks to classify the current gesture.
 * @param {Array} landmarks - An array of 21 hand landmark objects.
 * @returns {string|null} The name of the classified gesture or null if none.
 */
function classifyGesture(landmarks) {
    const isFingerExtended = (tip, dip) => landmarks[tip].y < landmarks[dip].y;

    const isIndexExtended = isFingerExtended(8, 6);
    const isMiddleExtended = isFingerExtended(12, 10);
    const isRingExtended = isFingerExtended(16, 14);
    const isPinkyExtended = isFingerExtended(20, 18);
    const isThumbOut = landmarks[4].x < landmarks[3].x; 
    const areFingersClosed = !isIndexExtended && !isMiddleExtended && !isRingExtended && !isPinkyExtended;

    if (areFingersClosed && landmarks[4].y < landmarks[3].y && landmarks[4].y < landmarks[2].y) return 'Thumbs Up';
    if (isIndexExtended && isMiddleExtended && isRingExtended && isPinkyExtended) return 'Open Palm';
    if (isIndexExtended && isMiddleExtended && !isRingExtended && !isPinkyExtended) return 'Two Fingers';
    if (isThumbOut && !isIndexExtended && !isMiddleExtended && !isRingExtended && isPinkyExtended) return 'Shaka';
    if (isIndexExtended && !isMiddleExtended && !isRingExtended && !isPinkyExtended) return 'Point';
    
    const isIndexPointingDown = landmarks[8].y > landmarks[6].y;
    if (isIndexPointingDown && !isMiddleExtended && !isRingExtended && !isPinkyExtended) return 'Point Down';

    if (areFingersClosed) return 'Fist';
    
    return null;
}

/**
 * Processes a recognized gesture, applying a cooldown to prevent spam.
 * @param {string} gesture - The name of the gesture to handle.
 */
function handleGesture(gesture) {
    if (gesture === lastGesture) return;

    clearTimeout(gestureTimeout);
    lastGesture = gesture;
    
    console.log(`Recognized gesture: ${gesture}, sending command.`);
    sendCommandToPython(gesture);

    gestureTimeout = setTimeout(() => { lastGesture = null; }, 1000);
}

/**
 * Sends the recognized gesture to the Python backend server.
 * @param {string} gesture - The name of the gesture to send.
 */
async function sendCommandToPython(gesture) {
    try {
        const response = await fetch('http://localhost:5000/command', {
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

// --- Start the Application ---
startCamera();
