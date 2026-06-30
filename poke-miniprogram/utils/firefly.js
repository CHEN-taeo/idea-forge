/** 流萤光点动效 class 名 */

function cardEnterClass(index) {
  const delay = (index % 5);
  return 'firefly-enter firefly-d' + delay;
}

function withFireflyEnter(list) {
  if (!list || !list.length) return list || [];
  return list.map((item, i) => Object.assign({}, item, {
    enterClass: i < 8 ? cardEnterClass(i) : ''
  }));
}

function briefEnterClass(index) {
  return index < 3 ? 'firefly-enter firefly-d' + index : '';
}

module.exports = { cardEnterClass, withFireflyEnter, briefEnterClass };
