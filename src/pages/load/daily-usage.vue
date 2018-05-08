<template>
  <div>
    <free-linechart
      timerange-type="daterange"
      :line-props="lineProps"
      :fig-data="figData"
      @lines-option-change="linesOptionChange">
    </free-linechart>
  </div>
</template>

<script type="text/ecmascript-6">
  import Moment from 'moment';
  import FreeLinechart from "../../components/free-linechart";
  import bus from '../../store/bus';
  import fetch from '../../util/fetch';
  import replaceArray from '../../util/replace-array';

  export default {
    name: 'dailiy-usage',
    components: {FreeLinechart},
    data () {
      return {
        lineProps: [
          {
            key: 'collectPointNo',
            text: '台区',
            values: []
          },
          {
            key: 'dataType',
            text: '用电量类型',
            values: [
              {
                key: '总用电量',
                value: 'total'
              },
              {
                key: '尖时段用电量',
                value: 'jian'
              },
              {
                key: '峰时段用电量',
                value: 'feng'
              },
              {
                key: '平时段用电量',
                value: 'ping'
              },
              {
                key: '谷时段用电量',
                value: 'gu'
              }
            ]
          }
        ],
        figData: []
      }
    },
    computed: {
      stations () {
        return bus.stations
      }
    },
    watch: {
      stations:{
        deep: true,
        immediate: true,
        handler () {
          if (this.stations.length) {
            replaceArray(this.lineProps[0].values, this.stations)
          }
        }
      }
    },
    methods: {
      linesOptionChange (linesOption) {
        console.log(linesOption);
        let postBody = linesOption;
        postBody.timeRange = postBody.timeRange.map(item => Moment(item).format('YYYY-MM-DD'));
        fetch('/api/load/dailyUsage', {
          method: 'POST',
          body: postBody
        }).then(res => {
          if (res.status === 1) {
            return res.data;
          }
        }).then(data => {
          replaceArray(this.figData, data);
        });
      }
    }
  }
</script>

<style lang="scss" scoped>

</style>
