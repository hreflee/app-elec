<template>
  <div class="page-wrapper">
    <el-form class="params-form" inline :model="queryParam">
      <el-form-item label="时段">
        <el-date-picker
          class="time-range-picker"
          v-model="queryParam.dateRange"
          type="daterange"
          :clearable="false"
          range-separator="~"
          start-placeholder="开始时间"
          end-placeholder="结束时间">
        </el-date-picker>
      </el-form-item>
      <el-form-item label="台区">
        <el-select class="station-select" multiple v-model="queryParam.collectPointNos">
          <el-option v-for="item in stations" :label="item.key" :value="item.value"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="聚合">
        <el-checkbox-group v-model="queryParam.groupOptions" class="group-checkbox">
          <el-checkbox label="按年" :disabled="queryParam.groupOptions.includes('按天')"></el-checkbox>
          <el-checkbox label="按月" :disabled="queryParam.groupOptions.includes('按天')"></el-checkbox>
          <el-checkbox label="按天" @change="toggleDate"></el-checkbox>
          <el-checkbox label="按台区"></el-checkbox>
        </el-checkbox-group>
      </el-form-item>
    </el-form>
    <el-table :data="queryResult" class="table" ref="table">
      <el-table-column v-if="tableCol.time" prop="time" label="时间" width="150px"></el-table-column>
      <el-table-column v-if="tableCol.station" prop="clientName" label="用户名称"></el-table-column>
      <el-table-column v-if="tableCol.station" prop="clientAddr" label="用电地址"></el-table-column>
      <el-table-column v-if="tableCol.station" prop="collectPointNo" label="采集点编号" width="150px"></el-table-column>
      <el-table-column v-if="tableCol.count" prop="count" label="总停电次数" width="120px"></el-table-column>
      <el-table-column v-if="tableCol.totalDays" prop="totalDays" label="总停电天数" width="120px"></el-table-column>
      <el-table-column prop="totalTime" label="总停电时长" width="120px"></el-table-column>
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
  import bus from '../../store/bus';
  import fetch from '../../util/fetch';
  import replaceArray from '../../util/replace-array';
  export default {
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
          station: true,
          count: false,
          totalDays: false
        },
        queryResult: [],
        totalCount: 0,
        pageSize: 20,
        currentPage: 1
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
    watch: {
      dateRange: {
        deep: true,
        immediate: true,
        handler () {
          this.queryParam.dateRange = this.dateRange;
        }
      },
      queryParam: {
        deep: true,
        handler () {
          this.currentPage = 1;
          this.query().then(() => {
            if (this.queryParam.groupOptions.length) {
              // 有聚合
              this.tableCol.count = true;
              this.tableCol.totalDays = !this.queryParam.groupOptions.includes('按天'); // 如果不包含按日期聚合,则显示总天数列
              this.tableCol.station = this.queryParam.groupOptions.includes('按台区'); // 如果包含按台区聚合,则显示台区列
              this.tableCol.time = !(this.queryParam.groupOptions.length === 1 && this.queryParam.groupOptions[0] === '按台区'); // 如果只有按台区聚合,则隐藏时间列
            } else {
              this.tableCol = {
                time: true,
                station: true,
                count: false,
                totalDays: false
              }
            }
          });
        }
      }
    },
    methods: {
      toggleDate (val) {
        if (val) {
          !this.queryParam.groupOptions.includes('按年') && this.queryParam.groupOptions.push('按年');
          !this.queryParam.groupOptions.includes('按月') && this.queryParam.groupOptions.push('按月');
        }
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
    .params-form {
      .time-range-picker {
        width: 300px;
      }
      .station-select {
        width: 400px;
      }
    }
    .table {
      flex: 0 0 auto;
      max-width: 1200px;
    }
    .pagination {
      margin: 10px auto;
      text-align: center;
    }
  }
</style>
