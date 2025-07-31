# gesturify_server.py
#
# This script runs a simple Flask web server that listens for gesture commands
# from the frontend. It uses the pyautogui library to simulate key presses
# to control media applications (like Spotify, VLC) and system volume.

from flask import Flask, request, jsonify
from flask_cors import CORS
import pyautogui

# Initialize the Flask application
app = Flask(__name__)

# Enable Cross-Origin Resource Sharing (CORS). This is crucial to allow the
# JavaScript frontend (running on a file:// or different domain) to send

# requests to this server.
CORS(app)

# --- Gesture to Keyboard Mapping ---
# This dictionary maps the recognized gesture names to specific keyboard keys.
# pyautogui can press standard media keys recognized by most operating systems.
# You can customize these to your preference.
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
        # Get the JSON data from the incoming request
        data = request.get_json()
        gesture = data.get('gesture')

        # Basic validation to ensure a gesture was provided
        if not gesture:
            print("Error: Received request with no gesture data.")
            return jsonify({"status": "error", "message": "Gesture not provided"}), 400

        print(f"Received gesture: '{gesture}'")

        # Check if the received gesture is one we have a defined action for
        if gesture in GESTURE_TO_KEY:
            key_to_press = GESTURE_TO_KEY[gesture]
            
            # Use pyautogui to simulate the key press
            pyautogui.press(key_to_press)
            
            print(f"Executed command: Pressed '{key_to_press}' key.")
            return jsonify({"status": "success", "command_executed": key_to_press})
        else:
            # If the gesture is not in our map, we ignore it but log it.
            print(f"Ignored: No action defined for gesture '{gesture}'.")
            return jsonify({"status": "ignored", "message": "No action defined for this gesture"})

    except Exception as e:
        # General error handler for any other issues
        print(f"An unexpected error occurred: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

# This block ensures the server runs only when the script is executed directly
if __name__ == '__main__':
    print("--- Gesturify Python Server ---")
    print("Starting server on http://localhost:5000")
    print("Listening for gesture commands...")
    print("Make sure your media player (Spotify, VLC, etc.) is the active window.")
    
    # Run the Flask app. host='0.0.0.0' makes it accessible from the network.
    app.run(host='0.0.0.0', port=5000)
