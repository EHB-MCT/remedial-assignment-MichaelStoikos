# 🚀 StarStation - Space Colony Resource Management Game

A web-based resource management game where players build and manage a space colony on a distant planet. Manage resources, construct buildings, and experience dynamic space events that affect your colony's production.

## ✨ Features

### 🌌 Core Gameplay
- **Resource Management**: Manage 5 key resources (oxygen, food, water, energy, metal)
- **Building System**: Construct various buildings with different production rates
- **Real-time Production**: Resources generate automatically over time
- **Manual Harvesting**: Collect accumulated resources when ready

### 🏗️ Building System
- **Basic Habitat**: Starts with oxygen production (5 per 30 seconds)
- **Hydroponic Farm**: Produces food using water and energy
- **Water Purifier**: Generates clean water for your colony
- **Solar Generator**: Harnesses solar energy for power
- **Metal Mine**: Extracts valuable metals from the planet surface

### 🌟 Space Events System
- **Dynamic Events**: Random space phenomena affect production
- **Event Types**:
  - 🌑 Solar Eclipse: Reduces energy production by 50%
  - ☄️ Meteor Shower: Doubles metal production
  - ☢️ Cosmic Radiation: Boosts all production by 50%
  - 🔥 Solar Flare: Reduces all production by 70%
  - 🌌 Nebula Passage: Triples oxygen production
- **Event Management**: Cooldown system prevents spam triggering
- **Production Modifiers**: Events temporarily change resource generation rates

### 🔐 Authentication System
- User registration and login
- Secure password hashing with bcrypt
- Session persistence with localStorage
- Protected game routes

## 🛠️ Tech Stack

### Frontend
- **React 19** - Modern React with hooks
- **Vite** - Fast build tool and development server
- **React Router DOM** - Client-side routing and navigation
- **Axios** - HTTP client for API communication
- **CSS3** - Custom styling with modern design

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database with native driver
- **bcryptjs** - Password hashing and verification
- **CORS** - Cross-origin resource sharing

### Database
- **MongoDB Atlas** - Cloud-hosted database
- **Collections**:
  - `users` - User accounts and authentication
  - `games` - Player game states and progress
  - `buildings` - Building definitions and costs
  - `spaceEvents` - Event types and configurations

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB Atlas account
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/EHB-MCT/remedial-assignment-MichaelStoikos.git
   ```

2. **Install server dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Install client dependencies**
   ```bash
   cd ../client/starstation
   npm install
   ```

4. **Environment Setup**
   ```bash
   # In server directory, create config.env
   echo "PORT=5000" > config.env
   echo "MONGODB_URI=your_mongodb_atlas_connection_string" >> config.env
   ```

5. **Initialize Database**
   ```bash
   # In server directory
   npm run init-events
   ```

6. **Start the Application**
   ```bash
   # Terminal 1 - Start backend server
   cd server
   npm run dev
   
   # Terminal 2 - Start frontend
   cd client/starstation
   npm run dev
   ```

7. **Open your browser**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:5000

## 🎮 How to Play

### Getting Started
1. **Register** a new account or **login** with existing credentials
2. Start with a **Basic Habitat** that produces oxygen
3. **Harvest resources** manually or wait for automatic collection
4. **Build new structures** when you have sufficient resources

### Resource Management
- **Oxygen**: Essential for survival, produced by habitat
- **Food**: Sustains your colonists, produced by farms
- **Water**: Required for farming and life support
- **Energy**: Powers advanced buildings and systems
- **Metal**: Used for construction and upgrades

### Building Strategy
- Start with basic resource producers
- Balance resource costs vs. production benefits
- Consider building placement and efficiency
- Upgrade buildings to increase production rates

### Space Events
- **Trigger events** manually to experience dynamic gameplay
- **Monitor effects** on your resource production
- **Plan around** event cooldowns and durations
- **Adapt strategy** based on active event modifiers

## 📁 Project Structure

```
remedial-assignment-MichaelStoikos/
├── client/starstation/           # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Buildings/        # Building management components
│   │   │   ├── resources/        # Resource display components
│   │   │   └── events/           # Space events components
│   │   ├── App.jsx              # Main application component
│   │   └── main.jsx             # Application entry point
│   ├── package.json
│   └── vite.config.js
├── server/                       # Node.js backend
│   ├── app.js                   # Main server file
│   ├── package.json
│   └── config.env               # Environment variables
└── README.md
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User authentication

### Game Management
- `GET /api/game/:userId` - Get user's game state
- `POST /api/game/:userId/harvest` - Harvest accumulated resources
- `POST /api/game/:userId/build` - Construct new building

### Buildings
- `GET /api/buildings` - Get all building types
- `POST /api/init-buildings` - Initialize building definitions

### Space Events
- `GET /api/events` - Get all event types
- `POST /api/init-events` - Initialize event definitions
- `POST /api/game/:userId/trigger-event` - Trigger random event

## 🎯 Game Mechanics

### Resource Production
- **Time-based**: Resources generate continuously
- **Building-dependent**: Production tied to owned structures
- **Event-modified**: Space events affect production rates
- **Level scaling**: Building levels increase production

### Event System
- **Manual triggering**: Players control when events occur
- **Cooldown management**: Prevents event spam
- **Rarity weighting**: Different event types have varying chances
- **Duration tracking**: Events have specific time limits

### Building System
- **Cost validation**: Ensures sufficient resources
- **Production calculation**: Dynamic resource generation
- **Position assignment**: Random placement for new buildings
- **Type definitions**: Database-driven building specifications

## 🚧 Future Enhancements

### Planned Features
- **Building upgrades** with resource costs
- **Colony expansion** to new areas
- **Research system** for advanced technologies
- **Multiplayer support** for collaborative colonies
- **Achievement system** for player progression

### Technical Improvements
- **Real-time updates** with WebSocket integration
- **Offline support** with service workers
- **Mobile optimization** for responsive design
- **Performance monitoring** and analytics
- **Automated testing** with Jest and Cypress

## 🐛 Troubleshooting

### Common Issues

**Frontend won't start**
- Ensure Node.js version is 16+
- Clear npm cache: `npm cache clean --force`
- Delete node_modules and reinstall

**Backend connection errors**
- Check MongoDB Atlas connection string
- Verify network access and IP whitelist
- Ensure server is running on correct port

**Database initialization issues**
- Run `npm run init-events` in server directory
- Check MongoDB connection and permissions
- Verify collection names and structure

**Resource production problems**
- Check building definitions in database
- Verify event modifiers are working
- Ensure harvest timestamps are updating

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## References

- **Cursor discussion for help project**: [Cursor Discussion](cursor_starting_a_space_colony_resource.md)
- **React vite**: https://vite.dev/guide/
- **nodejs**: https://nodejs.org/fr
- **bcryptjs**: https://www.npmjs.com/package/bcryptjs
- **cors**: https://www.npmjs.com/package/cors
- **express**: https://www.npmjs.com/package/express
- **nodemon**: https://www.npmjs.com/package/nodemon 
- **React router dom**: https://reactrouter.com/
- **axios**: https://axios-http.com/docs/intro
- **ESLint**: https://eslint.org/
- **mongodb**: https://www.mongodb.com/

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📝 Terms of Usage

You can read the full Terms of Usage here [TermsOfUsage](TERMS_OF_USAGE.md).

## 🙏 Acknowledgments

- **React Team** for the amazing framework
- **MongoDB** for the robust database solution
- **Express.js** for the flexible backend framework
- **Vite** for the fast development experience

---

**StarStation** - Where your space colony dreams become reality! 🌌✨
