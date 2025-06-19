import cv2
cap = cv2.VideoCapture('/dev/video23')
if not cap.isOpened():
    print("Failed to open camera")
else:
    ret, frame = cap.read()
    print("Read frame:", ret)
cap.release()
