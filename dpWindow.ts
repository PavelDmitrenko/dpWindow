/// <reference path="dpwindow.d.ts" />


enum DpCloseAction {
	Save,
	Cancel
}

enum DpLogSeverity {
	Trace,
	Error
}

class dpWindowHeader implements IDPWHeader { 
	private readonly _ctl: JQuery;

	constructor(ctl: JQuery) {
		this._ctl = ctl;
	}

	getCtl() {
		return this._ctl;
	}

	setCaption(text: string) {
		this._ctl.find("div.content").html(text);
	}
}



class dpWindow {
	
	private plugin: any;
	private settings: IDPWOptions;
	private container: JQuery;
	private wndBg: JQuery;
	public InnerContent: JQuery;
	public Content: JQuery;
	public header: dpWindowHeader;

	public Show(options: IDPWOptions) {
		this._Init(options);
	}

	private _Init(options: IDPWOptions) {

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

		const defaultAppearence = { color: "White", bgColor: "Black", bgOpacity: 0.5, className: "" } as IDPWAppearence;
		const defaultContent = { urlPostMethod: "GET" } as IDPWContentSettings;

		this.settings = options;

		this.settings.content = $.extend(defaultContent, this.settings.content);
		this.settings.appearence = $.extend(defaultAppearence, this.settings.appearence );

		if (this.settings.closeOnOuterMouseClick === undefined)
			this.settings.closeOnOuterMouseClick = true;

		this._log(this.settings, DpLogSeverity.Trace);

		this._placeControls();
		this._loadContents();

	}

	private _loadContents() {

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
		else
		{
			const loadPrg: JQuery = $("<div/>").attr("class", "dpw-loading");

			$.ajax({
				async: true,
				url: this.settings.content.url,
				cache: false,
				//contentType: "application/json; charset=utf-8",
				//dataType: "json",
				method: this.settings.content.urlPostMethod,
				data: this.settings.content.urlPostData,

				beforeSend: () => {
					this.Content.append(loadPrg);
				},

				success: data => {

					loadPrg.remove();

					if (jQuery.isFunction(this.settings.onContentPrefilter)) {
						data = this.settings.onContentPrefilter(data);
					}

					this.container.html(data);
					this.InnerContent = $(this.container.html);

					if (jQuery.isFunction(this.settings.onLoaded))
						this.settings.onLoaded(this);

					this._attachCloseActions();
					
				},

				error: (xhr, ajaxOptions, thrownError) => {
					this._log(`LoadContents / Error processing Ajax request / ${thrownError}${xhr.responseText}`, DpLogSeverity.Error);
				}

			});
		}
	}

	private _attachCloseActions() {
		// Attaching close action
		if (this.settings.closeSelectors) {
			console.log(this.settings.closeSelectors);
			this.Content.find(this.settings.closeSelectors)
				.on("click", (sender) => {
					this._log("Clicked on element with 'Close' action", DpLogSeverity.Trace);
					this.Close($(sender.currentTarget));
				});
		}
	}

	private _placeControls() {

		const sizeAndPosition = <IDPWSize>this._getSizeAndPosition();
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
			this.wndBg.on("click", () => {
				this._log("Clicked on background", DpLogSeverity.Trace);
				this.Close(this.wndBg);
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
				const headerCont = $("<header/>");

				const headerContent = $("<div/>")
					.addClass("content")
					.html(this.settings.struct.header.content);

				headerCont.append(headerContent);

				if (this.settings.struct.header.showCloseButton) {
					const headerClosebut = $("<div/>").addClass("closeButton");
					headerClosebut.on("click", () => {
						this._close();
					});
					headerCont.append(headerClosebut);
				};

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

				const footer = $("<footer/>")
					.html(this.settings.struct.footer.content);

				this.Content.append(footer);
			}
		}

		if (!this.container) {
			this.container = this.Content;
		}

		$("body")
			.append(this.Content)
			.append(this.wndBg);


		this.Content.data("dpModalWindow", this);
	}

	private _getSizeAndPosition(): IDPWSize {

		const res = <IDPWSize>{};

		const wndWidth = $(window).width();
		const wndHeight = $(window).height();

		res.width = this._getSize(this.settings.size.width.toString(), wndWidth);
		res.height = this._getSize(this.settings.size.height.toString(), wndHeight);

		res.top = (wndHeight / 2 - res.height / 2) - 3;
		res.left = (wndWidth / 2 - res.width / 2) - 3;

		if (res.width === 0 || res.height === 0) {
			this._log("Incorect Size", DpLogSeverity.Error);
			return null;
		}

		let zIndex: number = 0;
		const maxZindex = $(".dpModalWindow").css("z-index");

		if (maxZindex) {
			zIndex = parseInt(maxZindex);;
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

	private _getSize(str: string, wndDim: number): number {

		// LowerCase + Whitespace removing
		str = str.toLowerCase().replace(/\s+$/g, "");

		if (str.indexOf("%") > -1) {
			const prcVal = str.replace("%", "");
			return wndDim * parseInt(prcVal) / 100;
		};

		if (str.indexOf("px") > -1) {
			return parseInt(str.replace("px", ""));
		};

		if (this._isNumeric(str)) {
			return parseInt(str);
		};

		return 0;
	};

	public GetContent() {
		return $(this.Content.html);
	};

	public Close(sender = null) {
		console.log(sender);
		if (jQuery.isFunction(this.settings.onBeforeClose)) {

			this._log("onBeforeClose fired", DpLogSeverity.Trace);

			const def = $.Deferred<boolean>();

			$.when(this.settings.onBeforeClose(def, $(sender)))
				.then(res => {
					if (res) {
						this._log("Deffered with TRUE value, closing window.", DpLogSeverity.Trace);
						this._close();
					} else {
						this._log("Deffered with FALSE value, preventing window close.", DpLogSeverity.Trace);
					};
				});
		} else {
			this._log("Closing window.", DpLogSeverity.Trace);
			this._close();
		}
	};

	private _close() {
		this.Content.removeData("dpModalWindow");

		this.Content.remove();
		this.wndBg.remove();

		if (jQuery.isFunction(this.settings.onClose)) {
			this.settings.onClose();
		};
	};

	public Serialize():any {
		var obj = {};

		this.Content.find("[data-serializable]").each((ind, el) => {
			let isMultiple = false;

			const $el = $(el);

			const n = $el.attr("name"),
				v = $el.val(),
				type = $el.attr("data-serializable");
			
			if ($el.is("ul")) {
				isMultiple = true;
			}

			if (isMultiple) {
				this._Serialize($el);
			}

			let value = v;

			switch (type) {
				case "int":
					value = parseInt(v);
					break;
				case "string":
					value = v;
					break;
			};

			obj[n] = obj[n] === undefined ? value
				: $.isArray(obj[n]) ? obj[n].concat(value)
					: [obj[n], value];
		});


		return obj;
	}

	private _Serialize(el:JQuery) {
		
	}

	private _log(msg: any, severity: DpLogSeverity) {

		let bgc = "White";
		let color = "black";

		switch (+severity) {
		case DpLogSeverity.Error: color = "LimeGreen"; bgc = "Black"; break;
		case DpLogSeverity.Trace: color = "black"; bgc = "White"; break;
		}

		if (typeof msg == "object") {
			console.log(msg);
		} else {
			console.log(`%cdpMW: ${msg}`, `color:${color};font-weight:bold; background-color: ${bgc};`);
		}

	}

	private _isNumeric(n) {
		return !isNaN(parseInt(n)) && isFinite(n);
	};

}

