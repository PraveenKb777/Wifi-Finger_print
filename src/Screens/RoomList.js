import {
  Alert,
  BackHandler,
  Button,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import {SCREENS} from '../../App';

const RoomList = ({list, selectRoom = () => {}, changeScreen}) => {
  useEffect(() => {
    const backAction = () => {
      Alert.alert('Hold on!', 'Are you sure you want to go back?', [
        {
          text: 'Cancel',
          onPress: () => null,
          style: 'cancel',
        },
        {text: 'YES', onPress: () => changeScreen(SCREENS.HOME)},
      ]);
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => backHandler.remove();
  }, []);

  const Items = ({data}) => {
    return (
      <View
        style={{
          marginTop: 10,
          borderRadius: 15,
          overflow: 'hidden',
          marginHorizontal: 15,
        }}>
        <Button
          title={data.Room}
          onPress={() => {
            selectRoom(data.Room_Unique_ID);
          }}
        />
      </View>
    );
  };

  return (
    <>
      <View
        style={{
          width: '100%',
          justifyContent: 'center',
          alignItems: 'center',
          height: 55,
          backgroundColor: 'white',
        }}>
        <Text style={{color: 'black'}}>Select a Room</Text>
      </View>
      <ScrollView style={{flex: 1}}>
        {list?.map((e, i) => {
          return <Items data={e} key={e.Room_Unique_ID} />;
        })}
      </ScrollView>
    </>
  );
};

export default RoomList;

const styles = StyleSheet.create({});
