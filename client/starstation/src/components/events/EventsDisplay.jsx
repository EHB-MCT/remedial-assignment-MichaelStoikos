import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './EventsDisplay.css';

/**
 * EventsDisplay Component
 * 
 * A React component that displays and manages space events in the space colony game.
 * Shows active events, available event types, and allows manual event triggering.
 * 
 * @param {Object} props - Component props
 * @param {string} props.userId - The unique identifier of the current user
 * @param {Function} props.onEventTriggered - Callback function to notify parent component when events are triggered
 * @returns {JSX.Element} The rendered events display interface
 */
const EventsDisplay = ({ userId, onEventTriggered }) => {
  const [activeEvent, setActiveEvent] = useState(null);
  const [eventTypes, setEventTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(0);

  /**
   * useEffect hook that initializes the component by loading event types and current game state.
   * 
   * - Runs when the component mounts.
   * - Fetches available event types from the API.
   * - Fetches current game state to check for active events.
   */
  useEffect(() => {
    fetchEventTypes();
    fetchCurrentGameState();
  }, []);

  /**
   * useEffect hook that manages the countdown timer for active events.
   * 
   * - Updates time remaining every second when there's an active event.
   * - Automatically clears expired events.
   * - Notifies parent component when events expire.
   * - Cleans up interval on unmount or when activeEvent changes.
   */
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

  /**
   * useEffect hook that refreshes data when the component becomes visible.
   * 
   * - Listens for document visibility changes.
   * - Refreshes game state when user switches back to the events tab.
   * - Ensures active events are properly displayed after tab switches.
   * - Cleans up event listener on unmount.
   */
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

  /**
   * Fetches all available event types from the backend API.
   * 
   * - Sends an HTTP GET request to the events API endpoint.
   * - Updates the eventTypes state with the retrieved data.
   * - Handles errors gracefully with proper logging.
   */
  const fetchEventTypes = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/events');
      setEventTypes(response.data);
    } catch (error) {
      console.error('Error fetching event types:', error);
    }
  };

  /**
   * Fetches the current game state to check for active events.
   * 
   * - Sends an HTTP GET request to the game API using the provided userId.
   * - Checks if there's an active event and if it's still valid.
   * - Automatically clears expired events.
   * - Updates the activeEvent state accordingly.
   */
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

  /**
   * Attempts to trigger a random space event by sending a request to the backend API.
   * 
   * - Sends a POST request to the trigger-event API endpoint.
   * - Sets loading state during the API call.
   * - Updates the activeEvent state with the triggered event.
   * - Displays success/error messages to the user.
   * - Notifies the parent component about the event trigger.
   * - Refreshes game state to ensure data consistency.
   */
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

  /**
   * Helper function to format milliseconds into a readable time string.
   * 
   * - Converts milliseconds to minutes and seconds format.
   * - Pads seconds with leading zero for consistent display.
   * - Returns formatted string in "M:SS" format.
   * 
   * @param {number} milliseconds - Time duration in milliseconds
   * @returns {string} Formatted time string in "M:SS" format
   */
  const formatTime = (milliseconds) => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  /**
   * Helper function to format production modifiers into readable text.
   * 
   * - Converts modifier values to percentage changes.
   * - Shows positive changes with "+" and negative with "-".
   * - Only displays resources that have actual modifier effects.
   * - Returns formatted string of all modifier effects.
   * 
   * @param {Object} modifiers - Object containing resource production modifiers
   * @returns {string} Formatted string of modifier effects
   */
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