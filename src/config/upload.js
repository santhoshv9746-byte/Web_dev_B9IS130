
import axios from 'axios';

const uploadToCloudinary = async (file) => {

  const cloudName = 'msgsvfno';
  const uploadPreset = 'chat-app-preset';

  const allowedTypes = ['image/jpeg', 'image/png'];

  if (!file || !allowedTypes.includes(file.type)) {
    throw new Error('Please select a JPG or PNG image');
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Image size must be less than 5 MB');
  }

  const formData = new FormData();

  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  try {
    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      formData
    );

    return response.data.secure_url;

  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

export default uploadToCloudinary;
