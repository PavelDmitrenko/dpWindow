/// <reference path="dpwindow.d.ts" />
var DpCloseAction;
(function (DpCloseAction) {
    DpCloseAction[DpCloseAction["Save"] = 0] = "Save";
    DpCloseAction[DpCloseAction["Cancel"] = 1] = "Cancel";
})(DpCloseAction || (DpCloseAction = {}));
var DpLogSeverity;
(function (DpLogSeverity) {
    DpLogSeverity[DpLogSeverity["Trace"] = 0] = "Trace";
    DpLogSeverity[DpLogSeverity["Error"] = 1] = "Error";
})(DpLogSeverity || (DpLogSeverity = {}));
var dpWindowHeader = /** @class */ (function () {
    function dpWindowHeader(ctl) {
        this._ctl = ctl;
    }
    dpWindowHeader.prototype.getCtl = function () {
        return this._ctl;
    };
    dpWindowHeader.prototype.setCaption = function (text) {
        this._ctl.find("div.content").html(text);
    };
    return dpWindowHeader;
}());
var dpWindow = /** @class */ (function () {
    function dpWindow() {
    }
    dpWindow.prototype.Show = function (options) {
        this._Init(options);
    };
    dpWindow.prototype._Init = function (options) {
        //const defaults: IDPWOptions = {
        //	//appearence: {
        //	//	color: "White",
        //	//	bgColor: "Black",
        //	//	bgOpacity: 0.5,
        //	//	className: ""
        //	//},
        //	//content:  {
        //	//}
        //};
        //this.settings = $.extend(true, {}, options, defaults);
        var defaultAppearence = { color: "White", bgColor: "Black", bgOpacity: 0.5, className: "" };
        var defaultContent = { urlPostMethod: "GET" };
        this.settings = options;
        this.settings.content = $.extend(defaultContent, this.settings.content);
        this.settings.appearence = $.extend(defaultAppearence, this.settings.appearence);
        if (this.settings.closeOnOuterMouseClick === undefined)
            this.settings.closeOnOuterMouseClick = true;
        this._log(this.settings, DpLogSeverity.Trace);
        this._placeControls();
        this._loadContents();
    };
    dpWindow.prototype.ShowSpinner = function () {
        var loadPrg = $("<div/>").attr("class", "dpw-loading");
        this.Content.append(loadPrg);
    };
    dpWindow.prototype.HideSpinner = function () {
        this.Content.find("div.dpw-loading").remove();
    };
    dpWindow.prototype._loadContents = function () {
        var _this = this;
        if (this.settings.content.url === ""
            && this.settings.content.html === "") {
            this._log("No content supplied", DpLogSeverity.Error);
            return;
        }
        if (!this.settings.content.url && this.settings.content.html !== "") {
            this.container.html(this.settings.content.html);
            if (jQuery.isFunction(this.settings.onLoaded))
                this.settings.onLoaded(this);
            this._attachCloseActions();
        }
        else {
            $.ajax({
                async: true,
                url: this.settings.content.url,
                cache: false,
                //contentType: "application/json; charset=utf-8",
                //dataType: "json",
                method: this.settings.content.urlPostMethod,
                data: this.settings.content.urlPostData,
                beforeSend: function () {
                    _this.ShowSpinner();
                },
                success: function (data) {
                    _this.HideSpinner();
                    if (jQuery.isFunction(_this.settings.onContentPrefilter)) {
                        data = _this.settings.onContentPrefilter(data);
                    }
                    _this.container.html(data);
                    _this.InnerContent = $(_this.container.html);
                    if (jQuery.isFunction(_this.settings.onLoaded))
                        _this.settings.onLoaded(_this);
                    _this._attachCloseActions();
                },
                error: function (xhr, ajaxOptions, thrownError) {
                    _this._log("LoadContents / Error processing Ajax request / " + thrownError + xhr.responseText, DpLogSeverity.Error);
                }
            });
        }
    };
    dpWindow.prototype._attachCloseActions = function () {
        var _this = this;
        // Attaching close action
        if (this.settings.closeSelectors) {
            this.Content.find(this.settings.closeSelectors)
                .on("click", function (sender) {
                _this._log("Clicked on element with 'Close' action", DpLogSeverity.Trace);
                _this._close();
            });
        }
        ;
        if (this.settings.closeDefferedSelectors) {
            console.log(this.settings.closeDefferedSelectors);
            this.Content.find(this.settings.closeDefferedSelectors)
                .on("click", function (sender) {
                _this._log("Clicked on element with 'Close' action", DpLogSeverity.Trace);
                _this.Close($(sender.currentTarget));
            });
        }
    };
    dpWindow.prototype._placeControls = function () {
        var _this = this;
        var sizeAndPosition = this._getSizeAndPosition();
        this._log(sizeAndPosition, DpLogSeverity.Trace);
        this.Content = $("<div></div>")
            .attr("class", "dpModalWindow")
            .attr("id", this.settings.id)
            .css("z-index", sizeAndPosition.zindex);
        if (this.settings.appearence.className !== "")
            this.Content.addClass(this.settings.appearence.className);
        // Background
        this.wndBg = $("<div></div>")
            .attr("class", "dpModalWindowBg")
            .css("opacity", this.settings.appearence.bgOpacity)
            .css("z-index", sizeAndPosition.zindex - 1);
        if (this.settings.closeOnOuterMouseClick) {
            this.wndBg.on("click", function () {
                _this._log("Clicked on background", DpLogSeverity.Trace);
                _this.Close(_this.wndBg);
            });
        }
        this.Content.css({
            "top": sizeAndPosition.top + "px",
            "left": sizeAndPosition.left + "px",
            "width": sizeAndPosition.width + "px",
            "height": sizeAndPosition.height + "px",
            "background-color": this.settings.appearence.color
        });
        // Header
        if (this.settings.struct) {
            if (this.settings.struct.header) {
                var headerCont = $("<header/>");
                var headerContent = $("<div/>")
                    .addClass("content")
                    .html(this.settings.struct.header.content);
                headerCont.append(headerContent);
                if (this.settings.struct.header.showCloseButton) {
                    var headerClosebut = $("<div/>").addClass("closeButton");
                    headerClosebut.on("click", function () {
                        _this._close();
                    });
                    headerCont.append(headerClosebut);
                }
                ;
                this.header = new dpWindowHeader(headerCont);
                this.Content.append(this.header.getCtl());
            }
            // Main content container
            if (this.settings.struct.createMain) {
                this.container = $("<main/>");
                this.Content.append(this.container);
            }
            // Footer
            if (this.settings.struct.footer) {
                var footer = $("<footer/>")
                    .html(this.settings.struct.footer.content);
                this.Content.append(footer);
            }
        }
        this.container = this.Content;
        $("body")
            .append(this.Content)
            .append(this.wndBg);
        this.Content.data("dpModalWindow", this);
    };
    dpWindow.prototype._getSizeAndPosition = function () {
        var res = {};
        var wndWidth = $(window).width();
        var wndHeight = $(window).height();
        res.width = this._getSize(this.settings.size.width.toString(), wndWidth);
        res.height = this._getSize(this.settings.size.height.toString(), wndHeight);
        res.top = (wndHeight / 2 - res.height / 2) - 3;
        res.left = (wndWidth / 2 - res.width / 2) - 3;
        if (res.width === 0 || res.height === 0) {
            this._log("Incorect Size", DpLogSeverity.Error);
            return null;
        }
        var zIndex = 0;
        var maxZindex = $(".dpModalWindow").css("z-index");
        if (maxZindex) {
            zIndex = parseInt(maxZindex);
            ;
        }
        else {
            if (this.settings.size.zindex)
                zIndex = this.settings.size.zindex;
            else
                zIndex = 999;
        }
        res.zindex = zIndex + 2; // "2" is for background reservation
        return res;
    };
    ;
    dpWindow.prototype._getSize = function (str, wndDim) {
        // LowerCase + Whitespace removing
        str = str.toLowerCase().replace(/\s+$/g, "");
        if (str.indexOf("%") > -1) {
            var prcVal = str.replace("%", "");
            return wndDim * parseInt(prcVal) / 100;
        }
        ;
        if (str.indexOf("px") > -1) {
            return parseInt(str.replace("px", ""));
        }
        ;
        if (this._isNumeric(str)) {
            return parseInt(str);
        }
        ;
        return 0;
    };
    ;
    dpWindow.prototype.GetContent = function () {
        return $(this.Content.html);
    };
    ;
    dpWindow.prototype.Close = function (sender) {
        var _this = this;
        if (sender === void 0) { sender = null; }
        console.log(sender);
        if (!sender.hasClass("dpModalWindowBg") && jQuery.isFunction(this.settings.onBeforeClose)) {
            this._log("onBeforeClose fired", DpLogSeverity.Trace);
            var def = $.Deferred();
            $.when(this.settings.onBeforeClose(def, $(sender)))
                .then(function (res) {
                if (res) {
                    _this._log("Deferred with TRUE value, closing window.", DpLogSeverity.Trace);
                    _this._close();
                }
                else {
                    _this._log("Deferred with FALSE value, preventing window close.", DpLogSeverity.Trace);
                }
                ;
            });
        }
        else {
            this._log("Closing window.", DpLogSeverity.Trace);
            this._close();
        }
    };
    ;
    dpWindow.prototype._close = function () {
        this.Content.removeData("dpModalWindow");
        this.Content.remove();
        this.wndBg.remove();
        if (jQuery.isFunction(this.settings.onClose)) {
            this.settings.onClose();
        }
        ;
    };
    ;
    dpWindow.prototype.Serialize = function () {
        var _this = this;
        var obj = {};
        this.Content.find("[data-serializable]").each(function (ind, el) {
            var isMultiple = false;
            var $el = $(el);
            var n = $el.attr("name"), v = $el.val(), type = $el.attr("data-serializable");
            if ($el.is("ul")) {
                isMultiple = true;
            }
            if (isMultiple) {
                _this._Serialize($el);
            }
            var value = v;
            switch (type) {
                case "int":
                    value = parseInt(v);
                    break;
                case "string":
                    value = v;
                    break;
            }
            ;
            obj[n] = obj[n] === undefined ? value
                : $.isArray(obj[n]) ? obj[n].concat(value)
                    : [obj[n], value];
        });
        return obj;
    };
    dpWindow.prototype._Serialize = function (el) {
    };
    dpWindow.prototype._log = function (msg, severity) {
        var bgc = "White";
        var color = "black";
        switch (+severity) {
            case DpLogSeverity.Error:
                color = "LimeGreen";
                bgc = "Black";
                break;
            case DpLogSeverity.Trace:
                color = "black";
                bgc = "White";
                break;
        }
        if (typeof msg == "object") {
            console.log(msg);
        }
        else {
            console.log("%cdpMW: " + msg, "color:" + color + ";font-weight:bold; background-color: " + bgc + ";");
        }
    };
    dpWindow.prototype._isNumeric = function (n) {
        return !isNaN(parseInt(n)) && isFinite(n);
    };
    ;
    return dpWindow;
}());
//# sourceMappingURL=dpwindow.js.map