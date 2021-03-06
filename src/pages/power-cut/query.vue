<template>
  <div class="page-wrapper">
    <power-cut-form v-model="queryParam"></power-cut-form>
    <el-table :data="queryResult" class="table" v-if="showTable" :show-overflow-tooltip="true">
      <el-table-column
        v-if="tableCol.time" prop="time"
        label="时间" width="150px" :formatter="timeColFormatter"></el-table-column>
      <el-table-column
        v-if="tableCol.timeArea" prop="timeArea"
        label="时段" width="150px" :formatter="timeAreaColFormatter"></el-table-column>
      <el-table-column
        v-if="tableCol.station" prop="clientName"
        label="用户名称" :show-overflow-tooltip="true"></el-table-column>
      <el-table-column
        v-if="tableCol.station" prop="clientAddr"
        label="用电地址" :show-overflow-tooltip="true"></el-table-column>
      <el-table-column
        v-if="tableCol.station" prop="collectPointNo"
        label="采集点编号" width="150px"></el-table-column>
      <el-table-column
        v-if="tableCol.count" prop="count"
        label="总停电次数" width="120px"></el-table-column>
      <el-table-column
        v-if="tableCol.totalDays" prop="totalDays"
        label="总停电天数" width="120px"></el-table-column>
      <el-table-column
        prop="totalTime" label="总停电时长" width="120px"></el-table-column>
      <el-table-column
        v-if="tableCol.validMethod" prop="validMethod"
        label="验证方式" width="120px"></el-table-column>
    </el-table>
    <el-pagination
      class="pagination"
      v-show="totalCount > pageSize"
      background
      layout="prev, pager, next"
      @current-change="changePage"
      :current-page.sync="currentPage"
      :page-count="Math.ceil(totalCount / pageSize)">
    </el-pagination>
  </div>
</template>

<script type="text/ecmascript-6">
  import Moment from 'moment';
  import bus from '../../store/bus';
  import fetch from '../../util/fetch';
  import replaceArray from '../../util/replace-array';
  import PowerCutForm from "./components/power-cut-form";
  export default {
    components: {PowerCutForm},
    name: 'query',
    data () {
      return {
        queryParam: {
          dateRange: [],
          collectPointNos: [],
          groupOptions: []
        },
        tableCol: {
          time: true,
          timeArea: false,
          station: true,
          count: false,
          totalDays: false,
          validMethod: true
        },
        queryResult: [],
        totalCount: 0,
        pageSize: 20,
        currentPage: 1,
        showTable: true
      }
    },
    computed: {
      dateRange () {
        return bus.dateRange;
      }
    },
    watch: {
      queryParam: {
        deep: true,
        handler () {
          this.currentPage = 1;
          this.query().then(() => {
            this.showTable = false;
            if (this.queryParam.groupOptions.length) {
              // 有聚合
              this.tableCol.count = true;
              this.tableCol.validMethod = false;
              this.tableCol.time = this.queryParam.groupOptions.some(item => ['按年', '按月', '按天'].includes(item)); // 如果有按年/月/天聚合则显示时间列
              this.tableCol.timeArea = this.queryParam.groupOptions.includes('按时段'); // 如果包含按台区聚合,则显示台区列
              this.tableCol.station = this.queryParam.groupOptions.includes('按台区'); // 如果包含按台区聚合,则显示台区列
              this.tableCol.totalDays = !this.queryParam.groupOptions.some(item => ['按天', '按时段'].includes(item)); // 如果不包含按天或按时段聚合,则显示总天数列
            } else {
              this.tableCol = {
                time: true,
                timeArea: false,
                station: true,
                count: false,
                totalDays: false,
                validMethod: true
              }
            }
            this.$nextTick(() => {
              this.showTable = true;
            })
          });
        }
      }
    },
    mounted () {
      this.$nextTick(() => {
        this.query()
      });
    },
    methods: {
      timeColFormatter (row, column, cellValue, index) {
        return cellValue + (cellValue && cellValue.length <= 2 ? '月':'');
      },
      timeAreaColFormatter (row, column, cellValue, index) {
        return `${cellValue}~${Moment(cellValue, 'HH:mm').add(0.25, 'hours').format('HH:mm')}`
      },
      changePage () {
        this.query();
      },
      query () {
        let param = Object.assign({
          page: this.currentPage
        }, this.queryParam);
        param.groupOptions = param.groupOptions.map(item => ({
          '按年': 'year',
          '按月': 'month',
          '按天': 'date',
          '按时段': 'timeArea',
          '按台区': 'collectPointNo'
        })[item]);
        if (param.groupOptions.includes('date')) {
          param.groupOptions = param.groupOptions.filter(item => !(['year', 'month'].includes(item)))
        }
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
          let queryResult = dataArr[0].result;
          let clientProp = dataArr[1];

          queryResult.forEach(item => {
            if (clientProp[item.collectPointNo]) {
              item.clientName = clientProp[item.collectPointNo].name;
              item.clientAddr = clientProp[item.collectPointNo].addr;
            }
          });

          replaceArray(this.queryResult, queryResult);
          this.pageSize = dataArr[0].pageSize;
          this.totalCount = dataArr[0].total;
        })
      }
    }
  }
</script>

<style lang="scss" scoped>
  .page-wrapper {
    align-items: center;
    overflow: scroll;
    .table {
      flex: 0 0 auto;
      max-width: 1200px;
      /deep/ {
        table {
          margin: auto;
        }
        td .cell {
          overflow: hidden !important;
          text-overflow: ellipsis !important;
          white-space: nowrap !important;
          vertical-align: middle;
        }
      }
      &:before {
        display: none;
      }
    }
    .pagination {
      margin: 10px auto;
      text-align: center;
    }
  }
</style>
