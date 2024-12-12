import React, { useState, useEffect } from 'react';
import './Calendar.css';

const Calendar = () => {
  const loadFromLocalStorage = (key, defaultValue) => {
    const savedData = localStorage.getItem(key);
    console.log(`Loaded data for ${key}:`, savedData);
    try {
      if (savedData) {
        return key === 'currentDate' ? new Date(savedData) : JSON.parse(savedData);
      }
    } catch (error) {
      console.error(`Error parsing data from localStorage for ${key}:`, error);
    }
    return defaultValue;
  };

  const [currentDate, setCurrentDate] = useState(loadFromLocalStorage('currentDate', new Date()));
  const [selectedDate, setSelectedDate] = useState(loadFromLocalStorage('selectedDate', null));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [events, setEvents] = useState(loadFromLocalStorage('events', []));
  const [newEvent, setNewEvent] = useState({
    name: '',
    startTime: '',
    endTime: '',
    description: '',
    category: 'work',
  });
  const [editingEvent, setEditingEvent] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

  useEffect(() => {
    console.log('Saving events, currentDate, selectedDate to localStorage...');
    localStorage.setItem('events', JSON.stringify(events));
    localStorage.setItem('currentDate', currentDate.toISOString());
    localStorage.setItem('selectedDate', selectedDate ? selectedDate.toISOString() : null);
  }, [events, currentDate, selectedDate]);

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const openSidebar = (date) => {
    if (selectedDate && selectedDate.toLocaleDateString() === date.toLocaleDateString()) {
      return;
    }
    setSelectedDate(date);
  };

  const closeSidebar = () => {
    setSelectedDate(null);
  };

  const openModal = (event = null) => {
    if (event) {
      setEditingEvent(event);
      setNewEvent(event);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setNewEvent({ name: '', startTime: '', endTime: '', description: '', category: 'work' });
    setEditingEvent(null);
  };

  const isTimeOverlapping = (newEvent, events) => {
    return events.some(event => {
      if (event.date === newEvent.date && event !== editingEvent) {
        const eventStart = new Date(`${newEvent.date} ${event.startTime}`);
        const eventEnd = new Date(`${newEvent.date} ${event.endTime}`);
        const newEventStart = new Date(`${newEvent.date} ${newEvent.startTime}`);
        const newEventEnd = new Date(`${newEvent.date} ${newEvent.endTime}`);

        return (newEventStart < eventEnd && newEventEnd > eventStart);
      }
      return false;
    });
  };

  const saveEvent = () => {
    if (newEvent.name) {
      const newEventDetails = { ...newEvent, date: selectedDate.toLocaleDateString() };

      if (isTimeOverlapping(newEventDetails, events)) {
        alert('Event times overlap. Please choose different times.');
        return;
      }

      if (editingEvent) {
        setEvents(events.map(event => (event === editingEvent ? newEventDetails : event)));
      } else {
        setEvents([...events, newEventDetails]);
      }

      closeModal();
    } else {
      alert('Event name is required!');
    }
  };

  const deleteEvent = (eventToDelete) => {
    setEvents(events.filter(event => event !== eventToDelete));
  };

  const renderDays = () => {
    const days = [];
    const startDay = (firstDayOfMonth.getDay() + 6) % 7; 
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-empty"></div>);
    }

    for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
      const currentDayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const isCurrentDay = currentDayDate.toLocaleDateString() === new Date().toLocaleDateString(); // Highlight today's date
      const isSelectedDay = selectedDate && currentDayDate.toLocaleDateString() === selectedDate.toLocaleDateString(); // Highlight selected date

      days.push(
        <div
          key={`day-${day}`}
          className={`calendar-day ${isCurrentDay ? 'current-day' : ''} ${isSelectedDay ? 'selected-day' : ''}`}
          onClick={() => openSidebar(currentDayDate)}
        >
          {day}
        </div>
      );
    }

    return days;
  };

  const eventsForSelectedDate = events.filter(
    (event) => event.date === selectedDate?.toLocaleDateString()
  );

  const filteredEvents = eventsForSelectedDate.filter(event =>
    event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCategoryColor = (category) => {
    switch (category) {
      case 'work':
        return '#4CAF50';
      case 'personal':
        return '#FF9800'; 
      case 'other':
        return '#2196F3'; 
      default:
        return '#000'; 
    }
  };

  const exportEvents = (format) => {
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const eventsForMonth = events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear;
    });

    if (format === 'json') {
      const jsonData = JSON.stringify(eventsForMonth, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `events-${currentYear}-${currentMonth + 1}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'csv') {
      const csvData = [
        ['Name', 'Date', 'Start Time', 'End Time', 'Description', 'Category']
          .join(',')
      ];

      eventsForMonth.forEach(event => {
        csvData.push(
          [
            event.name,
            event.date,
            event.startTime,
            event.endTime,
            event.description,
            event.category
          ].join(',')
        );
      });

      const blob = new Blob([csvData.join('\n')], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `events-${currentYear}-${currentMonth + 1}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        {currentDate.toLocaleString('default', { month: 'long' })} {currentDate.getFullYear()}
      </div>
      <div className="calendar-buttons">
        <button onClick={previousMonth} className="calendar-button">Previous</button>
        <button onClick={nextMonth} className="calendar-button">Next</button>
      </div>
      <div className="calendar-grid">
        {daysOfWeek.map((day) => (
          <div key={day} className="calendar-day-header">{day}</div>
        ))}
        {renderDays()}
      </div>

      {/* Modal for adding event */}
      {isModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h3>{editingEvent ? 'Edit Event' : 'Add Event'}</h3>
            <label>
              Event Name:
              <input
                type="text"
                value={newEvent.name}
                onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
              />
            </label>
            <label>
              Start Time:
              <input
                type="time"
                value={newEvent.startTime}
                onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
              />
            </label>
            <label>
              End Time:
              <input
                type="time"
                value={newEvent.endTime}
                onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
              />
            </label>
            <label>
              Description:
              <textarea
                value={newEvent.description}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
              ></textarea>
            </label>
            <label>
              Category:
              <select
                value={newEvent.category}
                onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value })}
              >
                <option value="work">Work</option>
                <option value="personal">Personal</option>
                <option value="other">Other</option>
              </select>
            </label>
            <button onClick={saveEvent} className='Save-btn'>{editingEvent ? 'Save Changes' : 'Save'}</button>
            <button onClick={closeModal} className='Cancel-btn'>Cancel</button>
          </div>
        </div>
      )}

      {/* Event Sidebar */}
      <div className={`event-sidebar ${selectedDate ? 'open' : ''}`}>
        <div className="sidebar-header">
          <span>{selectedDate?.toLocaleDateString()}</span>
          <button className="close-button" onClick={closeSidebar}>&#x2715;</button>
        </div>
        <input
          type="text"
          placeholder="Search events..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-box"
        />
        <button className="sidebar-button" onClick={() => openModal()}>Add Event</button>
        <h3>Events</h3>
        <ul>
          {filteredEvents.length > 0 ? (
            filteredEvents.map((event, index) => (
              <li key={index} style={{ borderLeft: `5px solid ${getCategoryColor(event.category)}` }}>
                <div className="event-header">
                  <div className="event-actions">
                    <button onClick={() => openModal(event)} className='CalEdit'>	Edit</button>
                    <button onClick={() => deleteEvent(event)} className='CalDelete'>	Delete</button>
                  </div>
                  <strong>{event.name}({event.startTime} - {event.endTime})</strong>
                </div>
                {event.description}
              </li>
            ))
          ) : (
            <li>No events match your search</li>
          )}
        </ul>
        <div className='download-btns'>
          <h6>Download: </h6>
          <button onClick={() => exportEvents('json')} className="export-button">JSON</button>
          <button onClick={() => exportEvents('csv')} className="export-button">CSV</button>
      </div>
      </div>
    </div>
  );
};

export default Calendar;