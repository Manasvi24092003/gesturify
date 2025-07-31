# Import necessary libraries
from flask import Flask, request, jsonify # Flask for the web server
from flask_cors import CORS             # To allow requests from the browser
import pyautogui                       # To simulate keyboard presses

# Initialize the Flask web application
app = Flask(__name__)
# Enable CORS to allow the frontend (on localhost:8000) to talk to this backend (on localhost:5000)
CORS(app)

# This dictionary is the core logic of the backend. It maps the gesture
# names received from the frontend to the actual keyboard keys that
# pyautogui will press. These are standard media keys.
GESTURE_TO_KEY = {
    'Thumbs Up': 'space',
    'Open Palm': 'space',
    'Point': 'nexttrack',
    'Two Fingers': 'prevtrack',
    'Shaka': 'volumeup',
    'Point Down': 'volumedown',
    'Fist': 'stop'
}

# This defines the API endpoint. It only accepts POST requests at the /command URL.
@app.route('/command', methods=['POST'])
def handle_command():
    try:
        # Get the JSON data sent from the frontend
        data = request.get_json()
        gesture = data.get('gesture') # Extract the gesture name

        # If a gesture was found in the data...
        if gesture in GESTURE_TO_KEY:
            key_to_press = GESTURE_TO_KEY[gesture] # Look up the key to press
            pyautogui.press(key_to_press)          # Press the key!
            # Send a success message back to the frontend
            return jsonify({"status": "success", "command_executed": key_to_press})
        else:
            # If the gesture isn't in our dictionary, ignore it
            return jsonify({"status": "ignored", "message": "No action for this gesture"})

    except Exception as e:
        # If any other error occurs, send back an error message
        return jsonify({"status": "error", "message": str(e)}), 500

# This standard Python block ensures the server only runs when the script is executed directly
if __name__ == '__main__':
    # Run the server on host 0.0.0.0 (accessible on your local network) and port 5000
    app.run(host='0.0.0.0', port=5000)