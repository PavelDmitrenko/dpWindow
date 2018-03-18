// Type definitions for [~THE LIBRARY NAME~] [~OPTIONAL VERSION NUMBER~]
// Project: dpWindow
// Definitions by: Pavel Dmitrenko <https://github.com/PavelDmitrenko/dpWindow>



//declare class dpWindow {
//	Show(options: any): void;
//}


interface JQueryStatic {
	dpModal(options?: any);
}

interface IDPWOptions {

	id: string;

	content: IDPWContentSettings;
	size: IDPWClientSize;
	appearence?: IDPWAppearence;
	closeDefferedSelectors?: string; // Selectors which actions as current window closers (ex: button with "Close" meaning)
	closeSelectors?: string; // Selectors which actions as current window closers (ex: button with "Close" meaning)
	struct?: IDPWStructSettings;
	closeOnOuterMouseClick?: boolean; // Close window on mouse click outside window bounds
	log?: boolean;

	// Events
	onLoaded?(wnd: any): any;
	onBeforeClose?(deffered: any, sender: JQuery): void;
	onContentPrefilter?(response: Object): string;
	onClose?(): void;
}

interface IDPWHeader {
	setCaption(text: string);
}

interface IDPWContentSettings {
	url?: string;
	urlPostMethod?: string;
	urlPostData?: any;
	html?: string;
}

interface IDPWStructSettings {
	header?: IDPWHeaderSettings;
	footer?: IDPWFooterSettings;
	createMain: boolean;
}

interface IDPWHeaderSettings {
	visible?: boolean;
	content?: string;
	showCloseButton?: boolean;
}

interface IDPWFooterSettings {
	visible?: boolean;
	content?: string;
}

interface IDPWClientSize {
	width: any;
	height: any;
	zindex?: number;
}

interface IDPWSize {
	width?: number;
	height?: number;
	left?: number;
	top?: number;
	zindex?: number;
}

interface IDPWAppearence {
	color?: string;
	bgColor?: string;
	bgOpacity?: number;
	className?: string;
}