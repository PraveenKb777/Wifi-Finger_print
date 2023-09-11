import React, {useEffect, useState} from 'react';
import {View, Text, Button, ScrollView, SafeAreaView} from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import RNFS from 'react-native-fs';
import RoomList from './src/Screens/RoomList';
import CoorList from './src/Screens/CoorList';
import ScanScreen from './src/Screens/ScanScreen';

export const SCREENS = {
  HOME: 0,
  ROOMLIST: 1,
  COOR: 2,
  VIEWCSV: 3,
  SCANPAGE: 4,
};

const JsonReader = () => {
  const [jsonData, setJsonData] = useState(null);
  const [activeScreen, setActiveScreen] = useState(SCREENS.HOME);

  const [selectedRoom, setSelectedRoom] = useState('');

  const [setselectedRoomCoor, setSetselectedRoomCoor] = useState([]);
  const [setselectedFinalCoor, setSetselectedFinalCoor] = useState({
    Coordinate_Unique_ID: '',
    Grid_Point: ['x', 'y'],
    Room_Unique_ID: '3',
  });

  useEffect(() => {
    let data = jsonData?.Coordinates.filter(e => {
      return e.Room_Unique_ID === selectedRoom;
    });

    setSetselectedRoomCoor(data);
    if (data) {
      setActiveScreen(SCREENS.COOR);
    }
  }, [selectedRoom]);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles],
      });

      if (
        result[0].type === 'text/plain' ||
        result[0].type === 'application/json'
      ) {
        // Use react-native-fs to read the selected JSON file
        const content = await RNFS.readFile(result[0].uri, 'utf8');
        const parsedJson = JSON.parse(content);

        setJsonData(parsedJson);
      } else {
        alert('Please select a JSON file.');
      }
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        // User canceled the picker
      } else {
        throw err;
      }
    }
  };

  const selectRoom = id => {
    setSelectedRoom(id);
  };

  const changeScreen = screenName => {
    setActiveScreen(screenName);
  };

  const switchScreen = screnName => {
    switch (screnName) {
      case SCREENS.HOME:
        return (
          <View style={{flex: 1}}>
            <Button title="Pick JSON File" onPress={pickDocument} />

            <ScrollView>
              {jsonData ? (
                <Text>{JSON.stringify(jsonData)}</Text>
              ) : (
                <Text>No JSON data selected.</Text>
              )}
            </ScrollView>
            {jsonData?.Room.length && (
              <Button
                title="Can We Proceed to Select ROOM"
                onPress={() => {
                  setActiveScreen(SCREENS.ROOMLIST);
                  console.log('called');
                }}
              />
            )}
          </View>
        );

      case SCREENS.ROOMLIST:
        return (
          <RoomList
            list={jsonData?.Room}
            selectRoom={selectRoom}
            changeScreen={changeScreen}
          />
        );
      case SCREENS.COOR:
        return (
          <CoorList
            list={setselectedRoomCoor}
            changeScreen={changeScreen}
            setSetselectedFinalCoor={setSetselectedFinalCoor}
          />
        );

      case SCREENS.SCANPAGE:
        return <ScanScreen />;
    }
  };

  return (
    <SafeAreaView style={{flex: 1}}>{switchScreen(activeScreen)}</SafeAreaView>
  );
};

export default JsonReader;
