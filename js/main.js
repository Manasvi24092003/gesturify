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
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        for (let i = 0; i < results.multiHandLandmarks.length; i++) {
            const landmarks = results.multiHandLandmarks[i];
            drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 5 });
            drawLandmarks(canvasCtx, landmarks, { color: '#FF0000', lineWidth: 2 });

            // Use handedness from MediaPipe results if available
            const handedness = results.multiHandedness && results.multiHandedness[i]
                ? results.multiHandedness[i].label
                : 'Right';

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

/**
 * Analyzes hand landmarks to classify the current gesture.
 * @param {Array} landmarks - An array of 21 hand landmark objects.
 * @param {string} handedness - 'Left' or 'Right' hand label from MediaPipe.
 * @returns {string|null} The name of the classified gesture or null if none.
 */
function classifyGesture(landmarks, handedness = 'Right') {
    /**
     * Determines if a finger is extended based on its tip and dip landmark indices.
     * @param {number} tip - The index of the finger tip landmark (e.g., 8 for index finger).
     * @param {number} dip - The index of the finger's distal interphalangeal joint landmark (e.g., 6 for index finger).
     * Uses MediaPipe's hand landmark indices: https://google.github.io/mediapipe/solutions/hands.html
     * @returns {boolean} True if the finger is extended (tip above dip in y-axis).
     */
    const isFingerExtended = (tip, dip) => landmarks[tip].y < landmarks[dip].y;

    // Define finger extension variables before use
    const isIndexExtended = isFingerExtended(8, 6);
    const isMiddleExtended = isFingerExtended(12, 10);
    const isRingExtended = isFingerExtended(16, 14);
    const isPinkyExtended = isFingerExtended(20, 18);

    // Adjust thumb extension logic based on handedness
    let isThumbOut;
    if (handedness === 'Left') {
        isThumbOut = landmarks[4].x > landmarks[3].x;
    } else {
        isThumbOut = landmarks[4].x < landmarks[3].x;
    }

    const areFingersClosed = !isIndexExtended && !isMiddleExtended && !isRingExtended && !isPinkyExtended;

    // Adjust thumbs up logic for handedness
    let isThumbsUp;
    if (handedness === 'Left') {
        // For left hand, thumb tip (4) should be above (y <) and to the right (x >) of thumb joints (3, 2)
        isThumbsUp = areFingersClosed &&
            landmarks[4].y < landmarks[3].y &&
            landmarks[4].y < landmarks[2].y &&
            landmarks[4].x > landmarks[3].x &&
            landmarks[4].x > landmarks[2].x;
    } else {
        // For right hand, thumb tip (4) should be above (y <) and to the left (x <) of thumb joints (3, 2)
        isThumbsUp = areFingersClosed &&
            landmarks[4].y < landmarks[3].y &&
            landmarks[4].y < landmarks[2].y &&
            landmarks[4].x < landmarks[3].x &&
            landmarks[4].x < landmarks[2].x;
    }

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

// --- Start the Application ---
startCamera();
