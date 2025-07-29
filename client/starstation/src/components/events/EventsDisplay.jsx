import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './EventsDisplay.css';

const EventsDisplay = ({ userId, onEventTriggered }) => {
  const [activeEvent, setActiveEvent] = useState(null);
  const [eventTypes, setEventTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(0);

  // Fetch event types and current game state on component mount
  useEffect(() => {
    fetchEventTypes();
    fetchCurrentGameState();
  }, []);

  // Update time remaining every second when there's an active event
  useEffect(() => {
    let interval;
    if (activeEvent && activeEvent.endTime) {
      interval = setInterval(() => {
        const now = Date.now();
        const endTime = new Date(activeEvent.endTime).getTime();
        const remaining = Math.max(0, endTime - now);
        setTimeRemaining(remaining);
        
        // Clear event when it expires
        if (remaining <= 0) {
          setActiveEvent(null);
          setTimeRemaining(0);
          if (onEventTriggered) onEventTriggered();
        }
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeEvent, onEventTriggered]);

  // Refresh data when the component becomes visible (user switches back to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchCurrentGameState();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const fetchEventTypes = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/events');
      setEventTypes(response.data);
    } catch (error) {
      console.error('Error fetching event types:', error);
    }
  };

  const fetchCurrentGameState = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/game/${userId}`);
      if (response.data && response.data.activeEvent) {
        // Check if the event is still active (not expired)
        const now = Date.now();
        const eventEndTime = new Date(response.data.activeEvent.endTime).getTime();
        
        if (eventEndTime > now) {
          setActiveEvent(response.data.activeEvent);
        } else {
          // Event has expired, clear it
          setActiveEvent(null);
        }
      } else {
        setActiveEvent(null);
      }
    } catch (error) {
      console.error('Error fetching current game state:', error);
    }
  };

  const triggerEvent = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const response = await axios.post(`http://localhost:5000/api/game/${userId}/trigger-event`);
      
      if (response.data.event) {
        setActiveEvent(response.data.event);
        setMessage(`🌌 ${response.data.event.effects.message}`);
        if (onEventTriggered) onEventTriggered();
        // Refresh the game state to ensure we have the latest data
        await fetchCurrentGameState();
      } else {
        const message = response.data.message || 'No events available at this time';
        const debugInfo = response.data.debug ? ` (Debug: ${JSON.stringify(response.data.debug)})` : '';
        setMessage(message + debugInfo);
      }
    } catch (error) {
      console.error('Error triggering event:', error);
      setMessage('Failed to trigger event');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (milliseconds) => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getModifierText = (modifiers) => {
    const effects = [];
    Object.entries(modifiers).forEach(([resource, modifier]) => {
      if (modifier !== 1.0) {
        const percentage = modifier > 1 ? `+${Math.round((modifier - 1) * 100)}%` : `-${Math.round((1 - modifier) * 100)}%`;
        effects.push(`${resource}: ${percentage}`);
      }
    });
    return effects.join(', ');
  };

  return (
    <div className="events-display">
      <div className="events-header">
        <h3>🌌 Space Events</h3>
        <button 
          onClick={triggerEvent} 
          className="trigger-event-btn"
          disabled={loading || activeEvent}
        >
          {loading ? 'Triggering...' : 'Trigger Event'}
        </button>
      </div>

      {message && (
        <div className="event-message">
          {message}
        </div>
      )}

      {activeEvent && (
        <div className="active-event">
          <div className="event-header">
            <span className="event-icon">{activeEvent.icon}</span>
            <span className="event-name">{activeEvent.name}</span>
            <span className="event-timer">{formatTime(timeRemaining)}</span>
          </div>
          <div className="event-description">{activeEvent.description}</div>
          <div className="event-effects">
            <strong>Effects:</strong> {getModifierText(activeEvent.effects.productionModifiers)}
          </div>
        </div>
      )}

      <div className="available-events">
        <h4>Available Events</h4>
        <div className="events-grid">
          {eventTypes.map(eventType => (
            <div key={eventType.type} className="event-type">
              <div className="event-type-icon">{eventType.icon}</div>
              <div className="event-type-info">
                <div className="event-type-name">{eventType.name}</div>
                <div className="event-type-description">{eventType.description}</div>
                <div className="event-type-duration">
                  Duration: {Math.floor(eventType.duration / 60000)} minutes
                </div>
                <div className="event-type-rarity">
                  Rarity: <span className={`rarity-${eventType.rarity}`}>{eventType.rarity}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EventsDisplay; 