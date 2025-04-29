from flask import Flask, request, jsonify, send_file
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import os
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins=["*"])

# Configuration
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
ALLOWED_EXTENSIONS = {'nii', 'nii.gz'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///hospital.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Database Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    history = db.Column(db.Text)

class Patient(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(100), nullable=False)
    dob = db.Column(db.String(10), nullable=False)  # Format: YYYY-MM-DD
    gender = db.Column(db.String(10), nullable=False)
    condition = db.Column(db.String(200))
    next_appointment = db.Column(db.String(10))  # Format: YYYY-MM-DD
    history = db.Column(db.Text)
    mri_images = db.Column(db.Text)  # Paths to MRI images uploaded

# Helper Functions
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# API Endpoints
# 1. Patient Management
@app.route('/patients', methods=['GET'])
def get_patients():
    patients = Patient.query.all()
    result = [{
        "id": p.id,
        "full_name": p.full_name,
        "dob": p.dob,
        "gender": p.gender
    } for p in patients]
    return jsonify(result)

@app.route('/patients/search', methods=['GET'])
def search_patients():
    name = request.args.get('name')
    phone = request.args.get('phone')  # Assuming phone numbers are part of patient records
    query = Patient.query
    if name:
        query = query.filter(Patient.full_name.contains(name))
    if phone:
        query = query.filter(Patient.phone.contains(phone))
    result = [{
        "id": p.id,
        "full_name": p.full_name,
        "dob": p.dob,
        "gender": p.gender
    } for p in query.all()]
    return jsonify(result)

@app.route('/patients/<int:patient_id>', methods=['GET'])
def get_patient_details(patient_id):
    patient = Patient.query.get_or_404(patient_id)
    return jsonify({
        "id": patient.id,
        "full_name": patient.full_name,
        "dob": patient.dob,
        "gender": patient.gender,
        "condition": patient.condition,
        "next_appointment": patient.next_appointment,
        "history": patient.history,
        "mri_images": patient.mri_images.split(',') if patient.mri_images else []
    })

@app.route('/patients', methods=['POST'])
def add_patient():
    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    # Check for appointment time conflicts
    appointment_date = data.get('next_appointment', '')
    if appointment_date:
        # Check if there's any patient with the exact same appointment time
        existing_appointment = Patient.query.filter_by(next_appointment=appointment_date).first()
        if existing_appointment:
            return jsonify({
                "error": "Thời gian đã được đặt cho bệnh nhân khác",
                "message": f"Thời gian {appointment_date} đã được đặt cho bệnh nhân {existing_appointment.full_name}"
            }), 409  # Conflict status code
    
    new_patient = Patient(
        full_name=data.get('full_name'),
        dob=data.get('dob'),
        gender=data.get('gender'),
        condition=data.get('condition', ''),
        next_appointment=appointment_date,
        history=data.get('history', ''),
        mri_images=data.get('mri_images', '')
    )
        
    db.session.add(new_patient)
    db.session.commit()
        
    return jsonify({
        "id": new_patient.id,
        "full_name": new_patient.full_name,
        "dob": new_patient.dob,
        "gender": new_patient.gender,
        "condition": new_patient.condition,
        "next_appointment": new_patient.next_appointment,
        "history": new_patient.history,
        "mri_images": new_patient.mri_images,
        "message": "Patient added successfully"
    }), 201

# 2. 3D Model Handling
@app.route('/mri/upload', methods=['POST'])
def upload_mri():
    if 'file' not in request.files:
        return jsonify({"error": "No file part in the request"}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({"error": "No file selected for uploading"}), 400
    
    if file and allowed_file(file.filename):
        # Generate timestamp-based filename
        extension = file.filename.rsplit('.', 1)[1].lower()
        timestamp = datetime.utcnow().strftime('%Y%m%d%H%M%S')  # Format: YYYYMMDDHHMMSS
        new_filename = f"{timestamp}.{extension}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], new_filename)
        file.save(filepath)
        return jsonify({"message": "File uploaded successfully", "filename": new_filename}), 201
    else:
        return jsonify({"error": "Invalid file type. Only .nii and .nii.gz are allowed"}), 400

@app.route('/mri/files', methods=['GET'])
def list_uploaded_files():
    files = os.listdir(app.config['UPLOAD_FOLDER'])
    return jsonify({"files": files})

@app.route('/mri/files/<filename>', methods=['GET'])
def get_file(filename):
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    if os.path.exists(filepath):
        return jsonify({
            "message": "File available for download",
            "download_url": f"/mri/files/download/{filename}"
        })
    else:
        return jsonify({"error": "File not found"}), 404

@app.route('/mri/files/download/<filename>', methods=['GET'])
def download_file(filename):
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    if os.path.exists(filepath):
        return send_file(filepath, as_attachment=True)
    else:
        return jsonify({"error": "File not found"}), 404

# 3. User Account Features
@app.route('/register', methods=['POST'])
def register_user():
    data = request.json
    hashed_password = generate_password_hash(data['password'], method='sha256')
    user = User(full_name=data['full_name'], email=data['email'], password_hash=hashed_password)
    db.session.add(user)
    db.session.commit()
    return jsonify({"message": "User registered successfully"}), 201

@app.route('/login', methods=['POST'])
def login_user():
    data = request.json
    user = User.query.filter_by(email=data['email']).first()
    if not user or not check_password_hash(user.password_hash, data['password']):
        return jsonify({"error": "Invalid email or password"}), 401
    return jsonify({"message": "Login successful"}), 200

# Main Entry Point
if __name__ == '__main__':
    if not os.path.exists('hospital.db'):
        with app.app_context():
            db.create_all()
    app.run(debug=True)