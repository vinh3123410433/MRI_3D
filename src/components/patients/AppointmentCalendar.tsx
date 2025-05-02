import React, { useState, useRef, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import { EventClickArg, EventChangeArg, DateClickArg } from '@fullcalendar/core';
import viLocale from '@fullcalendar/core/locales/vi';

interface Appointment {
  id: string;
  title: string;
  start: string;
  end?: string;
  patient: {
    id: string;
    name: string;
  };
  description?: string;
  doctorComment?: string;
  backgroundColor?: string;
}

interface DateNote {
  date: string; // ISO string date
  note: string;
}

interface AppointmentCalendarProps {
  initialAppointments?: Appointment[];
  onAppointmentClick?: (appointment: Appointment) => void;
  onDateClick?: (date: Date) => void;
  onAppointmentChange?: (appointment: Appointment) => void;
  onNavigateHome?: () => void;
}

const AppointmentCalendar: React.FC<AppointmentCalendarProps> = ({
  initialAppointments = [],
  onAppointmentClick,
  onDateClick,
  onAppointmentChange,
  onNavigateHome,
}) => {
  const [viewMode, setViewMode] = useState<'dayGridMonth' | 'timeGridWeek' | 'listWeek'>('dayGridMonth');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const calendarRef = useRef<FullCalendar>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [comment, setComment] = useState("");
  
  // State for notes on specific dates (not just appointments)
  const [dateNotes, setDateNotes] = useState<DateNote[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDateNoteModal, setShowDateNoteModal] = useState(false);
  const [dateNote, setDateNote] = useState("");
  
  // Thêm state để hiển thị thông báo
  const [notification, setNotification] = useState<{show: boolean, message: string}>({
    show: false,
    message: ""
  });
  
  // Sample appointments data
  const defaultAppointments: Appointment[] = [
    {
      id: '1',
      title: '7:45 Nguyễn V.A.',
      start: new Date(2025, 3, 17, 7, 45).toISOString(),
      end: new Date(2025, 3, 17, 8, 30).toISOString(),
      patient: {
        id: '1',
        name: 'Nguyễn Văn An'
      },
      doctorComment: '',
      backgroundColor: '#4CAF50'
    },
    {
      id: '2',
      title: '5:20 Trần T.B.',
      start: new Date(2025, 3, 23, 17, 20).toISOString(),
      end: new Date(2025, 3, 23, 18, 0).toISOString(),
      patient: {
        id: '2',
        name: 'Trần Thị Bình'
      },
      doctorComment: '',
      backgroundColor: '#2196F3'
    },
    {
      id: '3',
      title: '10:00 Lê V.C.',
      start: new Date(2025, 3, 29, 10, 0).toISOString(),
      end: new Date(2025, 3, 29, 10, 45).toISOString(),
      patient: {
        id: '3',
        name: 'Lê Văn Cương'
      },
      doctorComment: '',
      backgroundColor: '#FF9800'
    }
  ];
  
  const appointments = initialAppointments.length > 0 ? initialAppointments : defaultAppointments;

  // Check if a time slot has a conflict with existing appointments
  const hasTimeConflict = (startTime: Date, endTime: Date, excludeAppointmentId?: string): boolean => {
    return appointments.some(appointment => {
      // Skip checking against the appointment we're currently editing
      if (excludeAppointmentId && appointment.id === excludeAppointmentId) {
        return false;
      }
      
      const aptStart = new Date(appointment.start);
      const aptEnd = appointment.end ? new Date(appointment.end) : new Date(aptStart.getTime() + 45 * 60000); // Default to 45 minutes if no end time
      
      // Check for overlap: 
      // If start time is before existing appointment end AND end time is after existing appointment start
      return (startTime < aptEnd && endTime > aptStart);
    });
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    const appointment = appointments.find(apt => apt.id === clickInfo.event.id);
    if (appointment) {
      setSelectedAppointment(appointment);
      setComment(appointment.doctorComment || "");
      setShowCommentModal(true);
      if (onAppointmentClick) {
        onAppointmentClick(appointment);
      }
    }
  };

  const handleDateClick = (info: DateClickArg) => {
    // When a date is clicked, check if there is already a note for this date
    const date = info.date;
    const dateString = date.toISOString().split('T')[0]; // Get just the date part YYYY-MM-DD
    
    const existingNote = dateNotes.find(n => n.date === dateString);
    
    setSelectedDate(date);
    setDateNote(existingNote?.note || "");
    setShowDateNoteModal(true);
    
    if (onDateClick) {
      onDateClick(info.date);
    }
  };

  const handleEventChange = (changeInfo: EventChangeArg) => {
    if (onAppointmentChange) {
      const updatedAppointment = appointments.find(apt => apt.id === changeInfo.event.id);
      if (updatedAppointment) {
        const newStart = changeInfo.event.start || new Date();
        const newEnd = changeInfo.event.end || new Date(newStart.getTime() + 45 * 60000);
        
        // Check for conflicts when moving an appointment
        if (!hasTimeConflict(newStart, newEnd, updatedAppointment.id)) {
          updatedAppointment.start = newStart.toISOString();
          updatedAppointment.end = newEnd.toISOString();
          onAppointmentChange(updatedAppointment);
        } else {
          alert('Không thể di chuyển lịch hẹn do trùng với lịch hẹn khác.');
          // Revert the change
          changeInfo.revert();
        }
      }
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
    if (calendarRef.current) {
      calendarRef.current.getApi().today();
    }
  };

  const handlePrev = () => {
    if (calendarRef.current) {
      const api = calendarRef.current.getApi();
      api.prev();
      setCurrentDate(api.getDate());
    }
  };

  const handleNext = () => {
    if (calendarRef.current) {
      const api = calendarRef.current.getApi();
      api.next();
      setCurrentDate(api.getDate());
    }
  };

  const handleHomeClick = () => {
    if (onNavigateHome) {
      onNavigateHome();
    } else {
      // Fallback nếu không có prop onNavigateHome
      window.location.href = '/';
    }
  };

  const handleSaveComment = () => {
    if (selectedAppointment && onAppointmentChange) {
      const updatedAppointment = {
        ...selectedAppointment,
        doctorComment: comment
      };
      onAppointmentChange(updatedAppointment);
      setShowCommentModal(false);
      setSelectedAppointment(null);
      
      // Hiển thị thông báo sau khi lưu
      setNotification({
        show: true,
        message: "Đã lưu ghi chú cho cuộc hẹn thành công!"
      });
      
      // Tự động ẩn thông báo sau 3 giây
      setTimeout(() => {
        setNotification({show: false, message: ""});
      }, 3000);
    }
  };
  
  const handleSaveDateNote = () => {
    if (selectedDate) {
      const dateString = selectedDate.toISOString().split('T')[0];
      
      // Check if there's already a note for this date
      const existingNoteIndex = dateNotes.findIndex(note => note.date === dateString);
      
      if (existingNoteIndex >= 0) {
        // Update existing note
        const updatedNotes = [...dateNotes];
        updatedNotes[existingNoteIndex] = {
          ...updatedNotes[existingNoteIndex],
          note: dateNote
        };
        setDateNotes(updatedNotes);
      } else {
        // Add new note
        setDateNotes([
          ...dateNotes,
          {
            date: dateString,
            note: dateNote
          }
        ]);
      }
      
      setShowDateNoteModal(false);
      setSelectedDate(null);
      
      // Hiển thị thông báo sau khi lưu
      setNotification({
        show: true,
        message: "Đã lưu ghi chú cho ngày thành công!"
      });
      
      // Tự động ẩn thông báo sau 3 giây
      setTimeout(() => {
        setNotification({show: false, message: ""});
      }, 3000);
    }
  };

  // Function to get background events for date notes
  const getBackgroundEvents = () => {
    return dateNotes.map(note => ({
      start: note.date,
      end: note.date,
      display: 'background',
      backgroundColor: 'rgba(200, 200, 255, 0.3)'
    }));
  };

  // Thêm CSS để tạo hiệu ứng hiển thị chỉ báo ghi chú trên lịch
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      .date-note-indicator {
        background-color: #ef4444;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        position: absolute;
        top: 2px;
        right: 2px;
        z-index: 10;
        cursor: pointer;
        box-shadow: 0 0 2px rgba(0, 0, 0, 0.3);
      }
      .date-has-note {
        position: relative;
        background-color: rgba(254, 226, 226, 0.2) !important;
      }
      .date-note-tooltip {
        position: absolute;
        background-color: white;
        border: 1px solid #ccc;
        border-radius: 4px;
        padding: 8px;
        max-width: 300px;
        z-index: 1000;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        font-size: 0.9rem;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <button 
            onClick={handleHomeClick}
            className="mr-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Trang Chủ
          </button>
          <h1 className="text-2xl font-bold text-blue-600">Lịch Làm Khám</h1>
        </div>
        <div className="flex items-center">
          <button 
            onClick={handlePrev}
            className="px-3 py-1 border rounded-md hover:bg-gray-100"
          >
            &lt;
          </button>
          <button
            onClick={handleToday}
            className="mx-2 px-3 py-1 border rounded-md hover:bg-gray-100"
          >
            Hôm nay
          </button>
          <button
            onClick={handleNext}
            className="px-3 py-1 border rounded-md hover:bg-gray-100"
          >
            &gt;
          </button>
          
          <div className="ml-4 text-xl font-medium text-blue-600">
            {currentDate.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
          </div>
          
          <div className="ml-8 flex gap-2">
            <button 
              onClick={() => setViewMode('dayGridMonth')}
              className={`px-3 py-1 rounded-md ${viewMode === 'dayGridMonth' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
            >
              Tháng
            </button>
            <button
              onClick={() => setViewMode('timeGridWeek')}
              className={`px-3 py-1 rounded-md ${viewMode === 'timeGridWeek' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
            >
              Tuần
            </button>
            <button
              onClick={() => setViewMode('listWeek')}
              className={`px-3 py-1 rounded-md ${viewMode === 'listWeek' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
            >
              Danh sách
            </button>
          </div>
        </div>
      </div>

      {/* Thêm phần thông báo */}
      {notification.show && (
        <div className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded shadow-md z-50 animate-fade-in-out">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" 
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
                clipRule="evenodd" />
            </svg>
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      <div className="calendar-container">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
          initialView={viewMode}
          headerToolbar={false}
          events={appointments}
          eventBackgroundColor="#4CAF50"
          eventBorderColor="#4CAF50"
          editable={true}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          weekends={true}
          eventClick={handleEventClick}
          dateClick={handleDateClick}
          eventChange={handleEventChange}
          locale={viLocale}
          height="auto"
          contentHeight={700}
          allDaySlot={false}
          slotMinTime="07:00:00"
          slotMaxTime="18:00:00"
          slotDuration="00:15:00"
          businessHours={{
            daysOfWeek: [1, 2, 3, 4, 5, 6],
            startTime: '07:00',
            endTime: '17:00',
          }}
          eventDidMount={(info) => {
            // Add a tooltip to show the doctor's comment
            if (info.event.extendedProps.doctorComment) {
              const tooltip = document.createElement('div');
              tooltip.classList.add('tooltip');
              tooltip.innerHTML = info.event.extendedProps.doctorComment;
              document.body.appendChild(tooltip);

              const hideTooltip = () => {
                tooltip.remove();
              };

              const showTooltip = (e: MouseEvent) => {
                const rect = info.el.getBoundingClientRect();
                tooltip.style.position = 'absolute';
                tooltip.style.top = `${rect.bottom + window.scrollY + 5}px`;
                tooltip.style.left = `${rect.left + window.scrollX}px`;
                tooltip.style.backgroundColor = 'white';
                tooltip.style.padding = '5px';
                tooltip.style.border = '1px solid #ccc';
                tooltip.style.borderRadius = '4px';
                tooltip.style.zIndex = '1000';
                tooltip.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
              };

              info.el.addEventListener('mouseenter', showTooltip as EventListener);
              info.el.addEventListener('mouseleave', hideTooltip);
            }
          }}
          eventContent={(eventInfo) => {
            const appointment = appointments.find(apt => apt.id === eventInfo.event.id);
            return (
              <div>
                <div>{eventInfo.event.title}</div>
                {appointment?.doctorComment && (
                  <div className="text-xs italic mt-1">
                    <span className="font-bold">Ghi chú:</span> {appointment.doctorComment.substring(0, 20)}
                    {appointment.doctorComment.length > 20 && '...'}
                  </div>
                )}
              </div>
            );
          }}
          dayCellDidMount={(info) => {
            // Check if there's a note for this date
            const dateString = info.date.toISOString().split('T')[0];
            const note = dateNotes.find(n => n.date === dateString);
            
            if (note) {
              // Thêm class để đánh dấu ngày có ghi chú
              info.el.classList.add('date-has-note');
              
              // Thêm badge "Ghi chú" vào ô ngày
              const noteIndicator = document.createElement('div');
              noteIndicator.classList.add('date-note-indicator');
              noteIndicator.title = note.note;
              info.el.appendChild(noteIndicator);
              
              // Thêm tooltip khi hover
              info.el.addEventListener('mouseenter', (e) => {
                const tooltip = document.createElement('div');
                tooltip.style.position = 'absolute';
                tooltip.style.top = `${(e as MouseEvent).clientY + 20}px`;
                tooltip.style.left = `${(e as MouseEvent).clientX + 10}px`;
                tooltip.style.backgroundColor = 'white';
                tooltip.style.border = '1px solid #ccc';
                tooltip.style.borderRadius = '4px';
                tooltip.style.padding = '8px';
                tooltip.style.maxWidth = '300px';
                tooltip.style.zIndex = '1000';
                tooltip.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
                tooltip.textContent = note.note;
                tooltip.classList.add('date-note-tooltip');
                document.body.appendChild(tooltip);
              });
              
              info.el.addEventListener('mouseleave', () => {
                const tooltip = document.querySelector('.date-note-tooltip');
                if (tooltip) {
                  tooltip.remove();
                }
              });
            }
          }}
          eventSources={[
            { events: appointments },
            { events: getBackgroundEvents() }
          ]}
        />
      </div>

      {/* Comment Modal for Appointments */}
      {showCommentModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                Ghi chú cho {selectedAppointment.patient.name}
              </h2>
              <button 
                onClick={() => setShowCommentModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">
                Ngày giờ khám:
              </label>
              <p>{new Date(selectedAppointment.start).toLocaleString('vi-VN')}</p>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">
                Ghi chú của bác sĩ:
              </label>
              <textarea
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={5}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Nhập ghi chú của bác sĩ..."
              />
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={() => setShowCommentModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 mr-2 hover:bg-gray-100"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleSaveComment}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Lưu ghi chú
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Note Modal for Dates */}
      {showDateNoteModal && selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                Ghi chú cho ngày {selectedDate.toLocaleDateString('vi-VN')}
              </h2>
              <button 
                onClick={() => setShowDateNoteModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">
                Ghi chú của bác sĩ:
              </label>
              <textarea
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={5}
                value={dateNote}
                onChange={(e) => setDateNote(e.target.value)}
                placeholder="Nhập ghi chú cho ngày này..."
              />
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={() => setShowDateNoteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 mr-2 hover:bg-gray-100"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleSaveDateNote}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Lưu ghi chú
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentCalendar;