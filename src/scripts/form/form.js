var Marionette = require("backbone.marionette");

var IdView = require("../formElements/id/id");
var InputView = require("../formElements/input/input");
var SelectView = require("../formElements/select/select");
var ObjView = require("../formElements/obj/obj");

var schemaService = require("./../services/schema");

var FormView = Marionette.LayoutView.extend({
    tagName: "div",
    className: "mainForm",
    template: require("./movieForm.html"),

    templateHelpers: function() {
        return {
            buttonTitle: (this.getOption("mode") === "edit") ? "Save" : "Add Movie",
            els: this.els
        };
    },

    initialize: function(){
        this.els = [];

        var props = schemaService.getProps(schemaService.getDataAsArray(this.model.attributes));
  
        try {
            props.forEach(function(prop) {
                var elementView = this.selectingView(prop, this.model.attributes);
                if(elementView){
                    this.els.push({
                        key: prop.value,
                        type: prop.type,
                        validation: prop.validation,
                        dep:  prop.dep,
                        view: elementView
                    });
                }
            }.bind(this));

            this.els.forEach(function(el) {
                this.appendRegion(el.key);
            }.bind(this));
        } catch (err) {
            console.log(err);
        }
    },

    events: {
        "submit": "onSubmit"
    },

    modelEvents: {
        change: "render"
    },

    onShow: function() {
        var vOptions = {
            debug: true, 
            rules: {},
        };
        this.els.forEach(function(el) {
            this.regionManager.get(this.getRegionName(el.key)).show(el.view);

            if (el.dep) {
                for (var key in el.dep) {
                    el.dep[key].watchedEl = el.view;
                    this["form-el-" + el.dep[key].target].$el.on(el.dep[0].event, el.dep[key], function (e) {
                        var value = schemaService[e.data.action](e.data.watchedEl.getValue(), $("#id-" + e.data.target)[0].value);
                        if (e.data.watchedEl.type === "select") {
                            e.data.watchedEl.set({
                                options: value
                            });
                            schemaService.set(key, {
                                options: value
                            });
                        } else {
                            e.data.watchedEl.set({
                                value: value
                            });
                        }
                    });
                }
            }
            _.merge(vOptions, el.view.getValidationOptions());
        }.bind(this));
        this.$("#movieForm").validate(vOptions);
    },

    appendRegion: function(key){
        var rName = this.getRegionName(key);
        this.addRegion(rName, "#" + rName);
    },

    getRegionName: function(key){
        return "form-el-" + key;
    },

    selectingView: function (properties, vals) {
        var options = {
            key: properties.value,
            value: vals[properties.value],
            validation: properties.validation,
            dep: properties.dep
        };

        switch (properties.type) {
        case "id":
            options.value = Math.random();
            return new IdView({options});
        case "string":
            return new InputView({options});
        case "number":
            return new InputView({options});
        case "select":
            options.options = properties.options;
            return new SelectView({options});
        case "obj":
            options.properties = properties.properties;
            return new ObjView({model: this.model, options});
        default:
            console.log("something when wrong");
        }
    },
    
    onSubmit: function () {
        if (!this.$("#movieForm").valid()) {
            return;
        }
        var data = {};
        this.els.forEach(function(el) {
            data[el.key] = el.view.getValue();
        });
        this.model.set(data, {validate: true});

        if (this.model.isValid()) {
            Marionette.triggerMethodOn(this.getOption("layout"),
                (this.getOption("mode") ? this.getOption("mode") : "add") + ":movie:item",
                this.toObject(),
                this.model.cid
            );
        }
    },

    toObject: function () {
        return this.model.pick(this.els.map(function(el) {return el.key;}));
    }
});

module.exports = FormView;
