import cv2
import glob
import os

def find_working_camera():
    # List all /dev/video* devices
    video_devices = sorted(glob.glob('/dev/video*'))
    print("Found devices:", video_devices)
    for device in video_devices:
        try:
            cap = cv2.VideoCapture(device)
            if cap.isOpened():
                ret, frame = cap.read()
                if ret:
                    print(f"Camera working at {device}")
                    cap.release()
                    return device
                else:
                    print(f"Opened {device} but failed to read frame.")
            else:
                print(f"Failed to open {device}")
            cap.release()
        except Exception as e:
            print(f"Error with {device}: {e}")
    print("No working camera found.")
    return None

if __name__ == "__main__":
    working_device = find_working_camera()
    if working_device:
        print(f"Use this device in your .env: CAMERA_DEVICE={working_device}")
    else:
        print("No camera found that can read frames.") 