import os
import cv2
import numpy as np
import pandas as pd
import tensorflow as tf
import pytesseract as pt
import plotly.express as px
import matplotlib.pyplot as plt
import xml.etree.ElementTree as xet
import re

import json

import time
import random

from glob import glob
from skimage import io
from shutil import copy
from sklearn.model_selection import train_test_split
from datetime import datetime, timedelta

INPUT_WIDTH =  640
INPUT_HEIGHT = 640


pt.pytesseract.tesseract_cmd = r'C:/Users/ACER/AppData/Local/Tesseract-OCR/tesseract.exe'

net = cv2.dnn.readNetFromONNX('C:/Users/ACER/yolov5/runs/train/Model15/weights/best.onnx')
net.setPreferableBackend(cv2.dnn.DNN_BACKEND_OPENCV)
net.setPreferableTarget(cv2.dnn.DNN_TARGET_CPU)


image_counter = 1
plate_saved = {}

def convert_image_yolo(image):
    # 1.CONVERT IMAGE TO YOLO FORMAT
    row, col, depth = image.shape
    max_dimension = max(row,col)
    img_resize = np.zeros((max_dimension, max_dimension,3),dtype=np.uint8)
    img_resize[:row, :col] = image

    return img_resize



def get_predictions_yolo(image, net):
    # 2. GET PREDICTION FROM YOLO MODEL
    img_resize = convert_image_yolo(image)
    blob = cv2.dnn.blobFromImage(img_resize,scalefactor=1/255,size=(INPUT_WIDTH,INPUT_HEIGHT),swapRB=True,crop=False)
    net.setInput(blob)
    predictions = net.forward()
    detections = predictions[0]

    return detections



def drawings_box(img_resize, detections):
    confidence_detect_target = 0.9
    confidence_probability = 0.9
    image_width, image_height, image_depth = img_resize.shape
    x_scale = image_width/INPUT_WIDTH
    y_scale = image_height/INPUT_HEIGHT
    boxes = []
    confidences = []

    for i in range(len(detections)):
        row = detections[i]
        confidence_detect = row[4]
        if confidence_detect > confidence_detect_target:        
            class_score = row[5]
            if class_score > confidence_probability:
                cx, cy, w, h = row[0:4]
                x1 = int(x_scale * (cx - w/2))
                y1 = int(y_scale * (cy - h/2))
                w = int(x_scale * w)
                h = int(y_scale * h) 
                boxes.append([x1,y1,w,h])
                confidences.append(float(confidence_detect))

    boxes_np = np.array(boxes)
    confidences_np = np.array(confidences)
    index = cv2.dnn.NMSBoxes(boxes_np,confidences_np,confidence_detect_target,confidence_probability)
    
    # print(index)
    
    return index, boxes_np, confidences_np



def screenshot_object(image, index, bbox, confidences_np):
    global image_counter
    confidence_detect_target = 0.7
    x, y, w, h = bbox
    crop_img = image[y:y+h, x:x+w]

    for i in index:
        if confidences_np[i] > confidence_detect_target:
            if not plate_saved.get(i, False):
                # Generate a unique filename based on the image counter
                filename = f'plate_{image_counter}.jpg'
                image_counter += 1

                # Save the image and set the flag in plate_saved
                cv2.imwrite(filename, crop_img)
                plate_saved[i] = True
                print(plate_saved)

    return crop_img



def time_enter(image, bbox):
    x,y,w,h = bbox
    time_in = datetime.now().strftime('%H:%M:%S')
    cv2.putText(image, time_in, (x+50,y-10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0,255,0), 2)
    
    # Create a dictionary with the time_in value
    time_dict = {"time_in": time_in}
    
    # Convert the dictionary to a JSON string
    time_enter = json.dumps(time_dict)

    print(time_enter)
    
    return time_enter



def time_exit(image, bbox):
    x,y,w,h = bbox
    # crop_img = image[y:y+h, x:x+w]
    
    time_out = datetime.now().strftime('%H:%M:%S')
    cv2.putText(image, time_out, (x+50,y-10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0,255,0), 2)
    # Create a dictionary with the time_in value
    
    time_dict = {"time_exit": time_out}
    
    # Convert the dictionary to a JSON string
    time_exit = json.dumps(time_dict)
    
    return time_exit




def yolo_predictions(image, net):
    # input_image, detections = convert_image_yolo(image, net)
    
    # CONVERT IMAGE TO YOLO
    input_image = convert_image_yolo(image)
    
    # GET DETECTIONS
    detections = get_predictions_yolo(input_image, net)
    boxes_np, confidences_np, index = drawings_box(input_image, detections)
    
    # result_image = draw_boxes(image, *drawings_box(input_image, detections))
    result_image = draw_boxes(image, boxes_np, confidences_np,index)
    
    # save data 
    # save_data_user(image, boxes_np, index)

    return result_image


    

def threshold_img(img):
    # img = cv2.imread("C:/Ilham/KULIAH/CODE/TA/auto-plate-recog-kaggle/images/test/362.E 6525 SF-09-21.jpeg")
    # baca perintah image
    image_th = img


    # Konversi ke citra grayscale
    gray = cv2.cvtColor(image_th, cv2.COLOR_BGR2GRAY)

    # Thresholding value dengan cv.threshold
    thresh_value, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)

    # Operasi dilasi
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
    dilated = cv2.dilate(thresh, kernel, iterations=1)

    text_img = pt.image_to_string(image_th, config='--psm 8')
    print(text_img)

    text_thresh = pt.image_to_string(thresh, config='--psm 8')
    print(text_thresh)

    text_dilated = pt.image_to_string(dilated, config='--psm 8')
    print(text_dilated)

    return text_img, text_thresh, text_dilated




def draw_boxes(image, index, boxes_np, confidences_np):
    for i in index:
        box = boxes_np[i]
        # plate_text = get_plate_text(image, boxes_np[i])
        ss_object = screenshot_object(image, index, boxes_np[i], confidences_np)
        time_in = time_enter(image, boxes_np[i])
        threshold_result = threshold_img(ss_object)

        x1,y1,w,h = box.astype('int')
        
        cv2.rectangle(image,(x1,y1),(x1+w,y1+h),(255,0,0),2)

        cv2.putText(image, f'{confidences_np[i]:.2f}', (x1,y1-10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0,255,0), 2)
        # cv2.putText(image,plate_text,(x1,y1+h+27),cv2.FONT_HERSHEY_SIMPLEX,0.7,(0,255,0),1)
    
    return image



# MAIN
def main():
    cap = cv2.VideoCapture(0)
    while True:
        ret, frame = cap.read()
    
        if ret == False:
            print('Unable to read video')
            break
        
        results = yolo_predictions(frame, net)

        cv2.namedWindow('YOLO',cv2.WINDOW_KEEPRATIO)
        cv2.imshow('YOLO',results)
        
        if cv2.waitKey(30) == 27 :
            break
        
    cv2.destroyAllWindows()
    cap.release()



if __name__ == '__main__':
    main()





