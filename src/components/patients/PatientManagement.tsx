import React, { useState } from "react";
import PatientIntakeForm from "./forms/PatientIntakeForm";
import AppointmentCalendar from "./AppointmentCalendar";
import PatientMriViewer from "./PatientMriViewer";
import { PatientIntakeData } from "./forms/PatientIntakeForm";
import mriService from "../../services/MriService";

interface Patient {
  id: string;
  name: string;
  phone: string;
  condition: string;
  nextAppointment: string;
  birthDate: string;
  gender: string;
  medical_history: string;
}

const samplePatients: Patient[] = [
  {
    id: "1",
    name: "Nguyễn Văn An",
    phone: "0123-456-789",
    condition: "Đau đầu",
    nextAppointment: "25/04/2024",
    birthDate: "15/04/1975",
    gender: "Nam",
    medical_history: "Tiền sử bệnh: Không có",
  },
  {
    id: "2",
    name: "Trần Thị Bình",
    phone: "0987-654-321",
    condition: "Bác sĩ",
    nextAppointment: "30/04/2024",
    birthDate: "20/05/1980",
    gender: "Nữ",
    medical_history: "Tiền sử bệnh: Không có",
  },
  {
    id: "3",
    name: "Lê Văn Cương",
    phone: "0321-567-880",
    condition: "Chóng mặt",
    nextAppointment: "02/05/2024",
    birthDate: "10/08/1965",
    gender: "Nam",
    medical_history: "Tiền sử bệnh: Không có",
  },
];

type View = "patients" | "intake-form" | "calendar" | "mri-viewer" | "patient-history";

const PatientManagement: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [patients, setPatients] = useState<Patient[]>(samplePatients);
  const [addShow, setAddShow] = useState<boolean>(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(
    patients[0]
  );
  const [currentView, setCurrentView] = useState<View>("patients");

  // Removed unused appointment state variables
  
  const filteredPatients = patients.filter(
    (patient) =>
      patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.phone.includes(searchQuery)
  );

  // Removed unused hasAppointmentTimeConflict function

  const handleIntakeFormSubmit = (formData: PatientIntakeData) => {
    // Generate a unique ID for the new patient
    const newId = String(patients.length + 1);
    
    // Create a new patient object
    const newPatient: Patient = {
      id: newId,
      name: formData.patientName,
      phone: "",  // Would need to be added to the form if required
      condition: formData.symptoms,
      nextAppointment: new Date().toLocaleDateString("vi-VN"),
      birthDate: "",  // Would need to be added to the form if required
      gender: "",  // Would need to be added to the form if required
      medical_history: formData.medicalHistory,
    };
    
    // Add the new patient to the list
    setPatients([...patients, newPatient]);
    
    // Switch to the calendar view if MRI is required
    if (formData.requiresMri) {
      setCurrentView("calendar");
    } else {
      setCurrentView("patients");
      setSelectedPatient(newPatient);
    }
  };

  const handleIntakeFormCancel = () => {
    setCurrentView("patients");
  };

  // Check if the selected patient has any MRI scans
  const hasMriScans = (patientId: string) => {
    const scans = mriService.getMriDataForPatient(patientId);
    return scans.length > 0;
  };

  // Get the count of MRI scans for the selected patient
  const getMriScanCount = (patientId: string) => {
    const scans = mriService.getMriDataForPatient(patientId);
    return scans.length;
  };

  const renderView = () => {
    switch (currentView) {
      case "intake-form":
        return (
          <PatientIntakeForm 
            onSubmit={handleIntakeFormSubmit} 
            onCancel={handleIntakeFormCancel} 
          />
        );
      case "calendar":
        return (
          <AppointmentCalendar 
            onAppointmentClick={(appointment) => {
              // Find the patient associated with this appointment
              const patient = patients.find(p => p.id === appointment.patient.id);
              if (patient) {
                setSelectedPatient(patient);
                setCurrentView("patients");
              }
            }}
            onDateClick={() => {
              // Could implement functionality to create a new appointment on date click
            }}
            onNavigateHome={() => setCurrentView("patients")}
          />
        );
      case "mri-viewer":
        return selectedPatient ? (
          <PatientMriViewer
            patientId={selectedPatient.id}
            onClose={() => setCurrentView("patients")}
          />
        ) : (
          <div className="p-4 text-center">
            <p className="text-red-500">Lỗi: Không có bệnh nhân nào được chọn.</p>
            <button 
              onClick={() => setCurrentView("patients")}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md"
            >
              Quay lại
            </button>
          </div>
        );
      case "patient-history":
        return selectedPatient ? (
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-blue-600">Lịch sử bệnh: {selectedPatient.name}</h1>
              <button
                onClick={() => setCurrentView("patients")}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-3">Thông tin cá nhân</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600">Họ và tên:</p>
                  <p className="font-medium">{selectedPatient.name}</p>
                </div>
                <div>
                  <p className="text-gray-600">Ngày sinh:</p>
                  <p className="font-medium">{selectedPatient.birthDate}</p>
                </div>
                <div>
                  <p className="text-gray-600">Giới tính:</p>
                  <p className="font-medium">{selectedPatient.gender}</p>
                </div>
                <div>
                  <p className="text-gray-600">Số điện thoại:</p>
                  <p className="font-medium">{selectedPatient.phone}</p>
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-3">Tiền sử bệnh</h2>
              <div className="bg-gray-50 p-4 rounded-md">
                <p>{selectedPatient.medical_history || "Không có tiền sử bệnh"}</p>
              </div>
            </div>
            
            {/* Sample visit history - in a real app, this would be fetched from a database */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">Lịch sử khám bệnh</h2>
              
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ngày khám
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Chẩn đoán
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Bác sĩ
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ghi chú
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedPatient.id === "1" ? (
                      <>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">15/03/2025</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Đau đầu cấp tính</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">BS. Trần Văn B</td>
                          <td className="px-6 py-4 text-sm text-gray-900">Đau nửa đầu bên phải. Đã kê thuốc giảm đau.</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">25/02/2025</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Chóng mặt</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">BS. Nguyễn Thị A</td>
                          <td className="px-6 py-4 text-sm text-gray-900">Chóng mặt khi thay đổi tư thế. Đề nghị kiểm tra huyết áp định kỳ.</td>
                        </tr>
                      </>
                    ) : selectedPatient.id === "2" ? (
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">10/01/2025</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Kiểm tra sức khỏe định kỳ</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">BS. Phạm Văn C</td>
                        <td className="px-6 py-4 text-sm text-gray-900">Tình trạng sức khỏe bình thường.</td>
                      </tr>
                    ) : selectedPatient.id === "3" ? (
                      <>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">05/04/2025</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Chóng mặt</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">BS. Lê Thị D</td>
                          <td className="px-6 py-4 text-sm text-gray-900">Mất thăng bằng, buồn nôn. Đề nghị chụp MRI não để kiểm tra.</td>
                        </tr>
                      </>
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                          Không có lịch sử khám bệnh
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="flex justify-center mt-8">
              <button
                onClick={() => setCurrentView("patients")}
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Quay lại
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 text-center">
            <p className="text-red-500">Lỗi: Không có bệnh nhân nào được chọn.</p>
            <button 
              onClick={() => setCurrentView("patients")}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md"
            >
              Quay lại
            </button>
          </div>
        );
      case "patients":
      default:
        return (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-gray-900">
                Quản lý bệnh nhân
              </h1>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentView("intake-form")}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Tiếp nhận bệnh nhân mới
                </button>
                <button
                  onClick={() => setCurrentView("calendar")}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                >
                  Lịch khám
                </button>
                <button
                  onClick={() => setAddShow(true)}
                  className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
                >
                  Thêm bệnh nhân
                </button>
              </div>
            </div>

            {/* Search bar */}
            <div className="mb-6">
              <input
                type="text"
                placeholder="Tìm kiếm bệnh nhân"
                className="w-full max-w-md px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {addShow && (
              <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                <div className="relative max-w-xl w-full bg-white rounded-xl shadow-lg"> {/* Đã giảm kích thước từ max-w-2xl xuống max-w-xl */}
                  <button className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors duration-200" onClick={() => setAddShow(false)}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                  <div className="p-6"> {/* Đã giảm padding từ p-8 xuống p-6 */}
                    <div className="w-full">
                      <div className="w-full">
                        <div>
                          <h2 className="text-center text-2xl font-bold text-gray-900 mb-4"> {/* Đã giảm kích thước font và margin */}
                            Thêm bệnh nhân
                          </h2>
                        </div>
                        <form className="space-y-4" onSubmit={async (event) => { {/* Đã giảm spacing từ space-y-6 xuống space-y-4 */}
                            event.preventDefault();

                            // Get form data
                            const formData = new FormData(event.currentTarget);
                            const patientData = {
                                full_name: formData.get('name'),
                                dob: formData.get('dob'),
                                gender: formData.get('gender'),
                                condition: formData.get('condition'),
                                nextAppointment: formData.get('next_appointment'),
                                medical_history: formData.get('history'),
                                phone: "", // You may want to add a phone input field
                            };

                            const files = formData.get('mri_images') as File;

                            // Check if a file was selected
                            if (!files || files.size <= 0) {
                                alert("File không được chọn");
                                return;
                            }
                            
                            // Create form data for file upload
                            const imageFormData = new FormData();
                            imageFormData.append('file', files);
                            
                            try {
                                // Upload MRI images
                                const resp = await fetch('http://127.0.0.1:5000/mri/upload', {
                                    method: 'POST',
                                    body: imageFormData,
                                });

                                if (!resp.ok) {
                                    throw new Error('Upload failed');
                                }

                                // Send patient data
                                const patientResp = await fetch('http://127.0.0.1:5000/patients', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify(patientData),
                                });

                                if (!patientResp.ok) {
                                    throw new Error('Failed to add patient');
                                }

                                const data = await patientResp.json();
                                
                                // Add the new patient to the list
                                const newPatient: Patient = {
                                    id: data.id || String(patients.length + 1),
                                    name: data.full_name || patientData.full_name as string,
                                    phone: "",
                                    condition: data.condition || patientData.condition as string,
                                    nextAppointment: data.nextAppointment || patientData.nextAppointment as string,
                                    birthDate: data.dob || patientData.dob as string,
                                    gender: data.gender || patientData.gender as string,
                                    medical_history: data.medical_history || patientData.medical_history as string,
                                };
                                
                                setPatients([...patients, newPatient]);
                                setAddShow(false);
                            } catch (error) {
                                console.error('Error adding patient:', error);
                                alert('Lỗi khi thêm bệnh nhân');
                            }
                        }}>
                          <div className="grid grid-cols-2 gap-3"> {/* Chuyển từ layout dọc sang layout 2 cột để tiết kiệm không gian */}
                            <div>
                              <label
                                htmlFor="name"
                                className="block text-sm font-medium text-gray-700 mb-1"
                              >
                                Họ và tên
                              </label>
                              <input
                                id="name"
                                name="name"
                                type="text"
                                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                                placeholder="Nhập họ và tên"
                                defaultValue=""
                              />
                            </div>
                            <div>
                              <label
                                htmlFor="dob"
                                className="block text-sm font-medium text-gray-700 mb-1"
                              >
                                Ngày sinh
                              </label>
                              <input
                                id="dob"
                                name="dob"
                                type="date"
                                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                                defaultValue=""
                              />
                            </div>
                            <div>
                              <label
                                htmlFor="gender"
                                className="block text-sm font-medium text-gray-700 mb-1"
                              >
                                Giới tính
                              </label>
                              <select
                                id="gender"
                                name="gender"
                                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                                defaultValue=""
                              >
                                <option value="" disabled>
                                  Chọn giới tính
                                </option>
                                <option value="Nam">Nam</option>
                                <option value="Nữ">Nữ</option>
                                <option value="Khác">Khác</option>
                              </select>
                            </div>
                            <div>
                              <label
                                htmlFor="condition"
                                className="block text-sm font-medium text-gray-700 mb-1"
                              >
                                Tình trạng
                              </label>
                              <input
                                id="condition"
                                name="condition"
                                type="text"
                                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                                placeholder="Nhập tình trạng bệnh"
                                defaultValue=""
                              />
                            </div>
                            <div>
                              <label
                                htmlFor="next_appointment"
                                className="block text-sm font-medium text-gray-700 mb-1"
                              >
                                Lịch hẹn tiếp theo
                              </label>
                              <input
                                id="next_appointment"
                                name="next_appointment"
                                type="date"
                                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                                defaultValue=""
                              />
                            </div>
                            <div>
                              <label
                                htmlFor="mri_images"
                                className="block text-sm font-medium text-gray-700 mb-1"
                              >
                                Hình ảnh MRI
                              </label>
                              <input
                                id="mri_images"
                                name="mri_images"
                                type="file"
                                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                              />
                            </div>
                          </div>
                          <div> {/* Trường nhập lịch sử khám bệnh sử dụng không gian đầy đủ */}
                            <label
                              htmlFor="history"
                              className="block text-sm font-medium text-gray-700 mb-1"
                            >
                              Lịch sử khám bệnh
                            </label>
                            {/* Giảm số dòng từ 3 xuống 2 */}
                            <textarea
                              id="history"
                              name="history"
                              rows={2}
                              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                              placeholder="Nhập lịch sử khám bệnh"
                              defaultValue=""
                            />
                          </div>
                          <div className="flex justify-between mt-4"> {/* Giảm margin-top */}
                            <button
                              type="button"
                              onClick={() => setAddShow(false)}
                              className="py-2 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
                            >
                              Hủy bỏ
                            </button>
                            <button
                              type="submit"
                              className="flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors duration-200"
                            >
                              Thêm bệnh nhân
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-6">
              {/* Patient list */}
              <div className="w-2/3 bg-white rounded-lg shadow-lg p-6">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3">Tên bệnh nhân</th>
                      <th className="text-left py-3">Số điện thoại</th>
                      <th className="text-left py-3">Tình trạng</th>
                      <th className="text-left py-3">Lịch hẹn tiếp theo</th>
                      <th className="text-left py-3">MRI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPatients.map((patient) => (
                      <tr
                        key={patient.id}
                        className={`border-b cursor-pointer hover:bg-gray-50 ${
                          selectedPatient?.id === patient.id ? "bg-blue-50" : ""
                        }`}
                        onClick={() => setSelectedPatient(patient)}
                      >
                        <td className="py-3">{patient.name}</td>
                        <td className="py-3">{patient.phone}</td>
                        <td className="py-3">{patient.condition}</td>
                        <td className="py-3">{patient.nextAppointment}</td>
                        <td className="py-3">
                          {hasMriScans(patient.id) ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {getMriScanCount(patient.id)} file
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              Không có
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Patient details */}
              <div className="w-1/3 bg-white rounded-lg shadow-lg p-6">
                {selectedPatient ? (
                  <div>
                    <h2 className="text-xl font-semibold mb-4">
                      Thông tin chi tiết
                    </h2>

                    <div className="space-y-4">
                      <div>
                        <label className="font-medium text-gray-700">Họ tên:</label>
                        <p>{selectedPatient.name}</p>
                      </div>

                      <div>
                        <label className="font-medium text-gray-700">
                          Ngày sinh:
                        </label>
                        <p>{selectedPatient.birthDate}</p>
                      </div>

                      <div>
                        <label className="font-medium text-gray-700">
                          Giới tính:
                        </label>
                        <p>{selectedPatient.gender}</p>
                      </div>

                      <div>
                        <label className="font-medium text-gray-700">
                          Tình trạng:
                        </label>
                        <p>{selectedPatient.condition}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                          onClick={() => setCurrentView("patient-history")}
                        >
                          Xem lịch sử khám bệnh
                        </button>
                        <button
                          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                          onClick={() => setCurrentView("calendar")}
                        >
                          Đặt lịch hẹn
                        </button>
                      </div>

                      {/* MRI Button */}
                      <div className="mt-4">
                        <button
                          className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-md ${
                            hasMriScans(selectedPatient.id)
                              ? "bg-purple-600 hover:bg-purple-700"
                              : "bg-gray-400 hover:bg-gray-500"
                          } text-white transition-colors`}
                          onClick={() => setCurrentView("mri-viewer")}
                          disabled={!hasMriScans(selectedPatient.id)}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                              clipRule="evenodd"
                            />
                          </svg>
                          {hasMriScans(selectedPatient.id) 
                            ? `Xem ${getMriScanCount(selectedPatient.id)} hình ảnh MRI 3D` 
                            : "Chưa có hình ảnh MRI"}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center">
                    Chọn một bệnh nhân để xem chi tiết
                  </p>
                )}
              </div>
            </div>
          </div>
        );
    }
  };

  return <div className="min-h-screen bg-gray-100 py-8">{renderView()}</div>;
};

export default PatientManagement;
