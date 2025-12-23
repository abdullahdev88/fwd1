import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { profileAPI } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import Button from '../components/common/Button';

const ProfileSettings = () => {
  const { user, updateUserData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [profileData, setProfileData] = useState({});

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await profileAPI.getMyProfile();
      setProfileData(response.data.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load profile');
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Handle nested address object
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setProfileData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));
    }
    // Handle nested emergency contact
    else if (name.startsWith('emergencyContact.')) {
      const contactField = name.split('.')[1];
      setProfileData(prev => ({
        ...prev,
        emergencyContact: {
          ...prev.emergencyContact,
          [contactField]: value
        }
      }));
    }
    // Handle regular fields
    else {
      setProfileData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await profileAPI.updateMyProfile(profileData);
      updateUserData(response.data.data);
      setSuccess(true);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
      console.error('Error updating profile:', err);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  const isDoctor = user?.role === 'doctor';
  const isPatient = user?.role === 'patient';

  return (
    <div className="max-w-4xl mx-auto p-6 card">
      <h1 className="text-3xl font-bold mb-6 text-[rgb(var(--text-heading))]">Profile Settings</h1>
      
      {error && <ErrorMessage message={error} />}
      
      {success && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          Profile updated successfully!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-[rgb(var(--bg-secondary))] p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-[rgb(var(--text-heading))] mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={profileData.name || ''}
                onChange={handleInputChange}
                className="input-field"
                required
              />
            </div>
            
            <div>
              <label className="label">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={profileData.email || ''}
                onChange={handleInputChange}
                className="input-field"
                required
              />
            </div>
            
            <div>
              <label className="label">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={profileData.phone || ''}
                onChange={handleInputChange}
                className="input-field"
              />
            </div>
            
            <div>
              <label className="label">
                Gender
              </label>
              <select
                name="gender"
                value={profileData.gender || ''}
                onChange={handleInputChange}
                className="input-field"
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div>
              <label className="label">
                Date of Birth
              </label>
              <input
                type="date"
                name="dateOfBirth"
                value={profileData.dateOfBirth ? profileData.dateOfBirth.split('T')[0] : ''}
                onChange={handleInputChange}
                className="input-field"
              />
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div className="bg-[rgb(var(--bg-secondary))] p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-[rgb(var(--text-heading))] mb-4">Address</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="label">
                Street Address
              </label>
              <input
                type="text"
                name="address.street"
                value={profileData.address?.street || ''}
                onChange={handleInputChange}
                className="input-field"
              />
            </div>
            
            <div>
              <label className="label">
                City
              </label>
              <input
                type="text"
                name="address.city"
                value={profileData.address?.city || ''}
                onChange={handleInputChange}
                className="input-field"
              />
            </div>
            
            <div>
              <label className="label">
                State
              </label>
              <input
                type="text"
                name="address.state"
                value={profileData.address?.state || ''}
                onChange={handleInputChange}
                className="input-field"
              />
            </div>
            
            <div>
              <label className="label">
                ZIP Code
              </label>
              <input
                type="text"
                name="address.zipCode"
                value={profileData.address?.zipCode || ''}
                onChange={handleInputChange}
                className="input-field"
              />
            </div>
            
            <div>
              <label className="label">
                Country
              </label>
              <input
                type="text"
                name="address.country"
                value={profileData.address?.country || ''}
                onChange={handleInputChange}
                className="input-field"
              />
            </div>
          </div>
        </div>

        {/* Doctor-specific fields */}
        {isDoctor && (
          <div className="bg-[rgb(var(--bg-tertiary))] p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-[rgb(var(--text-heading))] mb-4">Professional Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">
                  Specialization
                </label>
                <input
                  type="text"
                  name="specialization"
                  value={profileData.specialization || ''}
                  onChange={handleInputChange}
                  className="input-field"
                />
              </div>
              
              <div>
                <label className="label">
                  Experience (Years)
                </label>
                <input
                  type="number"
                  name="experience"
                  value={profileData.experience || ''}
                  onChange={handleInputChange}
                  min="0"
                  className="input-field"
                />
              </div>
              
              <div>
                <label className="label">
                  Consultation Fee
                </label>
                <input
                  type="number"
                  name="consultationFee"
                  value={profileData.consultationFee || ''}
                  onChange={handleInputChange}
                  min="0"
                  className="input-field"
                />
              </div>
              
              <div>
                <label className="label">
                  Qualification
                </label>
                <input
                  type="text"
                  name="qualification"
                  value={profileData.qualification || ''}
                  onChange={handleInputChange}
                  className="input-field"
                />
              </div>
            </div>
          </div>
        )}

        {/* Patient-specific fields */}
        {isPatient && (
          <>
            <div className="bg-[rgb(var(--bg-tertiary))] p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-[rgb(var(--text-heading))] mb-4">Medical Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">
                    Blood Group
                  </label>
                  <select
                    name="bloodGroup"
                    value={profileData.bloodGroup || ''}
                    onChange={handleInputChange}
                    className="input-field"
                  >
                    <option value="">Select Blood Group</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-[rgb(var(--bg-tertiary))] p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-[rgb(var(--text-heading))] mb-4">Emergency Contact</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="label">
                    Name
                  </label>
                  <input
                    type="text"
                    name="emergencyContact.name"
                    value={profileData.emergencyContact?.name || ''}
                    onChange={handleInputChange}
                    className="input-field"
                  />
                </div>
                
                <div>
                  <label className="label">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="emergencyContact.phone"
                    value={profileData.emergencyContact?.phone || ''}
                    onChange={handleInputChange}
                    className="input-field"
                  />
                </div>
                
                <div>
                  <label className="label">
                    Relationship
                  </label>
                  <input
                    type="text"
                    name="emergencyContact.relationship"
                    value={profileData.emergencyContact?.relationship || ''}
                    onChange={handleInputChange}
                    className="input-field"
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={updating}
            className="btn-primary"
          >
            {updating ? 'Updating...' : 'Update Profile'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ProfileSettings;