import axios from 'axios';

const uploadToCloudinary = async (file) => {
  const cloudName = 'msgsvfno';
  const uploadPreset = 'chat-app-preset';

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
    console.error("Cloudinary upload error:", error);
    throw error;
  }
};

export default uploadToCloudinary;