import cv2
import numpy as np
from PIL import Image, ImageDraw

img = cv2.imread('public/lenses-bg.jpg')
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
gray = cv2.medianBlur(gray, 5)
circles = cv2.HoughCircles(gray, cv2.HOUGH_GRADIENT, dp=1.2, minDist=100, param1=100, param2=50, minRadius=50, maxRadius=300)

if circles is not None:
    circles = np.round(circles[0, :]).astype("int")
    print(f"Found {len(circles)} circles.")
    # save first one as a test
    c = circles[0]
    x, y, r = c
    print(x,y,r)
else:
    print("No circles found.")
