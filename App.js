import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import './App.css';

const MapComponent = ({ setLocation, locations }) => {
  const mapRef = useRef(null);

  useEffect(() => {
    const loadMap = () => {
      if (window.google && window.google.maps) {
        const map = new window.google.maps.Map(mapRef.current, {
          center: { lat: 0, lng: 0 },
          zoom: 15,
        });

        window.google.maps.event.addListener(map, 'click', (event) => {
          const lat = event.latLng.lat();
          const lng = event.latLng.lng();
          setLocation({ lat, lng });
          fetchNearbyLocations(lat, lng);
        });

        locations.forEach(location => {
          new window.google.maps.Marker({
            position: { lat: location.lat, lng: location.lng },
            map: map,
          });
        });

        if (locations.length) {
          const bounds = new window.google.maps.LatLngBounds();
          locations.forEach(location => {
            bounds.extend(new window.google.maps.LatLng(location.lat, location.lng));
          });
          map.fitBounds(bounds);
        }
      }
    };

    const checkGoogleMapsLoaded = () => {
      if (typeof window.google !== 'undefined') {
        loadMap();
      } else {
        setTimeout(checkGoogleMapsLoaded, 100);
      }
    };

    checkGoogleMapsLoaded();
  }, [locations, setLocation]);

  const fetchNearbyLocations = async (lat, lng) => {
    const API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY'; // Replace with your API Key
    try {
      const response = await axios.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', {
        params: {
          location: `${lat},${lng}`,
          radius: 1500,
          key: API_KEY,
        },
      });
      const nearbyLocations = response.data.results.map(result => ({
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
      }));
      setLocation(nearbyLocations);
    } catch (error) {
      console.error('Error fetching nearby locations:', error);
    }
  };

  return <div ref={mapRef} className="map-container" />;
};

const App = () => {
  const [location, setLocation] = useState(null);
  const [pricePrediction, setPricePrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    area: '',
    bathrooms: '',
    parking: '',
    stories: '',
    airconditioning_yes: false,
    bedrooms: '',
    furnishingstatus: 'unfurnished',
    prefarea_yes: false,
    basement_yes: false,
    hotwaterheating_yes: false,
    guestroom_yes: false,
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post('/api/predict', { ...formData, location });
      setPricePrediction(response.data.price);
    } catch (error) {
      console.error('Error predicting price:', error);
      setPricePrediction(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <h1>House Price Prediction </h1>
      <form onSubmit={handleSubmit}>
        <input type="number" name="area" placeholder="Area" onChange={handleInputChange} required />
        <input type="number" name="bathrooms" placeholder="Bathrooms" onChange={handleInputChange} required />
        <input type="number" name="parking" placeholder="Parking" onChange={handleInputChange} required />
        <input type="number" name="stories" placeholder="Stories" onChange={handleInputChange} required />
        <input type="number" name="bedrooms" placeholder="Bedrooms" onChange={handleInputChange} required />

        <label>
          Air Conditioning:
          <input type="checkbox" name="airconditioning_yes" onChange={handleInputChange} />
        </label>
        <label>
          Preferred Area:
          <input type="checkbox" name="prefarea_yes" onChange={handleInputChange} />
        </label>
        <label>
          Basement:
          <input type="checkbox" name="basement_yes" onChange={handleInputChange} />
        </label>
        <label>
          Hot Water Heating:
          <input type="checkbox" name="hotwaterheating_yes" onChange={handleInputChange} />
        </label>
        <label>
          Guestroom:
          <input type="checkbox" name="guestroom_yes" onChange={handleInputChange} />
        </label>

        <select name="furnishingstatus" onChange={handleInputChange}>
          <option value="unfurnished">Unfurnished</option>
          <option value="semi-furnished">Semi-furnished</option>
          <option value="furnished">Furnished</option>
        </select>

        <button type="submit" disabled={loading}>Predict Price</button>
      </form>

      {loading && <p>Loading...</p>}
      {pricePrediction && <h2>Predicted Price: {pricePrediction}</h2>}

      <MapComponent setLocation={setLocation} locations={location || []} />
    </div>
  );
};

export default App;
