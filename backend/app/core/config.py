import os
from dotenv import load_dotenv
import cloudinary
import cloudinary.uploader
from cloudinary.utils import cloudinary_url

# Carga el archivo .env (por defecto busca en la raíz del proyecto)
load_dotenv()

# Configuration       
cloudinary.config( 
    cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key = os.getenv("CLOUDINARY_API_KEY"), 
    api_secret = os.getenv("CLOUDINARY_API_SECRET"),
    secure=True
)

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 1440))  # 1440 minutos = 24 horas
MERCADOPAGO_ACCESS_TOKEN = os.getenv("MERCADOPAGO_ACCESS_TOKEN")
# Si tienes base de datos
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./database.db")
# Si tienes Hostinger
# DATABASE_URL = os.getenv("DATABASE_URL", "mysql://user:password@host/dbname")