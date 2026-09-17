import { storage } from '../firebase/config';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

export const uploadFile = async (
  file: File,
  path: string, // e.g., 'companies/{companyId}/vehicles/{vehicleId}/{filename}'
): Promise<string> => {
  try {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw new Error('No se pudo subir el archivo.');
  }
};

export const deleteFile = async (path: string): Promise<void> => {
  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  } catch (error: any) {
    // Si no existe, no importa tanto para la lógica de negocio usual
    if (error.code === 'storage/object-not-found') {
      return;
    }
    console.error('Error deleting file:', error);
    throw new Error('No se pudo eliminar el archivo.');
  }
};
