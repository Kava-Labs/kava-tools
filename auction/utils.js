/**
 * performs an event-loop blocking callback function on each item in the input array
 * @param {object} array the array to perform the callback on
 * @param {*} callback the callback function to perform
 * @returns {Promise<boolean>}
 */
var asyncForEach = async (array, callback) => {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
};

var filterObjectByProperty = (object, property) => {
  if (object.hasOwnProperty(property)) return object;

  for (var i = 0; i < Object.keys(object).length; i++) {
    if (typeof object[Object.keys(object)[i]] == 'object') {
      var o = filterObjectByProperty(object[Object.keys(object)[i]], property);
      if (o != null) return o;
    }
  }

  return null;
};

module.exports = {
  asyncForEach,
  filterObjectByProperty,
};