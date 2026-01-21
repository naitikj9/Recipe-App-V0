# Recipe App - Mobile Recipe Collection Platform

A professional mobile recipe application built with Expo (React Native), FastAPI, and MongoDB. Perfect for discovering, saving, and creating your favorite recipes.

## 📱 Features

### User Features
- **JWT Authentication** - Secure user registration and login
- **Browse Recipes** - View 15+ pre-loaded recipes with professional food photography
- **Category Filtering** - Filter recipes by Veg, Non-Veg, Dessert, and Fast Food
- **Search Functionality** - Search recipes by name or ingredients
- **Recipe Details** - View complete recipe information including:
  - Ingredients list
  - Step-by-step instructions
  - Cooking time
  - Difficulty level
  - High-quality food images
- **Favorites System** - Save and manage favorite recipes (instant updates)
- **Create Recipes** - Add your own recipes with:
  - Camera capture support
  - Gallery photo selection
  - All recipe details
- **My Recipes** - View all recipes you've created
- **Profile Management** - User profile with logout functionality

### Technical Features
- **Real-time Updates** - Instant refresh when adding favorites or creating recipes
- **Offline Support** - JWT tokens cached locally for persistent login
- **Professional UI** - Elegant, aesthetic design with smooth animations
- **Cross-platform** - Works on iOS, Android, and Web
- **Image Optimization** - High-quality food photography from Unsplash
- **Safe Area Handling** - Proper layout for all device sizes (iPhone 15 optimized)

## 🎨 Design

### Color Scheme
- **Primary**: Deep Teal (#2C5F6F) - Professional and calming
- **Accent**: Warm Brown (#8B7355) - Elegant and inviting
- **Background**: Soft Cream (#F8F6F4) - Warm and sophisticated
- **Text**: Dark Gray (#1A1A1A) - Excellent readability

### UI Highlights
- Clean, modern interface with card-based design
- Smooth navigation with tab-based architecture
- Professional typography with proper spacing
- Soft shadows for depth
- Rounded corners (12-16px radius)
- Elegant icons from Ionicons

## 🛠️ Tech Stack

### Frontend
- **Framework**: Expo (React Native)
- **Routing**: expo-router (file-based routing)
- **UI Components**: React Native core components
- **State Management**: React Hooks (useState, useEffect, useFocusEffect)
- **HTTP Client**: Axios
- **Image Picker**: expo-image-picker (camera + gallery)
- **Storage**: @react-native-async-storage/async-storage
- **Icons**: @expo/vector-icons (Ionicons)

### Backend
- **Framework**: FastAPI (Python)
- **Database**: MongoDB (Motor async driver)
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: Passlib with bcrypt
- **Data Validation**: Pydantic models

### Development Tools
- **Language**: TypeScript (frontend), Python (backend)
- **Package Manager**: Yarn (frontend), pip (backend)
- **Linting**: ESLint (frontend)

## 📂 Project Structure

```
app/
├── backend/
│   ├── server.py           # FastAPI server with all endpoints
│   ├── requirements.txt    # Python dependencies
│   └── .env               # Database configuration
├── frontend/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login.tsx           # Login screen
│   │   │   └── register.tsx        # Registration screen
│   │   ├── (tabs)/
│   │   │   ├── _layout.tsx         # Tab navigation
│   │   │   ├── index.tsx           # Browse recipes (home)
│   │   │   ├── favorites.tsx       # Favorites screen
│   │   │   ├── add.tsx             # Create recipe
│   │   │   └── profile.tsx         # User profile
│   │   ├── recipe/
│   │   │   └── [id].tsx            # Recipe detail screen
│   │   ├── my-recipes.tsx          # User's created recipes
│   │   ├── _layout.tsx             # Root layout
│   │   └── index.tsx               # Landing/welcome screen
│   ├── assets/                     # Images and fonts
│   ├── package.json                # Node dependencies
│   ├── app.json                    # Expo configuration
│   └── .env                        # Environment variables
├── test_result.md                  # Testing documentation
└── README.md                       # This file
```

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- Python 3.11+
- MongoDB (running locally on port 27017)
- Expo Go app (for mobile testing)

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Environment is already configured in `.env`:
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=test_database
```

4. Start the backend server:
```bash
python -m uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

Backend will be available at: `http://localhost:8001`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install Node dependencies:
```bash
yarn install
```

3. Environment is already configured in `.env`:
```
EXPO_BACKEND_URL=http://localhost:8001
```

4. Start the Expo development server:
```bash
expo start
```

5. Scan QR code with Expo Go app (iOS/Android) or press 'w' for web

## 📱 Using the App

### First Time Setup
1. Open the app in Expo Go (scan QR code)
2. You'll see the welcome screen
3. Click "Create Account" to register

### Registration
- Enter your full name
- Provide email address
- Create password (minimum 6 characters)
- Automatically logs you in after registration

### Browsing Recipes
- **Home Tab**: View all recipes in a grid layout
- **Category Filter**: Tap category buttons to filter recipes
- **Search**: Use search bar to find recipes by name or ingredients
- **View Recipe**: Tap any recipe card to see full details

### Adding Favorites
1. Open any recipe
2. Tap the heart icon (top right)
3. Recipe is instantly added to your favorites
4. Go to Favorites tab to see all saved recipes

### Creating Your Own Recipe
1. Tap "Create" tab
2. Add a photo:
   - Take Photo: Opens camera
   - Choose from Gallery: Opens photo library
3. Fill in recipe details:
   - Name
   - Category
   - Ingredients (one per line)
   - Steps (one per line)
   - Cooking time
   - Difficulty
4. Tap "Add Recipe"
5. Recipe appears instantly in "My Recipes"

### Profile Features
- **My Recipes**: View all recipes you've created
- **Settings**: Access app settings (coming soon)
- **Help & Support**: Contact support at naitikjain921@gmail.com
- **About**: App version and information
- **Logout**: Sign out of your account

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/register` - Create new account
  - Body: `{ "email", "password", "name" }`
- `POST /api/auth/login` - Login to account
  - Body: `{ "email", "password" }`
  - Returns: JWT token

### Recipes
- `GET /api/recipes` - Get all recipes
- `GET /api/recipes?category=veg` - Filter by category
- `GET /api/recipes/{id}` - Get single recipe
- `POST /api/recipes` - Create recipe (requires auth)
- `GET /api/recipes/search?q=query` - Search recipes

### Favorites
- `GET /api/favorites` - Get user's favorites (requires auth)
- `POST /api/favorites` - Add to favorites (requires auth)
  - Body: `{ "recipe_id" }`
- `DELETE /api/favorites/{recipe_id}` - Remove from favorites (requires auth)


### Manual Testing
Test the following flows:
1. User registration and login
2. Browse recipes with filtering
3. Search functionality
4. View recipe details
5. Add/remove favorites
6. Create new recipe with photo
7. Profile menu navigation
8. Logout functionality



## This project demonstrates:
- **Full-stack development** (Frontend + Backend + Database)
- **Mobile app development** with React Native/Expo
- **RESTful API design** with FastAPI
- **Authentication & Authorization** with JWT
- **Database operations** with MongoDB
- **Image handling** with camera and gallery integration
- **State management** with React Hooks
- **Responsive UI design** for mobile devices
- **Professional code organization** and structure


## 🔧 Configuration

### Device Permissions (app.json)
```json
{
  "ios": {
    "infoPlist": {
      "NSCameraUsageDescription": "Take photos of your recipes",
      "NSPhotoLibraryUsageDescription": "Select photos for recipes"
    }
  },
  "android": {
    "permissions": [
      "CAMERA",
      "READ_EXTERNAL_STORAGE",
      "WRITE_EXTERNAL_STORAGE"
    ]
  }
}
```

### Environment Variables
- **Backend**: Uses `.env` for database configuration
- **Frontend**: Uses `.env` for API URL configuration
- Never hardcode sensitive information

## 📝 Development Notes

### Key Features Implemented
1. JWT-based authentication with secure token storage
2. File-based routing with expo-router
3. Real-time screen refresh with useFocusEffect
4. Image upload with both camera and gallery support
5. Professional UI with elegant color scheme
6. Safe area handling for modern devices (iPhone 15)
7. Error handling with user-friendly messages
8. Category filtering and search functionality


## 📞 Support

For issues or questions:
- **Email**: naitikjain921@gmail.com
- **Help & Support**: Available in app profile menu


---

**Version**: 1.0.0  
**Last Updated**: January 2025
