import Vue from 'vue';
import fetch from '../util/fetch';
import replaceArray from '../util/replace-array';

export default new Vue({
  data: {
    user: {
      username: ''
    },
    stations: [],
    dateRange: []
  },
  watch: {
    'user.username': {
      handler (newVal) {
        console.log(newVal);
        if (newVal) {
          fetch('./api/brief').then(res => {
            if (res.status === 1) {
              replaceArray(this.stations, res.data.stations);
              replaceArray(this.dateRange, res.data.dateRange);
            }
          })
        }
      }
    }
  }
})
