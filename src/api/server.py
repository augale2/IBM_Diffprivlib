from flask import Flask, request, jsonify, send_file
import os
from werkzeug.utils import secure_filename
import pandas as pd
import numpy as np
from flask_cors import CORS
from diffprivlib.mechanisms import Laplace, Gaussian, Geometric, Binary, ExponentialCategorical
from diffprivlib.models import LogisticRegression as dp_LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
import random

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

def noise_add(data_dict, file_path):
    df = pd.read_csv(file_path)

    # Extract parameters
    col_list = data_dict.get('private', '').split(',')
    binary_list = data_dict.get('binary', '').split(',')
    categ_list = data_dict.get('categorical', '').split(',')
    num_list = data_dict.get('numerical', '').split(',')

    try:
        params = [float(x) for x in data_dict['epsilon'].split(',')]
        local_epsilon = params[0]
        sensitivity = params[1]
        delta_val = params[2]
    except (KeyError, ValueError, IndexError):
        return None, "Invalid epsilon parameters"

    # Add noise to numerical columns
    for col in num_list:
        if col in df:
            mech = Laplace(epsilon=local_epsilon, sensitivity=sensitivity)
            df[col] = df[col].apply(lambda x: mech.randomise(x))

    # Add noise to binary columns
    for col in binary_list:
        if col in df:
            vals = df[col].dropna().unique()
            if len(vals) == 2:
                mech = Binary(epsilon=local_epsilon, sensitivity=1.0)  # Fixed sensitivity
                df[col] = df[col].apply(lambda x: mech.randomise(x))

    # Save and return path
    output_path = os.path.join(app.config['UPLOAD_FOLDER'], f'private_{os.path.basename(file_path)}')
    df.to_csv(output_path, index=False)
    return output_path, None

def model_check(data_dict, file_path):
    df = pd.read_csv(file_path)

    X_cols = data_dict.get('colinp', '').split(',')
    y_col = data_dict.get('colop', '')

    if y_col not in df or not all(col in df for col in X_cols):
        return None, None, "Invalid column names"

    X = df[X_cols]
    y = df[y_col]

    try:
        test_size = float(data_dict.get('traintest', '80,20').split(',')[1]) / 100
    except (ValueError, IndexError):
        return None, None, "Invalid train-test split"

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=test_size)

    # Non-private model
    clf = LogisticRegression()
    clf.fit(X_train, y_train)
    non_private_score = clf.score(X_test, y_test)

    # Private model
    try:
        epsilon = float(data_dict.get('mlpara', '1.0').split(',')[0])
    except ValueError:
        return None, None, "Invalid epsilon for model"

    dp_clf = dp_LogisticRegression(epsilon=epsilon)
    dp_clf.fit(X_train, y_train)
    private_score = dp_clf.score(X_test, y_test)

    return non_private_score, private_score, None

@app.route('/', methods=['POST'])
def process_file():
    if 'csvfile' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['csvfile']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    filename = secure_filename(file.filename)
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(filepath)

    if request.form.get('private') == 'on':  # Fix: Explicitly check if 'private' is set
        output_path, error = noise_add(request.form, filepath)
        if error:
            return jsonify({'error': error}), 400
        if not os.path.exists(output_path):
            return jsonify({'error': 'File processing failed'}), 500
        return send_file(output_path, as_attachment=True)
    else:
        non_private_score, private_score, error = model_check(request.form, filepath)
        if error:
            return jsonify({'error': error}), 400
        return jsonify({
            'accuracy1': non_private_score,
            'accuracy2': private_score
        })

if __name__ == '__main__':
    print("🚀 Server is running on http://127.0.0.1:5000")
    app.run(host='0.0.0.0', port=5000, debug=True)
