-- Agregar campo gallery_images a owner_profiles para almacenar la galeria de fotos
ALTER TABLE owner_profiles ADD COLUMN gallery_images TEXT DEFAULT '[]';
