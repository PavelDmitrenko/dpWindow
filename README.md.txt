# dpWindow

### Basic parameters
`id` — *(string)* id attribute to add to Window

`log` — *(bool)* Writes trace info into console if true, otherwise not.

### Content source
`content`

### Header
`header { visible:boolean;
  content: string;
  showCloseButton: boolean;}`
  
  `visible` — Show header or not;
  
  `content` — String content (text) of header;
  
  `showCloseButton` - Visibility of close button (right top corner of window)
  
```javascript
header: {
    visible: true,
    content: "It's the header title"
    showCloseButton: true }
```
  
### Footer
`footer`

### Size properties
size

### Appearence
appearence

`closeSelectors` — Selectors, which acts as current window closers *(ex: button with "Close" meaning)*

`closeOnOuterMouseClick` — Close window on mouse click outside window bounds


### Events
`onLoaded` *(dpWindow)* — Fires on complete loading contents via Ajax call

`onBeforeClose` *(deffered, sender)* — Fires before window closing occurs. 
Once fired, pass deffered object to caller, and waits for it resolving. 
If deffered object is resolved with 'true' *(boolean)* value, window closes. 
Otherwise, closing process is cancelled and window remains on screen.

`onClose` — Fires then window is closed
