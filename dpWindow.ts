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



class dpWindow implements IDPWindow {

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

		const defaultAppearence = { color: "White", bgColor: "Black", bgOpacity: 0.5, className: "" } as IDPWAppearence;
		const defaultContent = { urlPostMethod: "GET" } as IDPWContentSettings;

		this.settings = options;

		this.settings.content = $.extend(defaultContent, this.settings.content);
		this.settings.appearence = $.extend(defaultAppearence, this.settings.appearence);

		if (this.settings.closeOnOuterMouseClick === undefined)
			this.settings.closeOnOuterMouseClick = true;

		this._Log(this.settings, DpLogSeverity.Trace);

		this._PlaceControls();
		this._LoadContents();

	}

	public ShowSpinner() {
		const loadPrg = $("<div/>").attr("class", "dpw-loading");
		const loadPrgIcon = $("<div/>").attr("class", "dpw-loading-icon");
		this.Content.append(loadPrg).append(loadPrgIcon);
	}

	public HideSpinner() {
		this.Content.find("div.dpw-loading").remove();
		this.Content.find("div.dpw-loading-icon").remove();
	}

	private _LoadContents() {

		if (this.settings.content.url === ""
			&& this.settings.content.html === "") {
			this._Log("No content supplied", DpLogSeverity.Error);
			return;
		}

		if (!this.settings.content.url && this.settings.content.html !== "") 
		{
			this.container.html(this.settings.content.html);

			if (jQuery.isFunction(this.settings.onLoaded))
				this.settings.onLoaded(this);

			this._AttachCloseActions();
		}
		else {

			$.ajax({
				async: true,
				url: this.settings.content.url,
				cache: false,
				method: this.settings.content.urlPostMethod,
				data: this.settings.content.urlPostData,

				beforeSend: () => {
					this.ShowSpinner();
				},

				success: data => {

					
					
					if (jQuery.isFunction(this.settings.onContentPrefilter)) {
						data = this.settings.onContentPrefilter(data);
					}

					this.container.html(data);
					this.InnerContent = $(this.container.html);

					if (jQuery.isFunction(this.settings.onLoaded))
						this.settings.onLoaded(this);

					this._AttachCloseActions();

					this.HideSpinner();
				},

				error: (xhr, ajaxOptions, thrownError) => {
					this._Log(`LoadContents / Error processing Ajax request / ${thrownError}${xhr.responseText}`, DpLogSeverity.Error);
				}

			});
		}
	}

	private _AttachCloseActions() {

		// Attaching close action
		if (this.settings.closeSelectors) {
			this.Content.find(this.settings.closeSelectors)
				.on("click", (sender) => {
					this._Log("Clicked on element with 'Close' action", DpLogSeverity.Trace);
					this._Close();
				});
		};

		if (this.settings.closeDefferedSelectors) {
			console.log(this.settings.closeDefferedSelectors);

			this.Content.find(this.settings.closeDefferedSelectors)
				.on("click", (sender) => {
					this._Log("Clicked on element with 'Close' action", DpLogSeverity.Trace);
					this.Close($(sender.currentTarget));
				});
		}
	}

	private _PlaceControls() {

		const sizeAndPosition = this._GetSizeAndPosition();
		this._Log(sizeAndPosition, DpLogSeverity.Trace);

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
				this._Log("Clicked on background", DpLogSeverity.Trace);
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
						this._Close();
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

		this.container = this.Content;
	
		$("body")
			.append(this.Content)
			.append(this.wndBg);


		this.Content.data("dpModalWindow", this);
	}

	private _GetSizeAndPosition(): IDPWSize {

		const res = <IDPWSize>{};

		const wndWidth = $(window).width();
		const wndHeight = $(window).height();

		res.width = this._GetSize(this.settings.size.width.toString(), wndWidth);
		res.height = this._GetSize(this.settings.size.height.toString(), wndHeight);

		res.top = (wndHeight / 2 - res.height / 2) - 3;
		res.left = (wndWidth / 2 - res.width / 2) - 3;

		if (res.width === 0 || res.height === 0) {
			this._Log("Incorect Size", DpLogSeverity.Error);
			return null;
		}

		let zIndex: number;
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


		res.zindex = zIndex + 1; // "1" is for background reservation

		return res;
	};

	private _GetSize(str: string, wndDim: number): number {

		// LowerCase + Whitespace removing
		str = str.toLowerCase().replace(/\s+$/g, "");

		if (str.indexOf("%") > -1) {
			const prcVal = str.replace("%", "");
			return wndDim * parseInt(prcVal) / 100;
		};

		if (str.indexOf("px") > -1) {
			return parseInt(str.replace("px", ""));
		};

		if (this._IsNumeric(str)) {
			return parseInt(str);
		};

		return 0;
	};

	public GetContent() {
		return $(this.Content.html);
	};

	public Close(sender = null) {
		console.log(sender);

		if (sender && !sender.hasClass("dpModalWindowBg") && jQuery.isFunction(this.settings.onBeforeClose)) {

			this._Log("onBeforeClose fired", DpLogSeverity.Trace);

			const def = $.Deferred<boolean>();

			$.when(this.settings.onBeforeClose(def, $(sender)))
				.then(res => {
					if (res) {
						this._Log("Deferred with TRUE value, closing window.", DpLogSeverity.Trace);
						this._Close();
					} else {
						this._Log("Deferred with FALSE value, preventing window close.", DpLogSeverity.Trace);
					};
				});
		}
		else {
			this._Log("Closing window.", DpLogSeverity.Trace);
			this._Close();
		}
	};

	private _Close() {
		this.Content.removeData("dpModalWindow");

		this.Content.remove();
		this.wndBg.remove();

		if (jQuery.isFunction(this.settings.onClose)) {
			this.settings.onClose();
		};
	};

	public Serialize(): any {
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

	private _Log(msg: any, severity: DpLogSeverity) {

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

	private _IsNumeric(n) {
		return !isNaN(parseInt(n)) && isFinite(n);
	};

}

