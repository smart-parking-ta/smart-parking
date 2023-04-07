import os
import cv2
import numpy as np
import pytesseract as pt
import re
import json
import time
from datetime import datetime, timedelta
import csv

INPUT_WIDTH =  640
INPUT_HEIGHT = 640


pt.pytesseract.tesseract_cmd = r'C:/Users/ACER/AppData/Local/Tesseract-OCR/tesseract.exe'

net = cv2.dnn.readNetFromONNX('C:/Ilham/KULIAH\CODE/TA/TA-PLATE-RECOG/Epoch600/yolov5/runs/train/exp/weights/best.onnx')
net.setPreferableBackend(cv2.dnn.DNN_BACKEND_OPENCV)
net.setPreferableTarget(cv2.dnn.DNN_TARGET_CPU)



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
    confidence_detect_target = 0.8
    confidence_probability = 0.8
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


image_counter = 1
plate_saved = {}

def screenshot_object(image, index, bbox, confidences_np):
    global image_counter
    confidence_detect_target = 0.8
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
                # print(plate_saved)

    return crop_img



def time_enter(image, bbox):
    x,y,w,h = bbox
    time_in = datetime.now().strftime('%H:%M:%S %d-%m-%Y')

    cv2.putText(image, time_in, (x+50,y-10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0,255,0), 2)
        
    return time_in



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

    return result_image


    

def get_plate_number(image):
    image_th = image

    # Konversi ke citra grayscale
    gray = cv2.cvtColor(image_th, cv2.COLOR_BGR2GRAY)

    # Thresholding value dengan cv.threshold
    thresh_value, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)

    get_plate = pt.image_to_string(thresh, config='--psm 8')

    regex = "^[A-Z]{1,2}\s?[0-9]{1,4}\s?[A-Z]{1,3}$"
    
    
    ocr_plate_number = re.match(regex, get_plate)

    if ocr_plate_number:
        return ocr_plate_number




def save_plate_in(get_plate, time_in):

    if get_plate == None:
        pass
    else:
        # check if plate number already exist in csv file
        with open('vehicle_in.csv', 'r') as f:
            reader = csv.reader(f)
            for row in reader:
                if row[0] == get_plate.group() or row[1] == time_in:
                    # print("same plate", row[0], "at ", row[1])
                    return
                
        plate_dict = {"plate_number": get_plate.group(), 
                    "time_in": time_in}
        print(plate_dict)
        
        with open('vehicle_in.csv', 'a', newline='') as f:
            w = csv.DictWriter(f, plate_dict.keys())
            w.writerow(plate_dict)

    # return plate_dict




def match_plate_out(get_plate, time_out):
    if get_plate == None:
        pass
    else:
        with open('vehicle_in.csv', 'r') as f_in:
            reader_in = csv.reader(f_in)
            for row in reader_in:
                # print(get_plate.group(), row[0])
                if row[0] == get_plate.group():

                    with open('vehicle_out.csv', 'r') as f_out_r:
                        reader_out_r = csv.reader(f_out_r)
                        # print("plate out", get_plate.group())
                        for row_out_r in reader_out_r:
                            if row_out_r and row_out_r[0] == get_plate.group():
                                print("same plate", row_out_r[0], "at ", row_out_r[2])
                                break
                            
                            # else:
                        # print("plate out", get_plate.group())
                        plate_dict = {"plate_number": get_plate.group(),
                            "time_in": row[1], 
                            "time_out": time_out}

                        with open('vehicle_out.csv', 'r', newline='') as f_out_r_r:
                            reader_out_r_r = csv.reader(f_out_r_r)
                            for row_out_r_r in reader_out_r_r:
                                if row_out_r_r and row_out_r_r[0] == get_plate.group():
                                    print("same plate", row_out_r_r[0], "at ", row_out_r_r[2])
                                    return
                            
                            
                        with open('vehicle_out.csv', 'a', newline='') as f_out_r_w:
                            w = csv.DictWriter(f_out_r_w, plate_dict.keys())
                            if f_out_r_w.tell() == 0:
                                w.writeheader()
                            w.writerow(plate_dict)
                            print("saved plate ", get_plate.group(), "at ", time_out)
                            return
        print('no match ')
                    



    



def draw_boxes(image, index, boxes_np, confidences_np):
    for i in index:
        box = boxes_np[i]
        # plate_text = get_plate_text(image, boxes_np[i])
        ss_object = screenshot_object(image, index, boxes_np[i], confidences_np)
        time_in = time_enter(image, boxes_np[i])
        get_plate = get_plate_number(ss_object)

        # save_plate_number = save_plate_in(get_plate, time_in)

        check_plate = match_plate_out(get_plate, time_in)

        x1,y1,w,h = box.astype('int')
        
        cv2.rectangle(image,(x1,y1),(x1+w,y1+h),(255,0,0),2)

        cv2.putText(image, f'{confidences_np[i]:.2f}', (x1,y1-10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0,255,0), 2)
        # cv2.putText(image,plate_text,(x1,y1+h+27),cv2.FONT_HERSHEY_SIMPLEX,0.7,(0,255,0),1)
    
    return image




# MAIN
def main():
    cap = cv2.VideoCapture(1)
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





