import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns';
import Modal from 'react-modal';

// スケジュールデータの型
interface Schedule {
  _id: string;
  date: string;
  title: string;
}

Modal.setAppElement('#root');

const Calendar = () => {
  const today = new Date();
  const firstDayOfMonth = startOfMonth(today);
  const lastDayOfMonth = endOfMonth(today);

  const daysInMonth = eachDayOfInterval({
    start: firstDayOfMonth,
    end: lastDayOfMonth,
  });

  const startingDayOfWeek = getDay(firstDayOfMonth);

  const [schedules, setSchedules] = useState<{[key: string]: Schedule[]}>({});
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [newScheduleTitle, setNewScheduleTitle] = useState('');

  useEffect(() => {
    fetch('http://localhost:5000/schedules')
      .then(res => res.json())
      .then((data: Schedule[]) => {
        const schedulesByDate: {[key: string]: Schedule[]} = {};
        data.forEach(schedule => {
          if (!schedulesByDate[schedule.date]) {
            schedulesByDate[schedule.date] = [];
          }
          schedulesByDate[schedule.date].push(schedule);
        });
        setSchedules(schedulesByDate);
      });
  }, []);

  const openModal = (day: Date) => {
    setSelectedDate(day);
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
    setSelectedDate(null);
    setNewScheduleTitle('');
  };

  const handleAddSchedule = () => {
    if (selectedDate && newScheduleTitle) {
      const newSchedule = {
        date: format(selectedDate, 'yyyy-MM-dd'),
        title: newScheduleTitle,
      };

      fetch('http://localhost:5000/schedules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSchedule),
      })
      .then(res => res.json())
      .then((addedSchedule: Schedule) => {
        setSchedules(prevSchedules => ({
          ...prevSchedules,
          [addedSchedule.date]: [...(prevSchedules[addedSchedule.date] || []), addedSchedule],
        }));
        closeModal();
      });
    }
  };

  const handleDeleteSchedule = (scheduleId: string, date: string) => {
    fetch(`http://localhost:5000/schedules/${scheduleId}`, {
      method: 'DELETE',
    })
    .then(() => {
      setSchedules(prevSchedules => ({
        ...prevSchedules,
        [date]: prevSchedules[date].filter(schedule => schedule._id !== scheduleId),
      }));
    })
    .catch(error => console.error('Error deleting schedule:', error));
  };

  return (
    <div className="container mx-auto p-4">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-center">
          {format(today, 'MMMM yyyy')}
        </h2>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center font-bold">{day}</div>
        ))}
        {Array.from({ length: startingDayOfWeek }).map((_, index) => (
          <div key={`empty-${index}`} className="border rounded-md p-2"></div>
        ))}
        {daysInMonth.map(day => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const daySchedules = schedules[dateKey] || [];
          return (
            <div 
              key={day.toString()} 
              className={`border rounded-md p-2 text-center cursor-pointer ${daySchedules.length > 0 ? 'bg-blue-200' : ''}`}
              onClick={() => openModal(day)}
            >
              {format(day, 'd')}
              {daySchedules.map(schedule => (
                <div key={schedule._id} className="w-2 h-2 bg-red-500 rounded-full mx-auto mt-1"></div>
              ))}
            </div>
          )
        })}
      </div>
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        contentLabel="Schedule Modal"
        className="bg-white rounded-lg p-6 max-w-sm mx-auto mt-20 border"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50"
      >
        {selectedDate && (
          <>
            <h2 className="text-xl font-bold mb-4">{format(selectedDate, 'yyyy-MM-dd')}</h2>
            <ul>
              {(schedules[format(selectedDate, 'yyyy-MM-dd')] || []).map(schedule => (
                <li key={schedule._id} className="flex justify-between items-center">
                  {schedule.title}
                  <button onClick={() => handleDeleteSchedule(schedule._id, schedule.date)} className="text-red-500 hover:text-red-700">Delete</button>
                </li>
              ))}
              {(schedules[format(selectedDate, 'yyyy-MM-dd')] || []).length === 0 && (
                <li>No events</li>
              )}
            </ul>
            <div className="mt-4">
              <input 
                type="text" 
                value={newScheduleTitle} 
                onChange={(e) => setNewScheduleTitle(e.target.value)} 
                className="border rounded-md p-2 w-full"
                placeholder="New schedule title"
              />
              <button onClick={handleAddSchedule} className="mt-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full">
                Add Schedule
              </button>
            </div>
            <button onClick={closeModal} className="mt-4 bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded w-full">
              Close
            </button>
          </>
        )}
      </Modal>
    </div>
  );
};

export default Calendar;
