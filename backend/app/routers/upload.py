from fastapi import APIRouter, File, UploadFile, HTTPException
import cloudinary.uploader
import os

router = APIRouter()

@router.post("/upload-image-cloudinary/")
async def upload_image_cloudinary(file: UploadFile = File(...)):
    try:
        # Sube la imagen a Cloudinary. Puedes especificar un folder (carpeta) para organizar las imágenes.
        result = cloudinary.uploader.upload(file.file, folder="FreeStyle")
        # Devuelve la URL segura de la imagen
        return {"url": result.get("secure_url")}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error subiendo imagen: {str(e)}")
    
@router.post("/upload-image-local/")
async def upload_image_local(file: UploadFile = File(...)):
    try:
        # Define el directorio donde se guardarán las imágenes
        upload_dir = "uploads"
        os.makedirs(upload_dir, exist_ok=True)  # Crea el directorio si no existe

        # Guarda la imagen en el directorio especificado
        file_location = os.path.join(upload_dir, file.filename)
        with open(file_location, "wb") as buffer:
            buffer.write(file.file.read())

        # Devuelve la ruta local de la imagen
        return {"url": file_location}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error subiendo imagen: {str(e)}")
    
@router.get("/images/{filename}")
async def get_image(filename: str):
    try:
        # Define el directorio donde se guardan las imágenes
        upload_dir = "uploads"
        file_location = os.path.join(upload_dir, filename)

        # Verifica si el archivo existe
        if not os.path.exists(file_location):
            raise HTTPException(status_code=404, detail="Imagen no encontrada")

        return {"url": file_location}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo imagen: {str(e)}")
    
@router.delete("/images/{filename}")
async def delete_image(filename: str):
    try:
        # Define el directorio donde se guardan las imágenes
        upload_dir = "uploads"
        file_location = os.path.join(upload_dir, filename)

        # Verifica si el archivo existe
        if not os.path.exists(file_location):
            raise HTTPException(status_code=404, detail="Imagen no encontrada")

        # Elimina el archivo
        os.remove(file_location)
        return {"detail": "Imagen eliminada correctamente"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error eliminando imagen: {str(e)}")
    
@router.get("/images/")
async def list_images():
    try:
        # Define el directorio donde se guardan las imágenes
        upload_dir = "uploads"

        # Lista todos los archivos en el directorio
        files = os.listdir(upload_dir)
        return {"images": files}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listando imágenes: {str(e)}")
    
@router.put("/images/{filename}")
async def update_image(filename: str, file: UploadFile = File(...)):
    try:
        # Define el directorio donde se guardan las imágenes
        upload_dir = "uploads"
        file_location = os.path.join(upload_dir, filename)

        # Verifica si el archivo existe
        if not os.path.exists(file_location):
            raise HTTPException(status_code=404, detail="Imagen no encontrada")

        # Guarda la nueva imagen en el directorio especificado
        with open(file_location, "wb") as buffer:
            buffer.write(file.file.read())

        return {"detail": "Imagen actualizada correctamente"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error actualizando imagen: {str(e)}")
    
    
