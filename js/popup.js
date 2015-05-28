var ACTIONS = {
    NEW: "new",
    SAVE: "save",
    LOAD: "load",
    DELETE: "delete"
};

var popup = {

    rowKeys: {},

    init: function () {
        popup.getCurrentTabUrl(function (url) {
            var $el = $("<a></a>");
            $el.prop("href", url);

            var pathname = $el.prop("pathname");
            $("#pathname").text(pathname);

            chrome.storage.sync.get(pathname, function (result) {
                // result in the form of {pathname : {rowKey1:true, rowId2:true, ...}}
                if (result[pathname]) {
                    popup.rowKeys = result[pathname];
                    popup.initSavedRows();
                    popup.initSavedRowsBtnEvent();
                }
                popup.initInputEvent();
            });
        });
    },

    initSavedRows: function () {
        var $savedRows = $("#savedRows").empty();
        var html = "";
        for (var rowKey in popup.rowKeys) {
            if (popup.rowKeys.hasOwnProperty(rowKey)) {
                html += popup.createRow(rowKey);
            }
        }
        $savedRows.html(html);
        popup.reSize();
    },

    reSize: function () {
        $('html').height($('#content').height());
    },

    createRow: function (rowKey) {
        var $row = $("#hiddenRow").clone().removeAttr("id");
        $row.find("div[data-action]").each(function () {
            var $this = $(this);
            $this.attr("data-row-key", rowKey);
            if ($this.data("action") == ACTIONS.LOAD) {
                $this.text(rowKey);
            }
        });

        return $row[0].outerHTML;
    },

    initInputEvent: function () {

        $(".input>.button").click(function () {
            popup.sendInput(ACTIONS.NEW, $("#rowKeyInput").val());
        });

        $("#rowKeyInput").keyup(function (e) {
            if (e.which == 13) {
                popup.sendInput(ACTIONS.NEW, $("#rowKeyInput").val());
            }
        });
    },

    initSavedRowsBtnEvent: function () {
        $("#savedRows").find(".button").click(function () {
            var $this = $(this);
            popup.sendInput($this.data("action"), $this.data("rowKey"));
        });
    },

    sendInput: function (action, rowKey) {
        if (!rowKey) {
            return;
        }
        chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {action: action, rowKey: rowKey}, function () {
                if (action == ACTIONS.DELETE) {
                    delete popup.rowKeys[rowKey];
                } else {
                    popup.rowKeys[rowKey] = true;
                    $("#rowKeyInput").val("");
                }
                popup.initSavedRows();
                popup.initSavedRowsBtnEvent();
            });
        });
    },

    getCurrentTabUrl: function (callback) {
        var queryInfo = {
            active: true,
            currentWindow: true
        };

        chrome.tabs.query(queryInfo, function (tabs) {
            var tab = tabs[0];
            var url = tab.url;
            callback(url);
        });
    }

};

popup.init();