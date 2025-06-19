import os
import time
import threading
import cv2
from typing import Optional, Tuple

try:
    from picamera2 import Picamera2
    from picamera2.encoders import H264Encoder
    print("[DEBUG] Picamera2 import succeeded")
    PICAMERA2_AVAILABLE = True
except ImportError as e:
    print(f"[DEBUG] Picamera2 import failed: {e}")
    PICAMERA2_AVAILABLE = False
except Exception as e:
    print(f"[DEBUG] Picamera2 import failed (other): {e}")
    PICAMERA2_AVAILABLE = False

class CameraInterface:
    def __init__(self, width=1280, height=720, fps=30, output_dir="temp"):
        self.width = width
        self.height = height
        self.fps = fps
        self.output_dir = output_dir
        self.camera_type = None  # 'picamera2' or 'opencv'
        self.picam = None
        self.cap = None
        self.writer = None
        self.recording = False
        self.recording_path = None
        self._detect_camera()

    def _detect_camera(self):
        # Try Picamera2 first (for Pi Camera Module)
        if PICAMERA2_AVAILABLE:
            try:
                print("[DEBUG] Attempting to initialize Picamera2...")
                self.picam = Picamera2()
                video_config = self.picam.create_video_configuration(
                    main={"size": (self.width, self.height), "format": "RGB888"},
                    controls={"FrameRate": self.fps}
                )
                self.picam.configure(video_config)
                self.picam.start()
                self.camera_type = 'picamera2'
                print("[CameraInterface] Using Pi Camera (Picamera2)")
                return
            except Exception as e:
                import traceback
                self.picam = None
                print(f"[CameraInterface] Picamera2 not available or failed: {e}")
                traceback.print_exc()
        # Fallback: Try OpenCV on /dev/video* (for USB cameras)
        for idx in range(8):  # Try /dev/video0 ... /dev/video7
            cap = cv2.VideoCapture(idx)
            if cap.isOpened():
                ret, frame = cap.read()
                if ret:
                    self.cap = cap
                    self.camera_type = 'opencv'
                    print(f"[CameraInterface] Using USB camera at /dev/video{idx}")
                    return
                cap.release()
        raise RuntimeError("No working camera found (neither Pi Camera nor USB camera)")

    def capture_frame(self) -> Optional[any]:
        if self.camera_type == 'picamera2':
            frame = self.picam.capture_array()
            # Picamera2 returns RGB, OpenCV expects BGR
            return cv2.cvtColor(frame, cv2.COLOR_RGB2BGR)
        elif self.camera_type == 'opencv':
            ret, frame = self.cap.read()
            return frame if ret else None
        else:
            return None

    def _update_system_status(self, is_recording: bool):
        try:
            from .utils import update_system_status
            update_system_status(is_recording=is_recording)
        except Exception as e:
            print(f"[CameraInterface] Failed to update system status: {e}")

    def start_recording(self, filename: Optional[str] = None) -> str:
        if self.recording:
            print("[CameraInterface] Already recording!")
            return self.recording_path
        if not filename:
            timestamp = time.strftime("%Y%m%d_%H%M%S")
            filename = f"recording_{timestamp}.mp4"
        self.recording_path = os.path.join(self.output_dir, filename)
        if self.camera_type == 'picamera2':
            # Create encoder and start recording with encoder and output path
            self.encoder = H264Encoder()
            self.picam.start_recording(self.encoder, self.recording_path)
            self.recording = True
            self._update_system_status(is_recording=True)
        elif self.camera_type == 'opencv':
            fourcc = cv2.VideoWriter_fourcc(*'mp4v')
            self.writer = cv2.VideoWriter(
                self.recording_path, fourcc, self.fps, (self.width, self.height)
            )
            self.recording = True
            # Start a thread to grab frames
            self._recording_thread = threading.Thread(target=self._opencv_record_loop)
            self._recording_thread.daemon = True
            self._recording_thread.start()
            self._update_system_status(is_recording=True)
        print(f"[CameraInterface] Started recording: {self.recording_path}")
        return self.recording_path

    def _opencv_record_loop(self):
        while self.recording:
            frame = self.capture_frame()
            if frame is not None:
                self.writer.write(frame)
            else:
                print("[CameraInterface] Failed to read frame during recording.")
                break
            time.sleep(1.0 / self.fps)

    def stop_recording(self):
        if not self.recording:
            print("[CameraInterface] Not recording.")
            return
        if self.camera_type == 'picamera2':
            # Stop recording and clean up encoder
            self.picam.stop_recording()
            self.encoder = None
        elif self.camera_type == 'opencv':
            self.recording = False
            if self.writer:
                self.writer.release()
                self.writer = None
        self._update_system_status(is_recording=False)
        print(f"[CameraInterface] Stopped recording: {self.recording_path}")
        self.recording_path = None

    def release(self):
        if self.camera_type == 'picamera2' and self.picam:
            self.picam.stop()
        elif self.camera_type == 'opencv' and self.cap:
            self.cap.release()
        print("[CameraInterface] Camera released.") 