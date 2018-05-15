import Vue from 'vue';
import fetch from '../util/fetch';
import replaceArray from '../util/replace-array';

export default new Vue({
  data: {
    user: {
      username: ''
    },
    stations: [],
    dateRange: [],
    loading: false
  },
  watch: {
    'user.username': {
      handler (newVal) {
        console.log(newVal);
        if (newVal) {
          fetch('./api/brief').then(res => {
            if (res.status === 1) {
              this.$set(this, 'stations', res.data.stations);
              this.$set(this, 'dateRange', res.data.dateRange);
            }
          })
        }
      }
    }
  }
})
