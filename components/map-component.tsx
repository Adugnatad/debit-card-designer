import React, { useState, useRef, useEffect } from "react";
import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";
import { useQuery } from "@tanstack/react-query";
import { getLocation, Location } from "@/lib/apis/map_apis";

const mapContainerStyle = {
  width: "100%",
  height: "300px",
};

const defaultCenter = { lat: 9.03, lng: 38.74 }; // Default center (Addis Ababa)

// Locations with Names
// const locations = [
//   { name: "Golden Gate Bridge", lat: 37.8199, lng: -122.4783 },
//   { name: "Alcatraz Island", lat: 37.8267, lng: -122.423 },
//   { name: "Fisherman's Wharf", lat: 37.808, lng: -122.4177 },
// ];

const MapComponent = ({
  location,
  setPickup,
}: {
  location: Location[];
  setPickup: (loc: string) => void;
}) => {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: "AIzaSyAFJGkkxLWFayXiwrnk7Sb6CoXQWfV-I8c",
  });

  const [search, setSearch] = useState(""); // Search state
  const [selectedLocation, setSelectedLocation] = useState<{
    name: string;
    lat: number;
    lng: number;
  }>();
  const mapRef = useRef<google.maps.Map | null>(null);

  // Filter locations based on search
  const filteredLocations = location.filter((loc) =>
    loc.name.toLowerCase().includes(search.toLowerCase())
  );

  // Function to handle selection
  const handleSelect = (location: {
    name: string;
    lat: number;
    lng: number;
  }) => {
    setPickup(location.name);
    setSearch(location.name);
    setSelectedLocation(location);

    // Move the map to the selected location
    if (mapRef.current) {
      mapRef.current.panTo({ lat: location.lat, lng: location.lng });
      mapRef.current.setZoom(14);
    }
  };

  //   useEffect(() => {
  //     setSelectedLocation(undefined);
  //   }, [search]);

  if (loadError) return <p>Error loading maps</p>;
  if (!isLoaded) return <p>Loading...</p>;

  return (
    <div style={{ position: "relative", width: "100%" }}>
      {/* Search Input */}
      <input
        type="text"
        placeholder="Search location..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: "100%",
          padding: "10px",
          marginBottom: "10px",
          fontSize: "16px",
        }}
      />

      {/* Auto-Complete Suggestions */}
      {search && !selectedLocation && (
        <ul
          style={{
            position: "absolute",
            background: "#fff",
            width: "100%",
            listStyle: "none",
            padding: "5px",
            boxShadow: "0px 4px 6px rgba(0,0,0,0.1)",
            maxHeight: "150px",
            overflowY: "auto",
            zIndex: 10,
          }}
        >
          {filteredLocations.map((loc, index) => (
            <li
              key={index}
              onClick={() => handleSelect(loc)}
              style={{
                padding: "10px",
                cursor: "pointer",
                borderBottom: "1px solid #ddd",
              }}
            >
              {loc.name}
            </li>
          ))}
        </ul>
      )}

      {/* Map with Markers */}
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        zoom={12}
        center={selectedLocation || defaultCenter}
        onLoad={(map) => {
          mapRef.current = map;
        }}
      >
        {filteredLocations.map((loc, index) => (
          <Marker
            key={index}
            onClick={() => handleSelect(loc)}
            position={{ lat: loc.lat, lng: loc.lng }}
          />
        ))}
      </GoogleMap>
    </div>
  );
};

export default MapComponent;
