var Marionette = require("backbone.marionette");

var ToDo = Marionette.LayoutView.extend({
    tagName: "li",
    className: "list-group-item",
    template: require("./moviesList.jst")
});

var TodoList = Marionette.CollectionView.extend({
    tagName: "ul",
    className: "list-group",
    childView: ToDo,

    ui: {
        dropdownToggle: ".glyphicon-pencil"
    },

    events: {
        "click @ui.dropdownToggle": "edit"
    },

    edit: function () {
        console.log("start edit current item");
    }
});

module.exports = TodoList;
