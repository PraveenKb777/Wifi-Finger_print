import {Dimensions, Modal, StyleSheet, Text, View} from 'react-native';
import React, {useEffect, useRef, useState} from 'react';
import {PermissionsAndroid} from 'react-native';
import {
  magnetometer,
  setUpdateIntervalForType,
  SensorTypes,
} from 'react-native-sensors';

const INTERVAL = 100;
const TIMEOUT = 5000;
const CalibrationScreen = ({returnFun = () => {}, visible = false}) => {
  const [mag, setMag] = useState([]);
  setUpdateIntervalForType(SensorTypes.magnetometer, INTERVAL);

  const magRef = useRef(null);

  const magList = useRef(mag);

  magList.current = mag;
  useEffect(() => {
    magRef.current = subMag();

    setTimeout(() => {
      unsubscribeAll();
      returnFun(calc());
    }, TIMEOUT);

    return () => {
      unsubscribeAll();
    };
  }, []);

  const calOffset = arr => {
    // console.log(Math.min(arr));
    return (Math.min(...arr) + Math.max(...arr)) / 2;
  };
  const calOffDeltaValue = arr => {
    // console.log(Math.min(arr));
    return (Math.max(...arr) - Math.min(...arr)) / 2;
  };
  const calc = () => {
    // raw data
    const magX = magList.current.map(e => e.x);
    const magY = magList.current.map(e => e.y);
    const magZ = magList.current.map(e => e.z);

    // avg offset
    const offsetX = calOffset(magX);
    const offsetY = calOffset(magY);
    const offsetZ = calOffset(magZ);

    const hardCorrectedX = magX.map(e => e - offsetX);
    const hardCorrectedY = magY.map(e => e - offsetY);
    const hardCorrectedZ = magZ.map(e => e - offsetZ);

    // // avg delta offser
    const delX = calOffDeltaValue(hardCorrectedX);
    const delY = calOffDeltaValue(hardCorrectedY);
    const delZ = calOffDeltaValue(hardCorrectedZ);

    // // total delta offset
    const avgDelta = (delX + delY + delZ) / 3;

    // // scall offset
    const scaleX = avgDelta / delX;
    const scaleY = avgDelta / delY;
    const scaleZ = avgDelta / delZ;

    return {
      offsetX,
      offsetY,
      offsetZ,
      delX,
      delY,
      delZ,
      avgDelta,
      scaleX,
      scaleY,
      scaleZ,
      hardCorrectedX,
      hardCorrectedY,
      hardCorrectedZ,
    };
  };
  const unsubscribeAll = () => {
    magRef.current.unsubscribe();
  };

  const subMag = () => {
    const subscription = magnetometer.subscribe(({x, y, z, timestamp}) =>
      setMag(e => {
        return [...e, {x, y, z, timestamp}];
      }),
    );
    return subscription;
  };

  return (
    <Modal animationType="slide" transparent={true} visible={visible}>
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.modalText}>Calibirating</Text>
        </View>
      </View>
    </Modal>
  );
};

export default CalibrationScreen;
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
  button: {
    borderRadius: 20,
    padding: 10,
    elevation: 2,
  },
  buttonOpen: {
    backgroundColor: '#F194FF',
  },
  buttonClose: {
    backgroundColor: '#2196F3',
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
    color: 'black',
  },
});
