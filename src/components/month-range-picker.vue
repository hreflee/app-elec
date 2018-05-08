<template>
  <div class="month-range-picker">
    <el-date-picker
      v-model="monthRange[0]"
      type="month"
      :picker-options="pickerOptionStart"
      :default-value="defaultValueStart"
      @change="startValueChange"
      placeholder="起始月">
    </el-date-picker>
    <span class="separator">~</span>
    <el-date-picker
      ref="endPicker"
      v-model="monthRange[1]"
      type="month"
      :picker-options="pickerOptionEnd"
      :default-value="monthRange[0] || defaultValueEnd"
      @change="endValueChange"
      placeholder="结束月">
    </el-date-picker>
  </div>
</template>

<script type="text/ecmascript-6">
  import Moment from 'moment';
  export default {
    name: 'month-range-picker',
    props: {
      value: {
        type: Array
      },
      pickerOptionStart: {},
      pickerOptionEnd: {},
      defaultValueStart: {},
      defaultValueEnd: {},
    },
    data () {
      return {
        monthRange: [null, null]
      }
    },
    watch: {
      value: {
        deep: true,
        immediate: true,
        handler () {
          if (this.value[0] && this.value[1]) {
            this.monthRange = this.value.map(item => new Date(item));
          }
        }
      }
    },
    methods: {
      startValueChange (date) {
        if (this.monthRange[1] && Moment(date).isSameOrAfter(this.monthRange[1], 'month')) {
          this.monthRange.pop();
          this.$refs.endPicker.focus();
          this.$emit('input', this.monthRange);
        } else if (!this.monthRange[1]) {
          this.$refs.endPicker.focus();
          this.$emit('input', this.monthRange);
        } else {
          this.$emit('input', this.monthRange);
          this.$emit('change', this.monthRange);
        }
      },
      endValueChange (date) {
        this.$emit('input', this.monthRange);
        this.$emit('change', this.monthRange);
      }
    }
  }
</script>

<style lang="scss" scoped>
  .month-range-picker {
    display: flex;
    align-items: center;
    .separator {
      margin: 0 6px;
    }
  }
</style>
