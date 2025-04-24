# 🛍️ FreestyleSport

**FreestyleSport** es un proyecto de E-commerce desarrollado como una iniciativa personal para aprender y adquirir experiencia en el desarrollo de aplicaciones web fullstack. Su estructura y organización están pensadas para ser reutilizadas en otros proyectos similares como tiendas, almacenes o minimercados.

---

## 🚀 Tecnologías utilizadas

### 🔧 Backend
- **[FastAPI](https://fastapi.tiangolo.com/)** – framework para construir APIs web modernas y rápidas.
- **SQLAlchemy** – ORM para manejar la base de datos.
- **Alembic** – herramienta de migraciones de base de datos.
- **Pydantic** – validación y serialización de datos.
- **Uvicorn** – servidor ASGI para ejecutar la aplicación FastAPI.
- **Bcrypt** – manejo de contraseñas seguras.
- **email-validator** – validación de emails.
- **requests** – cliente HTTP.

### 🌐 Frontend
- **React** – librería para construir interfaces de usuario.
- **Vite** – bundler moderno para React.
- **JavaScript (ES6+)**

---

## 📁 Estructura del proyecto

```bash
FreestyleSport/
├── backend/
│   ├── app/               # Lógica de negocio y rutas
│   ├── alembic/           # Migraciones de base de datos
│   └── database.db        # Base de datos SQLite
├── frontend/              # Aplicación React
│   └── src/               # Componentes y páginas
├── requirements.txt       # Dependencias del backend
├── .gitignore             # Ignora archivos innecesarios
└── README.md              # Este archivo
