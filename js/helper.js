(function () {

  var DisplayHelper = function () {
    var self = this;
    var sql = "select * from rules where enabled = 'true' and website like ?";
    var attr = [location.origin + "%"];
    var data = {message: 'query', sql: sql, data: attr};
    chrome.extension.sendMessage(data, function (response) {
        var status = response.status;
        var result = response.data;
        var currentUrl = location.href + "/";
        if (status) {
          for (var i=0;i<result.length;i++) {
            var rule = result[i];
            if (currentUrl.indexOf(rule.website) == 0) {
              if (rule.action == 'show') {
                $(rule.dom).show();
              } else if (rule.action == 'hide') {
                $(rule.dom).hide();
              }
            }
          }
        }
    });
  };

  new DisplayHelper();

})();