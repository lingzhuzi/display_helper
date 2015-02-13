
var DatabaseStorage = function() {};
DatabaseStorage.prototype = {
    _database: null,
    _databaseName: null,
    _databaseVersion: '1.0',

    init: function(databaseName, databaseVersion){
      var self = this;
      self._databaseName = databaseName;
      self._databaseVersion = databaseVersion;
      self._database = self.openDatabase();
      return self;
    },

    openDatabase: function(){
      var self = this;
      if(!self._databaseName || !self._databaseVersion){
        throws("DatabaseStorage未初始化！");
      }
      if (!self._database) {
        self._database = openDatabase(self._databaseName, self._databaseVersion, "", 1024 * 1024);
      }
      return self._database;
    },

    createTable: function (tableName, attributes) {
      var self = this;
      var database = self.openDatabase();
      var columns = [];
      for (var name in attributes){
        columns.push(name + " " + attributes[name]);
      }
      var sqlString = "create table if not exists " + tableName;
      sqlString += " (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, " + columns.join(", ") + ")";

      // 创建表
      database.transaction(function (tx) {
        tx.executeSql(sqlString, []);
      });
    },

    //删除数据表
    dropTable: function (tableName) {
      var self = this;
      var database = self.openDatabase();
      database.transaction(function (tx) {
        tx.executeSql('drop table ' + tableName);
      });
    },

    queryBySql: function(sql, data, callback){
      var self = this;
      var database = self.openDatabase();
      database.transaction(function (tx) {
        tx.executeSql(sql, data, function (tx, result){
          var data = self.generateData(result);
          callback.call(null, true, data);
        }, function (tx, error){
          callback.call(null, false, "查询失败：" + error.message);
        });
      });
    },

    insertBySql: function (sql, data, callback){
      var self = this;
      var database = self.openDatabase();
      database.transaction(function (tx){
        tx.executeSql(sql, data, function () {
          callback.call(null, true);
        }, function (tx, error){
          callback.call(null, false, '添加数据失败: ' + error.message);
        });
      });
    },

    updateBySql: function (sql, data, callback){
      var self = this;
      var database = self.openDatabase();
      database.transaction(function(tx){
        tx.executeSql(sql, data, function(tx, result){
          callback.call(null, true);
        }, function(tx, error){
          callback.call(null, false, '更新失败: ' + error.message);
        });
      });
    },

    deleteBySql: function (sql, data, callback) {
      var self = this;
      var database = self.openDatabase();
      database.transaction(function(tx){
        tx.executeSql(sql, data, function(fx, result){
          callback.call(null, true);
        }, function(tx, error){
          callback.call(null, false, '删除失败:' + error.message);
        })
      })
    },

    generateData: function(selectResult){
      var result = [];
      for (var i = 0; i < selectResult.rows.length; i++) {
        var item = selectResult.rows.item(i);
        result.push(item);
      }
      return result;
    }

  }
