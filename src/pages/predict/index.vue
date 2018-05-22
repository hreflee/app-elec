<template>
  <div class="page-wrapper">
    <predict-item class="predict-item" v-for="item in predictCount"></predict-item>
    <div class="add-btn-wrapper">
      <el-button class="add-btn" type="info" icon="el-icon-plus" circle @click="addItem"></el-button>
    </div>
  </div>
</template>

<script type="text/ecmascript-6">
  import PredictItem from "./components/predict-item";
  export default {
    components: {
      PredictItem},
    name: 'predict',
    data () {
      return {
        predictCount: 1
      }
    },
    methods: {
      addItem () {
        this.predictCount++;
      }
    }
  }
</script>

<style lang="scss" scoped>
  .page-wrapper {
    overflow: scroll;
  }
  .predict-item {
    flex: 0 0 auto;
    margin-bottom: 20px;
  }
  .add-btn-wrapper {
    margin-bottom: 20px;
    text-align: center;
  }
  .add-btn {
    flex: 0 0 auto;
  }
</style>
