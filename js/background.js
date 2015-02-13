(function () {
  var databaseName = 'display_helper', databaseVersion = '1.0';
  var databaseStorage = new DatabaseStorage();
  databaseStorage.init(databaseName, databaseVersion);
  databaseStorage.createTable('rules', {website: 'text', dom: 'text', action: 'text', enabled: 'text'});

  chrome.extension.onMessage.addListener(function (request, sender, sendResponse) {
    var keyWords = ['insert', 'delete', 'update', 'query'];
    if (keyWords.indexOf(request.message) > -1) {
      var fun = databaseStorage[request.message + "BySql"];
      if (typeof fun == 'function'){
        fun.call(databaseStorage, request.sql, request.data || [], function(succeed, result){
          sendResponse({status: succeed, data: result});
        });
        return true;
      }
    }
    if (request.message == 'openOptions') {
      chrome.extension.getBackgroundPage().open('options.html');
    }
  });
})();