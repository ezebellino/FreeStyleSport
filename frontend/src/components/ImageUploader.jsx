// src/components/ImageUploader.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { Button, Form, Alert } from 'react-bootstrap';

const ImageUploader = ({ onUpload }) => {
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await axios.post(
        'http://127.0.0.1:8000/upload/upload-image-cloudinary/',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      console.log("URL de imagen subida:", response.data.url);
      onUpload(response.data.url);
    } catch (err) {
      console.error(err);
      setError('Error subiendo la imagen.');
    }
  };

  return (
    <div>
      {error && <Alert variant="danger">{error}</Alert>}
      <Form.Group>
        <Form.Control type="file" onChange={handleFileChange} />
      </Form.Group>
      <Button onClick={handleUpload} className="mt-2">
        Subir Imagen
      </Button>
    </div>
  );
};

export default ImageUploader;
