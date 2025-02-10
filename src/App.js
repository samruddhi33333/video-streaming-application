import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [videos, setVideos] = useState([]);
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [session, setSession] = useState('Social Media');
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const response = await axios.get('http://localhost:5000/videos');
      setVideos(response.data);
    } catch (error) {
      console.error('Error fetching videos:', error);
      setMessage({ text: 'Failed to fetch videos.', type: 'error' });
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type.startsWith('video/')) {
      setFile(selectedFile);
      setMessage({ text: '', type: '' });
    } else {
      setMessage({ text: 'Please select a valid video file.', type: 'error' });
    }
  };

  const handleUpload = async () => {
    if (!file || !title || !session) {
      setMessage({ text: 'Please fill in all fields.', type: 'error' });
      return;
    }

    const formData = new FormData();
    formData.append('video', file);
    formData.append('title', title);
    formData.append('session', session);

    setIsUploading(true);
    setMessage({ text: 'Uploading...', type: 'info' });

    try {
      await axios.post('http://localhost:5000/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMessage({ text: 'Video uploaded successfully!', type: 'success' });
      setFile(null);
      setTitle('');
      setSession('Social Media');
      fetchVideos();
    } catch (error) {
      console.error('Error uploading video:', error);
      setMessage({ text: 'Failed to upload video. Please try again.', type: 'error' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>SparkPlay </h1>
      </header>

      <section className="upload-section">
        <h2>Upload Your Video</h2>
        <div className="upload-container">
          <input type="file" onChange={handleFileChange} />
          <input
            type="text"
            placeholder="Enter video title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <select value={session} onChange={(e) => setSession(e.target.value)}>
            <option value="Social Media">Social Media</option>
            <option value="Travel">Travel</option>
            <option value="Office">Office</option>
          </select>
          <button onClick={handleUpload} disabled={isUploading}>
            {isUploading ? 'Uploading...' : 'Upload'}
          </button>
          {message.text && <p className={`message ${message.type}`}>{message.text}</p>}
        </div>
      </section>


    
      <section className="video-section">
        <h2>Available Videos</h2>
        <div className="video-grid">
          {videos.length === 0 ? (
            <p>No videos uploaded yet.</p>
          ) : (
            videos.map((video) => (
              <div key={video._id} className="video-card">
                <video controls>
                  <source
                    src={`http://localhost:5000/stream/${video.filename}`}
                    type="video/mp4"
                  />
                </video>
                <div className="video-info">
                  <h3>{video.title || 'Untitled Video'}</h3>
                  <p>Type: {video.session || 'Uncategorized'}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

export default App;
