<template>
  <div>
    <el-form class="params-form" inline :model="queryParam">
      <el-form-item label="时段">
        <el-date-picker
          class="time-range-picker"
          v-model="queryParam.dateRange"
          type="daterange"
          :clearable="false"
          :picker-options="{disabledDate: dateLimit}"
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
          <el-checkbox label="按时段"></el-checkbox>
          <el-checkbox label="按台区"></el-checkbox>
        </el-checkbox-group>
      </el-form-item>
    </el-form>

  </div>
</template>

<script type="text/ecmascript-6">
  import Moment from 'moment';
  import bus from '../../../store/bus';
  export default {
    name: 'power-cut-form',
    props: {
      value: {
        type: Object
      }
    },
    data () {
      return {
        queryParam: {
          dateRange: [],
          collectPointNos: [],
          groupOptions: []
        }
      }
    },
    computed: {
      dateRange () {
        return bus.dateRange;
      },
      stations () {
        return bus.stations
      },
      dateLimit () {
        return (date) => {
          return !Moment(date).isBetween(...bus.dateRange, null, '[]');
        }
      }
    },
    watch: {
      dateRange: {
        deep: true,
        immediate: true,
        handler () {
          this.$nextTick(() => {
            this.queryParam.dateRange = this.dateRange;
          });
        }
      },
      value: {
        deep: true,
        immediate: true,
        handler () {
          this.queryParam = this.value;
        }
      },
      queryParam: {
        deep: true,
        handler () {
          this.$emit('change', this.queryParam);
        }
      }
    },
    methods: {
      toggleDate (val) {
        if (val) {
          !this.queryParam.groupOptions.includes('按年') && this.queryParam.groupOptions.push('按年');
          !this.queryParam.groupOptions.includes('按月') && this.queryParam.groupOptions.push('按月');
        }
      }
    }
  }
</script>

<style lang="scss" scoped>
  .time-range-picker {
    width: 300px;
  }
  .station-select {
    width: 400px;
  }
</style>
