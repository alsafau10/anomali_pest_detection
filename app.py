import os
import cv2
import shutil
import numpy as np
from PIL import Image
from datetime import datetime
from werkzeug.utils import secure_filename
from tensorflow.lite.python.interpreter import Interpreter
from flask import Flask, render_template, request, jsonify, send_file

app = Flask(__name__)


UPLOAD_FOLDER = 'static/upload'
RESULT_FOLDER = 'static/image/result'
MODEL_FOLDER = 'static/model'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

MODEL_PATH = os.path.join(MODEL_FOLDER, "detect.tflite")
LABELMAP_PATH = os.path.join(MODEL_FOLDER, "labelmap.txt")


interpreter = Interpreter(model_path=MODEL_PATH)
interpreter.allocate_tensors()
input_details = interpreter.get_input_details()
output_details = interpreter.get_output_details()

height = input_details[0]['shape'][1]
width = input_details[0]['shape'][2]
float_input = (input_details[0]['dtype'] == np.float32)

input_mean = 127.5
input_std = 127.5


def load_labelmap(labelmap_path):
    with open(labelmap_path, 'r') as file:
        labels = [line.strip() for line in file.readlines()]
    return labels

labels = load_labelmap(LABELMAP_PATH)# Allowed file extensions
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route('/', methods=['GET'])
def main():
    return render_template('index.html')


@app.route('/submit', methods=['GET', 'POST'])
def predict():
    if request.method == 'POST':
        if 'file' not in request.files:
            return render_template('index.html', error="No image uploaded.")

        file = request.files['file']
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(file_path)
        else:
            return render_template('index.html', error="Invalid file type.")

        
        iou_threshold = float(request.form.get('iou_threshold', 0.5))
        nms_threshold = float(request.form.get('nms_threshold', 0.5))

        
        image = cv2.imread(file_path)
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        imH, imW, _ = image.shape
        image_resized = cv2.resize(image_rgb, (width, height))
        input_data = np.expand_dims(image_resized, axis=0)

        
        if float_input:
            input_data = (np.float32(input_data) - input_mean) / input_std

        
        interpreter.set_tensor(input_details[0]['index'],input_data)
        interpreter.invoke()

        # detection metadata
        boxes = interpreter.get_tensor(output_details[1]['index'])[0] # Bounding box coordinates of detected objects
        classes = interpreter.get_tensor(output_details[3]['index'])[0] # Class index of detected objects
        scores = interpreter.get_tensor(output_details[0]['index'])[0] # Confidence of detected objects

        detections = []
        for i in range(len(scores)):
            if scores[i] > iou_threshold:
                ymin = int(max(1,(boxes[i][0] * imH)))
                xmin = int(max(1,(boxes[i][1] * imW)))
                ymax = int(min(imH,(boxes[i][2] * imH)))
                xmax = int(min(imW,(boxes[i][3] * imW)))
                # Get label name
                class_id = int(classes[i])
                label = labels[class_id] if class_id < len(labels) else "Unknown"

                detections.append({
                    "label": label,
                    "score": float(scores[i]),
                    "box": [xmin, ymin, xmax, ymax]
                })

                # gambar bounding box
                cv2.rectangle(image, (xmin, ymin), (xmax, ymax), (0, 255, 0), 2)
                cv2.putText(image, f"{label} {scores[i]:.2f}", (xmin, ymin - 10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
        # print(detections)
        # Save the result image
        now = datetime.now()
        result_filename = f"{now.strftime('%d%m%y-%H%M%S')}.png"
        result_filepath = os.path.join(RESULT_FOLDER, result_filename)
        cv2.imwrite(result_filepath, image)

        return render_template('index.html', img_path=result_filename, detections=jsonify(detections))

    return render_template('index.html', img_path=None, detections=None)

@app.route('/download-model-zip', methods=['GET'])
def download_model_zip():
    folder_path = 'static/model'
    zip_file_path = 'static/model.zip'
    print('invoek')
    shutil.make_archive('static/model', 'zip', folder_path)

    if os.path.exists(zip_file_path):
        return send_file(zip_file_path, as_attachment=True)
    else:
        return jsonify({"error": "Failed to create ZIP file."}), 500

if __name__ == '__main__':
    app.run(debug=True)
