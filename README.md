# 42 Matcha API

A dating app backend built with Node.js, Express, and PostgreSQL.

[Click here to go to the frontend repository.](https://github.com/marcioflaviob/42_matcha_front)

## What is this?

This is a school project developed by [Marcio Flavio](https://www.linkedin.com/in/marcioflavio/) and [Teo Rimize](https://www.linkedin.com/in/t%C3%A9o-rimize-378b3222a/).

You can access the API and its documentation at https://apimatcha.marcioflavio.com/api-docs/

You can access the whole application at https://matcha.marcioflavio.com/

This project is a complete backend for a dating application. Users can create profiles, upload pictures, like each other, chat in real-time, and schedule dates. It includes location-based matching, interest filtering, and a rating system.

## How it works

The application follows a layered architecture pattern with clear separation of concerns:
```
┌─────────────────────────────────────┐
│             API Layer               │
│        (Controllers/Routes)         │
├─────────────────────────────────────┤
│           Service Layer             │
│          (Business Logic)           │
├─────────────────────────────────────┤
│            Model Layer              │
│           (Data Access)             │
└─────────────────────────────────────┘
```

## Project structure

```
42_matcha_back/
├── api/                          
├── config/                      
├── controllers/                  # Request handlers (API layer)
│   ├── AuthController.js       
│   ├── UserController.js        
│   ├── UserInteractionsController.js 
│   ├── MessagesController.js    
│   └── ...
├── models/                       # Database operations
│   ├── User/
│   ├── UserInteractions/
│   ├── Messages/
│   └── ...
├── services/                     # Business logic
│   ├── UserService.js
│   ├── AuthService.js
│   ├── MessagesService.js
│   └── ...
├── utils/
├── exceptions/                   # Error handling
├── tests/
├── routes.js                     # API routes
└── script.sql                    # Database setup
```

## Database

The database has these main tables:
- `users` - User profiles and login info
- `user_interests` - What users are interested in
- `user_pictures` - Photo storage
- `user_interactions` - Likes, matches, blocks
- `messages` - Chat messages
- `notifications` - Push notifications
- `locations` - Where users are
- `dates` - Scheduled dates
- `interests` - Dataref of available interests

![Database Diagram](https://i.ibb.co/JwfPF9SY/Untitled.png)

## Tech stack

![Database Diagram](https://i.ibb.co/9HT0Jprb/Blank-diagram.png)

- **Node.js** with Express.js
- **Neon PostgreSQL** database
- **JWT** for authentication
- **Pusher** for real-time features (alternative for websockets)
- **Vercel Blob** for file storage
- **bcrypt** for password hashing
- **Jest** for testing

## Getting started

### You need:
- Node.js (v16+)
- PostgreSQL database
- npm

### Setup:
```bash
# Clone the repo
git clone [your-repo-url]

# Install packages
npm install

# Copy environment file
cp .env.example .env
# Edit .env with your values

# Setup database
psql -U your_user -d your_database -f script.sql

# Start server
npm run dev

# Run tests
npm test
```

### Environment variables:
```
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
PUSHER_APP_ID=your-pusher-id
PUSHER_KEY=your-pusher-key
PUSHER_SECRET=your-pusher-secret
PUSHER_CLUSTER=eu
GOOGLE_CLIENT_ID=your-google-id
GOOGLE_CLIENT_SECRET=your-google-secret
GEOCODE_API_KEY=your-geocode-key
BLOB_READ_WRITE_TOKEN=your-vercel-token
BLOB_URL=your-blob-url
EMAIL_API_KEY=your-email-key
FRONTEND_URL=http://localhost:5173
USE_HTTPS=true
```

## Testing

The API is 100% covered by unit tests

## How matching works

1. User sets preferences (age range, max distance, interests)
2. System finds users that match these criteria
3. Users are ranked by:
   - Common interests
   - Distance
   - Fame rating (how popular they are)
   - Recent activity
4. Users can like/dislike potential matches
5. When both users like each other = match
6. Matched users can chat and schedule dates

## Real-time features

Uses Pusher for WebSocket connections:
- New messages appear instantly
- Notifications for likes/matches
- Online status indicators
- Audio and video calls

## Security

- Passwords are hashed with bcrypt
- JWT tokens for authentication
- Input validation on all endpoints
- SQL injection protection
- File upload restrictions

## Notes

This is a 42 School project. The goal is to build a complete dating app backend with all the features you'd expect from a real dating app.

The frontend is separate - this is just the API that serves data and handles all