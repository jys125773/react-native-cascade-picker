import React from 'react';
import PropTypes from 'prop-types';
import {
  Platform,
  Dimensions,
  StyleSheet,
  Animated,
  PixelRatio,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  TouchableNativeFeedback,
  FlatList,
} from 'react-native';

import areaData from './area.json';

const Touchable = Platform.OS === 'ios' ? TouchableOpacity : TouchableNativeFeedback;
const PIXEL_RADIO = 1 / PixelRatio.get();
const SCREEN_WIDTH = Dimensions.get('window').width;

class CascaderPicker extends React.Component {
  constructor(props) {
    super(props);

    this.activeUnderlineLeft = new Animated.Value(0);
    this.activeUnderlineWidth = new Animated.Value(0);

    this.tabsOffsetMap = {};

    const len = props.value.length;
    this.state = {
      values: this.getValues(props),
      activeIndex: len === 0 ? 0 : len - 1,
    };
  }

  getValues(props) {
    const { value, data } = props;

    return value.reduce((acc, cur, index) => {
      if (index === 0) {
        acc[0].label = cur.label;
        acc[0].value = cur.value;
        const initialScrollIndex = acc[0].siblings.findIndex(({ value }) => value === cur.value);

        acc[0].initialScrollIndex = initialScrollIndex;
        acc[0].children = acc[0].siblings[initialScrollIndex].children;
      } else {
        const initialScrollIndex = acc[index - 1].children.findIndex(({ value }) => value === cur.value);
        const item = acc[index - 1].children[initialScrollIndex];

        acc.push({ ...item, initialScrollIndex, siblings: acc[index - 1].children });
      }

      return acc;
    }, [{ siblings: data, label: '', value: '' }]);
  }

  _keyExtractor = (item) => item.value

  _onTabLayout = (e, index) => {
    const { width, x } = e.nativeEvent.layout;
    this.tabsOffsetMap[index] = { width, x };
    if (index === this.state.activeIndex) {
      this.activeUnderlineLeft.setValue(x);
      this.activeUnderlineWidth.setValue(width);
    }
  }

  _onHorizontalScroll = (e) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const { activeIndex } = this.state;
    const radio = offsetX / SCREEN_WIDTH - activeIndex;
    const target = this.tabsOffsetMap[activeIndex + (radio > 0 ? 1 : -1)];

    if (!target || !this.tabsOffsetMap[activeIndex]) {
      return;
    }

    const { x, width } = this.tabsOffsetMap[activeIndex];

    if (radio > 0) {
      this.activeUnderlineLeft.setValue(x + radio * (target.x - x));
      this.activeUnderlineWidth.setValue(width + radio * (target.width - width));
    } else if (radio < 0) {
      this.activeUnderlineLeft.setValue(x + radio * (x - target.x));
      this.activeUnderlineWidth.setValue(width + radio * (width - target.width));
    } else {
      this.activeUnderlineLeft.setValue(x);
      this.activeUnderlineWidth.setValue(width);
    }
  }

  _onMomentumScrollEnd = () => {
    this.setState({
      activeIndex: this.$targetIndex,
    });
  }

  _animteTo = (index) => {
    this._scrollTo(index);
  }

  _scrollTo(index, animated = true) {
    this.$targetIndex = index;
    this.refs.scroller && this.refs.scroller.scrollTo({ animated, x: SCREEN_WIDTH * index, y: 0 });
  }

  _onSelectRegion = (index, value) => {
    let values = this.state.values.slice(0, index)
      .concat({ ...value, siblings: this.state.values[index].siblings });

    if (value.children) {
      values = values.concat({ siblings: value.children, label: '', value: '' });
    }

    this.setState({ values }, () => {
      if (value.children) {
        this._scrollTo(index + 1);
      } else {
        this.props.onCheck(values.map(({ value, label }) => ({ value, label })));
      }
    });
  }

  shouldComponentUpdate(nextProps, nextState) {
    return nextState.values !== this.state.values
      || nextState.activeIndex !== this.state.activeIndex
      || nextProps.value !== this.props.value;
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.value !== this.props.value) {
      const len = nextProps.value.length;

      this.setState({
        values: this.getValues(nextProps),
        activeIndex: len === 0 ? 0 : len - 1,
      }, (v) => {
        const { x, width } = this.tabsOffsetMap[this.state.activeIndex];
        this.activeUnderlineLeft.setValue(x);
        this.activeUnderlineWidth.setValue(width);
      });
    }
  }

  componentDidMount() {
    this._scrollTo(this.state.activeIndex, false);
  }

  render() {
    const { values, activeIndex } = this.state;
    const { activeColor, underlineHeight, containerHeight } = this.props;

    return (
      <View style={[styles.container, { height: containerHeight }]}>
        <View style={[styles.tabs, { borderBottomWidth: underlineHeight }]}>
          {values.map(({ label, value }, index) => {
            return (
              <Animated.View
                onLayout={e => this._onTabLayout(e, index)}
                key={index}>
                <Touchable onPress={() => this._animteTo(index)}>
                  <Text
                    style={[styles.tabText, activeIndex === index && { color: activeColor }]}
                  >{label || '请选择'}</Text>
                </Touchable>
              </Animated.View>
            );
          })}
          <Animated.View style={[
            styles.activeUnderline,
            {
              width: this.activeUnderlineWidth,
              left: this.activeUnderlineLeft,
              backgroundColor: activeColor,
              height: underlineHeight,
              bottom: -underlineHeight,
              position: 'absolute',
            },
          ]} />
        </View>
        <ScrollView
          ref="scroller"
          onScroll={this._onHorizontalScroll}
          scrollEventThrottle={8}
          onMomentumScrollEnd={this._onMomentumScrollEnd}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={styles.content}>
          {values.map(({ siblings, value, initialScrollIndex }, index) => {

            return (
              <FlatList
                key={index}
                keyExtractor={this._keyExtractor}
                extraData={value}
                data={siblings}
                initialScrollIndex={initialScrollIndex}
                getItemLayout={(item, index) => ({ length: siblings.length, offset: 40 * index, index })}
                style={styles.regions}
                renderItem={({ item }) => {
                  const active = value === item.value;

                  return (
                    <Touchable
                      onPress={() => this._onSelectRegion(index, item)}
                      style={styles.region}>
                      <Text style={[styles.regionText, active && { color: activeColor }]}>
                        {item.label + (active ? '    √' : '')}
                      </Text>
                    </Touchable>
                  );
                }} />
            );
          })}
        </ScrollView>
      </View>
    );
  }
}

CascaderPicker.propTypes = {
  onCheck: PropTypes.func,
  value: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.string,
    label: PropTypes.string,
  })),
  data: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.string,
    label: PropTypes.string,
    children: PropTypes.array,
  })).isRequired,
  activeColor: PropTypes.string,
  underlineHeight: PropTypes.number,
  containerHeight: PropTypes.number,
};

CascaderPicker.defaultProps = {
  onCheck: () => { },
  value: [],
  data: areaData,
  activeColor: '#FF7F24',
  underlineHeight: 4 * PIXEL_RADIO,
  containerHeight: 400,
};

export default CascaderPicker;

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
  },
  tabs: {
    borderBottomColor: '#ccc',
    flexDirection: 'row',
    width: SCREEN_WIDTH,
  },
  tabText: {
    marginHorizontal: 14,
    paddingVertical: 14,
  },
  content: {
    flex: 1,
    width: SCREEN_WIDTH,
  },
  regions: {
    width: SCREEN_WIDTH,
    flex: 1,
    paddingLeft: 10,
  },
  region: {
    height: 40,
  },
  regionText: {
    lineHeight: 40,
  },
});