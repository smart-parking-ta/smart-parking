import cv2
import numpy as np

# Load the image
image = cv2.imread("./Image/14.E 1129 RP-07-18.jpg")

# Define the sliding window size and stride
(winW, winH) = (64, 64)
stride = 16

# Loop over the sliding window for each (x, y)-coordinate in the image
for y in range(0, image.shape[0] - winH, stride):
    for x in range(0, image.shape[1] - winW, stride):
        # Extract the region of interest from the image
        roi = image[y:y + winH, x:x + winW]

        # Apply object detection algorithm on the region of interest
        # Here, we're using a simple color-based detection algorithm
        # You can replace this with any other object detection algorithm
        hsv = cv2.cvtColor(roi, cv2.COLOR_BGR2HSV)
        lower_red = np.array([0, 50, 50])
        upper_red = np.array([10, 255, 255])
        mask = cv2.inRange(hsv, lower_red, upper_red)
        count = cv2.countNonZero(mask)
        print(hsv)

        # If the count of the detected object is above a threshold, draw a rectangle around it
        if count > 500:
            cv2.rectangle(image, (x, y), (x + winW, y + winH), (0, 255, 0), 2)

# Show the output image
cv2.imshow("Output", image)
cv2.waitKey(0)