import os
import cv2
import numpy as np
import pytesseract as pt
import re
import json
import time
from datetime import datetime, timedelta
import csv
import tempfile
import shutil

INPUT_WIDTH =  640
INPUT_HEIGHT = 640


pt.pytesseract.tesseract_cmd = r'C:/Users/ACER/AppData/Local/Tesseract-OCR/tesseract.exe'
# C:/Ilham/KULIAH/CODE/TA/TA-PLATE-RECOG/.env/Lib/site-packages/pytesseract/pytesseract

# net = cv2.dnn.readNetFromONNX('C:/Ilham/KULIAH\CODE/TA/TA-PLATE-RECOG/Epoch600/yolov5/runs/train/exp/weights/best.onnx')

net = cv2.dnn.readNetFromONNX('C:/Ilham/KULIAH/CODE/TA/TA-PLATE-RECOG/yolomodel/1.3000-512/yolov5/runs/train/exp/weights/best.onnx')

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
                filename = f'plate_{image_counter}.jpg'
                image_counter += 1

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
    
    
    return time_out




def yolo_predictions(image, net):
    # input_image, detections = convert_image_yolo(image, net)
    
    # CONVERT IMAGE TO YOLO
    input_image = convert_image_yolo(image)
    
    # GET DETECTIONS
    detections = get_predictions_yolo(input_image, net)
    boxes_np, confidences_np, index = drawings_box(input_image, detections)
    
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
    




def save_plate_in_csv(last_plate, get_plate, time_in):
    if get_plate == None:
        pass
    else:
        # check if plate already exist in csv file
        with open('vehicle_in.csv', 'r') as f:
            reader = csv.reader(f)
            for row in reader:
                if len(row) >= 2 and (row[0] == get_plate or row[1] == time_in):
                    print("You've already check in with ", row[0], "at ", row[1])
                    return
                
        plate_dict = {"plate_number": get_plate, 
                    "time_in": time_in,
                    "status": 0,
                    "response_text": None,}
        print(plate_dict)
        
        with open('vehicle_in.csv', 'a', newline='') as f:
            w = csv.DictWriter(f, plate_dict.keys())
            w.writerow(plate_dict)
            # print("saved plate", get_plate, "at ", time_in)
            # time.sleep(2)


        status_code, response_text = push_data_in_api(last_plate, get_plate)

        while status_code == 503:
            print("Error pushing data to API. Retrying in 2 seconds...")
            time.sleep(2)
            status_code, response_text = push_data_in_api(last_plate, get_plate)

        with open('vehicle_in.csv', 'r') as f:
            reader = csv.DictReader(f)
            rows = list(reader)


        for row in rows:
            if row['plate_number'] == get_plate:
                row['status'] = 1 if status_code == 201 else 0
                row['response_text'] = "success" if status_code == 201 else "unauth" if status_code == 401 else "error" if status_code == 404 else "internal server error"

        time.sleep(2)

        with open('vehicle_in.csv', 'w', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=plate_dict.keys())
            writer.writeheader()
            writer.writerows(rows)

        print("saved plate", get_plate, "at ", time_in)
        # time.sleep(2)

    return plate_dict






def get_last_plate_in():
    with open('vehicle_in.csv', 'r', newline='') as f_in_r_r:
        reader_in_r_r = csv.reader(f_in_r_r)
        rows = list(reader_in_r_r)[-1] 
        if not rows:
            pass
        last_row = rows[0]
        # print("last data in: ", last_row[0])
        return last_row




import requests
def push_data_in_api(last_plate, get_plate):
    print("Pushing data to API:", get_plate)
    # api_url = "https://smart-parking-api-izqxjuid2a-et.a.run.app/checkIn"
    api_url = "http://127.0.0.1:8080/checkIn"    
    # api_url = "http://192.168.43.213:8080/checkIn"


    headers = {
        "Content-Type": "application/json"
    }

    payload = {
        "plat_number": get_plate,
    }

    print("last plate in: ", get_plate)
    # print("current plate in: ", get_plate)


    if last_plate == get_plate:
        print("same plate")
        return
    else:
        response = requests.post(api_url, json=payload, headers=headers)
        print(response.status_code)
        print(response.text)
        # time.sleep(2)
        return response.status_code, response.text    
        

        


#---------------------------------------------

def match_plate_out(get_plate, time_out):
    if get_plate is None:
        return
    else:
        with open('vehicle_in.csv', 'r') as f_in:
            reader_in = csv.reader(f_in)
            rows = list(reader_in)
        
        # Remove the matched plate from the list of rows
        updated_rows = [row for row in rows if row and row[0] != get_plate]
        
        with open('vehicle_in.csv', 'w', newline='') as f_out:
            writer_out = csv.writer(f_out)
            for row in updated_rows:
                writer_out.writerow(row)

        time_in = None  # Initialize time_in with a default value

        with open('vehicle_out.csv', 'r') as f_out_r:
            for row in rows:
                if row and row[0] == get_plate:
                    time_in = row[1]
                    print(time_in)
            reader_out_r = csv.reader(f_out_r)
            plate_dict = {
                "plate_number": get_plate,
                "time_in": time_in,
                "time_out": time_out,
                "status": 0,
                "response_text": None
            }
            
            with open('vehicle_in.csv', 'r') as f_in:
                reader_in = csv.reader(f_in)
                for row in reader_in:
                    if row and row[0] == get_plate:
                        plate_dict['time_in'] = row[1]
                        break

            with open('vehicle_out.csv', 'a', newline='') as f:
                w = csv.DictWriter(f, plate_dict.keys())
                w.writerow(plate_dict)

            status_code, response_text = push_data_out_api(get_plate)

            while status_code == 503:
                print("Error pushing data to API. Retrying in 2 seconds...")
                time.sleep(2)
                status_code, response_text = push_data_out_api(get_plate)

            with open('vehicle_out.csv', 'r') as f:
                reader = csv.DictReader(f)
                rows = list(reader)

            for row in rows:
                if row['plate_number'] == get_plate:
                    row['status'] = 1 if status_code == 201 else 0
                    row['response_text'] = "success" if status_code == 201 else "unauth" if status_code == 401 else "error" if status_code == 404 else "internal server error"
                    row['time_out'] = time_out  

            with open('vehicle_out.csv', 'w', newline='') as f:
                writer = csv.DictWriter(f, fieldnames=plate_dict.keys())
                writer.writeheader()
                writer.writerows(rows)






# def match_plate_out(get_plate, time_out):
#     if get_plate is None:
#         return

#     else:
#         with open('vehicle_in.csv', 'r') as f_in:
#             reader_in = csv.reader(f_in)
#             rows = list(reader_in)
        
#         # Remove the matched plate from the list of rows
#         updated_rows = [row for row in rows if row and row[0] != get_plate]
        
#         with open('vehicle_in.csv', 'w', newline='') as f_out:
#             writer_out = csv.writer(f_out)
#             for row in updated_rows:
#                 writer_out.writerow(row)

#         with open('vehicle_out.csv', 'r') as f_out_r:
#             for row in rows:
#                 if row and row[0] == get_plate:
#                     time_in = row[1]
#                     print(time_in)
#             reader_out_r = csv.reader(f_out_r)
#             plate_dict = {
#                 "plate_number": get_plate,
#                 "time_in": time_in,
#                 "time_out": time_out,
#                 "status": 0,
#                 "response_text": None
#             }
            
#             with open('vehicle_in.csv', 'r') as f_in:
#                 reader_in = csv.reader(f_in)
#                 for row in reader_in:
#                     if row and row[0] == get_plate:
#                         plate_dict['time_in'] = row[1]
#                         break

#             with open('vehicle_out.csv', 'a', newline='') as f:
#                 w = csv.DictWriter(f, plate_dict.keys())
#                 w.writerow(plate_dict)

#             status_code, response_text = push_data_out_api(get_plate)

#             while status_code == 503:
#                 print("Error pushing data to API. Retrying in 2 seconds...")
#                 time.sleep(2)
#                 status_code, response_text = push_data_out_api(get_plate)

#             with open('vehicle_out.csv', 'r') as f:
#                 reader = csv.DictReader(f)
#                 rows = list(reader)

#             for row in rows:
#                 if row['plate_number'] == get_plate:
#                     row['status'] = 1 if status_code == 201 else 0
#                     row['response_text'] = "success" if status_code == 201 else "unauth" if status_code == 401 else "error" if status_code == 404 else "internal server error"
#                     row['time_out'] = time_out  

#             with open('vehicle_out.csv', 'w', newline='') as f:
#                 writer = csv.DictWriter(f, fieldnames=plate_dict.keys())
#                 writer.writeheader()
#                 writer.writerows(rows)





        
def get_last_plate_out():
    with open('vehicle_out.csv', 'r', newline='') as f_out_r_r:
        reader_out_r_r = csv.reader(f_out_r_r)
        rows = list(reader_out_r_r)[-1]
        if not rows:
            pass
        last_row = rows[0]
        # print("last data out: ", last_row)
        return last_row
    
    

    

def push_data_out_api(get_plate):
    print("Pushing data to API:", get_plate)

    # api_url = "https://smart-parking-api-izqxjuid2a-et.a.run.app/checkOut"
    api_url = "http://127.0.0.1:8080/checkOut"

    headers = {
        "Content-Type": "application/json"
    }

    payload = {
        "plat_number": get_plate,
    }
    
    response = requests.post(api_url, json=payload, headers=headers)
    print(response.status_code)
    print(response.text)
    # time.sleep(2)
    return response.status_code, response.text


def save_inference_time(inference_time):
    with open('inference_times.csv', 'a', newline='') as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow([inference_time])



def draw_boxes(image, index, boxes_np, confidences_np):
    for i in index:
        box = boxes_np[i]

        ss_object = screenshot_object(image, index, boxes_np[i], confidences_np)

        start_time = time.time()

        time_in = time_enter(image, boxes_np[i])
        get_plate = get_plate_number(ss_object)

        end_time = time.time()
        inference_time = end_time - start_time
        save_inference_time(inference_time)
        
        x1,y1,w,h = box.astype('int')
        cv2.rectangle(image,(x1,y1),(x1+w,y1+h),(255,0,0),2)
        cv2.putText(image, f'{confidences_np[i]:.2f}', (x1,y1-10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0,255,0), 2)
        # cv2.putText(image,plate_text,(x1,y1+h+27),cv2.FONT_HERSHEY_SIMPLEX,0.7,(0,255,0),1)

        

        # ----------------------------------------PLATE IN-------------------------------------------------------

        # last_plate = get_last_plate_in()
        # # PUSH DATA TO API FOR PLATE IN
        # if get_plate is not None:
        #     # push_data_in_api(last_plate, get_plate) # push data to API
        #     save_plate_in = save_plate_in_csv(last_plate, get_plate, time_in)
        #     last_plate = get_plate 


        # -----------------------------------------PLATE OUT-----------------------------------------------------

        time_out = time_exit(image, boxes_np[i])
        last_plate_out = get_last_plate_out()
        # PUSH DATA TO API FOR PLATE OUT
        if get_plate is not None:
            save_plate_out = match_plate_out(get_plate, time_out)
            # push_data_out_api(last_plate_out, get_plate)
            last_plate_out = get_plate
        
        # ------------------------------------------------------------------------------------------------------

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




