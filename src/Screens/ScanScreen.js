import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  Button,
  BackHandler,
  Alert,
  TextInput,
  PermissionsAndroid,
  ScrollView,
} from 'react-native';
import WifiManager from 'react-native-wifi-reborn';
import {request, PERMISSIONS} from 'react-native-permissions';
import DeviceInfo from 'react-native-device-info';
import CounterComponent from './PlusMinus';
import {SCREENS} from '../../App';
import * as ScopedStorage from 'react-native-scoped-storage';

import DocumentPicker from 'react-native-document-picker';
import RNFS from 'react-native-fs';

const WifiScanner = ({coor, room, roomList, changeScreen}) => {
  const [wifiList, setWifiList] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isCreate, setIsCreate] = useState(true);
  const [count, setCount] = useState(0);
  const [deviceDate, setDeviceData] = useState({});
  const [onscanning, setOnScanning] = useState(false);
  const [finalCoor, setFinalCoor] = useState({
    Coordinate_Unique_ID: '',
    Grid_Point: ['x', 'y'],
    Room_Unique_ID: '3',
  });
  const [roomDetails, setRoomDetails] = useState({
    Room_Unique_ID: '',
    Room: '',
  });

  useEffect(() => {
    const roomMain = roomList.filter(e => e.Room_Unique_ID === room);

    setRoomDetails(roomMain[0]);
    setFinalCoor(coor);
  }, []);

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

  const firstRender = useRef(true);

  useEffect(() => {
    let timer;
    let timeout;
    if (!firstRender.current) {
      if (isScanning) {
        scanWifiNetworks();
        timer = setInterval(() => {
          scanWifiNetworks();
        }, 30000);

        timeout = setTimeout(() => {
          clearInterval(timer);
          timer = null;
          setIsScanning(false);
        }, count * 60 * 1000);
      }
    } else {
      firstRender.current = false;
    }

    return () => {
      clearInterval(timer);
      clearTimeout(timeout);
    };
  }, [isScanning]);

  useEffect(() => {
    getDeviceId();
  }, []);

  const getDeviceId = async () => {
    const a = await DeviceInfo.getUniqueId();
    const b = DeviceInfo.getModel();
    setDeviceData({
      uId: a,
      modal: b,
    });
  };

  const scanWifiNetworks = async () => {
    console.log('called');
    try {
      await requestLocationPermission();
      setOnScanning(true);

      const wifiArray = await WifiManager.reScanAndLoadWifiList();
      const date = new Date();
      const finalWifiList = wifiArray.map(e => {
        let a = `${deviceDate?.modal + deviceDate?.uId},${
          finalCoor.Grid_Point[0]
        },${finalCoor.Grid_Point[1]},${e.SSID},${e.BSSID},${e.level},${
          e.frequency
        },${date},${roomDetails.Room_Unique_ID},${roomDetails.Room},${
          finalCoor.Coordinate_Unique_ID
        }`;
        return a;
      });
      setWifiList(e => [...e, ...finalWifiList]);
      setOnScanning(false);
      console.log('finished');
    } catch (error) {
      console.error('Error scanning for Wi-Fi networks:', error);
    } finally {
    }
  };

  useEffect(() => {
    const backAction = () => {
      Alert.alert(
        'Hold on!',
        'If you are going back kindly save the generated data on a new or existing file or else it will be deleted if you did not save kindly press Cancel and save and go back ',
        [
          {
            text: 'Cancel',
            onPress: () => null,
            style: 'cancel',
          },
          {text: 'YES', onPress: () => changeScreen(SCREENS.COOR)},
        ],
      );
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => backHandler.remove();
  }, []);

  const [action, setAction] = useState('');
  const [fileName, setFileName] = useState('');
  const [selectedFolderPath, setSelectedFolderPath] = useState('');

  const handleFileSelection = async () => {
    try {
      // Ask the user whether to create a new file or update an existing one
      Alert.alert('Select Action', 'Do you want to create a new file?', [
        {
          text: 'Create New',
          onPress: () => setAction('create'),
        },
      ]);
    } catch (err) {
      // Handle error
      console.log(err);
    }
  };

  const handleCreateNewFile = async () => {
    if (!fileName) {
      Alert.alert('Error', 'Please enter a file name.');
      return;
    }
    let dir;
    try {
      // Use DocumentPicker to select a folder where the file should be saved
      dir = await ScopedStorage.openDocumentTree(true);
      console.log('>>>>', dir.uri);
      if (dir.uri) {
        setSelectedFolderPath(dir.uri);
      } else {
        // User canceled folder selection
        return;
      }
    } catch (error) {
      console.error('Error selecting folder:', error);
      return;
    }

    // Check if the selected folder path is valid
    if (!dir.uri) {
      Alert.alert('Error', 'Please select a folder to save the file.');
      return;
    }

    let fileList = await ScopedStorage.listFiles(dir.uri);
    console.log(fileList);

    let isFilePresent = fileList.find(e => {
      return e.name === `${fileName}.csv`;
    });
    let fileContent = '';
    for (let i = 0; i < wifiList.length; i++) {
      fileContent += `\n${wifiList[i]}`;
    }
    if (!isFilePresent) {
      fileContent =
        'deviceID,x,y,SSID,BSSID,level,frequency,TimeStamp,RoomID,RoomName,Coordiante ID' +
        fileContent;
    }

    // Perform your file creation logic here, e.g., write file content using RNFS
    try {
      await ScopedStorage.writeFile(
        dir.uri,
        fileContent,
        `${fileName}.csv`,
        'text/csv',

        'utf8',
        true,
      );
      Alert.alert(
        'Success',
        `File "${fileName}.csv" has been created in ${dir.uri}`,
        setWifiList([]),
      );
    } catch (error) {
      console.error('Error creating file:', error);
      Alert.alert('Error', 'Failed to create the file.');
    }
  };

  return (
    <>
      <View style={{flex: 1}}>
        <CounterComponent value={count} changeFunction={setCount} />
        <View style={{paddingHorizontal: 70}}>
          <Button
            title="Scan Wi-Fi"
            onPress={() => setIsScanning(true)}
            disabled={onscanning}
          />
        </View>
        <View style={{paddingHorizontal: 70}}>
          <Button
            title="Create a file"
            onPress={handleFileSelection}
            disabled={onscanning}
          />
        </View>

        {action === 'create' && (
          <>
            <TextInput
              placeholder="Enter a file name"
              onChangeText={text => setFileName(text)}
              value={fileName}
            />
            <Button
              title="Select Folder & Create File"
              onPress={handleCreateNewFile}
            />
          </>
        )}

        {isScanning || (onscanning && <Text>Scanning...</Text>)}
        <ScrollView style={{flex: 1}}>
          <Text>Available Wi-Fi Networks:</Text>
          {wifiList.map((wifi, index) => (
            <Text key={index}>{wifi}</Text>
          ))}
        </ScrollView>
      </View>
      {isScanning && (
        <View
          style={{
            position: 'absolute',
            flex: 1,
            height: '100%',
            width: '100%',
            top: 0,
            left: 0,
            backgroundColor: '#00000080',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <Text
            style={{
              fontSize: 25,
              color: 'red',
              textAlign: 'center',
            }}>
            Cant stop wait until scan finishes
          </Text>
        </View>
      )}
    </>
  );
};

export default WifiScanner;
