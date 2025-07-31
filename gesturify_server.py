# gesturify_server.py
#
# This script runs a Flask web server that listens for gesture commands
# from the frontend. It uses pyautogui to simulate key presses, allowing
# gesture-based control over desktop media applications and system volume.

from flask import Flask, request, jsonify
from flask_cors import CORS
import pyautogui

# Initialize the Flask application
app = Flask(__name__)

# Enable Cross-Origin Resource Sharing (CORS) to allow the JavaScript
# frontend (running on a different port) to send requests to this server.
CORS(app)

# --- Gesture to Keyboard Mapping ---
# This dictionary maps gesture names to specific keyboard keys.
# These are standard media keys recognized by most operating systems.
GESTURE_TO_KEY = {
    'Thumbs Up': 'space',        # Play/Pause media
    'Open Palm': 'space',        # Play/Pause media (alternative)
    'Point': 'nexttrack',        # Go to the next track
    'Two Fingers': 'prevtrack',    # Go to the previous track
    'Shaka': 'volumeup',       # Increase system volume
    'Point Down': 'volumedown',   # Decrease system volume
    'Fist': 'stop'             # Stop media (less common)
}

@app.route('/command', methods=['POST'])
def handle_command():
    """
    API endpoint to receive gesture commands.
    It expects a JSON payload with a "gesture" key.
    """
    try:
        data = request.get_json()
        gesture = data.get('gesture')

        if not gesture:
            print("Error: Received request with no gesture data.")
            return jsonify({"status": "error", "message": "Gesture not provided"}), 400

        print(f"Received gesture: '{gesture}'")

        if gesture in GESTURE_TO_KEY:
            key_to_press = GESTURE_TO_KEY[gesture]
            pyautogui.press(key_to_press)
            print(f"Executed command: Pressed '{key_to_press}' key.")
            return jsonify({"status": "success", "command_executed": key_to_press})
        else:
            print(f"Ignored: No action defined for gesture '{gesture}'.")
            return jsonify({"status": "ignored", "message": "No action defined for this gesture"})

    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    print("--- Gesturify Python Server ---")
    print("Starting server on http://localhost:5000")
    print("Listening for gesture commands...")
    print("Make sure your media player (Spotify, VLC, etc.) is the active window.")
    app.run(host='0.0.0.0', port=5000)
