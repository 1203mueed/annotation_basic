// frontend/src/components/RequestAnnotationForm.js
import React, { useState } from 'react';
import API from '../services/api';
import '../styles/RequestAnnotationForm.css';

function RequestAnnotationForm({ onClose }) {
  const [description, setDescription] = useState('');
  const [deliveryType, setDeliveryType] = useState('Regular');

  // NEW: Special Instructions
  const [specialInstructions, setSpecialInstructions] = useState('');

  const [folder, setFolder] = useState(null);
  const [error, setError] = useState('');

  const handleFolderChange = (e) => {
    const files = e.target.files;
    setFolder(files);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // Build FormData to send text fields + files
      const formData = new FormData();
      formData.append('description', description);
      formData.append('delivery_type', deliveryType);
      formData.append('special_instructions', specialInstructions); // append special instructions

      if (folder) {
        for (let i = 0; i < folder.length; i++) {
          formData.append('files', folder[i]);
        }
      }

      // Example endpoint that handles DB creation + folder upload
      const res = await API.post('/auth/requests-with-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      console.log('[RequestAnnotationForm] response:', res.data);

      // On success, close form (or navigate to dashboard if you prefer)
      onClose();
    } catch (err) {
      console.error('[RequestAnnotationForm] error:', err);
      setError(err.response?.data?.error || 'Error submitting request');
    }
  };

  return (
    <div className="request-annotation-overlay">
      <div className="request-annotation-form">
        <h2>Request Annotation</h2>
        {error && <div className="error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <label>Description:</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />

          <label>Delivery Type:</label>
          <select 
            value={deliveryType}
            onChange={(e) => setDeliveryType(e.target.value)}
          >
            <option value="Regular">Regular</option>
            <option value="Express">Express</option>
          </select>

          {/* NEW: Special Instructions */}
          <label>Special Instructions:</label>
          <textarea
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value)}
            placeholder="e.g., any formatting requirements, deadlines, etc."
          />

          <label>Upload Folder(s):</label>
          <input
            type="file"
            directory=""
            webkitdirectory=""
            onChange={handleFolderChange}
          />

          <div className="buttons">
            <button type="submit">Submit Request</button>
            <button type="button" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RequestAnnotationForm;
