import 'whatwg-fetch'
import queryString from 'query-string'
import bus from '../store/bus'

let betterFetch = function (url, option) {
  option = option || {};
  if (option && option.method === 'POST' && option.body && option.body instanceof Object ) {
    option.headers = {
      "Content-Type": "application/json"
    };
    option.body = JSON.stringify(option.body);
  }
  if (option.method === undefined || option.method === 'GET' && option.body) {
    let allParams = option.body;
    if (url.indexOf('?') >= 0) {
      allParams = Object.assign(queryString.parse(url.split('?')[1]), allParams);
    }
    url += '?' + queryString.stringify(allParams);
  }
  option.credentials = 'include';
  bus.loading = true;
  return fetch(url, option).then((res) => {
    bus.loading = false;
    if ((res.headers.get('Content-Type') || '').indexOf('application/json') >= 0) {
      return res.json()
    } else {
      return res
    }
  });
};

export default betterFetch
