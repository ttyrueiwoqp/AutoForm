var ACTIONS = {
    NEW: "new",
    SAVE: "save",
    LOAD: "load",
    DELETE: "delete"
};

/**
 * Stored in chrome.storage.sync:
 * pathname : {rowKey1:true, rowId2:true, ...}
 * pathname#rowKey1 : {tag1 : [val1, val2, ...], tag2 : [val1, ...]}
 * pathname#rowKey2 : {tag1 : [val1, val2, ...], tag2 : [val1, ...]}
 */
var content = {

    debug: false,

    tags: [
        $("input"),
        $("select"),
        $("textarea")
    ],

    save: function (pathname, rowKey) {
        content.saveToPathname(pathname, rowKey);
        content.saveRowKey(pathname, rowKey);
    },

    saveToPathname: function (pathname, rowKey) {
        chrome.storage.sync.get(pathname, function (result) {
            // result in the form of {pathname : {rowKey1:true, rowId2:true, ...}}
            var val = $.isEmptyObject(result) ? {} : result[pathname];
            val[rowKey] = true;

            content.saveToStorage(pathname, val);
            content.printStorage(pathname);
        });
    },

    saveRowKey: function (pathname, rowKey) {
        var fullRowKey = pathname + "#" + rowKey;

        var rowMap = {};
        for (var i = 0; i < content.tags.length; i++) {
            var $tag = content.tags[i];
            if (!$tag.length) {
                continue;
            }

            var tagName = $tag.prop("tagName");
            var tagArr = [];
            $tag.not(":hidden").each(function () {
                tagArr.push(content.getVal($(this)));
            });
            rowMap[tagName] = tagArr
        }

        content.saveToStorage(fullRowKey, rowMap);
        content.printStorage(fullRowKey);
    },

    saveToStorage: function (key, val) {
        var obj = {};
        obj[key] = val;
        chrome.storage.sync.set(obj);
    },

    printStorage: function (rowKey) {
        if (content.debug) {
            chrome.storage.sync.get(rowKey, function (result) {
                console.log(rowKey);
                console.log(result);
            });
        }
    },

    load: function (pathname, rowKey) {
        var fullRowKey = pathname + "#" + rowKey;

        chrome.storage.sync.get(fullRowKey, function (result) {
            // result in the form of {pathname#rowKey1 : {tag1 : [val1, val2, ...], tag2 : [val1, ...]}}
            var map = result[fullRowKey];
            for (var tagName in map) {
                if (map.hasOwnProperty(tagName)) {
                    $(tagName).not(":hidden").each(function (index) {
                        content.setVal($(this), map[tagName][index]);
                    });
                }
            }
        });
    },

    delete: function (pathname, rowKey) {
        content.deleteFromPathname(pathname, rowKey);
        content.deleteRowKey(pathname, rowKey);
    },

    deleteFromPathname: function (pathname, rowKey) {
        chrome.storage.sync.get(pathname, function (result) {
            // result in the form of {pathname : {rowKey1:true, rowId2:true, ...}}
            var val = result[pathname];
            delete val[rowKey];

            if ($.isEmptyObject(val)) {
                content.deletePathname(pathname);
            } else {
                content.saveToStorage(pathname, val);
            }
            content.printStorage(pathname);
        });
    },

    deletePathname: function(pathname) {
        chrome.storage.sync.remove(pathname);
    },

    deleteRowKey: function (pathname, rowKey) {
        var fullRowKey = pathname + "#" + rowKey;
        chrome.storage.sync.remove(fullRowKey);
    },

    setVal: function ($el, val) {
        content.isBoolType($el) ? $el.prop("checked", val) : $el.val(val);
    },

    getVal: function ($el) {
        return content.isBoolType($el) ? $el.prop("checked") : $el.val();
    },

    isBoolType: function ($el) {
        return $el.prop("tagName") == "INPUT"
            && ($el.prop("type") == "checkbox" || $el.prop("type") == "radio");
    }

};

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    var pathname = window.location.pathname;
    var action = request.action;
    var rowKey = request.rowKey;
    switch (action) {
        case ACTIONS.NEW:
            content.save(pathname, rowKey);
            break;
        case ACTIONS.SAVE:
            content.save(pathname, rowKey);
            break;
        case ACTIONS.LOAD:
            content.load(pathname, rowKey);
            break;
        case ACTIONS.DELETE:
            content.delete(pathname, rowKey);
            break;
        default:
            break;
    }
    sendResponse({result: "success"});
});

