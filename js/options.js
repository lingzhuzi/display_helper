(function () {
  $(function () {

    var VERSION = 0, editWinInited = false;

    showData();
    bindEvents();

    function showData(){
      showVersion();
      checkUpdate();
      showList();
    }

    function showEditWindow() {
      var $editWin = $('.edit-win');
      if(!editWinInited) {
        var left = ($(window).width() - $editWin.width())/2;
        $editWin.css('left', left > 0 ? left : 0);
        editWinInited = true;
      }
      $editWin.show();
      $(".edit-win-shelter").height($(document).height()).show();
    }

    function hideEditWindow() {
      var $editWin = $('.edit-win');
      $editWin.hide();
      $(".edit-win-shelter").hide();
    }

    function bindEventsOfEditWin() {
      var $editWin = $('.edit-win');
      $editWin.draggable({ handle: ".title" });

      $editWin.on('click', '.close', function(){
        hideEditWindow();
        return false;
      });

      $editWin.on('click', '.btn-cancel', function(){
        hideEditWindow();
        return false;
      });

      $editWin.on('click', '.btn-save', function(){
        var data = {};
        var id       = $editWin.find("#id").val();
        data.dom     = $editWin.find('#dom').val();
        data.action  = $editWin.find('#action').val();
        data.website = $editWin.find('#website').val();
        data.enabled = 'true';
        saveRule(id, data);
        return false;
      });
    }

    function bindEventsOfButtons(){
      $('#check_all').change(function () {
        var status = $(this).is(':checked');
        $('.data-list input:checkbox').prop('checked', status);
      })
      $('.add-btn').click(function(){
        var $editWin = $('.edit-win');
        $editWin.find("#id").val('');
        $editWin.find('#dom').val('');
        $editWin.find('#website').val('');
        $editWin.find('#action').val('show');
        showEditWindow();
      });
      $('.del-btn').click(function(){
        var ids = collectCheckedItemIds();
        deleteRules(ids);
      });
      $('.enable-btn').click(function(){
        changeStatus('true');
      });
      $('.disable-btn').click(function(){
        changeStatus('false');
      });
      $('.data-list').on('click', '.btn-edit', function(){
        var id = $(this).parents('tr.item-tr').find('.item-id').val();
        var sql = 'select * from rules where id = ?';
        var attr = [id];
        var data = {message: 'query', sql: sql, data: attr};
        chrome.extension.sendMessage(data, function (response){
          var status = response.status;
          var result = response.data;
          if(!status){
            showNotice(result);
            return;
          }
          if (result.length == 0){
            alert("该规则不存在");
          } else {
            var item = result[0];
            var $editWin = $('.edit-win');
            $editWin.find("#id").val(item.id);
            $editWin.find('#dom').val(item.dom);
            $editWin.find('#website').val(item.website);
            $editWin.find('#action').val(item.action);
            showEditWindow();
          }
        });
      });
      $('.data-list').on('click', '.btn-delete', function(){
        var id = $(this).parents('tr.item-tr').find('.item-id').val();
        deleteRules([id]);
      });
    }

    function bindEvents(){
      bindEventsOfButtons();
      bindEventsOfEditWin();
    }

    function collectCheckedItemIds(){
      var $ids = $('.data-list').find('td input:checkbox:checked').parents('tr.item-tr').find('.item-id');
      var ids = [];
      $ids.each(function(i, obj){
        ids.push($(obj).val());
      });
      return ids;
    }

    function changeStatus(toStatus){
      var ids = collectCheckedItemIds();
      if (ids.length == 0) {
        showNotice('未选中任何行');
        return;
      }
      var sql = "update rules set enabled = ? where id in (" + ids.join(', ') + ")";
      var attr = [toStatus];
      var data = {message: 'update', sql: sql, data: attr};
      chrome.extension.sendMessage(data, function () {
        showNotice('保存成功');
        showList();
      });
    }

    function checkUpdate(){
      $.get("https://raw.githubusercontent.com/lingzhuzi/display_helper/master/release/version.json", function(json){
        var data = JSON.parse(json);
        var version = data.version;
        var log = data.log;
        if (version > VERSION){
          $('#update_ctn').show();
          $('#update_ctn .version').html("版本：" + version);
          $('#update_ctn .log').html($(log));
        } else {
          $('#update_ctn').remove();
        }
      });
    }

    function showVersion(){
      $.get(chrome.extension.getURL('manifest.json'), function(info){
        VERSION = parseFloat(info.version);
        $('#version_no').text(info.version);
      }, 'json');
    }

    function showList(){
      var sql = 'select * from rules;'
      var data = {message: "query", sql: sql};
      chrome.extension.sendMessage(data, function (response) {
        var succeed = response.status;
        var result = response.data;
        if (!succeed){
          showNotice('查询失败');
          return;
        }

        var $table = $(".data-list");
        $table.find(".item-tr").remove();
        $('#check_all').prop('checked', false);
        if(result.length > 0){
          $table.find(".no-item-tr").hide();
        } else {
          $table.find(".no-item-tr").show();
        }

        for(var i=0;i<result.length;i++){
          var item = result[i];
          var $td = $("<td></td>");
          $td.append($("<a class='btn btn-primary btn-small btn-edit' href='#'>编辑</a>"));
          $td.append($("<a class='btn btn-primary btn-small btn-delete' href='#'>删除</a>"));

          var $tr = $("<tr class='item-tr'></tr>");
          $tr.append($("<td><input type='checkbox'><input type='hidden' class='item-id' value='" + item.id + "'></td>"));
          $tr.append($("<td>" + item.website + "</td>"));
          $tr.append($("<td>" + item.dom + "</td>"));
          $tr.append($("<td>" + (item.action == "show" ? "显示" : "隐藏") + "</td>"));
          $tr.append($("<td>" + (item.enabled == "true" ? "已启用" : "已禁用") + "</td>"));
          $tr.append($td);
          if (i%2 == 1) {
            $tr.addClass('alt');
          }

          $table.append($tr);
        }
      });
    }

    function saveRule(id, data){
      var success = function(response){
        var succeed = response.status;
        var result  = response.data;
        if (succeed) {
          showNotice('保存成功');
          hideEditWindow();
          showList();
        } else {
          showNotice(result);
        }
      }
      if(id){
        var sql = 'update rules set website = ? , dom = ?, action = ? where id = ?';
        var attr = [data.website, data.dom, data.action, id];
        var data = {message: 'update', sql: sql, data: attr};
        chrome.extension.sendMessage(data, success);
      } else {
        var sql = 'insert into rules(website, dom, action, enabled) values(?,?,?,?)';
        var attr = [data.website, data.dom, data.action, 'true'];
        var data = {message: 'insert', sql: sql, data: attr};
        chrome.extension.sendMessage(data, success);
      }
    }

    function deleteRules(ids){
      if (ids.length == 0) {
        showNotice('未选中任何行');
        return;
      }
      var sql = "delete from rules where id in (" + ids.join(', ') + ");";
      var data = {message: "delete", sql: sql};
      chrome.extension.sendMessage(data, function (response) {
        showNotice("删除成功");
        showList();
      });
    }

    function showNotice(notice){
      $("#notice_wrap").text(notice).show();
      setTimeout(function(){
        $("#notice_wrap").hide();
      }, 3000);
    }

  });
})();