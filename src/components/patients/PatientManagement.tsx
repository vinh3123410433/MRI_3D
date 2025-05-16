import React, { useEffect, useState } from "react";
import mriService from "../../services/MriService";
import patientService, { Patient } from "../../services/PatientService";
import AppointmentCalendar from "./AppointmentCalendar";
import PatientMriViewer from "./PatientMriViewer";

type View =
  | "patients"
  | "calendar"
  | "mri-viewer"
  | "patient-history";

const PatientManagement: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [addShow, setAddShow] = useState<boolean>(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [currentView, setCurrentView] = useState<View>("patients");
  const [mriCountsByPatient, setMriCountsByPatient] = useState<
    Record<string, number>
  >({});

  // Load patients when component mounts
  useEffect(() => {
    const allPatients = patientService.getAllPatients();
    setPatients(allPatients);
    if (allPatients.length > 0) {
      setSelectedPatient(allPatients[0]);
    }
  }, []);

  const filteredPatients = patients.filter(
    (patient) =>
      patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.phone.includes(searchQuery)
  );

  // Check if the selected patient has any MRI scans  const [mriCountsByPatient, setMriCountsByPatient] = useState<Record<string, number>>({});

  // Load MRI counts for patients
  useEffect(() => {
    const loadMriCounts = async () => {
      const counts: Record<string, number> = {};

      for (const patient of patients) {
        try {
          const scans = await mriService.getMriDataForPatient(patient.id);
          counts[patient.id] = scans.length;
        } catch (error) {
          console.error(
            `Error loading MRI data for patient ${patient.id}:`,
            error
          );
          counts[patient.id] = 0;
        }
      }

      setMriCountsByPatient(counts);
    };

    if (patients.length > 0) {
      loadMriCounts();
    }
  }, [patients]);

  const hasMriScans = (patientId: string) => {
    return (mriCountsByPatient[patientId] || 0) > 0;
  };

  // Get the count of MRI scans for the selected patient
  const getMriScanCount = (patientId: string) => {
    return mriCountsByPatient[patientId] || 0;
  };

  const handleAddPatient = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Get form data from the event
    const formData = new FormData(event.currentTarget);
    const requiresMri = formData.get("requires_mri") === "on";

    // Create patient data object
    const patientData = {
      name: formData.get("name") as string,
      phone: (formData.get("phone") as string) || "",
      birthDate: (formData.get("dob") as string) || "",
      gender: (formData.get("gender") as string) || "",
      condition: (formData.get("condition") as string) || "",
      nextAppointment: (formData.get("next_appointment") as string) || "",
      medical_history: (formData.get("history") as string) || "",
      severity: (formData.get("severity") as string) || "Trung bình",
    };

    try {
      // Add the patient using our service
      const newPatient = await patientService.addPatient(patientData);

      // Update the patients list and close the dialog
      setPatients(patientService.getAllPatients());
      setAddShow(false);

      // Select the new patient
      setSelectedPatient(newPatient);
      
      // Navigate to calendar view if MRI is required
      if (requiresMri) {
        setCurrentView("calendar");
      }
    } catch (error) {
      console.error("Error adding patient:", error);
      alert("Có lỗi xảy ra khi thêm bệnh nhân. Vui lòng thử lại.");
    }
  };

  const renderView = () => {
    switch (currentView) {
      case "calendar":
        return (
          <AppointmentCalendar
            onAppointmentClick={(appointment) => {
              // Find the patient associated with this appointment
              const patient = patients.find(
                (p) => p.id === appointment.patient.id
              );
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
            <p className="text-red-500">
              Lỗi: Không có bệnh nhân nào được chọn.
            </p>
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
              <h1 className="text-2xl font-bold text-blue-600">
                Lịch sử bệnh: {selectedPatient.name}
              </h1>
              <button
                onClick={() => setCurrentView("patients")}
                className="text-gray-500 hover:text-gray-700"
              >
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
            </div>

            <div className="mb-6">
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <h2 className="text-lg font-semibold text-blue-800 mb-2">Thông tin bệnh nhân</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Họ và tên</p>
                    <p className="font-medium">{selectedPatient.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Ngày sinh</p>
                    <p className="font-medium">{selectedPatient.birthDate || "Không có thông tin"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Giới tính</p>
                    <p className="font-medium">{selectedPatient.gender || "Không có thông tin"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Số điện thoại</p>
                    <p className="font-medium">{selectedPatient.phone || "Không có thông tin"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Tình trạng hiện tại</p>
                    <p className="font-medium">{selectedPatient.condition || "Không có thông tin"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Lịch hẹn tiếp theo</p>
                    <p className="font-medium">{selectedPatient.nextAppointment || "Không có lịch hẹn"}</p>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h2 className="text-lg font-semibold text-blue-800 mb-3">Tiền sử bệnh</h2>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p className="text-gray-700">{selectedPatient.medical_history || "Không có tiền sử bệnh"}</p>
                </div>
              </div>

              <h2 className="text-lg font-semibold text-blue-800 mb-4">Lịch sử khám bệnh chi tiết</h2>
              
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg mb-4">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Ngày khám</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Chẩn đoán</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Bác sĩ</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Triệu chứng</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Thuốc kê đơn</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {selectedPatient.id === "1" ? (
                      <>
                        <tr>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">15/03/2025</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">Đau đầu căng thẳng</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">Bs. Nguyễn Văn X</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">Đau đầu, chóng mặt, mất ngủ</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">Paracetamol 500mg: 2 viên/ngày x 5 ngày</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">Nghỉ ngơi, giảm căng thẳng</td>
                        </tr>
                        <tr>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">25/04/2025</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">Tái khám</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">Bs. Nguyễn Văn X</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">Cải thiện nhẹ, vẫn còn đau đầu</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">Ibuprofen 400mg: 1 viên/ngày x 7 ngày</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">Theo dõi tiếp, cần chụp MRI nếu tình trạng kéo dài</td>
                        </tr>
                        <tr>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">10/05/2025</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">Theo dõi định kỳ</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">Bs. Trần Thị Y</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">Đau đầu giảm, cải thiện tình trạng giấc ngủ</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">Vitamin B Complex: 1 viên/ngày x 30 ngày</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">Tình trạng ổn định, tiếp tục theo dõi</td>
                        </tr>
                      </>
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 text-sm text-center text-gray-500">Không có dữ liệu lịch sử khám bệnh</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-6">
                <h2 className="text-lg font-semibold text-blue-800 mb-4">Lịch sử chỉ định chụp MRI</h2>
                {selectedPatient.id === "1" ? (
                  <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Ngày chỉ định</th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Loại chụp</th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Lý do</th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Bác sĩ chỉ định</th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        <tr>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">25/04/2025</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">MRI sọ não</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">Đau đầu kéo dài không rõ nguyên nhân</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">Bs. Nguyễn Văn X</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm">
                            <span className="inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold leading-5 text-green-800">Hoàn thành</span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center">Không có dữ liệu chỉ định chụp MRI</p>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-between">
              <button
                onClick={() => setCurrentView("patients")}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Quay lại
              </button>
              
              <button
                onClick={() => setCurrentView("mri-viewer")}
                className={`px-6 py-3 rounded-md ${
                  hasMriScans(selectedPatient.id) 
                    ? "bg-blue-600 text-white hover:bg-blue-700" 
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
                disabled={!hasMriScans(selectedPatient.id)}
              >
                {hasMriScans(selectedPatient.id) ? "Xem MRI 3D" : "Không có MRI"}
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 text-center">
            <p className="text-red-500">
              Lỗi: Không có bệnh nhân nào được chọn.
            </p>
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
                  onClick={() => setAddShow(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Thêm bệnh nhân mới
                </button>
                <button
                  onClick={() => setCurrentView("calendar")}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                >
                  Lịch khám
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
                <div className="relative max-w-xl w-full bg-white rounded-xl shadow-lg">
                  <button
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors duration-200"
                    onClick={() => setAddShow(false)}
                  >
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
                  <div className="p-6">
                    <div className="w-full">
                      <div className="w-full">
                        <div>
                          <h2 className="text-center text-2xl font-bold text-gray-900 mb-4">
                            Thêm bệnh nhân mới
                          </h2>
                          <p className="text-center text-gray-600 mb-4">
                            Nhập thông tin bệnh nhân mới và chọn "Yêu cầu chụp MRI" nếu cần đặt lịch chụp
                          </p>
                        </div>
                        <form className="space-y-4" onSubmit={handleAddPatient}>
                          {/* Name and Phone */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                placeholder="Nhập họ tên bệnh nhân"
                                required
                              />
                            </div>
                            <div>
                              <label
                                htmlFor="phone"
                                className="block text-sm font-medium text-gray-700 mb-1"
                              >
                                Số điện thoại
                              </label>
                              <input
                                id="phone"
                                name="phone"
                                type="text"
                                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                                placeholder="Nhập số điện thoại"
                              />
                            </div>
                          </div>

                          {/* Date of Birth and Gender */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                              >
                                <option value="">-- Chọn giới tính --</option>
                                <option value="Nam">Nam</option>
                                <option value="Nữ">Nữ</option>
                                <option value="Khác">Khác</option>
                              </select>
                            </div>
                          </div>

                          {/* Condition and Next Appointment */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                              />
                            </div>
                          </div>

                          {/* MRI Images Upload */}
                          {/* <div>
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
                              accept=".nii,.nii.gz"
                              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                            />
                          </div> */}

                          {/* Medical History */}
                          <div>
                            <label
                              htmlFor="history"
                              className="block text-sm font-medium text-gray-700 mb-1"
                            >
                              Tiền sử bệnh
                            </label>
                            <textarea
                              id="history"
                              name="history"
                              rows={3}
                              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                              placeholder="Nhập tiền sử bệnh"
                            ></textarea>
                          </div>
                          
                          {/* Severity */}
                          <div>
                            <label
                              htmlFor="severity"
                              className="block text-sm font-medium text-gray-700 mb-1"
                            >
                              Mức độ nghiêm trọng
                            </label>
                            <select
                              id="severity"
                              name="severity"
                              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                            >
                              <option value="Nhẹ">Nhẹ</option>
                              <option value="Trung bình" selected>Trung bình</option>
                              <option value="Nghiêm trọng">Nghiêm trọng</option>
                            </select>
                          </div>
                          
                          {/* Requires MRI Checkbox */}
                          <div className="flex items-center">
                            <input
                              id="requires_mri"
                              name="requires_mri"
                              type="checkbox"
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor="requires_mri" className="ml-2 block text-sm text-gray-900">
                              Yêu cầu chụp MRI
                            </label>
                          </div>

                          {/* Submit Button */}
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => setAddShow(false)}
                              className="mr-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
                            >
                              Hủy
                            </button>
                            <button
                              type="submit"
                              className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
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

            <div className="flex flex-col lg:flex-row gap-6">
              {/* Patients list */}
              <div className="p-5 w-full lg:w-2/3 bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
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
                            selectedPatient?.id === patient.id
                              ? "bg-blue-50"
                              : ""
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
              </div>

              {/* Patient details */}
              <div className="w-full lg:w-1/3 bg-white rounded-lg shadow-lg p-6">
                {selectedPatient ? (
                  <div>
                    <h2 className="text-xl font-semibold mb-4">
                      Thông tin chi tiết
                    </h2>

                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">
                          Họ và tên
                        </h3>
                        <p className="font-medium">{selectedPatient.name}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">
                            Ngày sinh
                          </h3>
                          <p className="font-medium">
                            {selectedPatient.birthDate}
                          </p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">
                            Giới tính
                          </h3>
                          <p className="font-medium">
                            {selectedPatient.gender}
                          </p>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-gray-500">
                          Số điện thoại
                        </h3>
                        <p className="font-medium">{selectedPatient.phone}</p>
                      </div>
                    </div>

                    <div className="mb-6">
                      <h2 className="text-xl font-semibold text-gray-800 mb-3">
                        Tiền sử bệnh
                      </h2>
                      <div className="bg-gray-50 p-4 rounded-md">
                        <p>
                          {selectedPatient.medical_history ||
                            "Không có tiền sử bệnh"}
                        </p>
                      </div>
                    </div>

                    {/* Sample visit history - in a real app, this would be fetched from a database */}
                    {/* Lịch sử khám bệnh */}
                    <div>
                      <h2 className="text-xl font-semibold text-gray-800 mb-3">
                        Lịch sử khám bệnh
                      </h2>

                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                Ngày khám
                              </th>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                Chẩn đoán
                              </th>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                Bác sĩ
                              </th>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                Ghi chú
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {selectedPatient.id === "1" ? (
                              <>
                                <tr>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    15/03/2025
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    Đau đầu căng thẳng
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    Bs. Nguyễn Văn X
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    Kê thuốc giảm đau, nghỉ ngơi
                                  </td>
                                </tr>
                                <tr>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    25/04/2025
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    Tái khám
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    Bs. Nguyễn Văn X
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    Theo dõi tiếp
                                  </td>
                                </tr>
                              </>
                            ) : (
                              <tr>
                                <td
                                  colSpan={4}
                                  className="px-6 py-4 text-center text-sm text-gray-500"
                                >
                                  Không có dữ liệu
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                      <div className="mt-2 text-right">
                        <button
                          className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                          onClick={() => setCurrentView("patient-history")}
                        >
                          Xem lịch sử đầy đủ
                        </button>
                      </div>
                    </div>

                    <div className="mt-6 flex gap-3">
                      <button
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors w-full"
                        onClick={() => setCurrentView("patient-history")}
                      >
                        Xem lịch sử khám bệnh
                      </button>
                    </div>

                    <div className="mt-3">
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
                            d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Xem MRI 3D
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full">
                    <svg
                      className="w-16 h-16 text-gray-300"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    <p className="mt-2 text-gray-500">
                      Chọn bệnh nhân để xem thông tin chi tiết
                    </p>
                  </div>
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
