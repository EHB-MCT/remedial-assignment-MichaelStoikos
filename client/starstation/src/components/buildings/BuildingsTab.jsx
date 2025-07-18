import { useState, useEffect } from 'react';
import axios from 'axios';
import '../buildings/BuildingsTab.css' 

const BuildingsTab = ({ userId }) => {
  const [gameState, setGameState] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchGameState = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/game/${userId}`);
      setGameState(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching game state:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGameState();
  }, [userId]);

  const buildingTypes = [
    {
      type: 'habitat',
      name: 'Basic Habitat',
      icon: '🏠',
      description: 'Produces oxygen for your colony',
      cost: { oxygen: 0, food: 0, water: 0, energy: 0, metal: 0 },
      production: '5 oxygen per 30 seconds'
    },
    {
      type: 'farm',
      name: 'Hydroponic Farm',
      icon: '🌾',
      description: 'Grows food in controlled environments',
      cost: { oxygen: 20, food: 0, water: 30, energy: 10, metal: 15 },
      production: '3 food per minute'
    },
    {
      type: 'water',
      name: 'Water Purifier',
      icon: '💧',
      description: 'Purifies and produces clean water',
      cost: { oxygen: 15, food: 0, water: 0, energy: 25, metal: 20 },
      production: '4 water per minute'
    },
    {
      type: 'generator',
      name: 'Solar Generator',
      icon: '⚡',
      description: 'Generates energy from solar radiation',
      cost: { oxygen: 10, food: 0, water: 0, energy: 0, metal: 30 },
      production: '6 energy per minute'
    },
    {
      type: 'mine',
      name: 'Metal Mine',
      icon: '⛏️',
      description: 'Extracts metal from the planet surface',
      cost: { oxygen: 25, food: 10, water: 15, energy: 20, metal: 0 },
      production: '2 metal per minute'
    }
  ];

  const canAfford = (cost) => {
    if (!gameState) return false;
    return Object.keys(cost).every(resource => 
      gameState.resources[resource] >= cost[resource]
    );
  };

  const getBuildingCount = (type) => {
    if (!gameState?.buildings) return 0;
    return gameState.buildings.filter(building => building.type === type).length;
  };

  if (loading) {
    return <div className="buildings-tab loading">Loading buildings...</div>;
  }

  return (
    <div className="buildings-tab">
      <div className="buildings-header">
        <h3>Buildings</h3>
        <p>Manage your colony structures</p>
      </div>

      <div className="buildings-content">
        <div className="current-buildings">
          <h4>Current Buildings</h4>
          <div className="buildings-grid">
            {buildingTypes.map(buildingType => {
              const count = getBuildingCount(buildingType.type);
              if (count === 0) return null;
              
              return (
                <div key={buildingType.type} className="current-building">
                  <div className="building-icon">{buildingType.icon}</div>
                  <div className="building-info">
                    <div className="building-name">{buildingType.name}</div>
                    <div className="building-count">Owned: {count}</div>
                    <div className="building-production">{buildingType.production}</div>
                  </div>
                </div>
              );
            })}
          </div>
          {gameState?.buildings?.length === 0 && (
            <p className="no-buildings">No buildings constructed yet.</p>
          )}
        </div>

        <div className="available-buildings">
          <h4>Available Buildings</h4>
          <div className="buildings-grid">
            {buildingTypes.map(buildingType => {
              const affordable = canAfford(buildingType.cost);
              const hasCost = Object.values(buildingType.cost).some(cost => cost > 0);
              
              return (
                <div 
                  key={buildingType.type} 
                  className={`available-building ${!affordable && hasCost ? 'unaffordable' : ''}`}
                >
                  <div className="building-icon">{buildingType.icon}</div>
                  <div className="building-info">
                    <div className="building-name">{buildingType.name}</div>
                    <div className="building-description">{buildingType.description}</div>
                    <div className="building-production">{buildingType.production}</div>
                    
                    {hasCost && (
                      <div className="building-cost">
                        <span>Cost:</span>
                        <div className="cost-items">
                          {Object.entries(buildingType.cost).map(([resource, amount]) => (
                            amount > 0 && (
                              <span key={resource} className="cost-item">
                                {resource === 'oxygen' && '🫧'}
                                {resource === 'food' && '🍎'}
                                {resource === 'water' && '💧'}
                                {resource === 'energy' && '⚡'}
                                {resource === 'metal' && '🔩'}
                                {amount}
                              </span>
                            )
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {!affordable && hasCost && (
                      <div className="insufficient-resources">
                        Insufficient resources
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuildingsTab; 