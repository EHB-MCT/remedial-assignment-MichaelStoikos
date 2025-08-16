import { useState, useEffect } from 'react';
import axios from 'axios';
import '../buildings/BuildingsTab.css' 

/**
 * BuildingsTab Component
 * 
 * A React component that displays and manages buildings in the space colony game.
 * Shows current owned buildings and available buildings that can be purchased.
 * 
 * @param {Object} props - Component props
 * @param {string} props.userId - The unique identifier of the current user
 * @param {Function} props.onResourcesUpdate - Callback function to notify parent component of resource changes
 * @returns {JSX.Element} The rendered buildings tab interface
 */
const BuildingsTab = ({ userId, onResourcesUpdate }) => {
  const [gameState, setGameState] = useState(null);
  const [buildingTypes, setBuildingTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [buildingMessage, setBuildingMessage] = useState('');

  /**
   * Fetches the current game state for a given user from the backend API
   * and updates the local component state.
   *
   * - Sends an HTTP GET request to the game API using the provided userId.
   * - Updates the component's state with the response data.
   * - Logs an error if the request fails (helpful for debugging).
   */
  const fetchGameState = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/game/${userId}`);
      setGameState(response.data);
    } catch (error) {
      console.error('Error fetching game state:', error);
    }
  };

  /**
   * Fetches all available building types from the backend API
   * and updates the local component state with building definitions.
   *
   * - Sends an HTTP GET request to the buildings API endpoint.
   * - Logs detailed information about each building for debugging purposes.
   * - Updates the buildingTypes state with the retrieved data.
   * - Handles errors gracefully with proper logging.
   */
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

  /**
   * useEffect hook that initializes the component by loading necessary data.
   * 
   * - Runs when the component mounts or when userId changes.
   * - Sets loading state to true during data fetching.
   * - Fetches both game state and building types concurrently using Promise.all.
   * - Sets loading state to false once all data is loaded.
   */
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchGameState(), fetchBuildingTypes()]);
      setLoading(false);
    };
    loadData();
  }, [userId]);

  /**
   * Helper function to format production information into human-readable text.
   * 
   * - Takes production data and production rate as parameters.
   * - Filters out resources with zero production.
   * - Formats the output with appropriate time units.
   * - Handles edge cases like invalid or missing production data.
   * 
   * @param {Object} production - Object containing resource production amounts
   * @param {number} productionRate - The time interval for production in seconds
   * @returns {string} Formatted production string or fallback message
   */
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

  /**
   * Determines if the player can afford to build a specific building
   * by checking if they have sufficient resources.
   * 
   * - Checks if gameState exists to avoid runtime errors.
   * - Iterates through all required resources for the building.
   * - Returns true only if ALL required resources are available.
   * - Returns false if any resource is insufficient.
   * 
   * @param {Object} cost - Object containing resource costs for the building
   * @returns {boolean} True if player can afford the building, false otherwise
   */
  const canAfford = (cost) => {
    if (!gameState) return false;
    return Object.keys(cost).every(resource => 
      gameState.resources[resource] >= cost[resource]
    );
  };

  /**
   * Counts how many buildings of a specific type the player currently owns.
   * 
   * - Safely accesses the buildings array from gameState.
   * - Filters buildings by the specified type.
   * - Returns the count of matching buildings.
   * - Handles cases where buildings array might not exist.
   * 
   * @param {string} type - The type of building to count
   * @returns {number} The number of buildings of the specified type owned by the player
   */
  const getBuildingCount = (type) => {
    if (!gameState?.buildings) return 0;
    return gameState.buildings.filter(building => building.type === type).length;
  };

  /**
   * Attempts to build a new building by sending a request to the backend API.
   * 
   * - Sends a POST request to the build API endpoint with the building type.
   * - Updates the local game state with the response from the server.
   * - Displays success/error messages to the user.
   * - Notifies the parent component about resource changes.
   * - Automatically clears messages after a timeout for better UX.
   * 
   * @param {string} buildingType - The type of building to construct
   */
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