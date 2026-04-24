import React from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import styles from './Map.module.css';

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/hack24/marker-icon-2x.png',
  iconUrl: '/hack24/marker-icon.png',
  shadowUrl: '/hack24/marker-shadow.png',
});

const Hack24Map = ({ position }) => {
  return (
    <MapContainer center={position} zoom={15} className={styles.mapContainer}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <Marker position={position}>
        <Popup>Providencia 229, Santiago, Chile</Popup>
      </Marker>
    </MapContainer>
  );
};

export default Hack24Map;
