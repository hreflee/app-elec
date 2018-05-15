<template>
  <el-card>
    <div class="card-body">
      <el-steps class="step-indicator" direction="vertical" :active="activeStep" finish-status="success">
        <el-step title="步骤 1" description="选择要预测/验证的台区和日期"></el-step>
        <el-step title="步骤 2" description="输入必要的参数"></el-step>
        <el-step title="步骤 3" description="获得预测/验证结果"></el-step>
      </el-steps>
      <div class="steps-content">
        <div class="step step-1" v-if="activeStep === 0">
          <el-form :model="stationInfo" ref="step1Form" :rules="formRules">
            <el-form-item prop="collectPointNo" label="台区">
              <el-select class="station-select" v-model="stationInfo.collectPointNo">
                <el-option v-for="(item, index) in stations" :label="item" :value="index"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item prop="date" label="日期">
              <el-date-picker v-model="stationInfo.date" type="date" value-format="yyyy-MM-dd"></el-date-picker>
            </el-form-item>
            <el-form-item label-width="0">
              <el-button type="primary" @click="getSecondFields" :disabled="stepDisabled[0]">下一步</el-button>
            </el-form-item>
          </el-form>
        </div>
        <div class="step step-2" v-if="activeStep === 1">
          <el-form :model="predictParam" ref="step2Form" label-width="135px" label-position="left" :rules="formRules">
            <el-form-item v-for="(item, index) in predictParam" :prop="index" :label="predictParamLabels[index].label">
              <template v-if="selectorValues[index]">
                <el-select v-model="predictParam[index]" placeholder="请选择">
                  <el-option v-for="(labelItem, index) in selectorValues[index]" :value="index" :label="labelItem.label"></el-option>
                </el-select>
              </template>
              <template v-else>
                <el-input v-model="predictParam[index]" type="number" placeholder="请输入">
                  <span slot="suffix" class="input-desc">{{predictParamLabels[index].desc}}</span>
                </el-input>
              </template>
            </el-form-item>
            <el-form-item label-width="0">
              <el-button @click="lastStep" :disabled="stepDisabled[1]">上一步</el-button>
              <el-button type="primary" @click="getPredictResult" :disabled="stepDisabled[1]">下一步</el-button>
              <span class="comment">如需验证当日是否发生停电,请填写当日用电量</span>
            </el-form-item>
          </el-form>
        </div>
        <div class="step step-3" v-if="activeStep === 2">
          <div class="result-container">
            <template v-for="(item, index) in predictResult" v-if="!['total', 'validResult', 'predict', 'mape'].includes(index)">
              <div class="result-item" v-if="index === 'collectPointNo'">
                <label>台区</label>
                <span>{{stations[item]}}</span>
              </div>
              <div class="result-item" v-else-if="selectorValues[index]">
                <label>{{predictParamLabels[index] && predictParamLabels[index].label}}</label>
                <span>{{selectorValues[index][item].label}}</span>
              </div>
              <div class="result-item" v-else>
                <label>{{predictParamLabels[index] && predictParamLabels[index].label}}</label>
                <span>{{item | accurateToTwo | removeZero}}</span>
              </div>
            </template>
          </div>
          <div class="result-container" v-if="predictParam.total">
            <template v-for="(item, index) in predictResult" v-if="['total', 'validResult'].includes(index)">
              <div class="result-item bold" v-if="index === 'total'">
                <label>实际用电量</label>
                <span>{{item}}</span>
              </div>
              <div class="result-item bold" v-else>
                <label>验证结果</label>
                <span>{{item ? '较大概率发生停电':'较大概率未发生停电'}}</span>
              </div>
            </template>
          </div>
          <div class="result-container">
            <template v-for="(item, index) in predictResult" v-if="['predict', 'mape'].includes(index)">
              <div class="result-item bold">
                <label>{{predictParamLabels[index] && predictParamLabels[index].label}}</label>
                <span>{{item | accurateToTwo | removeZero}}{{index === 'mape' ? '%':''}}</span>
              </div>
            </template>
          </div>
          <el-button @click="lastStep">上一步</el-button>
        </div>
      </div>
    </div>
  </el-card>
</template>

<script type="text/ecmascript-6">
  import Moment from 'moment';
  import bus from '../../../store/bus';
  import fetch from '../../../util/fetch';

  const transKey = (key) => {
    let labelMap = {
      'total': '用电量',
      'TEM': '平均气温'
    };
    let keySplit = key.split('_');
    return `${keySplit[2]}日前${labelMap[keySplit[1]]}`;
  };

  let defaultPredictParamLabels = {
    date: {
      label: '日期'
    },
    TEM: {
      label: '当日平均气温',
      desc: ''
    },
    holiday: {
      label: '当日是否为节假日',
      desc: ''
    },
    season: {
      label: '当日季节',
      desc: ''
    },
    total: {
      label: '实际用电量',
      desc: ''
    },
    predict: {
      label: '预测用电量'
    },
    mape: {
      label: '精确度'
    }
  };

  export default {
    name: 'predict-item',
    data () {
      return {
        activeStep: 0,
        stationInfo: {
          collectPointNo: '',
          date: '',
        },
        predictParam: {
          TEM: '',
          holiday: '',
          season: ''
        },
        predictParamLabels: defaultPredictParamLabels,
        selectorValues: {
          'holiday': [
            {
              label: '非节假日'
            },
            {
              label: '非春节节假日'
            },
            {
              label: '春节节假日'
            }
          ],
          'season': [
            {
              label: '冬季'
            },
            {
              label: '春季或秋季'
            },
            {
              label: '夏季'
            }
          ]
        },
        formRules: {
          collectPointNo: [{required: true, message: ' '}],
          date: [{required: true, message: ' '}],
          TEM: [{required: true, message: ' '}],
          holiday: [{required: true, message: ' '}],
          season: [{required: true, message: ' '}]
        },
        stepDisabled: [
          false,
          false
        ],
        predictResult: {}
      }
    },
    computed: {
      stations () {
        let map = {};
        bus.stations.forEach(item => {
          map[item.value] = item.key;
        });
        return map;
      }
    },
    filters: {
      accurateToTwo (value) {
        return (typeof value === 'number') ? value.toFixed(2):value
      },
      removeZero (value) {
        let demicalPart = value.split('.')[1] || '';
        if (demicalPart.search(/[1-9]/) >= 0) {
          return value;
        } else {
          return value.split('.')[0];
        }
      }
    },
    methods: {
      lastStep () {
        this.activeStep--;
        this.$nextTick(() => {
          this.$refs[`step${this.activeStep + 1}Form`].clearValidate();
        });
        if (this.activeStep === 0) {
          this.predictParam = {
            TEM: '',
            holiday: 0,
            season: 0
          };
          this.predictParamLabels = defaultPredictParamLabels;
        }
      },
      getSecondFields () {
        this.$refs.step1Form.validate((valid) => {
          if (valid) {
            this.$set(this.stepDisabled, 0, true);
            fetch('/api/predict/secondFields', {
              body: {
                collectPointNo: this.stationInfo.collectPointNo,
                date: this.stationInfo.date
              }
            }).then(res => {
              if (res.status === 1) {
                return res.data
              }
            }).then(data => {
              data.forEach(item => {
                this.$set(this.predictParam, item.key, item.desc.length ? item.value:'');
                this.$set(this.formRules, item.key, [{required: true, message: ' '}]);
                this.$set(this.predictParamLabels, item.key, {
                  label: transKey(item.key),
                  desc: item.desc
                });
              });
              this.$set(this.predictParam, 'total', '');

              this.activeStep = 1;
              this.$set(this.stepDisabled, 0, false);
              this.$nextTick(() => {this.$refs.step2Form.resetFields()})
            }).catch((err) => {
              this.$message.error('发生错误');
              console.error(err);
              this.$set(this.stepDisabled, 0, false);
            });
          }
        })
      },
      getPredictResult () {
        this.$refs.step2Form.validate(valid => {
          if (valid) {
            this.$set(this.stepDisabled, 1, true);
            let predictParam = Object.assign({}, this.predictParam);
            Object.keys(predictParam).forEach(key => {
              predictParam[key] = parseFloat(predictParam[key] || 0);
            });
            let allParam = Object.assign(Object.assign({}, this.stationInfo), predictParam, {date: undefined});
            console.log(allParam);
            fetch('/api/predict/result', {
              method: 'POST',
              body: allParam
            }).then(res => {
              if (res.status === 1) {
                return res.data
              }
            }).then(data => {
              this.predictResult = Object.assign(Object.assign({}, this.stationInfo), predictParam, data);
              this.$set(this.stepDisabled, 1, false);
              this.activeStep = 2;
            }).catch((err) => {
              this.$message.error('发生错误');
              console.error(err);
              this.$set(this.stepDisabled, 1, false);
            });
          }
        })
      }
    }
  }
</script>

<style lang="scss" scoped>
  @import '../../../../node_modules/element-ui/packages/theme-chalk/src/common/var.scss';
  .card-body {
    display: flex;
    min-height: 300px;
    .step-indicator {
      flex: 0 0 300px;
      height: auto;
    }
    .steps-content {
      flex: 1 1 auto;
      padding: 20px 40px;
      /deep/ .el-input {
        width: 350px;
      }
      .step-2 {
        .input-desc {
          margin-right: 6px;
          background: white;
          font-size: 12px;
          color: $--color-info;
        }
        .comment {
          float: right;
          font-size: 12px;
          color: $--color-info;
        }
      }
      .step-3 {
        .result-container {
          display: flex;
          flex-wrap: wrap;
          max-width: 700px;
          &:not(:last-child) {
            margin-bottom: 30px;
          }
          .result-item {
            flex: 0 0 50%;
            display: flex;
            box-sizing: border-box;
            align-items: center;
            padding-right: 22px;
            margin-bottom: 22px;
            label {
              flex: 0 0 120px;
              margin-right: 12px;
              font-size: 14px;
              color: $--color-info;
            }
            span {
              font-size: 14px;
            }
            &.bold {
              span {
                font-size: 16px;
                font-weight: bold;
              }
            }
          }
        }
      }
    }
  }
</style>
