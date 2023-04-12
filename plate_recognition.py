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
    crop_img = image[y+5:y+h-5, x+5:x+w-5]

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
    time_in = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    cv2.putText(image, time_in, (x+50,y-10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0,255,0), 2)
        
    return time_in



def time_exit(image, bbox):
    x,y,w,h = bbox
    # crop_img = image[y:y+h, x:x+w]
    
    time_out = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
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
    cv2.imshow("thresh", thresh)
    get_plate = pt.image_to_string(thresh, config='--psm 8')
    regex = "^[A-Z]{1,2}\s?[0-9]{1,4}\s?[A-Z]{1,3}$"
    
    ocr_plate_number = re.match(regex, get_plate)

    if ocr_plate_number:
        return ocr_plate_number.group()
    else:
        return None
    

    # if ocr_plate_number:
    # return ocr_plate_number.group()



def save_plate_in(get_plate, time_in):

    if get_plate == None:
        pass
    else:
        # check if plate number already exist in csv file
        with open('vehicle_in.csv', 'r') as f:
            reader = csv.reader(f)
            for row in reader:
                if row[0] == get_plate or row[1] == time_in:
                    # print("same plate", row[0], "at ", row[1])
                    return
                
        plate_dict = {"plate_number": get_plate, 
                    "time_in": time_in}
        print(plate_dict)
        
        with open('vehicle_in.csv', 'a', newline='') as f:
            w = csv.DictWriter(f, plate_dict.keys())
            w.writerow(plate_dict)
            print("saved plate", get_plate, "at ", time_in)

    # return plate_dict




def match_plate_out(get_plate, time_out):
    if get_plate == None:
        pass
    else:
        with open('vehicle_in.csv', 'r') as f_in:
            reader_in = csv.reader(f_in)
            for row in reader_in:
                # print(get_plate.group(), row[0])
                if row[0] == get_plate:

                    with open('vehicle_out.csv', 'r') as f_out_r:
                        reader_out_r = csv.reader(f_out_r)
                        # print("plate out", get_plate.group())
                        for row_out_r in reader_out_r:
                            if row_out_r and row_out_r[0] == get_plate:
                                print("same plate", row_out_r[0], "at ", row_out_r[2])
                                break
                            
                            # else:
                        # print("plate out", get_plate.group())
                        plate_dict = {"plate_number": get_plate,
                            "time_in": row[1], 
                            "time_out": time_out}

                        with open('vehicle_out.csv', 'r', newline='') as f_out_r_r:
                            reader_out_r_r = csv.reader(f_out_r_r)
                            for row_out_r_r in reader_out_r_r:
                                if row_out_r_r and row_out_r_r[0] == get_plate:
                                    print("same plate", row_out_r_r[0], "at ", row_out_r_r[2])
                                    return
                            

                        with open('vehicle_out.csv', 'a', newline='') as f_out_r_w:
                            w = csv.DictWriter(f_out_r_w, plate_dict.keys())
                            if f_out_r_w.tell() == 0:
                                w.writeheader()
                            w.writerow(plate_dict)
                            print("saved plate ", get_plate, "at ", time_out)
                            return
                        
                # with open('vehicle_out.csv', 'r', newline='') as f_out_r_r:
                #     reader_out_r_r = csv.reader(f_out_r_r)
                #     last_row = list(reader_out_r_r)[-1]
                #     print("last data:", last_row)
                #     return       
                        
        print('no match ', get_plate, "at ", time_out)
                    



def get_last_plate_in():
    with open('vehicle_in.csv', 'r', newline='') as f_in_r_r:
        reader_in_r_r = csv.reader(f_in_r_r)
        last_row = list(reader_in_r_r)[-1]
        print("last data in: ", last_row)
        return last_row



def get_last_two_plates_in():
    with open('vehicle_in.csv', 'r', newline='') as f_in_r_r:
        reader_in_r_r = csv.reader(f_in_r_r)
        rows = list(reader_in_r_r)
        last_row = rows[-1]
        second_last_row = rows[-2] if len(rows) >= 2 else None
        # print("last data in: ", last_row)
        # print("second last data in: ", second_last_row)
        return last_row, second_last_row



import requests
def push_data_in_api(last_plate_in, get_plate):
    # implement code to push data to API
    # print("Pushing data to API:", get_plate)
    api_url = "https://final-project-iotxbackend-zv3ntfgfrq-et.a.run.app/checkIn"

    # Request headers (optional)
    headers = {
        "Content-Type": "application/json"
    }

    # Create the request body using the last data
    payload = {
        "plat_number": get_plate,
    }

    print("last plate in: ", last_plate_in[0])
    print("current plate in: ", get_plate)

    if get_plate == last_plate_in[0]:
        print("same plate has been pushed to API")
        return
    elif get_plate == None:
        print("no plate detected")
        return
    else:
        # Send a POST request to the API
        response = requests.post(api_url, headers=headers, json=payload)
        print("Pushing data to API:", get_plate)
        # Check the response status code
        if response.status_code == 200:
            print("Data successfully pushed to API:", get_plate)
        else:
            print(response.text)
        # time.sleep(2)

    

    # # Send a POST request to the API
    # response = requests.post(api_url, headers=headers, json=payload)

    # # Check the response status code
    # if response.status_code == 200:
    #     print("Data successfully pushed to API:", get_plate)
    # else:
    #     print(response.text)


        
# def get_last_plate_out():
#     with open('vehicle_out.csv', 'r', newline='') as f_out_r_r:
#         reader_out_r_r = csv.reader(f_out_r_r)
#         last_row = list(reader_out_r_r)[-1]
#         print("last data out: ", last_row)
#         return last_row
    

# def get_last_two_plates_out():
#     with open('vehicle_out.csv', 'r', newline='') as f_out_r_r:
#         reader_out_r_r = csv.reader(f_out_r_r)
#         rows = list(reader_out_r_r)
#         last_row = rows[-1]
#         second_last_row = rows[-2] if len(rows) >= 2 else None
#         print("last data out: ", last_row)
#         print("second last data out: ", second_last_row)
#         return last_row, second_last_row
    

# def push_data_out_api(data):
#     # implement code to push data to API
#     print("Pushing data to API:", data[0])
#     api_url = "https://final-project-iotxbackend-zv3ntfgfrq-et.a.run.app/checkOut"

#     # Request headers (optional)
#     headers = {
#         "Content-Type": "application/json"
#     }

#     # Create the request body using the last data
#     payload = {
#         "plat_number": data[0],
#     }

#     # Send a POST request to the API
#     response = requests.post(api_url, headers=headers, json=payload)

#     # Check the response status code
#     if response.status_code == 200:
#         print("Data successfully pushed to API:", data)
#     else:
#         print("Error pushing data to API:", response.text)





def draw_boxes(image, index, boxes_np, confidences_np):
    for i in index:
        box = boxes_np[i]

        ss_object = screenshot_object(image, index, boxes_np[i], confidences_np)
        time_in = time_enter(image, boxes_np[i])
        get_plate = get_plate_number(ss_object)

        save_plate_number = save_plate_in(get_plate, time_in)
        # check_plate = match_plate_out(get_plate, time_in)


        x1,y1,w,h = box.astype('int')
        cv2.rectangle(image,(x1,y1),(x1+w,y1+h),(255,0,0),2)
        cv2.putText(image, f'{confidences_np[i]:.2f}', (x1,y1-10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0,255,0), 2)
        # cv2.putText(image,plate_text,(x1,y1+h+27),cv2.FONT_HERSHEY_SIMPLEX,0.7,(0,255,0),1)

        last_plate_in = get_last_plate_in()
        # last_plate_out = get_last_plate_out()


        # PUSH DATA VEHICLE IN TO API
        last_row_in, second_last_row_in = get_last_two_plates_in()
        # print("last row in: ", last_row_in)


        # if last_plate_in[0] != get_plate:
        #     push_data_in_api(last_plate_in, get_plate)
        #     time.sleep(3)
        # else:
        #     print("No new data to push to API")


        # PUSH DATA VEHICLE OUT TO API
        # last_row_out, second_last_row_out = get_last_two_plates_out()
        # if last_row_out != second_last_row_out:
        #     push_data_out_api(last_row_out)
        # else:
        #     print("No new data to push to API")
        
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





