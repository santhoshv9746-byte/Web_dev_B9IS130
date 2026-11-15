
import React, { useContext, useEffect, useState } from 'react';
import './ProfileUpdate.css';
import assets from '../../assets/assets';

import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import { auth, db } from '../../config/firebase';
import uploadToCloudinary from '../../config/upload';
import { AppContext } from '../../context/AppContext';

const ProfileUpdate = () => {

  const navigate = useNavigate();
  const { setUserData } = useContext(AppContext);

  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [prevImage, setPrevImage] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmitHandler = async (event) => {
    event.preventDefault();

    const user = auth.currentUser;

    if (!user) {
      toast.error('Please log in first');
      return;
    }

    if (!prevImage && !image) {
      toast.error('Please upload a profile picture');
      return;
    }

    setLoading(true);

    try {
      const docRef = doc(db, 'users', user.uid);

      let imgUrl = prevImage;

      if (image) {
        imgUrl = await uploadToCloudinary(image);
      }

      await updateDoc(docRef, {
        avatar: imgUrl,
        name: name.trim(),
        bio: bio.trim()
      });

      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setUserData(docSnap.data());
      }

      setPrevImage(imgUrl);

      toast.success('Profile updated successfully');

      navigate('/chat');

    } catch (error) {
      console.error('Profile update error:', error);
      toast.error(error.message || 'Profile update failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {

        if (!user) {
          navigate('/');
          return;
        }

        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);

          if (active && docSnap.exists()) {
            const userData = docSnap.data();

            setName(userData.name || '');
            setBio(userData.bio || '');
            setPrevImage(userData.avatar || '');
          }

        } catch (error) {
          if (active) {
            console.error(error);
            toast.error('Unable to load profile');
          }
        }
      }
    );

    return () => {
      active = false;
      unsubscribe();
    };

  }, [navigate]);

  useEffect(() => {
    if (!image) {
      setImagePreview('');
      return;
    }

    const previewUrl = URL.createObjectURL(image);
    setImagePreview(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);

  }, [image]);

  return (
    <div className="profile">
      <div className="profile-container">

        <form onSubmit={onSubmitHandler}>

          <h3>Profile Details</h3>

          <label htmlFor="avatar">
            <input
              onChange={(e) =>
                setImage(e.target.files?.[0] || null)
              }
              type="file"
              id="avatar"
              accept=".png,.jpg,.jpeg"
              hidden
            />

            <img
              src={
                imagePreview ||
                prevImage ||
                assets.avatar_icon
              }
              alt="Profile"
            />

            Upload profile image
          </label>

          <input
            onChange={(e) => setName(e.target.value)}
            value={name}
            type="text"
            placeholder="Your name"
            required
          />

          <textarea
            onChange={(e) => setBio(e.target.value)}
            value={bio}
            placeholder="Write profile bio"
            required
          />


          <div className="profile-actions">
            <button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </button>

            <button
              type="button"
              className="cancel-btn"
              onClick={() => navigate('/chat')}
              disabled={loading}
            >
              Cancel
            </button>
          </div>


        </form>

        <img
          className="profile-pic"
          src={
            imagePreview ||
            prevImage ||
            assets.logo_icon
          }
          alt="Profile preview"
        />

      </div>
    </div>
  );
};

export default ProfileUpdate;
