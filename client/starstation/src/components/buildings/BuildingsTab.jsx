import { useState, useEffect } from 'react';
import axios from 'axios';
import '../buildings/BuildingsTab.css' 

const BuildingsTab = ({ userId, onResourcesUpdate }) => {
  const [gameState, setGameState] = useState(null);
  const [buildingTypes, setBuildingTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [buildingMessage, setBuildingMessage] = useState('');

  const fetchGameState = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/game/${userId}`);
      setGameState(response.data);
    } catch (error) {
      console.error('Error fetching game state:', error);
    }
  };

  const fetchBuildingTypes = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/buildings');
      console.log('Building types loaded:', response.data);
      
      // Check if the data has the expected structure
      response.data.forEach(building => {
        console.log(`Building ${building.type}:`, {
          name: building.name,
          production: building.production,
          productionRate: building.productionRate,
          cost: building.cost
        });
      });
      
      setBuildingTypes(response.data);
    } catch (error) {
      console.error('Error fetching building types:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchGameState(), fetchBuildingTypes()]);
      setLoading(false);
    };
    loadData();
  }, [userId]);

  // Helper function to format production text
  const formatProduction = (production, productionRate) => {
    console.log('Formatting production:', production, 'Rate:', productionRate);
    
    if (!production || typeof production !== 'object') {
      console.log('Invalid production data:', production);
      return 'No production data';
    }
    
    const entries = Object.entries(production).filter(([_, amount]) => amount > 0);
    if (entries.length === 0) return 'No production';
    
    const formatted = entries.map(([resource, amount]) => {
      const timeUnit = productionRate === 30 ? '30 seconds' : 'minute';
      return `${amount} ${resource} per ${timeUnit}`;
    }).join(', ');
    
    console.log('Formatted production:', formatted);
    return formatted;
  };

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

  const buildBuilding = async (buildingType) => {
    try {
      console.log('Attempting to build:', buildingType);
      setBuildingMessage('Building...');
      
      const response = await axios.post(`http://localhost:5000/api/game/${userId}/build`, {
        buildingType
      });
      
      console.log('Build response:', response.data);
      setGameState(response.data.gameState);
      setBuildingMessage(response.data.message);
      
      // Notify parent component about resource update
      if (onResourcesUpdate) {
        onResourcesUpdate(response.data.gameState.resources);
      }
      
      // Clear message after 3 seconds
      setTimeout(() => setBuildingMessage(''), 3000);
    } catch (error) {
      console.error('Error building:', error);
      console.error('Error response:', error.response?.data);
      setBuildingMessage(error.response?.data?.error || 'Failed to build structure');
      
      // Clear error message after 3 seconds
      setTimeout(() => setBuildingMessage(''), 3000);
    }
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
      
      {buildingMessage && (
        <div className={`building-message ${buildingMessage.includes('Successfully') ? 'success' : 'error'}`}>
          {buildingMessage}
        </div>
      )}

      <div className="buildings-content">
        <div className="current-buildings">
          <h4>Current Buildings</h4>
          <div className="buildings-grid">
            {buildingTypes.map(buildingType => {
              const count = getBuildingCount(buildingType.type);
              if (count === 0) return null;
              
              return (
                <div key={buildingType.type} className="current-building">
                  <div className="building-icon">{buildingType.icon || '🏗️'}</div>
                  <div className="building-info">
                    <div className="building-name">{buildingType.name}</div>
                    <div className="building-count">Owned: {count}</div>
                    <div className="building-production">{formatProduction(buildingType.production, buildingType.productionRate)}</div>
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
                  <div className="building-icon">{buildingType.icon || '🏗️'}</div>
                  <div className="building-info">
                    <div className="building-name">{buildingType.name}</div>
                    <div className="building-description">{buildingType.description}</div>
                    <div className="building-production">{formatProduction(buildingType.production, buildingType.productionRate)}</div>
                    
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
                    
                    {hasCost && (
                      <button 
                        className={`build-button ${affordable ? 'affordable' : 'unaffordable'}`}
                        onClick={() => buildBuilding(buildingType.type)}
                        disabled={!affordable}
                      >
                        {affordable ? 'Build' : 'Cannot Build'}
                      </button>
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