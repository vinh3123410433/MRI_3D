import { EventChangeArg, EventClickArg } from '@fullcalendar/core';
import viLocale from '@fullcalendar/core/locales/vi';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin, { DateClickArg } from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import React, { useEffect, useRef, useState } from 'react';
import appointmentService, { Appointment, DateNote } from '../../services/AppointmentService';

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
  
  // State for appointments and date notes
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [dateNotes, setDateNotes] = useState<DateNote[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDateNoteModal, setShowDateNoteModal] = useState(false);
  const [dateNote, setDateNote] = useState("");
  
  // Notification state
  const [notification, setNotification] = useState<{show: boolean, message: string}>({
    show: false,
    message: ""
  });
    // Load appointments and date notes on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // If we have initialAppointments, use those, otherwise load from service
        const loadedAppointments = initialAppointments.length > 0 
          ? initialAppointments 
          : await appointmentService.getAllAppointments();
        setAppointments(loadedAppointments);
        
        // Load date notes
        const loadedDateNotes = await appointmentService.getAllDateNotes();
        setDateNotes(loadedDateNotes);
      } catch (error) {
        console.error('Failed to load calendar data:', error);
      }
    };

    fetchData();
  }, [initialAppointments]);

  // Check if a time slot has a conflict with existing appointments
  const hasTimeConflict = (startTime: Date, endTime: Date, excludeAppointmentId?: string): boolean => {
    return appointmentService.hasTimeConflict(startTime, endTime, excludeAppointmentId);
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

  const handleEventChange = async (changeInfo: EventChangeArg) => {
    const appointmentToUpdate = appointments.find(apt => apt.id === changeInfo.event.id);
    if (appointmentToUpdate) {
      const newStart = changeInfo.event.start || new Date();
      const newEnd = changeInfo.event.end || new Date(newStart.getTime() + 45 * 60000);
      
      // Check for conflicts when moving an appointment
      if (!hasTimeConflict(newStart, newEnd, appointmentToUpdate.id)) {
        const updatedAppointment = {
          ...appointmentToUpdate,
          start: newStart.toISOString(),
          end: newEnd.toISOString()
        };
        
        try {
          // Update in the service
          await appointmentService.updateAppointment(updatedAppointment);
          
          // Update local state
          setAppointments(prev => 
            prev.map(apt => apt.id === updatedAppointment.id ? updatedAppointment : apt)
          );
          
          // Notify parent component if provided
          if (onAppointmentChange) {
            onAppointmentChange(updatedAppointment);
          }
          
          // Show success notification
          setNotification({
            show: true,
            message: "Đã cập nhật lịch hẹn thành công!"
          });
          
          // Auto-hide notification after 3 seconds
          setTimeout(() => {
            setNotification({show: false, message: ""});
          }, 3000);
        } catch (error) {
          console.error("Error updating appointment:", error);
          changeInfo.revert();
          
          // Show error notification
          setNotification({
            show: true,
            message: "Không thể cập nhật lịch hẹn. Vui lòng thử lại."
          });
          
          setTimeout(() => {
            setNotification({show: false, message: ""});
          }, 3000);
        }
      } else {
        alert('Không thể di chuyển lịch hẹn do trùng với lịch hẹn khác.');
        // Revert the change
        changeInfo.revert();
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

  const handleSaveComment = async () => {
    if (selectedAppointment) {
      const updatedAppointment = {
        ...selectedAppointment,
        doctorComment: comment
      };
      
      try {
        // Update in the service
        await appointmentService.updateAppointment(updatedAppointment);
        
        // Update local state
        setAppointments(prev => 
          prev.map(apt => apt.id === updatedAppointment.id ? updatedAppointment : apt)
        );
        
        // Close modal and clear selection
        setShowCommentModal(false);
        setSelectedAppointment(null);
        
        // Notify parent component if provided
        if (onAppointmentChange) {
          onAppointmentChange(updatedAppointment);
        }
        
        // Show success notification
        setNotification({
          show: true,
          message: "Đã lưu ghi chú cho cuộc hẹn thành công!"
        });
        
        // Auto-hide notification after 3 seconds
        setTimeout(() => {
          setNotification({show: false, message: ""});
        }, 3000);
      } catch (error) {
        console.error("Error saving appointment comment:", error);
        
        // Show error notification
        setNotification({
          show: true,
          message: "Không thể lưu ghi chú. Vui lòng thử lại."
        });
        
        setTimeout(() => {
          setNotification({show: false, message: ""});
        }, 3000);
      }
    }
  };
  
  const handleSaveDateNote = async () => {
    if (selectedDate) {
      const dateString = selectedDate.toISOString().split('T')[0];
      const newDateNote: DateNote = {
        date: dateString,
        note: dateNote
      };
      
      try {        // Save in the service 
        await appointmentService.saveDateNote(dateString, dateNote);
        
        // Update local state
        const existingNoteIndex = dateNotes.findIndex(note => note.date === dateString);
        if (existingNoteIndex >= 0) {
          setDateNotes(prev => {
            const updated = [...prev];
            updated[existingNoteIndex] = newDateNote;
            return updated;
          });
        } else {
          setDateNotes(prev => [...prev, newDateNote]);
        }
        
        // Close modal and clear selection
        setShowDateNoteModal(false);
        setSelectedDate(null);
        
        // Show success notification
        setNotification({
          show: true,
          message: "Đã lưu ghi chú cho ngày thành công!"
        });
        
        // Auto-hide notification after 3 seconds
        setTimeout(() => {
          setNotification({show: false, message: ""});
        }, 3000);
      } catch (error) {
        console.error("Error saving date note:", error);
        
        // Show error notification
        setNotification({
          show: true,
          message: "Không thể lưu ghi chú. Vui lòng thử lại."
        });
        
        setTimeout(() => {
          setNotification({show: false, message: ""});
        }, 3000);
      }
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

  // CSS for date note indicators
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

      {/* Notification */}
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
              // Add class to mark days with notes
              info.el.classList.add('date-has-note');
              
              // Add note indicator to the day cell
              const noteIndicator = document.createElement('div');
              noteIndicator.classList.add('date-note-indicator');
              noteIndicator.title = note.note;
              info.el.appendChild(noteIndicator);
              
              // Add tooltip on hover
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