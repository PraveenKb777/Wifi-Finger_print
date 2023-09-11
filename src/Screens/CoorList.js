import {
  Alert,
  BackHandler,
  Button,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import React, {useEffect} from 'react';
import {SCREENS} from '../../App';

const CoorList = ({list, changeScreen, setSetselectedFinalCoor}) => {
  useEffect(() => {
    const backAction = () => {
      Alert.alert('Hold on!', 'Are you sure you want to go back?', [
        {
          text: 'Cancel',
          onPress: () => null,
          style: 'cancel',
        },
        {text: 'YES', onPress: () => changeScreen(SCREENS.ROOMLIST)},
      ]);
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => backHandler.remove();
  }, []);

  return (
    <ScrollView style={{flex: 1}}>
      {list?.map(e => {
        return (
          <View
            key={e.Coordinate_Unique_ID}
            style={{
              marginTop: 10,
              marginBottom: 5,
              borderRadius: 15,
              overflow: 'hidden',
              marginHorizontal: 15,
            }}>
            <Button
              title={`(${e.Grid_Point[0]},${e.Grid_Point[1]})`}
              onPress={() => {
                setSetselectedFinalCoor(e);
                changeScreen(SCREENS.SCANPAGE);
              }}
            />
          </View>
        );
      })}
    </ScrollView>
  );
};

export default CoorList;

const styles = StyleSheet.create({});
