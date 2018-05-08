<template>
  <el-container>
    <el-aside width="340px">
      <small>时间范围</small>
      <el-date-picker
        class="date-picker"
        v-model="timeRange"
        :type="timerangeType"
        :picker-options="{disabledDate: dateLimit}"
        :default-value="dateRange"
        @change="emitChange"
        :format="'yyyy-MM-dd' + (timerangeType === 'datetimerange' ? ' HH:mm':'')"
        range-separator="~"
        start-placeholder="开始时间"
        end-placeholder="结束时间">
      </el-date-picker>
      <small>数据项</small>
      <el-table
        class="data-item-table"
        :data="lines"
        :show-header="false"
        empty-text="未添加数据项"
        :row-class-name="getRowClass"
        border>
        <el-table-column>
          <template slot-scope="scope">
            <el-form v-if="scope.$index === editingIndex" :model="scope.row" :rules="rules" label-width="95px" label-position="left" ref="addItemForm">
              <el-form-item v-for="(item, index) in scope.row" :label="textMap[index]" :prop="index">
                <el-select v-model="scope.row[index]">
                  <el-option v-for="option in valuesMap[index]" :label="option.key" :value="option.value"></el-option>
                </el-select>
              </el-form-item>
              <el-form-item class="form-btn-group" label-width="0">
                <el-button size="mini" type="success" icon="el-icon-check" circle @click="submitItem"></el-button>
                <el-button size="mini" type="danger" icon="el-icon-delete" circle @click="delItem(scope.$index)"></el-button>
              </el-form-item>
            </el-form>
            <div class="common-item" v-if="scope.$index !== editingIndex">
              <p class="text">{{getCommonItemText(scope.row)}}</p>
              <el-button class="inline-btn edit-btn" size="mini" type="warning" icon="el-icon-edit" circle @click="editItem(scope.$index)"></el-button>
              <el-button class="inline-btn del-btn" size="mini" type="danger" icon="el-icon-delete" circle @click="delItem(scope.$index)"></el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
      <el-button class="add-btn" type="info" icon="el-icon-plus" circle @click="addItem"></el-button>
    </el-aside>

    <el-main>
      <div ref="figContainer" class="fig-container"></div>
    </el-main>
  </el-container>
</template>

<script type="text/ecmascript-6">
  import HChart from 'highcharts';
  import Moment from 'moment';
  import bus from '../store/bus';

  export default {
    name: 'free-linechart',
    props: {
      'line-props': {
        type: Array
      },
      'timerange-type': {
        type: String,
        default: 'datetimerange'
      },
      'fig-data': {
        type: Array
      }
    },
    data () {
      return {
        timeRange: [],
        lines: [],
        textMap: {},
        valuesMap: {},
        rules: {},
        editingIndex: -1,
        chart: null
      }
    },
    computed: {
      dateRange () {
        return bus.dateRange;
      },
      dateLimit () {
        return (date) => {
          return !Moment(date).isBetween(...bus.dateRange);
        }
      }
    },
    watch: {
      lineProps: {
        deep: true,
        immediate: true,
        handler () {
          this.lineProps.forEach(item => {
            this.textMap[item.key] = item.text;
            this.valuesMap[item.key] = item.values;
            this.rules[item.key] = [{required: true, message: ' '}]
          });
        }
      },
      figData: {
        deep: true,
        handler () {
          let timeArray = [];
          let timeRange = this.timeRange.map(item => new Moment(item));
          let timeIterator = null;
          let grain = null;
          let figSeries = [];

          if (this.timerangeType === 'datetimerange') {
            // 如果粒度为15分钟
            grain = Moment.duration(15, 'minutes');
            while (timeRange[0].minute() % 15) {
              timeRange[0].add(1, 'minute');
            }
            while (timeRange[1].minute() % 15) {
              timeRange[1].subtract(1, 'minute');
            }
          } else {
            // 如果粒度为1天
            grain = Moment.duration(1, 'days');
          }

          timeIterator = new Moment(timeRange[0]);
          while (timeIterator.isSameOrBefore(timeRange[1])) {
            timeArray.push(timeIterator.valueOf());
            timeIterator.add(grain);
          }

          this.figData.forEach(figDataItem => {
            figSeries.push({
              name: this.getCommonItemText(figDataItem),
              data: figDataItem.data
                .map((dataItem, index) => [timeArray[index], dataItem])
                .filter((dataItem, index, array) => dataItem[1] !== null || (dataItem[1] === null && array[index + 1] && array[index + 1][1] === null))
            });
          });

          console.log(figSeries);
          this.chart.xAxis[0].update({
            min: timeRange[0].valueOf(),
            max: timeRange[1].valueOf()
          }, false);

          let beforeSeriesLen = this.chart.series.length;
          for (let i = 0; i < beforeSeriesLen; i++) {
            this.chart.series[0].remove(false);
          }
          figSeries.forEach((figSeriesItem, index) => {
            this.chart.addSeries(figSeriesItem, false);
          });
          this.chart.redraw();
        }
      }
    },
    mounted () {
      let tooltipFormat = this.timerangeType === 'datetimerange' ? 'YYYY-MM-DD HH:mm':'YYYY-MM-DD';
      this.chart = new HChart.chart({
        chart: {
          renderTo: this.$refs.figContainer,
          type: 'line',
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
              return Moment(this.value).format('YYYY-MM-DD')
            }
          }
        },
        tooltip: {
          formatter () {
            return `<span style="color: ${this.point.color}">●</span><b>${this.series.name}</b><br>
                     <b>${Moment(this.x).format(tooltipFormat)}: </b>${this.y}`
          }
        },
        series: []
      });
    },
    methods: {
      addItem () {
        let addCb = () => {
          let lineItem = {};
          this.lineProps.forEach(item => {
            lineItem[item.key] = '';
          });
          this.lines.push(lineItem);
          this.editingIndex = this.lines.length - 1;
        };
        if (this.$refs.addItemForm) {
          this.$refs.addItemForm.validate(valid => {
            if (valid) {
              addCb();
            }
          });
        } else {
          addCb();
        }
      },
      editItem (index) {
        let editCb = () => {
          this.editingIndex = index;
        };
        if (this.$refs.addItemForm) {
          this.$refs.addItemForm.validate(valid => {
            if (valid) {
              editCb();
            } else {
              this.lines.pop();
              editCb();
            }
          });
        } else {
          editCb();
        }
      },
      delItem (index) {
        this.lines.splice(index, 1);
        this.$refs.addItemForm && this.$refs.addItemForm.validate(valid => {
          if (!valid) {
            this.editingIndex--;
          }
        });
        this.emitChange();
      },
      submitItem () {
        this.$refs.addItemForm.validate(valid => {
          if (valid) {
            this.editingIndex = -1;
          }
        });
        this.emitChange();
      },
      getRowClass (rowInfo) {
        return rowInfo.rowIndex === this.editingIndex ? 'editing':''
      },
      getCommonItemText (item) {
        let ts = [];
        this.lineProps.forEach(linePropsItem => {
          let key = linePropsItem.key;
          let value = this.valuesMap[key].find(i => i.value === item[key])
          value && ts.push(value.key);
        });
        return ts.join(' | ');
      },
      emitChange () {
        if (this.timeRange && this.lines.length) {
          this.$emit('lines-option-change', {
            timeRange: this.timeRange,
            dataItems: this.lines
          });
        }
      },
      log () {
        console.log(arguments);
      }
    }
  }
</script>

<style lang="scss" scoped>
  small {
    margin-left: 5px;
    margin-top: 15px;
  }

  .left-side /deep/ div {
    overflow-x: hidden;
  }
  .date-picker {
    width: 340px;
  }
  .add-btn {
    display: block;
    margin: 10px auto;
  }
  .form-btn-group {
    display: flex;
    justify-content: center;
  }
  .common-item {
    display: flex;
    justify-content: center;
    .text {
      flex: 1 1 auto;
    }
    .inline-btn {
      flex: 0 0 auto;
      display: block;
      height: 23px;
      width: 23px;
      padding: 0;
      visibility: hidden;
    }
    &:hover {
      .inline-btn {
        visibility: visible;
      }
    }
  }
  .data-item-table {
    overflow: visible;
    /deep/ .el-table__body-wrapper {
      overflow: visible;
    }
    /deep/ .editing {
      box-shadow: 0 2px 12px 0 rgba(0,0,0,.1);;
    }
    /deep/ td,
    /deep/ tr{
      background-color: transparent !important;
    }
  }
  .fig-container {
    height: 100%;
  }
</style>
