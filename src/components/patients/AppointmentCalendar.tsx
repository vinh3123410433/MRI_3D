import React, { useState, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import { EventClickArg, EventChangeArg } from '@fullcalendar/core';
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
  backgroundColor?: string;
}

interface AppointmentCalendarProps {
  initialAppointments?: Appointment[];
  onAppointmentClick?: (appointment: Appointment) => void;
  onDateClick?: (date: Date) => void;
  onAppointmentChange?: (appointment: Appointment) => void;
  onNavigateHome?: () => void; // Thêm prop điều hướng về trang chủ
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

  // Removed unused createAppointment function

  const handleEventClick = (clickInfo: EventClickArg) => {
    const appointment = appointments.find(apt => apt.id === clickInfo.event.id);
    if (appointment && onAppointmentClick) {
      onAppointmentClick(appointment);
    }
  };

  const handleDateClick = (info: any) => {
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

  // Xử lý khi nhấn nút Trang Chủ
  const handleHomeClick = () => {
    if (onNavigateHome) {
      onNavigateHome();
    } else {
      // Fallback nếu không có prop onNavigateHome
      window.location.href = '/';
    }
  };

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

      <div className="calendar-container">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
          initialView={viewMode}
          headerToolbar={false}
          events={appointments}
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
        />
      </div>
    </div>
  );
};

export default AppointmentCalendar;