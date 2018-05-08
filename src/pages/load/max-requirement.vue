<template>
  <el-container>
    <el-aside width="340px">
      <el-collapse class="data-group" v-model="openIndexes">
        <el-collapse-item v-for="(dataGroupItem, dataGroupIndex) in dataGroup" :name="dataGroupIndex">
          <div slot="title" class="title">
            <span>数据组 {{dataGroupIndex + 1}} <em v-show="!validGroup(dataGroupItem)">数据组无效</em></span>
            <el-button class="inline-btn del-btn" size="mini" type="danger" icon="el-icon-delete" circle @click.stop="delGroup(dataGroupIndex)"></el-button>
          </div>
          <small>月范围</small>
          <month-range-picker
            v-model="dataGroupItem.monthRange"
            :picker-option-start="getPickerOptions(dataGroupItem.monthRange, 'start')"
            :picker-option-end="getPickerOptions(dataGroupItem.monthRange, 'end')"
            :default-value-start="dateRange[0]"
            :default-value-end="dateRange[0]"
            @change="updateGroup(dataGroupItem, dataGroupIndex)">
          </month-range-picker>
          <small>台区</small>
          <el-select class="common-select" multiple v-model="dataGroupItem.collectPointNos"
                     @change="updateGroup(dataGroupItem, dataGroupIndex)">
            <el-option v-for="item in stations" :label="item.key" :value="item.value"></el-option>
          </el-select>
          <small>峰值类别</small>
          <el-select class="common-select" multiple v-model="dataGroupItem.types"
                     @change="updateGroup(dataGroupItem, dataGroupIndex)">
            <el-option v-for="item in typeOption" :label="item.key" :value="item.value"></el-option>
          </el-select>
          <div class="only-max-switcher">
            <el-switch
              v-model="dataGroupItem.onlyMax"
              active-color="#13ce66"
              @change="updateGroup(dataGroupItem, dataGroupIndex)">
            </el-switch>
            <small>只显示当月最大峰值</small>
          </div>
        </el-collapse-item>
        <el-button class="add-btn" type="info" icon="el-icon-plus" circle @click="addGroup"></el-button>
      </el-collapse>
    </el-aside>
    <el-main>
      <div ref="figContainer" class="fig-container"></div>
    </el-main>
  </el-container>
</template>

<script type="text/ecmascript-6">
  import HChart from 'highcharts';
  import Moment from 'moment';
  import fetch from '../../util/fetch';
  import getMarker from '../../util/marker-getter';

  import bus from '../../store/bus';

  import MonthRangePicker from "../../components/month-range-picker";

  const symbols = ['circle', 'square', 'diamond', 'triangle', 'triangle-down'];
  const colors = ['#058DC7', '#50B432', '#ED561B', '#DDDF00'].map(item => item + '80');

  export default {
    components: {MonthRangePicker},
    name: 'max-requirement',
    data () {
      return {
        openIndexes: [0],
        typeOption: [
          {
            key: '正向有功(总)',
            value: 'total'
          },
          {
            key: '正向有功(尖)',
            value: 'jian'
          },
          {
            key: '正向有功(峰)',
            value: 'feng'
          },
          {
            key: '正向有功(平)',
            value: 'ping'
          },
          {
            key: '正向有功(谷)',
            value: 'gu'
          }
        ],
        dataGroup: [
          {
            monthRange: [],
            collectPointNos: [],
            types: [],
            onlyMax: false
          }
        ],
        chart: null
      }
    },
    computed: {
      dateRange () {
        return bus.dateRange;
      },
      stations () {
        return bus.stations
      }
    },
    mounted () {
      getMarker.init(symbols, colors);
      let plotBandsConfig = [
        {
          timeRanges: [['19:00', '22:00']],
          type: '尖峰',
          color: '#FFB6D940'
        },
        {
          timeRanges: [['08:00', '11:00'], ['15:00', '19:00']],
          type: '高峰',
          color: '#FFC9B640'
        },
        {
          timeRanges: [['07:00', '08:00'], ['11:00', '15:00'], ['22:00', '23:00']],
          type: '平段',
          color: '#B6FFDC40'
        },
        {
          timeRanges: [['00:00', '07:00'], ['23:00', '23:59']],
          type: '谷时',
          color: '#E2FFB640'
        }
      ];
      let plotBands = [];
      plotBandsConfig.forEach(typeItem => {
        typeItem.timeRanges.forEach(rangeItem => {
          plotBands.push({
            from: Moment('2000-01-01 ' + rangeItem[0]).valueOf(),
            to: Moment('2000-01-01 ' + rangeItem[1]).valueOf(),
            color: typeItem.color,
            label: {
              text: typeItem.type
            }
          })
        })
      })

      this.chart = new HChart.chart({
        chart: {
          renderTo: this.$refs.figContainer,
          type: 'scatter',
          zoomType: 'x'
        },
        title: {
          text: ''
        },
        credits: {
          enabled: false
        },
        xAxis: {
          type: 'datetime',
          labels: {
            formatter () {
              return Moment(this.value).format('HH:mm')
            }
          },
          min: Moment('2000-01-01').valueOf(),
          max: Moment('2000-01-02').valueOf(),
          opposite: true,
          plotBands
        },
        yAxis: {
          type: 'category',
          reversed: true,
          title: {
            text: null
          },
          labels: {
            format: '数据组 {value}'
          }
        },
        legend: {
          enabled: false
        },
        tooltip: {
          formatter () {
            let {type, requirement, time, isMax, stationName} = this.point.name;
            return `
              <b>台区: </b> ${stationName} <br>
              <b>属性: </b> ${type} <br>
              <b>需量: </b> ${requirement} <br>
              <b>发生时间: </b> ${time} <br>
              <b>是否当月最大值: </b> ${isMax ? '是':'否'} <br>
            `
          }
        },
        series: [{}]
      });
    },
    methods: {
      addGroup () {
        this.dataGroup.push({
            monthRange: [],
            collectPointNos: [],
            types: [],
            onlyMax: false
        });
        this.openIndexes.push(this.dataGroup.length - 1);
        this.chart.addSeries({});
      },
      delGroup (index) {
        this.dataGroup.splice(index, 1);
        if (this.chart.series[index]) {
          for (let i = index + 1; i < this.chart.series.length; i++) {
            this.chart.series[i].update({
              data: this.chart.series[i].data.map(item => {
                return {
                  marker: item.marker,
                  name: item.name,
                  x: item.x,
                  y: item.y - 1
                }
              })
            }, false);
          }
          this.chart.redraw();
        }
      },
      updateGroup (group, index) {
        if (this.validGroup(group)) {
          group.monthRange = group.monthRange.map(item => Moment(item).format('YYYY-MM-DD'));
          fetch('/api/load/maxRequirement', {
            method: 'POST',
            body: group
          }).then(res => {
            if (res.status === 1) {
              return res.data
            }
          }).then(data => {
            let seriesItem = {
              data: []
            };
            data.forEach(stationItem => {
              let marker = getMarker(stationItem.collectPointNo);
              stationItem.peeks.forEach(peekItem => {
                peekItem.stationName = this.stations.find(item => item.value === stationItem.collectPointNo).key;
                seriesItem.data.push({
                  marker,
                  name: peekItem,
                  x: Moment(peekItem.time).set({year: 2000, month: 0, date: 1}).valueOf(),
                  y: index + 1
                })
              })
            });
            if (this.chart.series[index] === undefined) {
              for (let i = this.chart.series.length; i < index; i++) {
                console.log('add');
                this.chart.addSeries({}, false);
              }
              this.chart.addSeries(seriesItem, false);
            } else {
              this.chart.series[index].update(seriesItem, false);
            }
            this.chart.redraw();
          })
        }
      },
      validGroup (group) {
        return group.monthRange.length === 2 && group.collectPointNos.length && group.types.length;
      },
      getPickerOptions (monthRange, pickerType) {
        return {
          disabledDate (date) {
            if (pickerType === 'start') {
              return !Moment(date).isBetween(...bus.dateRange);
            } else if (pickerType === 'end') {
              if (monthRange[0]) {
                return !(Moment(date).isAfter(monthRange[0], 'month') && Moment(date).isBetween(...bus.dateRange));
              } else {
                return !Moment(date).isBetween(...bus.dateRange)
              }
            }
          }
        }
      },
    }
  }
</script>

<style lang="scss" scoped>
  small {
    margin-left: 5px;
  }
  .data-group {
    border-bottom: 0;
    .common-select {
      display: flex;
    }
    .title {
      display: flex;
      align-items: center;
      span {
        margin-right: 15px;
        em {
          margin-left: 10px;
          color: red;
        }
      }
      .inline-btn {
        height: 23px;
        width: 23px;
        padding: 0;
      }
    }
    .only-max-switcher {
      display: flex;
      align-items: center;
      margin-top: 12px;
      margin-left: 5px;
      small {
        margin-left: 15px;
      }
    }
    .add-btn {
      display: block;
      margin: 10px auto;
    }
  }
  .fig-container {
    height: 100%;
  }

</style>
