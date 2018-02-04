## React Native Cascade Picker

react-native cascade picker for ios iOS & Android,use such as region picker,unlimited depth level.

<img src="https://github.com/jys125773/cascaderPicker/blob/master/cascaderpicker.gif" width="250" />

## Installation

```
npm install --save react-native-cascade-picker
# OR
yarn add react-native-cascade-picker
```

## Usage
```javascript
import React, { Component } from 'react';
import { StyleSheet, View } from 'react-native';
import CascadePicker from 'react-native-cascade-picker';
import areaData from './area.json';

export default class App extends Component {
  render() {
    return (
      <View style={styles.container}>
        <CascadePicker
          onSelect={(region) => {

          }}
          data={areaData}
          value={[
            {
              "value": "510000",
              "label": "四川省",
            },
            {
              "value": "510100",
              "label": "成都市",
            },
            {
              "value": "510182",
              "label": "彭州市",
            },
          ]}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5FCFF',
    marginTop: 40,
  },
});
```
