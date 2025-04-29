import React, { useState } from 'react';

interface PatientIntakeFormProps {
  onSubmit: (formData: PatientIntakeData) => void;
  onCancel: () => void;
}

export interface PatientIntakeData {
  patientName: string;
  medicalHistory: string;
  symptoms: string;
  riskFactors: string;
  vitalSigns: string;
  severity: string;
  requiresMri: boolean;
}

const PatientIntakeForm: React.FC<PatientIntakeFormProps> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<PatientIntakeData>({
    patientName: '',
    medicalHistory: '',
    symptoms: '',
    riskFactors: '',
    vitalSigns: '',
    severity: 'Trung bình',
    requiresMri: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  // Options for dropdown selects
  const severityOptions = ['Nhẹ', 'Trung bình', 'Nghiêm trọng', 'Cấp cứu'];
  const medicalHistoryOptions = ['Không có', 'Đau đầu', 'Chóng mặt', 'Tăng huyết áp', 'Đái tháo đường', 'Khác'];
  const symptomsOptions = ['Đau đầu', 'Chóng mặt', 'Buồn nôn', 'Mất thăng bằng', 'Mờ mắt', 'Khác'];
  const riskFactorsOptions = ['Không có', 'Hút thuốc', 'Uống rượu', 'Béo phì', 'Tiểu đường', 'Cao huyết áp', 'Khác'];
  const vitalSignsOptions = ['Bình thường', 'Tăng huyết áp', 'Giảm huyết áp', 'Nhịp tim nhanh', 'Nhịp tim chậm', 'Sốt', 'Khác'];

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-blue-600 mb-6 text-center">1. Tiếp Nhận Bệnh Nhân & Khám Lâm Sàng</h1>
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          {/* Patient Name */}
          <div className="border-b pb-4">
            <label className="block text-gray-700 font-medium mb-2">
              Tên bệnh nhân
            </label>
            <input
              type="text"
              name="patientName"
              value={formData.patientName}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Medical History */}
          <div className="border-b pb-4">
            <label className="block text-gray-700 font-medium mb-2">
              Tiền sử bệnh
            </label>
            <select
              name="medicalHistory"
              value={formData.medicalHistory}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Chọn tiền sử bệnh --</option>
              {medicalHistoryOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            {formData.medicalHistory === 'Khác' && (
              <input
                type="text"
                placeholder="Nhập tiền sử bệnh khác"
                className="w-full mt-2 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) => setFormData(prev => ({ ...prev, medicalHistory: e.target.value }))}
              />
            )}
          </div>

          {/* Symptoms */}
          <div className="border-b pb-4">
            <label className="block text-gray-700 font-medium mb-2">
              Triệu chứng
            </label>
            <select
              name="symptoms"
              value={formData.symptoms}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">-- Chọn triệu chứng --</option>
              {symptomsOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            {formData.symptoms === 'Khác' && (
              <input
                type="text"
                placeholder="Nhập triệu chứng khác"
                className="w-full mt-2 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) => setFormData(prev => ({ ...prev, symptoms: e.target.value }))}
              />
            )}
          </div>

          {/* Risk Factors */}
          <div className="border-b pb-4">
            <label className="block text-gray-700 font-medium mb-2">
              Yếu tố nguy cơ
            </label>
            <select
              name="riskFactors"
              value={formData.riskFactors}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Chọn yếu tố nguy cơ --</option>
              {riskFactorsOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            {formData.riskFactors === 'Khác' && (
              <input
                type="text"
                placeholder="Nhập yếu tố nguy cơ khác"
                className="w-full mt-2 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) => setFormData(prev => ({ ...prev, riskFactors: e.target.value }))}
              />
            )}
          </div>

          {/* Vital Signs */}
          <div className="border-b pb-4">
            <label className="block text-gray-700 font-medium mb-2">
              Dấu hiệu sinh tồn
            </label>
            <select
              name="vitalSigns"
              value={formData.vitalSigns}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">-- Chọn dấu hiệu sinh tồn --</option>
              {vitalSignsOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            {formData.vitalSigns === 'Khác' && (
              <input
                type="text"
                placeholder="Nhập dấu hiệu sinh tồn khác"
                className="w-full mt-2 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) => setFormData(prev => ({ ...prev, vitalSigns: e.target.value }))}
              />
            )}
          </div>

          {/* Severity */}
          <div className="border-b pb-4">
            <label className="block text-gray-700 font-medium mb-2">
              Mức độ nghiêm trọng
            </label>
            <select
              name="severity"
              value={formData.severity}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {severityOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          {/* MRI Requirement Checkbox */}
          <div className="py-4">
            <label className="flex items-center text-gray-700">
              <input
                type="checkbox"
                name="requiresMri"
                checked={formData.requiresMri}
                onChange={handleCheckboxChange}
                className="h-5 w-5 text-blue-600 mr-2"
              />
              <span className="font-medium">Cần chụp MRI?</span>
            </label>
          </div>

          {/* Form Actions */}
          <div className="pt-4 flex justify-center">
            <button
              type="submit"
              className="bg-blue-600 text-white px-8 py-3 rounded-md text-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Lưu & Tiếp tục
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="ml-4 bg-gray-300 text-gray-800 px-6 py-3 rounded-md text-lg font-medium hover:bg-gray-400 transition-colors"
            >
              Hủy bỏ
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default PatientIntakeForm;