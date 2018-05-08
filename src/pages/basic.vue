<template>
  <div>
    <free-linechart
      timerange-type="datetimerange"
      :line-props="lineProps"
      :fig-data="figData"
      @lines-option-change="linesOptionChange">
    </free-linechart>
  </div>
</template>

<script type="text/ecmascript-6">
  import Moment from 'moment';
  import fetch from '../util/fetch';
  import replaceArray from '../util/replace-array';
  import bus from '../store/bus';
  import FreeLinechart from "../components/free-linechart";
  export default {
    name: 'basic',
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
            text: '数据项',
            values: [
              {
                key: '电流-A相',
                value: 'I-A'
              },
              {
                key: '电流-B相',
                value: 'I-B'
              },
              {
                key: '电流-C相',
                value: 'I-C'
              },
              {
                key: '电压-A相',
                value: 'U-A'
              },
              {
                key: '电压-B相',
                value: 'U-B'
              },
              {
                key: '电压-C相',
                value: 'U-C'
              },
              {
                key: '功率-A相',
                value: 'P-A'
              },
              {
                key: '功率-B相',
                value: 'P-B'
              },
              {
                key: '功率-C相',
                value: 'P-C'
              },
              {
                key: '功率-总',
                value: 'P-T'
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
        let postBody = linesOption;
        postBody.timeRange = postBody.timeRange.map(item => Moment(item).format('YYYY-MM-DD HH:mm'));
        fetch('/api/basic', {
          method: 'POST',
          body: postBody
        }).then(res => {
          if (res.status === 1) {
            return res.data;
          }
        }).then(data => {
          replaceArray(this.figData, data);
        })
      }
    }
  }
</script>

<style lang="scss" scoped>

</style>
