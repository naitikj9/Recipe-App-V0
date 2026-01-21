from fastapi import FastAPI, APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime, timedelta
from passlib.context import CryptContext
from bson import ObjectId
import jwt
import os
import logging

# =============================
# ENV LOADING (CRITICAL FIX)
# =============================

ROOT_DIR = Path(__file__).resolve().parent

# Force load .env explicitly
env_path = ROOT_DIR / ".env"
if not env_path.exists():
    raise RuntimeError(f".env file NOT FOUND at {env_path}")

load_dotenv(dotenv_path=env_path, override=True)

MONGO_URL = os.getenv("MONGO_URL")
DB_NAME = os.getenv("DB_NAME")
SECRET_KEY = os.getenv("SECRET_KEY")

print("ENV CHECK:", MONGO_URL, DB_NAME)

if not MONGO_URL or not DB_NAME or not SECRET_KEY:
    raise RuntimeError("ENV variables missing: MONGO_URL / DB_NAME / SECRET_KEY")

# =============================
# DATABASE
# =============================

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# =============================
# JWT CONFIG
# =============================

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7

# =============================
# SECURITY
# =============================

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Models
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    id: str
    email: str
    name: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class Recipe(BaseModel):
    id: Optional[str] = None
    name: str
    category: str
    ingredients: List[str]
    steps: List[str]
    cooking_time: str
    difficulty: str
    image: str
    created_by: Optional[str] = None
    created_at: Optional[datetime] = None

class RecipeCreate(BaseModel):
    name: str
    category: str
    ingredients: List[str]
    steps: List[str]
    cooking_time: str
    difficulty: str
    image: str

class FavoriteCreate(BaseModel):
    recipe_id: str

# Helper functions
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")

# Auth Routes
@api_router.post("/auth/register", response_model=Token)
async def register(user_data: UserRegister):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user_dict = {
        "email": user_data.email,
        "password": hash_password(user_data.password),
        "name": user_data.name,
        "created_at": datetime.utcnow()
    }
    result = await db.users.insert_one(user_dict)
    
    # Create token
    access_token = create_access_token({"user_id": str(result.inserted_id)})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(result.inserted_id),
            "email": user_data.email,
            "name": user_data.name
        }
    }

@api_router.post("/auth/login", response_model=Token)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    access_token = create_access_token({"user_id": str(user["_id"])})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(user["_id"]),
            "email": user["email"],
            "name": user["name"]
        }
    }

# Recipe Routes
@api_router.get("/recipes", response_model=List[Recipe])
async def get_recipes(category: Optional[str] = None):
    query = {}
    if category:
        query["category"] = category
    
    recipes = await db.recipes.find(query).to_list(1000)
    return [
        Recipe(
            id=str(recipe["_id"]),
            name=recipe["name"],
            category=recipe["category"],
            ingredients=recipe["ingredients"],
            steps=recipe["steps"],
            cooking_time=recipe["cooking_time"],
            difficulty=recipe["difficulty"],
            image=recipe["image"],
            created_by=recipe.get("created_by"),
            created_at=recipe.get("created_at")
        )
        for recipe in recipes
    ]

@api_router.get("/recipes/search")
async def search_recipes(q: str):
    # Search in name and ingredients
    recipes = await db.recipes.find({
        "$or": [
            {"name": {"$regex": q, "$options": "i"}},
            {"ingredients": {"$regex": q, "$options": "i"}}
        ]
    }).to_list(1000)
    
    return [
        Recipe(
            id=str(recipe["_id"]),
            name=recipe["name"],
            category=recipe["category"],
            ingredients=recipe["ingredients"],
            steps=recipe["steps"],
            cooking_time=recipe["cooking_time"],
            difficulty=recipe["difficulty"],
            image=recipe["image"],
            created_by=recipe.get("created_by"),
            created_at=recipe.get("created_at")
        )
        for recipe in recipes
    ]

@api_router.get("/recipes/{recipe_id}", response_model=Recipe)
async def get_recipe(recipe_id: str):
    try:
        recipe = await db.recipes.find_one({"_id": ObjectId(recipe_id)})
        if not recipe:
            raise HTTPException(status_code=404, detail="Recipe not found")
        
        return Recipe(
            id=str(recipe["_id"]),
            name=recipe["name"],
            category=recipe["category"],
            ingredients=recipe["ingredients"],
            steps=recipe["steps"],
            cooking_time=recipe["cooking_time"],
            difficulty=recipe["difficulty"],
            image=recipe["image"],
            created_by=recipe.get("created_by"),
            created_at=recipe.get("created_at")
        )
    except Exception:
        raise HTTPException(status_code=404, detail="Recipe not found")

@api_router.post("/recipes", response_model=Recipe)
async def create_recipe(recipe_data: RecipeCreate, current_user: dict = Depends(get_current_user)):
    recipe_dict = {
        "name": recipe_data.name,
        "category": recipe_data.category,
        "ingredients": recipe_data.ingredients,
        "steps": recipe_data.steps,
        "cooking_time": recipe_data.cooking_time,
        "difficulty": recipe_data.difficulty,
        "image": recipe_data.image,
        "created_by": str(current_user["_id"]),
        "created_at": datetime.utcnow()
    }
    
    result = await db.recipes.insert_one(recipe_dict)
    recipe_dict["id"] = str(result.inserted_id)
    
    return Recipe(**recipe_dict)

# Favorites Routes
@api_router.get("/favorites")
async def get_favorites(current_user: dict = Depends(get_current_user)):
    favorites = await db.favorites.find({"user_id": str(current_user["_id"])}).to_list(1000)
    recipe_ids = [ObjectId(fav["recipe_id"]) for fav in favorites]
    
    recipes = await db.recipes.find({"_id": {"$in": recipe_ids}}).to_list(1000)
    
    return [
        Recipe(
            id=str(recipe["_id"]),
            name=recipe["name"],
            category=recipe["category"],
            ingredients=recipe["ingredients"],
            steps=recipe["steps"],
            cooking_time=recipe["cooking_time"],
            difficulty=recipe["difficulty"],
            image=recipe["image"],
            created_by=recipe.get("created_by"),
            created_at=recipe.get("created_at")
        )
        for recipe in recipes
    ]

@api_router.post("/favorites")
async def add_favorite(favorite: FavoriteCreate, current_user: dict = Depends(get_current_user)):
    # Check if already favorited
    existing = await db.favorites.find_one({
        "user_id": str(current_user["_id"]),
        "recipe_id": favorite.recipe_id
    })
    
    if existing:
        return {"message": "Already in favorites"}
    
    await db.favorites.insert_one({
        "user_id": str(current_user["_id"]),
        "recipe_id": favorite.recipe_id,
        "created_at": datetime.utcnow()
    })
    
    return {"message": "Added to favorites"}

@api_router.delete("/favorites/{recipe_id}")
async def remove_favorite(recipe_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.favorites.delete_one({
        "user_id": str(current_user["_id"]),
        "recipe_id": recipe_id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Favorite not found")
    
    return {"message": "Removed from favorites"}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

# Initialize sample data
@app.on_event("startup")
async def startup_db():
    # Check if recipes already exist
    count = await db.recipes.count_documents({})
    if count == 0:
        # Real food images from Unsplash
        recipe_images = {
            "veg_biryani": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&h=600&fit=crop",
            "paneer": "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=800&h=600&fit=crop",
            "chicken": "https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=800&h=600&fit=crop",
            "butter_chicken": "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=800&h=600&fit=crop",
            "chocolate_cake": "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&h=600&fit=crop",
            "ice_cream": "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800&h=600&fit=crop",
            "fries": "https://images.unsplash.com/photo-1576107232684-1279f390859f?w=800&h=600&fit=crop",
            "burger": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&h=600&fit=crop",
            "dal": "https://images.unsplash.com/photo-1546833998-877b37c2e5c6?w=800&h=600&fit=crop",
            "fish": "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800&h=600&fit=crop",
            "pizza": "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&h=600&fit=crop",
            "fruit_salad": "https://images.unsplash.com/photo-1564093497595-593b96d80180?w=800&h=600&fit=crop",
            "paratha": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&h=600&fit=crop",
            "wings": "https://images.unsplash.com/photo-1608039755401-742074f0548d?w=800&h=600&fit=crop",
            "tiramisu": "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800&h=600&fit=crop"
        }
        
        # Add sample recipes
        sample_recipes = [
            {
                "name": "Vegetable Biryani",
                "category": "veg",
                "ingredients": ["Basmati rice", "Mixed vegetables", "Onions", "Tomatoes", "Spices", "Yogurt"],
                "steps": ["Wash and soak rice", "Cook vegetables with spices", "Layer rice and vegetables", "Cook on low heat"],
                "cooking_time": "45 minutes",
                "difficulty": "medium",
                "image": recipe_images["veg_biryani"],
                "created_at": datetime.utcnow()
            },
            {
                "name": "Paneer Tikka",
                "category": "veg",
                "ingredients": ["Paneer cubes", "Bell peppers", "Onions", "Yogurt", "Tikka masala", "Lemon juice"],
                "steps": ["Marinate paneer in yogurt and spices", "Skewer with vegetables", "Grill until golden", "Serve with chutney"],
                "cooking_time": "30 minutes",
                "difficulty": "easy",
                "image": recipe_images["paneer"],
                "created_at": datetime.utcnow()
            },
            {
                "name": "Grilled Chicken",
                "category": "non-veg",
                "ingredients": ["Chicken breast", "Olive oil", "Garlic", "Herbs", "Lemon", "Salt and pepper"],
                "steps": ["Marinate chicken with oil and herbs", "Preheat grill", "Grill for 6-7 minutes each side", "Rest before serving"],
                "cooking_time": "25 minutes",
                "difficulty": "easy",
                "image": recipe_images["chicken"],
                "created_at": datetime.utcnow()
            },
            {
                "name": "Butter Chicken",
                "category": "non-veg",
                "ingredients": ["Chicken", "Butter", "Tomatoes", "Cream", "Spices", "Kasuri methi"],
                "steps": ["Marinate and cook chicken", "Prepare tomato gravy", "Add cream and butter", "Simmer and serve"],
                "cooking_time": "50 minutes",
                "difficulty": "medium",
                "image": recipe_images["butter_chicken"],
                "created_at": datetime.utcnow()
            },
            {
                "name": "Chocolate Cake",
                "category": "dessert",
                "ingredients": ["All-purpose flour", "Cocoa powder", "Sugar", "Eggs", "Butter", "Milk"],
                "steps": ["Mix dry ingredients", "Beat eggs and sugar", "Combine all ingredients", "Bake at 180°C for 30 minutes"],
                "cooking_time": "45 minutes",
                "difficulty": "medium",
                "image": recipe_images["chocolate_cake"],
                "created_at": datetime.utcnow()
            },
            {
                "name": "Ice Cream Sundae",
                "category": "dessert",
                "ingredients": ["Vanilla ice cream", "Chocolate sauce", "Whipped cream", "Cherry", "Nuts"],
                "steps": ["Scoop ice cream into bowl", "Drizzle chocolate sauce", "Add whipped cream", "Top with cherry and nuts"],
                "cooking_time": "5 minutes",
                "difficulty": "easy",
                "image": recipe_images["ice_cream"],
                "created_at": datetime.utcnow()
            },
            {
                "name": "French Fries",
                "category": "fast-food",
                "ingredients": ["Potatoes", "Oil", "Salt"],
                "steps": ["Cut potatoes into strips", "Soak in cold water", "Deep fry until golden", "Season with salt"],
                "cooking_time": "20 minutes",
                "difficulty": "easy",
                "image": recipe_images["fries"],
                "created_at": datetime.utcnow()
            },
            {
                "name": "Veggie Burger",
                "category": "fast-food",
                "ingredients": ["Burger bun", "Veggie patty", "Lettuce", "Tomato", "Onion", "Cheese", "Sauce"],
                "steps": ["Toast burger buns", "Cook veggie patty", "Assemble with vegetables", "Add sauce and serve"],
                "cooking_time": "15 minutes",
                "difficulty": "easy",
                "image": recipe_images["burger"],
                "created_at": datetime.utcnow()
            },
            {
                "name": "Dal Tadka",
                "category": "veg",
                "ingredients": ["Yellow lentils", "Onions", "Tomatoes", "Garlic", "Cumin", "Ghee"],
                "steps": ["Pressure cook lentils", "Prepare tempering with spices", "Add to cooked dal", "Simmer and serve"],
                "cooking_time": "35 minutes",
                "difficulty": "easy",
                "image": recipe_images["dal"],
                "created_at": datetime.utcnow()
            },
            {
                "name": "Fish Curry",
                "category": "non-veg",
                "ingredients": ["Fish fillets", "Coconut milk", "Curry leaves", "Tamarind", "Spices", "Onions"],
                "steps": ["Marinate fish", "Prepare curry base", "Add fish and simmer", "Garnish with curry leaves"],
                "cooking_time": "40 minutes",
                "difficulty": "medium",
                "image": recipe_images["fish"],
                "created_at": datetime.utcnow()
            },
            {
                "name": "Pizza Margherita",
                "category": "fast-food",
                "ingredients": ["Pizza dough", "Tomato sauce", "Mozzarella cheese", "Basil", "Olive oil"],
                "steps": ["Roll out pizza dough", "Spread tomato sauce", "Add cheese and basil", "Bake at 220°C"],
                "cooking_time": "25 minutes",
                "difficulty": "medium",
                "image": recipe_images["pizza"],
                "created_at": datetime.utcnow()
            },
            {
                "name": "Fruit Salad",
                "category": "dessert",
                "ingredients": ["Mixed fruits", "Honey", "Lemon juice", "Mint leaves"],
                "steps": ["Chop all fruits", "Mix in a bowl", "Add honey and lemon", "Garnish with mint"],
                "cooking_time": "10 minutes",
                "difficulty": "easy",
                "image": recipe_images["fruit_salad"],
                "created_at": datetime.utcnow()
            },
            {
                "name": "Aloo Paratha",
                "category": "veg",
                "ingredients": ["Wheat flour", "Potatoes", "Spices", "Butter", "Coriander"],
                "steps": ["Make dough and potato filling", "Stuff and roll parathas", "Cook on griddle", "Serve with butter"],
                "cooking_time": "30 minutes",
                "difficulty": "medium",
                "image": recipe_images["paratha"],
                "created_at": datetime.utcnow()
            },
            {
                "name": "Chicken Wings",
                "category": "fast-food",
                "ingredients": ["Chicken wings", "Hot sauce", "Butter", "Garlic powder", "Paprika"],
                "steps": ["Season wings", "Bake until crispy", "Toss in sauce", "Serve hot"],
                "cooking_time": "35 minutes",
                "difficulty": "easy",
                "image": recipe_images["wings"],
                "created_at": datetime.utcnow()
            },
            {
                "name": "Tiramisu",
                "category": "dessert",
                "ingredients": ["Ladyfinger biscuits", "Mascarpone cheese", "Coffee", "Cocoa powder", "Sugar", "Eggs"],
                "steps": ["Prepare coffee mixture", "Layer soaked biscuits and cream", "Refrigerate overnight", "Dust with cocoa"],
                "cooking_time": "30 minutes + chilling",
                "difficulty": "hard",
                "image": recipe_images["tiramisu"],
                "created_at": datetime.utcnow()
            }
        ]
        await db.recipes.insert_many(sample_recipes)
        logger.info("Sample recipes added to database")
