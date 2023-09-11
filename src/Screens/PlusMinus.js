import React, {useState} from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';

const CounterComponent = ({value, changeFunction}) => {
  const handleIncrement = () => {
    if (value < 100) {
      changeFunction(value + 1);
    }
  };

  const handleDecrement = () => {
    if (value > 0) {
      changeFunction(value - 1);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handleDecrement}>
        <Text style={styles.button}>-</Text>
      </TouchableOpacity>
      <View style={{marginHorizontal: 15}}>
        <Text style={styles.count}>{value}</Text>
        <Text>Minutes</Text>
      </View>

      <TouchableOpacity onPress={handleIncrement}>
        <Text style={styles.button}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 50,
  },
  count: {
    fontSize: 24,
    marginHorizontal: 20,
  },
  button: {
    fontSize: 24,
    paddingHorizontal: 20,
    borderColor: 'black',
    borderWidth: 1,
    borderRadius: 5,
  },
});

export default CounterComponent;
