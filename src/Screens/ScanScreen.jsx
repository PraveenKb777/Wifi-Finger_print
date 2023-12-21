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
  Modal,
  StyleSheet,
  Dimensions,
} from 'react-native';
import WifiManager from 'react-native-wifi-reborn';
import {request, PERMISSIONS} from 'react-native-permissions';
import DeviceInfo from 'react-native-device-info';
import CounterComponent from './PlusMinus';
import {SCREENS} from '../../App';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ScopedStorage from 'react-native-scoped-storage';

import DocumentPicker from 'react-native-document-picker';
import RNFS from 'react-native-fs';
import CalibrationScreen from './CalibrationScreen';
import {
  SensorTypes,
  accelerometer,
  gyroscope,
  magnetometer,
  setUpdateIntervalForType,
} from 'react-native-sensors';

// TODO Calibration Screen Here
const MAX_THRESHOLD = 65;
const MIN_THRESHOLD = 25;
const WifiScanner = ({coor, room, roomList, changeScreen}) => {
  setUpdateIntervalForType(SensorTypes.magnetometer, 50);
  setUpdateIntervalForType(SensorTypes.accelerometer, 50);
  setUpdateIntervalForType(SensorTypes.gyroscope, 50);
  const [finalScanList, setFinalScanList] = useState([]);
  const [deviceDate, setDeviceData] = useState({});

  const [wifiList, setWifiList] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isCreate, setIsCreate] = useState(true);
  const [count, setCount] = useState(0);
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

  const [calibrationData, setCalibrationData] = useState({
    offsetX: 0,
    offsetY: 0,
    offsetZ: 0,
    delX: 0,
    delY: 0,
    delZ: 0,
    avgDelta: 0,
    scaleX: 0,
    scaleY: 0,
    scaleZ: 0,
    hardCorrectedX: [],
    hardCorrectedY: [],
    hardCorrectedZ: [],
  });
  const magRef = useRef({
    x: 0,
    y: 0,
    z: 0,
    correctedData: {x: 0, y: 0, z: 0},
    absCurrent: 0,
  });
  const accRef = useRef({x: 0, y: 0, z: 0});
  const gyroRef = useRef({x: 0, y: 0, z: 0});
  const maxMagInaccurate = useRef(0);
  const intervalRef = useRef(null);
  const absMagData = (val = {x: 0, y: 0, z: 0}) => {
    return Math.sqrt(val.x ** 2 + val.y ** 2 + val.z ** 2);
  };

  const calCalibiratedData = (
    val = {x: 0, y: 0, z: 0},
    calData = calibrationData,
  ) => {
    const correctedX = (val.x - calData.offsetX) * calData.scaleX;
    const correctedY = (val.y - calData.offsetY) * calData.scaleY;
    const correctedZ = (val.z - calData.offsetZ) * calData.scaleZ;

    return {x: correctedX, y: correctedY, z: correctedZ};
  };

  const magSub = () => {
    let subscribeMag = magnetometer.subscribe(({x, y, z, timestamp}) => {
      console.log('>>>>', x, y, z);
      // calibrationData
      const correctedData = calCalibiratedData({x, y, z});
      const absCurrent = absMagData(correctedData);
      if (absCurrent > MAX_THRESHOLD || absCurrent < MIN_THRESHOLD) {
        maxMagInaccurate.current += 1;
        subscribeMag.unsubscribe();
        return;
      } else {
        maxMagInaccurate.current = 0;
      }

      if (maxMagInaccurate.current >= 20) {
        clearInterval(intervalRef.current);
        setCalPopUp(true);
      }

      magRef.current = {...magRef.current, x, y, z, correctedData, absCurrent};
      console.log('>>>:', {x, y, z, correctedData, absCurrent});
      subscribeMag.unsubscribe();
    });
    let subscribeAcc = accelerometer.subscribe(({x, y, z, timestamp}) => {
      accRef.current = {x, y, z};
      subscribeAcc.unsubscribe();
    });
    let subscribeGyro = gyroscope.subscribe(({x, y, z, timestamp}) => {
      gyroRef.current = {x, y, z};
      subscribeGyro.unsubscribe();
    });

    if (
      magRef.current.x === 0 &&
      magRef.current.y === 0 &&
      magRef.current.z === 0
    ) {
      console.log(magRef.current);
      console.log('gone here');
    } else {
      // 'deviceId,timestamp,x,y,RoomId,RoomName,CoorId,acc_x, acc_y, acc_z, gyr_x, gyr_y, gyr_z, mag_ori_x, mag_ori_y, mag_ori_z, mag_cor_x, mag_cor_y, mag_cor_z, absolute' +
      console.log('gone in');
      let listData = `${deviceDate?.modal + deviceDate?.uId},${
        Date.now() / 1000
      },${finalCoor.Grid_Point[0]},${finalCoor.Grid_Point[1]},${
        roomDetails.Room_Unique_ID
      },${roomDetails.Room},${finalCoor.Coordinate_Unique_ID},${
        accRef.current.x
      },${accRef.current.y},${accRef.current.z},${gyroRef.current.x},${
        gyroRef.current.y
      },${gyroRef.current.z},${magRef.current.x},${magRef.current.y},${
        magRef.current.z
      },${magRef.current.correctedData?.x},${magRef.current.correctedData?.y},${
        magRef.current.correctedData?.z
      },${magRef.current.absCurrent}`;
      console.log({
        mag: magRef.current,
        gyroRef: gyroRef.current,
        accRef: accRef.current,
      });
      setFinalScanList(e => {
        return [...e, listData];
      });
    }
  };

  useEffect(() => {}, []);

  useEffect(() => {
    const roomMain = roomList.filter(e => e.Room_Unique_ID === room);

    setRoomDetails(roomMain[0]);
    setFinalCoor(coor);
  }, []);

  const checkStorage = async () => {
    const item = await AsyncStorage.getItem('calData');
    if (item) {
      setCalibrationData(JSON.parse(item));
    } else {
      setCalPopUp(true);
    }
  };

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

  // const firstRender = useRef(true);
  useEffect(() => {
    checkStorage();
  }, []);

  // useEffect(() => {
  //   let timer;
  //   let timeout;
  //   if (!firstRender.current) {
  //     if (isScanning) {
  //       scanWifiNetworks();
  //       timer = setInterval(() => {
  //         scanWifiNetworks();
  //       }, 30000);

  //       timeout = setTimeout(() => {
  //         clearInterval(timer);
  //         timer = null;
  //         setIsScanning(false);
  //       }, count * 60 * 1000);
  //     }
  //   } else {
  //     firstRender.current = false;
  //   }

  //   return () => {
  //     clearInterval(timer);
  //     clearTimeout(timeout);
  //   };
  // }, [isScanning]);

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
    // // Wifi scaning
    // try {
    //   await requestLocationPermission();
    //   setOnScanning(true);

    //   const wifiArray = await WifiManager.reScanAndLoadWifiList();
    //   const date = new Date();
    //   const finalWifiList = wifiArray.map(e => {
    //     let a = `${deviceDate?.modal + deviceDate?.uId},${
    //       finalCoor.Grid_Point[0]
    //     },${finalCoor.Grid_Point[1]},${e.SSID},${e.BSSID},${e.level},${
    //       e.frequency
    //     },${date},${roomDetails.Room_Unique_ID},${roomDetails.Room},${
    //       finalCoor.Coordinate_Unique_ID
    //     }`;
    //     return a;
    //   });
    //   setWifiList(e => [...e, ...finalWifiList]);
    //   setOnScanning(false);
    //   console.log('finished');
    // } catch (error) {
    //   console.error('Error scanning for Wi-Fi networks:', error);
    // } finally {
    // }

    try {
    } catch (error) {}
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
  const [calPopUp, setCalPopUp] = useState(false);
  const [calibration, setCalibration] = useState(false);

  const calFun = async data => {
    setCalibrationData(data);
    setCalibration(false);
    setCalPopUp(false);
    await AsyncStorage.setItem('calData', JSON.stringify(data));
  };

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
    for (let i = 0; i < finalScanList.length; i++) {
      fileContent += `\n${finalScanList[i]}`;
    }
    if (!isFilePresent) {
      fileContent =
        'deviceId,timestamp,x,y,RoomId,RoomName,CoorId,acc_x, acc_y, acc_z, gyr_x, gyr_y, gyr_z, mag_ori_x, mag_ori_y, mag_ori_z, mag_cor_x, mag_cor_y, mag_cor_z, absolute' +
        // 'deviceId,timestamp, acc_x, acc_y, acc_z, gyr_x, gyr_y, gyr_z, mag_ori_x, mag_ori_y, mag_ori_z, mag_cor_x, mag_cor_y, mag_cor_z, absolute' +
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
        setFinalScanList([]),
      );
    } catch (error) {
      console.error('Error creating file:', error);
      Alert.alert('Error', 'Failed to create the file.');
    }
  };

  return (
    <>
      <Button
        title="Calibration"
        onPress={() => {
          setCalPopUp(true);
        }}
        disabled={onscanning}
      />
      <View style={{flex: 1}}>
        <CounterComponent value={count} changeFunction={setCount} />
        <View style={{paddingHorizontal: 70}}>
          {/* <Button
            title="Scan Wi-Fi"
            onPress={() => setIsScanning(true)}
            disabled={onscanning}
          /> */}
        </View>
        <View style={{paddingHorizontal: 70}}>
          <Button
            title="Create a file"
            onPress={handleFileSelection}
            disabled={onscanning}
          />
          <Button
            title="Start Scan"
            onPress={() => {
              magRef.current = {
                x: 0,
                y: 0,
                z: 0,
                correctedData: {
                  x: 0,
                  y: 0,
                  z: 0,
                },
                absCurrent: 0,
              };
              setIsScanning(true);
              intervalRef.current = setInterval(() => {
                magSub();
              }, 200);

              setTimeout(() => {
                clearInterval(intervalRef.current);
                setIsScanning(false);
              }, count * 60 * 1000);
            }}
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
          <Text>Available Data Networks:</Text>
          {finalScanList.map((wifi, index) => (
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
      <Modal visible={calPopUp} transparent>
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Button
              title="Can we Calibrate"
              onPress={() => setCalibration(true)}
            />
          </View>
        </View>
      </Modal>
      {calibration && (
        <CalibrationScreen visible={calibration} returnFun={calFun} />
      )}
    </>
  );
};
const {height, width} = Dimensions.get('window');
const styles = StyleSheet.create({
  centeredView: {
    height,
    width,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#00000080',
    zIndex: 10,
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});

export default WifiScanner;
