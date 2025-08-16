import { useState, useEffect } from 'react';
import axios from 'axios';
import './ResourceDisplay.css'

const ResourceDisplay = ({ userId, onRef }) => {
  const [resources, setResources] = useState(null);
  const [stockedResources, setStockedResources] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastHarvest, setLastHarvest] = useState(null);
  const [activeEvent, setActiveEvent] = useState(null);

  const fetchGameState = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/game/${userId}`);
      if (response.data && response.data.resources) {
        setResources(response.data.resources);
        setStockedResources(response.data.stockedResources || {
          oxygen: 0,
          food: 0,
          water: 0,
          energy: 0,
          metal: 0
        });
        setActiveEvent(response.data.activeEvent || null);
      } else {
        console.error('Invalid game state response:', response.data);
        setResources({
          oxygen: 0,
          food: 0,
          water: 0,
          energy: 0,
          metal: 0
        });
        setStockedResources({
          oxygen: 0,
          food: 0,
          water: 0,
          energy: 0,
          metal: 0
        });
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching game state:', error);
      setResources({
        oxygen: 0,
        food: 0,
        water: 0,
        energy: 0,
        metal: 0
      });
              setStockedResources({
          oxygen: 0,
          food: 0,
          water: 0,
          energy: 0,
          metal: 0
        });
        setActiveEvent(null);
        setLoading(false);
      }
  };

  const harvestResources = async () => {
    try {
      const response = await axios.post(`http://localhost:5000/api/game/${userId}/harvest`);
      setResources(response.data.gameState.resources);
      setStockedResources({
        oxygen: 0,
        food: 0,
        water: 0,
        energy: 0,
        metal: 0
      });
      setLastHarvest(response.data.harvested);
      
      // Clear harvest message after 3 seconds
      setTimeout(() => setLastHarvest(null), 3000);
    } catch (error) {
      console.error('Error harvesting resources:', error);
    }
  };

  useEffect(() => {
    fetchGameState();
    
    // Auto-harvest every 30 seconds
    const interval = setInterval(harvestResources, 30000);
    
    // Expose refresh function to parent
    if (onRef) {
      onRef({ refresh: fetchGameState });
    }
    
    return () => clearInterval(interval);
  }, [userId, onRef]);

  if (loading) {
    return <div className="resource-display loading">Loading resources...</div>;
  }

  const resourceIcons = {
    oxygen: '🫧',
    food: '🍎',
    water: '💧',
    energy: '⚡',
    metal: '🔩'
  };

  return (
    <div className="resource-display">
      <div className="resource-header">
        <h3>Resources</h3>
        <button onClick={harvestResources} className="harvest-btn">
          🔄 Harvest
        </button>
      </div>
      
      {activeEvent && (
        <div className="active-event-notification">
          <div className="event-notification-header">
            <span className="event-notification-icon">{activeEvent.icon}</span>
            <span className="event-notification-name">{activeEvent.name}</span>
          </div>
          <div className="event-notification-message">{activeEvent.effects.message}</div>
        </div>
      )}
      
      <div className="resources-grid">
        {Object.entries(resources).map(([resource, amount]) => {
          const stocked = stockedResources[resource] || 0;
          const hasStocked = stocked > 0;
          
          return (
            <div key={resource} className={`resource-item ${hasStocked ? 'has-stocked' : ''}`}>
              <span className="resource-icon">{resourceIcons[resource]}</span>
              <span className="resource-name">{resource.charAt(0).toUpperCase() + resource.slice(1)}</span>
              <div className="resource-amounts">
                <span className="resource-amount">{amount}</span>
                {hasStocked && (
                  <span className="stocked-amount">+{stocked}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {lastHarvest && (
        <div className="harvest-message">
          <h4>Resources Harvested:</h4>
          {Object.entries(lastHarvest).map(([resource, amount]) => (
            amount > 0 && (
              <span key={resource} className="harvest-item">
                {resourceIcons[resource]} +{amount} {resource}
              </span>
            )
          ))}
        </div>
      )}
    </div>
  );
};

export default ResourceDisplay; 