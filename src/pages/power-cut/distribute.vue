<template>
  <div class="page-wrapper">
    <power-cut-form v-model="queryParam"></power-cut-form>
    <el-card class="y-axis-switcher-wrapper" :class="{open: openSwitcher}">
      <div class="y-axis-switcher">
        <el-radio-group class="switcher" v-model="dataType">
          <el-radio-button label="总停电天数" :disabled="dataTypeDateDisabled"></el-radio-button>
          <el-radio-button label="总停电次数"></el-radio-button>
          <el-radio-button label="总停电时长"></el-radio-button>
        </el-radio-group>
        <div class="label" @click="toggleSwitcher">
          <small>更改</small>
          <small>纵轴</small>
        </div>
      </div>
    </el-card>
    <div class="chart-container" ref="chartContainer"></div>
  </div>
</template>

<script type="text/ecmascript-6">
  import HChart from 'highcharts';
  import Moment from 'moment';

  import fetch from '../../util/fetch';
  import replaceArray from '../../util/replace-array';
  import ObjectKeyMap from '../../util/object-key-map';

  import PowerCutForm from "./components/power-cut-form";

  let labelKeyMap = {
    '按年': 'year',
    '按月': 'month',
    '按天': 'date',
    '按时段': 'timeArea',
    '按台区': 'collectPointNo'
  };

  let timeAreaCate = ['00:00', '00:15', '00:30', '00:45', '01:00', '01:15', '01:30', '01:45', '02:00', '02:15', '02:30',
    '02:45', '03:00', '03:15', '03:30', '03:45', '04:00', '04:15', '04:30', '04:45', '05:00', '05:15',
    '05:30', '05:45', '06:00', '06:15', '06:30', '06:45', '07:00', '07:15', '07:30', '07:45', '08:00',
    '08:15', '08:30', '08:45', '09:00', '09:15', '09:30', '09:45', '10:00', '10:15', '10:30', '10:45',
    '11:00', '11:15', '11:30', '11:45', '12:00', '12:15', '12:30', '12:45', '13:00', '13:15', '13:30',
    '13:45', '14:00', '14:15', '14:30', '14:45', '15:00', '15:15', '15:30', '15:45', '16:00', '16:15',
    '16:30', '16:45', '17:00', '17:15', '17:30', '17:45', '18:00', '18:15', '18:30', '18:45', '19:00',
    '19:15', '19:30', '19:45', '20:00', '20:15', '20:30', '20:45', '21:00', '21:15', '21:30', '21:45',
    '22:00', '22:15', '22:30', '22:45', '23:00', '23:15', '23:30', '23:45'];
  let monthCate = Array(12).fill(1).map((item, index) => String(index + 1));

  export default {
    components: {
      PowerCutForm},
    name: 'distribute',
    data () {
      return {
        queryParam: {
          dateRange: [],
          collectPointNos: [],
          groupOptions: []
        },
        clientProp: {},
        dataType: '总停电时长',
        chart: null,
        openSwitcher: false,
        dataTypeDateDisabled: false,
        queryResult: []
      }
    },
    watch: {
      queryParam: {
        deep: true,
        handler () {
          if (this.queryParam.groupOptions.length) {
            if (this.queryParam.groupOptions.includes('按天') || this.queryParam.groupOptions.includes('按时段')) {
              this.dataTypeDateDisabled = true;
              this.dataType = '总停电时长';
            } else {
              this.dataTypeDateDisabled = false;
            }
            this.query().then(queryResult => {
              replaceArray(this.queryResult, queryResult);
              this.drawChart(queryResult, this.dataType);
            });
          }
        }
      },
      dataType () {
        if (this.queryParam.groupOptions.length) {
          this.drawChart(this.queryResult, this.dataType);
        }
      }
    },
    mounted () {
      this.chart = new HChart.chart({
        chart: {
          renderTo: this.$refs.chartContainer,
          zoomType: 'x'
        },
        title: {
          text: ''
        },
        credits: {
          enabled: false
        },
        xAxis: {
          categories: []
        },
        yAxis: {
          title: {
            text: '总停电时长(小时)'
          }
        },
        series: []
      });
    },
    methods: {
      toggleSwitcher () {
        this.openSwitcher = !this.openSwitcher
      },
      drawChart (queryResult, yAxisDataType) {
        let groupOptions = {
          year: this.queryParam.groupOptions.includes('按年'),
          month: this.queryParam.groupOptions.includes('按月'),
          date: this.queryParam.groupOptions.includes('按天'),
          timeArea: this.queryParam.groupOptions.includes('按时段'),
          station: this.queryParam.groupOptions.includes('按台区')
        }
        let yAxisLabelMap = {
          '总停电天数': ['totalDays', '总停电天数(天)'],
          '总停电次数': ['count', '总停电次数(次)'],
          '总停电时长': ['totalTime', '总停电时长(小时)']
        }
        let haveGroupTime = this.queryParam.groupOptions.some(item => ['按年', '按月', '按天'].includes(item));
        let seriesBaseOn = [];
        let emptyX = [];
        let fillHandler = null; // fillHandler = (seriesData, resultItem) => {...}
        let seriesMap = new ObjectKeyMap();
        let series = [];


        if (queryResult[0].timeArea) {
          // 按时段则series默认96个空格,按位填充
          emptyX = Array(96).fill(0);
          fillHandler = (seriesData, resultItem) => {
            seriesData[timeAreaCate.indexOf(resultItem.timeArea)] = resultItem[yAxisLabelMap[yAxisDataType][0]];
          };
          this.chart.xAxis[0].update({
            categories: timeAreaCate
          }, false);
          if (queryResult[0].time) {
            seriesBaseOn.push('time');
          }
          if (queryResult[0].collectPointNo) {
            seriesBaseOn.push('collectPointNo');
          }
        } else if (queryResult[0].time) {
          // 按时间则根据timeRange groupOptions算出系列总数,按位填充
          if (groupOptions.month && !groupOptions.year && !groupOptions.date) {
            // 只按月聚合时
            emptyX =  Array(12).fill(0);
            fillHandler = (seriesData, resultItem) => {
              seriesData[monthCate.indexOf(resultItem.time)] = resultItem[yAxisLabelMap[yAxisDataType][0]];
            };
            this.chart.xAxis[0].update({
              categories: monthCate
            }, false);
          } else {
            let as = "";
            let formatString = '';
            if (groupOptions.year){
              as = 'years';
              formatString = 'YYYY';
            }
            if (groupOptions.month){
              as = 'months';
              formatString = 'YYYY-MM';
            }
            if (groupOptions.date){
              as = 'days';
              formatString = 'YYYY-MM-DD';
            }
            let duration = Math.ceil(Moment.duration(Moment(this.queryParam.dateRange[1]) - Moment(this.queryParam.dateRange[0])).as(as)) + 1;
            let timeCate = [];
            let timeIterator = new Moment(this.queryParam.dateRange[0]);
            for (let i = 0; i < duration; i++) {
              timeCate.push(timeIterator.format(formatString))
              timeIterator.add(1, as);
            }
            timeCate.push(timeIterator.format(formatString))
            emptyX = Array(duration).fill(0);
            fillHandler = (seriesData, resultItem) => {
              seriesData[timeCate.indexOf(resultItem.time)] = resultItem[yAxisLabelMap[yAxisDataType][0]];
            };
            this.chart.xAxis[0].update({
              categories: timeCate
            }, false);
          }
          if (queryResult[0].collectPointNo) {
            seriesBaseOn = ['collectPointNo'];
          }
        } else if (queryResult[0].collectPointNo) {
          // 按台区则根据collectPointNos算出系列总数
          seriesBaseOn = [];
          let clientPropCate = Object.keys(this.clientProp);
          emptyX = Array(clientPropCate.length).fill(0);
          fillHandler = (seriesData, resultItem) => {
            seriesData[clientPropCate.indexOf(resultItem.collectPointNo)] = resultItem[yAxisLabelMap[yAxisDataType][0]];
          };
          this.chart.xAxis[0].update({
            categories: clientPropCate.map(item => this.clientProp[item].name)
          }, false);
        }

        this.chart.yAxis[0].update({
          title: {
            text: yAxisLabelMap[yAxisDataType][1]
          }
        });

        queryResult.forEach(queryResultItem => {
          let mapKey = [];
          seriesBaseOn.forEach(seriesKey => {
            mapKey.push(queryResultItem[seriesKey]);
          });
          fillHandler(seriesMap.get(mapKey, {
            data: Array.from(emptyX)
          }).data, queryResultItem);
        });

        seriesMap.forEach((name, value) => {
          let seriesName = "";
          if (name.length) {
            let namePart = [];
            seriesBaseOn.forEach((key, index) => {
              if (key === 'collectPointNo') {
                namePart.push(this.clientProp[name[index]].name);
              } else {
                if (groupOptions.month && !groupOptions.year && !groupOptions.date) {
                  namePart.push(name[index] + '月');
                } else {
                  namePart.push(name[index]);
                }
              }
            });
            seriesName = namePart.join('|');
          }
          series.push({
            name: seriesName,
            data: value.data
          });
        });
        while (this.chart.series.length) {
          this.chart.series[0].remove(false);
        }
        series.forEach(seriesItem => {
          this.chart.addSeries(seriesItem, false);
        });
        this.chart.redraw();
      },
      query () {
        let param = Object.assign({}, this.queryParam);
        param.groupOptions = param.groupOptions.map(item => labelKeyMap[item]);
        if (param.groupOptions.includes('date')) {
          param.groupOptions = param.groupOptions.filter(item => !(['year', 'month'].includes(item)))
        }
        param.paging = false;
        return Promise.all([
          fetch('/api/powerCut/query', {
            method: 'POST',
            body: param
          }).then(res => {
            if (res.status === 1) {
              return res.data
            }
          }),
          fetch('/api/brief/clientProp', {
            method: 'POST',
            body: param.collectPointNos
          }).then(res => {
            if (res.status === 1) {
              return res.data
            }
          })
        ]).then(dataArr => {
          this.clientProp = dataArr[1];

          return dataArr[0].result;
        })
      }
    }
  }
</script>

<style lang="scss" scoped>
  .page-wrapper {
    position: relative;
    align-items: center;
    overflow: visible;
    .y-axis-switcher-wrapper {
      position: absolute;
      left: 0;
      bottom: 20px;
      z-index: 100;
      transform: translateX(-382px);
      transition: all .5s;
      &.open {
        transform: translateX(-22px);
      }
      .y-axis-switcher {
        display: flex;
        align-items: center;
        .label {
          small {
            margin: 0 0 0 20px;
          }
        }
      }
    }
    .chart-container {
      flex: 1 1 auto;
      width: 100%;
    }
  }
</style>
