import React, { useEffect, useState } from 'react';
import appointmentService, { Appointment } from '../../services/AppointmentService';
import patientService, { Patient } from '../../services/PatientService';

interface AppointmentCalendarProps {
  onAppointmentClick?: (appointment: Appointment) => void;
  onDateClick?: (date: Date) => void;
  onNavigateHome?: () => void;
}

const AppointmentCalendar: React.FC<AppointmentCalendarProps> = ({
  onAppointmentClick,
  onDateClick,
  onNavigateHome,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [dateNotes, setDateNotes] = useState<Record<string, string>>({});
  const [newAppointment, setNewAppointment] = useState<{
    patientId: string;
    title: string;
    date: string;
    time: string;
    description: string;
  }>({
    patientId: '',
    title: '',
    date: '',
    time: '',
    description: '',
  });
  const [isAddingAppointment, setIsAddingAppointment] = useState(false);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [currentNote, setCurrentNote] = useState('');

  // Load appointments, patients, and date notes when component mounts
  useEffect(() => {
    const fetchData = async () => {
      // Load all appointments
      const allAppointments = await appointmentService.getAllAppointments();
      setAppointments(allAppointments);

      // Load all patients
      const allPatients = patientService.getAllPatients();
      setPatients(allPatients);

      // Load date notes
      const allDateNotes = await appointmentService.getAllDateNotes();
      const notesMap: Record<string, string> = {};
      allDateNotes.forEach((note) => {
        notesMap[note.date] = note.note;
      });
      setDateNotes(notesMap);
    };

    fetchData();
  }, []);

  // When the selected date changes, prepare the new appointment form
  useEffect(() => {
    if (selectedDate) {
      const dateStr = selectedDate.toISOString().split('T')[0];
      setNewAppointment((prev) => ({
        ...prev,
        date: dateStr,
      }));
    }
  }, [selectedDate]);

  // Navigate to previous month
  const goToPreviousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };

  // Navigate to next month
  const goToNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  };

  // Generate calendar days for the current month
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);

    // Day of the week for the first day (0-6, where 0 is Sunday)
    const firstDayOfWeek = firstDay.getDay();

    // Number of days in the month
    const daysInMonth = lastDay.getDate();

    // Generate array of days
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }

    // Add cells for each day of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  // Get appointments for a specific day
  const getAppointmentsForDay = (date: Date): Appointment[] => {
    const dateStr = date.toISOString().split('T')[0];
    return appointments.filter((appt) => appt.start.split('T')[0] === dateStr);
  };

  // Get date note for a specific day
  const getDateNote = (date: Date): string => {
    const dateStr = date.toISOString().split('T')[0];
    return dateNotes[dateStr] || '';
  };

  // Handle date click
  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    if (onDateClick) {
      onDateClick(date);
    }
  };

  // Handle appointment click
  const handleAppointmentClick = (appointment: Appointment) => {
    if (onAppointmentClick) {
      onAppointmentClick(appointment);
    }
  };

  // Handle save note
  const handleSaveNote = async () => {
    if (selectedDate) {
      const dateStr = selectedDate.toISOString().split('T')[0];
      await appointmentService.saveDateNote(dateStr, currentNote);
      
      // Update local state
      setDateNotes((prev) => ({
        ...prev,
        [dateStr]: currentNote,
      }));
      
      setIsEditingNote(false);
    }
  };

  // Handle adding new appointment
  const handleAddAppointment = async () => {
    if (!newAppointment.patientId || !newAppointment.date || !newAppointment.time) {
      alert('Vui lòng điền đầy đủ thông tin bệnh nhân, ngày và giờ hẹn');
      return;
    }

    const patient = patients.find((p) => p.id === newAppointment.patientId);
    if (!patient) {
      alert('Không tìm thấy bệnh nhân');
      return;
    }

    // Create a new appointment
    const startDateTime = `${newAppointment.date}T${newAppointment.time}:00`;
    const appointmentData = {
      title: newAppointment.title || `Lịch hẹn: ${patient.name}`,
      start: startDateTime,
      patient: {
        id: patient.id,
        name: patient.name,
      },
      description: newAppointment.description,
    };

    try {
      const newAppointmentResult = await appointmentService.addAppointment(appointmentData);
      
      // Update local state
      setAppointments((prev) => [...prev, newAppointmentResult]);
      
      // Reset form and close modal
      setNewAppointment({
        patientId: '',
        title: '',
        date: selectedDate ? selectedDate.toISOString().split('T')[0] : '',
        time: '',
        description: '',
      });
      
      setIsAddingAppointment(false);
      
      // Update patient's next appointment in the patient service
      patient.nextAppointment = new Date(startDateTime).toLocaleDateString('vi-VN');
      await patientService.updatePatient(patient);
      
    } catch (error) {
      console.error('Error adding appointment:', error);
      alert('Có lỗi xảy ra khi thêm lịch hẹn. Vui lòng thử lại.');
    }
  };

  // Delete an appointment
  const handleDeleteAppointment = async (appointmentId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa lịch hẹn này không?')) {
      try {
        await appointmentService.deleteAppointment(appointmentId);
        
        // Update local state
        setAppointments((prev) => prev.filter((appt) => appt.id !== appointmentId));
        
      } catch (error) {
        console.error('Error deleting appointment:', error);
        alert('Có lỗi xảy ra khi xóa lịch hẹn. Vui lòng thử lại.');
      }
    }
  };

  // Format time for display
  const formatTime = (dateTimeString: string): string => {
    const date = new Date(dateTimeString);
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  // Format date for display
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('vi-VN', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Get appointment count for a specific day (for the calendar day cell)
  const getAppointmentCount = (date: Date): number => {
    return getAppointmentsForDay(date).length;
  };

  // Calendar days
  const calendarDays = generateCalendarDays();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Lịch hẹn</h1>
          <p className="text-gray-500">
            Quản lý và xem lịch hẹn của tất cả bệnh nhân
          </p>
        </div>
        <div className="flex space-x-4">
          <button
            onClick={onNavigateHome}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Quay lại
          </button>
        </div>
      </div>

      {/* Calendar navigation */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">
          Tháng {currentDate.getMonth() + 1}, {currentDate.getFullYear()}
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={goToPreviousMonth}
            className="p-2 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <button
            onClick={goToNextMonth}
            className="p-2 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Calendar */}
        <div className="w-full lg:w-2/3">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Days of week header */}
            <div className="grid grid-cols-7 bg-gray-50 border-b">
              {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((day, index) => (
                <div
                  key={index}
                  className="py-2 text-center font-medium text-gray-600"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 auto-rows-fr">
              {calendarDays.map((day, index) => {
                if (day === null) {
                  return <div key={`empty-${index}`} className="border p-2 bg-gray-50"></div>;
                }

                const dateStr = day.toISOString().split('T')[0];
                const isToday = day.toDateString() === new Date().toDateString();
                const isSelected = selectedDate && day.toDateString() === selectedDate.toDateString();
                const hasAppointments = getAppointmentCount(day) > 0;
                const hasNote = getDateNote(day) !== '';

                return (
                  <div
                    key={dateStr}
                    className={`border p-2 cursor-pointer transition-colors min-h-[100px] ${
                      isToday ? 'bg-blue-50' : ''
                    } ${isSelected ? 'bg-blue-100' : ''} hover:bg-gray-50`}
                    onClick={() => handleDateClick(day)}
                  >
                    <div className="flex justify-between items-start">
                      <span
                        className={`text-sm font-medium ${
                          isToday ? 'text-blue-600' : ''
                        }`}
                      >
                        {day.getDate()}
                      </span>
                      <div className="flex space-x-1">
                        {hasAppointments && (
                          <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                            {getAppointmentCount(day)}
                          </span>
                        )}
                        {hasNote && (
                          <span className="text-yellow-500">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M18 3a1 1 0 00-1.447-.894L8.763 6H5a3 3 0 000 6h.28l1.771 5.316A1 1 0 008 18h1a1 1 0 001-1v-4.382l6.553 3.276A1 1 0 0018 15V3z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Preview of appointments */}
                    <div className="mt-1 space-y-1">
                      {getAppointmentsForDay(day)
                        .slice(0, 2)
                        .map((appt) => (
                          <div
                            key={appt.id}
                            className="text-xs bg-blue-50 rounded px-1 py-0.5 truncate"
                          >
                            {formatTime(appt.start)} {appt.patient.name}
                          </div>
                        ))}
                      {getAppointmentCount(day) > 2 && (
                        <div className="text-xs text-gray-500 font-medium">
                          +{getAppointmentCount(day) - 2} lịch khác
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Selected date details */}
        <div className="w-full lg:w-1/3">
          {selectedDate ? (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">
                  {formatDate(selectedDate)}
                </h2>
                <button
                  onClick={() => setIsAddingAppointment(true)}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                >
                  Thêm lịch hẹn
                </button>
              </div>

              {/* Date notes */}
              <div className="mb-4 p-3 bg-gray-50 rounded-md">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-700">Ghi chú ngày</h3>
                  <button
                    onClick={() => {
                      setCurrentNote(getDateNote(selectedDate));
                      setIsEditingNote(true);
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    {getDateNote(selectedDate) ? 'Sửa' : 'Thêm ghi chú'}
                  </button>
                </div>
                {isEditingNote ? (
                  <div className="space-y-2">
                    <textarea
                      value={currentNote}
                      onChange={(e) => setCurrentNote(e.target.value)}
                      className="w-full h-24 p-2 border rounded-md resize-none"
                      placeholder="Nhập ghi chú cho ngày này..."
                    ></textarea>
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => setIsEditingNote(false)}
                        className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                      >
                        Hủy
                      </button>
                      <button
                        onClick={handleSaveNote}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                      >
                        Lưu
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-600">
                    {getDateNote(selectedDate) || 'Không có ghi chú cho ngày này.'}
                  </p>
                )}
              </div>

              {/* Appointments list */}
              <div>
                <h3 className="font-medium text-gray-700 mb-2">Lịch hẹn</h3>
                <div className="space-y-3">
                  {getAppointmentsForDay(selectedDate).length > 0 ? (
                    getAppointmentsForDay(selectedDate).map((appointment) => (
                      <div
                        key={appointment.id}
                        className="p-3 bg-white border rounded-md shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{appointment.title}</h4>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleAppointmentClick(appointment)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                <path
                                  fillRule="evenodd"
                                  d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteAppointment(appointment.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                        <div className="mt-2">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Thời gian:</span>{' '}
                            {formatTime(appointment.start)}
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Bệnh nhân:</span>{' '}
                            {appointment.patient.name}
                          </p>
                          {appointment.description && (
                            <p className="text-sm text-gray-600 mt-1">
                              <span className="font-medium">Ghi chú:</span>{' '}
                              {appointment.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-4">
                      Không có lịch hẹn nào vào ngày này
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col items-center justify-center h-64">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 text-gray-400 mb-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-gray-600">Chọn một ngày để xem chi tiết</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Appointment Modal */}
      {isAddingAppointment && selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                Thêm lịch hẹn mới - {formatDate(selectedDate)}
              </h2>
              <button
                onClick={() => setIsAddingAppointment(false)}
                className="text-gray-400 hover:text-gray-600"
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

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bệnh nhân
                </label>
                <select
                  value={newAppointment.patientId}
                  onChange={(e) =>
                    setNewAppointment((prev) => ({
                      ...prev,
                      patientId: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">-- Chọn bệnh nhân --</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tiêu đề (tùy chọn)
                </label>
                <input
                  type="text"
                  value={newAppointment.title}
                  onChange={(e) =>
                    setNewAppointment((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ví dụ: Khám định kỳ, Tái khám..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Thời gian
                </label>
                <input
                  type="time"
                  value={newAppointment.time}
                  onChange={(e) =>
                    setNewAppointment((prev) => ({
                      ...prev,
                      time: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ghi chú (tùy chọn)
                </label>
                <textarea
                  value={newAppointment.description}
                  onChange={(e) =>
                    setNewAppointment((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 h-24 resize-none"
                  placeholder="Thêm ghi chú hoặc hướng dẫn cho lịch hẹn này..."
                ></textarea>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  onClick={() => setIsAddingAppointment(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleAddAppointment}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Lưu lịch hẹn
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentCalendar;