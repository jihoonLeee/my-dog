import React, { useEffect, useRef, useState } from 'react';
import '../../styles/KakaoMap.css'; // Importing CSS for styling

const KakaoMap = () => {
  const mapContainer = useRef(null); // Reference for map container
  const [locations, setLocations] = useState([]); // State for locations within 1km
  const [selectedPlace, setSelectedPlace] = useState(null); // State for selected place info
  const [currentLocation, setCurrentLocation] = useState(null); // State for current location
  const mapRef = useRef(null); // Store the map instance
  const currentLocationMarker = useRef(null); // Reference for the current location marker

  useEffect(() => {
    const loadScript = (src) => {
      return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
          resolve();
          return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.onload = resolve;
        script.onerror = reject;
        document.head.append(script);
      });
    };

    const KAKAO_APP_KEY = process.env.REACT_APP_KAKAO_MAP_API;
    const scriptSrc = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_APP_KEY}&autoload=false&libraries=services,clusterer,drawing`;

    loadScript(scriptSrc)
      .then(() => {
        if (!window.kakao) {
          console.error('Kakao script not loaded');
          return;
        }

        window.kakao.maps.load(() => {
          initializeMap();
        });
      })
      .catch((error) => {
        console.error('Kakao Map script load error:', error);
      });
  }, []);

  const initializeMap = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({ latitude, longitude });

          const mapOption = {
            center: new window.kakao.maps.LatLng(latitude, longitude),
            level: 3,
          };
          const map = new window.kakao.maps.Map(mapContainer.current, mapOption);
          mapRef.current = map;

          // Create a marker for the current location
          const marker = new window.kakao.maps.Marker({
            map: map,
            position: new window.kakao.maps.LatLng(latitude, longitude),
            title: "현재 위치",
            image: new window.kakao.maps.MarkerImage(
              "http://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_red.png", 
              new window.kakao.maps.Size(24, 35),
              { offset: new window.kakao.maps.Point(12, 35) }
            ),
          });

          currentLocationMarker.current = marker;

          fetchLocations(map, latitude, longitude);
        },
        (error) => {
          console.error('Geolocation error:', error);
          alert('현재 위치를 불러올 수 없습니다.');
        }
      );
    } else {
      console.error('Geolocation not supported');
      alert('Geolocation을 지원하지 않는 브라우저입니다.');
    }
  };

  const fetchLocations = (map, latitude, longitude) => {
    const places = new window.kakao.maps.services.Places();
    const callback = (result, status) => {
      if (status === window.kakao.maps.services.Status.OK) {
        setLocations(result);
        result.forEach((place) => {
          const marker = new window.kakao.maps.Marker({
            map: map,
            position: new window.kakao.maps.LatLng(place.y, place.x),
          });

          window.kakao.maps.event.addListener(marker, 'click', () => {
            setSelectedPlace({
              address: place.address_name,
              latitude: place.y,
              longitude: place.x,
            });
          });
        });
      }
    };
    places.categorySearch('CE7', callback, {
      location: new window.kakao.maps.LatLng(latitude, longitude),
      radius: 1000,
    });
  };

  const handleLocationClick = (place) => {
    setSelectedPlace({
      address: place.address_name,
      latitude: place.y,
      longitude: place.x,
    });
    const moveLatLon = new window.kakao.maps.LatLng(place.y, place.x);
    mapRef.current.setCenter(moveLatLon);
  };

  const recenterMap = () => {
    if (currentLocation) {
      const moveLatLon = new window.kakao.maps.LatLng(currentLocation.latitude, currentLocation.longitude);
      mapRef.current.setCenter(moveLatLon);
      currentLocationMarker.current.setPosition(moveLatLon);
    }
  };

  return (
    <div className="container">
      <div className="content">
        <div className="list-section">
          <h3>1km 이내의 카페 목록</h3>
          <ul>
            {locations.map((place) => (
              <li key={place.id} onClick={() => handleLocationClick(place)}>
                {place.place_name}
              </li>
            ))}
          </ul>
          {selectedPlace && (
            <div>
              <h3>선택한 장소 정보</h3>
              <p><strong>주소:</strong> {selectedPlace.address}</p>
              <p><strong>위도:</strong> {selectedPlace.latitude}</p>
              <p><strong>경도:</strong> {selectedPlace.longitude}</p>
            </div>
          )}
        </div>
        <div className="map-section" ref={mapContainer}>
          <button className="recenter-button" onClick={recenterMap}>
            <img src={`${process.env.PUBLIC_URL}/icons/borikkori_brown.png`} alt="현재 위치" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default KakaoMap;
