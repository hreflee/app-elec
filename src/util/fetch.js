import 'whatwg-fetch'

let betterFetch = function (url, option) {
  option = option || {};
  if (option && option.method === 'POST' && option.body && option.body instanceof Object ) {
    option.headers = {
      "Content-Type": "application/json"
    };
    option.body = JSON.stringify(option.body);
  }
  option.credentials = 'include';
  return fetch(url, option).then((res) => {
    if ((res.headers.get('Content-Type') || '').indexOf('application/json') >= 0) {
      return res.json()
    } else {
      return res
    }
  });
};

export default betterFetch
