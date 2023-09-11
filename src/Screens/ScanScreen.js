import React, {useState, useEffect} from 'react';
import {View, Text, Button} from 'react-native';
import WifiManager from 'react-native-wifi-reborn';
import {request, PERMISSIONS} from 'react-native-permissions';

const WifiScanner = () => {
  const [wifiList, setWifiList] = useState([]);
  const [isScanning, setIsScanning] = useState(false);

  const requestLocationPermission = async () => {
    try {
      const granted = await request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
      if (granted === 'granted') {
        console.log('Location permission granted');
      } else {
        console.warn('Location permission denied');
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
    }
  };

  const scanWifiNetworks = async () => {
    setIsScanning(true);
    try {
      await requestLocationPermission();

      const wifiArray = await WifiManager.reScanAndLoadWifiList();
      setWifiList(wifiArray);
    } catch (error) {
      console.error('Error scanning for Wi-Fi networks:', error);
    } finally {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    scanWifiNetworks();
  }, []);

  return (
    <View>
      <Button
        title="Scan Wi-Fi"
        onPress={scanWifiNetworks}
        disabled={isScanning}
      />
      {isScanning ? (
        <Text>Scanning...</Text>
      ) : (
        <View>
          <Text>Available Wi-Fi Networks:</Text>
          {wifiList.map((wifi, index) => (
            <Text key={index}>
              {wifi.SSID} ({wifi.level} dBm)
            </Text>
          ))}
        </View>
      )}
    </View>
  );
};

export default WifiScanner;
