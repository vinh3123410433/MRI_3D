import React, { useEffect, useState } from "react";

interface Patient {
  id: string;
  full_name: string;
  condition: string;
  next_appointment: string;
  dob: string;
  gender: string;
  //   imageUrl?: string;
  medical_history: string;
}

const PatientManagement: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [addShow, setAddShow] = useState<boolean>(!!0);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(
    patients?.[0]
  );

  const filteredPatients = patients.filter(
    (patient) =>
      patient.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    fetch("http://127.0.0.1:5000/patients").then(async (resp) => {
      setPatients(await resp.json());
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Quản lý bệnh nhân
        </h1>

        {/* Search bar */}
        <div className="mb-6 flex justify-between">
          <input
            type="text"
            placeholder="Tìm kiếm bệnh nhân"
            className="w-full max-w-md px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <button className="inline-flex items-center px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500" onClick={() => setAddShow(true)}>
            Them
          </button>
        </div>

        {addShow && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            {/* <div className="relative max-w-2xl w-full bg-white rounded-xl shadow-lg"></div> */}
            <div className="relative max-w-2xl w-full bg-white rounded-xl shadow-lg">
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
              <div className="p-8">
                <div className="w-full">
                  <div className="w-full space-y-6">
                    <div>
                      <h2 className="text-center text-3xl font-extrabold text-gray-900 mb-8">
                        Them benh nhan
                      </h2>
                    </div>
                    <form className="space-y-6" onSubmit={async (event) => {
                        event.preventDefault()

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

                        const files: File = formData.get('mri_images') as File


                        // Check if a file was selected
                        if (!files || files.size <= 0) {
                            alert("file not select")
                        }
                            // Create form data for file upload
                            const imageFormData = new FormData();
                            imageFormData.append('file', files);
                            
                        // Upload MRI images
                        const resp = await fetch('http://127.0.0.1:5000/mri/upload', {
                            method: 'POST',
                            body: imageFormData,
                        })

                        if (resp.ok) {

                        }

                        // Send POST request
                        fetch('http://127.0.0.1:5000/patients', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(patientData),
                        })
                        .then(response => {
                            if (!response.ok) {
                                throw new Error('Network response was not ok');
                            }
                            return response.json();
                        })
                        .then(data => {
                            // Add the new patient to the list
                            setPatients([...patients, data]);
                            setAddShow(false);
                        })
                        .catch(error => {
                            console.error('Error adding patient:', error);
                            alert('Error adding patient');
                        });

                    }}>
                      <div className="space-y-4">
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
                            className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-base"
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
                            className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-base"
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
                            className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-base"
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
                            className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-base"
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
                            className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-base"
                            defaultValue=""
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="history"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Lịch sử khám bệnh
                          </label>
                          <textarea
                            id="history"
                            name="history"
                            rows={3}
                            className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-base"
                            placeholder="Nhập lịch sử khám bệnh"
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
                            multiple
                            className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-base"
                          />
                        </div>
                      </div>
                      <div>
                        <button
                          type="submit"
                          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors duration-200"
                        >
                          Đăng nhập
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
                    <td className="py-3">{patient.full_name}</td>
                    <td className="py-3">{patient.dob}</td>
                    <td className="py-3">{patient.condition}</td>
                    <td className="py-3">{patient.next_appointment}</td>
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
                    <p>{selectedPatient.full_name}</p>
                  </div>

                  <div>
                    <label className="font-medium text-gray-700">
                      Ngày sinh:
                    </label>
                    <p>{selectedPatient.dob}</p>
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

                  <button
                    className="mt-4 w-full bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    onClick={() => {
                      /* TODO: Implement view history */
                    }}
                  >
                    Xem anh mri
                  </button>
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
    </div>
  );
};

export default PatientManagement;
