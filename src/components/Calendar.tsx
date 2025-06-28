import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths } from 'date-fns';
import Modal from 'react-modal';

// スケジュールデータの型
interface Schedule {
  _id: string;
  date: string;
  title: string;
}

Modal.setAppElement('#root');

const Calendar = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const firstDayOfMonth = startOfMonth(currentMonth);
  const lastDayOfMonth = endOfMonth(currentMonth);

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
      })
      .catch(error => console.error('Error fetching schedules:', error));
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
      })
      .catch(error => console.error('Error adding schedule:', error));
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

  const goToPreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  return (
    <div className="container mx-auto p-4 bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <button 
          onClick={goToPreviousMonth} 
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-l-md transition-colors duration-200"
        >
          Previous
        </button>
        <h2 className="text-3xl font-extrabold text-gray-800">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <button 
          onClick={goToNextMonth} 
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-r-md transition-colors duration-200"
        >
          Next
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2 border border-gray-300 rounded-md">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center font-bold text-gray-600 bg-gray-200 py-2 border-r border-gray-300 last:border-r-0">{day}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 border border-gray-300 rounded-md">
        {Array.from({ length: startingDayOfWeek }).map((_, index) => (
          <div key={`empty-${index}`} className="p-2 border border-gray-300"></div>
        ))}
        {daysInMonth.map(day => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const daySchedules = schedules[dateKey] || [];
          const hasSchedule = daySchedules.length > 0;
          return (
            <div 
              key={day.toString()} 
              className={`p-3 text-center border border-gray-300 cursor-pointer transition-colors duration-200 
                ${hasSchedule ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-100 hover:bg-gray-200'}`}
              onClick={() => openModal(day)}
            >
              <span className="font-semibold">{format(day, 'd')}</span>
              {hasSchedule && <div className="w-2 h-2 bg-white rounded-full mx-auto mt-1"></div>}
            </div>
          )
        })}
      </div>
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        contentLabel="Schedule Modal"
        className="bg-white rounded-lg p-6 max-w-sm mx-auto mt-20 border border-gray-300 shadow-xl"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
      >
        {selectedDate && (
          <>
            <h2 className="text-2xl font-bold mb-4 text-gray-800">{format(selectedDate, 'yyyy-MM-dd')}</h2>
            <h3 className="text-lg font-semibold mb-2 text-gray-700">Events:</h3>
            <ul>
              {(schedules[format(selectedDate, 'yyyy-MM-dd')] || []).map(schedule => (
                <li key={schedule._id} className="flex justify-between items-center py-1 border-b border-gray-200 last:border-b-0">
                  <span className="text-gray-700">{schedule.title}</span>
                  <button onClick={() => handleDeleteSchedule(schedule._id, schedule.date)} className="text-red-500 hover:text-red-700 text-sm font-medium">
                    Delete
                  </button>
                </li>
              ))}
              {(schedules[format(selectedDate, 'yyyy-MM-dd')] || []).length === 0 && (
                <li className="text-gray-500">No events for this day.</li>
              )}
            </ul>
            <div className="mt-6 pt-4 border-t border-gray-200">
              <input 
                type="text" 
                value={newScheduleTitle} 
                onChange={(e) => setNewScheduleTitle(e.target.value)} 
                className="border border-gray-300 rounded-md p-2 w-full focus:ring-blue-500 focus:border-blue-500"
                placeholder="New schedule title"
              />
              <button onClick={handleAddSchedule} className="mt-3 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md w-full transition-colors duration-200">
                Add Schedule
              </button>
            </div>
            <button onClick={closeModal} className="mt-4 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-md w-full transition-colors duration-200">
              Close
            </button>
          </>
        )}
      </Modal>
    </div>
  );
};

export default Calendar;
