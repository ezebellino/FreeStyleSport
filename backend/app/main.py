from fastapi import FastAPI
from .routers import users, products, orders, payments, cart, products_admin, coupons, upload
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .auth import router as auth_router


app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5173", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    # Crea las tablas si no existen
    Base.metadata.create_all(bind=engine)

# Incluyes el router de auth
app.include_router(auth_router, prefix="/auth", tags=["Auth"])
# subir imágenes a Cloudinary
app.include_router(upload.router, prefix="/upload", tags=["Uploads"])
# Incluimos los routers
app.include_router(products.router, prefix="/products", tags=["Products"])
app.include_router(products_admin.router, prefix="/admin/products", tags=["Admin - Products"])
app.include_router(users.router, prefix="/users", tags=["Users"])
app.include_router(orders.router, prefix="/orders", tags=["Orders"])
app.include_router(cart.router, prefix="/cart", tags=["Cart"])
# Si tuvieras un payments.router, lo incluirías igual.
app.include_router(payments.router, prefix="/payments", tags=["Payments"])
app.include_router(coupons.router, prefix="/coupons", tags=["Coupons"])


@app.get("/")
async def root():
    return {"message": "Bienvenido a tu tienda virtual de productos deportivos!"}
