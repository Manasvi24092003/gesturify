


<div align="center">

# 🖐️ Gesturify - Gesture Controlled Media Player 🎵  
Control your desktop media players with the wave of a hand.

</div>

---

**Gesturify** is a Python and JavaScript application that lets you control applications like **Spotify**, **VLC**, and **YouTube** using hand gestures via your webcam. It's a fun, futuristic way to interact with your computer without touching the keyboard or mouse.

---

## ✨ Features

- **Real-time Hand Tracking**  
  Uses Google's MediaPipe to detect hand landmarks with high accuracy.

- **Multi-Gesture Recognition**  
  Recognizes several distinct hand gestures for a wide range of commands.

- **Handedness Detection**  
  Differentiates between the left and right hand for more precise gesture classification.

- **Desktop Media Control**  
  Sends universal keyboard commands to control the active media application on your computer.

- **Web-Based UI**  
  A clean and simple interface runs in your browser to show the camera feed and gesture information.

---

## 🚀 How It Works

Gesturify uses a **client-server architecture**, creating a bridge between your browser and your desktop.

| Component            | Description                                                                 |
|----------------------|-----------------------------------------------------------------------------|
| **Frontend (Client)** | Runs in your web browser using JavaScript and MediaPipe to detect hand gestures. |
| **Backend (Server)**  | A lightweight Flask server that receives gesture commands and simulates media key presses using `pyautogui`. |

---

## 🛠️ Installation & Setup

### ✅ Prerequisites

- Python 3.7+
- A webcam
- Git

---

### 📥 1. Get the Code

```bash
git clone https://github.com/Manasvi24092003/gesturify.git
cd gesturify
````

---

### 🐍 2. Set up the Python Environment

#### For Windows

```bash
python -m venv venv
venv\Scripts\activate
```

#### For macOS/Linux

```bash
python3 -m venv venv
source venv/bin/activate
```

---

## 📦 3. Install Dependencies

```bash
pip install -r requirements.txt
```

This installs:

* **Flask**
* **Flask-Cors**
* **pyautogui**

---

## ▶️ How to Run Gesturify

You need to run **two servers** in **two separate terminals**.

---

### 🖥️ Terminal 1: Start the Backend Server

```bash
# Make sure you're in the project directory and the virtual environment is activated
python gesturify_server.py
```

---

### 🌐 Terminal 2: Start the Frontend Server

```bash
# Still in the project directory
python -m http.server 8000
```

---

## 🔓 Final Step: Open the Application

1. Open your browser (**Chrome** or **Firefox** recommended).
2. Go to: [http://localhost:8000](http://localhost:8000)
3. Grant **camera access** when prompted.
4. Launch a media player (e.g., **Spotify**, **VLC**) and make sure it's the **active window**.
5. Use **hand gestures** to control playback!

---

## 🙌 Gesture Guide

| Gesture     | Visual | Command        |
| ----------- | ------ | -------------- |
| Thumbs Up   | 👍     | Play / Pause   |
| Open Palm   | 🖐️    | Play / Pause   |
| Point       | 👉     | Next Track     |
| Two Fingers | ✌️     | Previous Track |
| Shaka Sign  | 🤙     | Volume Up      |
| Point Down  | 👇     | Volume Down    |
| Fist        | 👊     | Stop           |

---

## 🧠 Built With

* [MediaPipe](https://mediapipe.dev/)
* [Flask](https://flask.palletsprojects.com/)
* [pyautogui](https://pyautogui.readthedocs.io/)
* **Vanilla JavaScript and HTML**

