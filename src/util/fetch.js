import 'whatwg-fetch'
import QueryString from 'query-string'
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
      allParams = Object.assign(QueryString.parse(url.split('?')[1]), allParams);
    }
    let queryString = QueryString.stringify(allParams)
    url += (queryString.length ? '?':'') + queryString;
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
