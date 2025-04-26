import React, { useState } from "react";

interface Patient {
  id: string;
  name: string;
  phone: string;
  condition: string;
  nextAppointment: string;
  birthDate: string;
  gender: string;
  //   imageUrl?: string;
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

const PatientManagement: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [patients, setPatients] = useState<Patient[]>(samplePatients);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(
    patients[0]
  );

  const filteredPatients = patients.filter(
    (patient) =>
      patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.phone.includes(searchQuery)
  );

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Quản lý bệnh nhân
        </h1>

        {/* Search bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Tìm kiếm bệnh nhân"
            className="w-full max-w-md px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

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
                    <td className="py-3">{patient.name}</td>
                    <td className="py-3">{patient.phone}</td>
                    <td className="py-3">{patient.condition}</td>
                    <td className="py-3">{patient.nextAppointment}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Patient details */}
          <div className="w-1/3 bg-white rounded-lg shadow-lg p-6">
            {selectedPatient ? (
              <div>
                {/* {selectedPatient.imageUrl && (
                  <div className="mb-6">
                    <img
                      src={selectedPatient.imageUrl}
                      alt="MRI Scan"
                      className="w-full rounded-lg"
                    />
                  </div>
                )} */}

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

                  <button
                    className="mt-4 w-full bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    onClick={() => {
                      /* TODO: Implement view history */
                    }}
                  >
                    Xem lịch sử khám bệnh
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
