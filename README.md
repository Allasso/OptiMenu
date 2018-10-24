## OptiMenu
### Optimized HTML menu API which uses minimal DOM resources.

A (theoretically) unlimited number of menuitems can be displayed using only the
minimum amount of DOM elements required to fill the displayed view.  eg, if a menu
has 1000 items, but 50 menuitems will fill the view, only 50 DOM elements (plus
a few "padding" elements) are created. "Scrolling" is accomplished by updating the
properties of the elements within the menuitems. This proves very effective for
improving performance of very large menus.

Note that while the height of the menuitems can be set by the user, all
menuitems must be the same height for the menu to function and scroll properly.
The width of the menuitems will be determined by the containing element
(see below).

It is up to the user to provide the container in which the menu lives. This
would normally be a `<div>` element. The container must have a declared `width`,
though this width value can be changed at any time and menuitems will adjust
to the new width. More information on appearance is given below.

Menu is updated by supplying an array of objects which provide data to
display menuitems. This array would be the list of items you wish to appear
in the menu and can (theoretically) be of unlimited length. Each object in
the array may contain the following properties which will determine how the
menuitems are displayed:

&nbsp;&nbsp;&nbsp;&nbsp;`menutextstr` - string - the text displayed in the menuitem\
&nbsp;&nbsp;&nbsp;&nbsp;`menuiconurl1` - string - url of the icon which will be displayed preceding the text (prefix icon)\
&nbsp;&nbsp;&nbsp;&nbsp;`menuiconurl2` - string - url of the icon which will be displayed succeeding the text (suffix icon)\
&nbsp;&nbsp;&nbsp;&nbsp;`noPrefixIcon` - boolean - if set to `true`, collapses the prefix icon\
&nbsp;&nbsp;&nbsp;&nbsp;`noSuffixIcon` - boolean - if set to `true`, collapses the suffix icon\
&nbsp;&nbsp;&nbsp;&nbsp;`isSelected` - boolean - if set to `true`, displays the menuitem as selected

All of these values are actually optional, and boolean values default to `false`.

There is also an optional `userDefined` property which can contain a subset of properties
which can be set on each menuitem for user access, such as custom displaying
of the menuitem, feedback when it is clicked, etc:

&nbsp;&nbsp;&nbsp;&nbsp;`userDefined.properties` - javascript properties set directly on the menuitem element\
&nbsp;&nbsp;&nbsp;&nbsp;`userDefined.attributes` - element attributes set using setAttribute()\
&nbsp;&nbsp;&nbsp;&nbsp;`userDefined.classes` - css classes set using the classList API

Not setting properties for a menu update which were previously set will result
in the removal of those properties. Not setting `userDefined.attributes` or
`userDefined.classes` which were previously set will also result in the removal
of those attributes or classes.

The menu is updated by calling `OptiMenu.updateMenu(array, deepClone)`.
`OptiMenu` keeps a reference to the `array` and may change properties later, so
the `deepClone` parameter may optionally be passed so that the passed array
will instead be copied and thus will be unaffected by updates of properties.

The API includes the following built-in functionality:

&nbsp;&nbsp;&nbsp;&nbsp;Highlighting of menuitems as mouse hovers over them\
&nbsp;&nbsp;&nbsp;&nbsp;Select menuitems using `ctrl/cmd + click` or `shift + click` which will leave\
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;the menuitems in highlighted state. (Selecting one or more menuitems\
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;will disable mouse hovering highlighting, unless `selectedPlusHover` is\
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;set, see `OptiMenu` constructor.)\
&nbsp;&nbsp;&nbsp;&nbsp;Drag and drop of selected menuitems\
&nbsp;&nbsp;&nbsp;&nbsp;Activity listeners which can be registered for drag and drop, activation of\
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;prefix or suffix icon, and general mouse events\
&nbsp;&nbsp;&nbsp;&nbsp;Detection of last hovered menuitem (useful for implementing context menu actions)

All properties, classes and attributes set on menuitems for the native functionality\
of the menu (those not defined under `userDefined`) are prefixed with `opti_`.

### Appearance:

This API must be used with the supporting CSS file for proper menu display
and behavior. It is possible for the user to override CSS settings by using
`!important` declarations or higher specificity in a separate file, and this
method is recommended over directly editing the OptiMenu CSS file.

_Some_ restrictions when overriding using CSS:

&nbsp;&nbsp;&nbsp;&nbsp;Menuitems will always be the width of the container.\
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Overriding menuitem width will likely produce bad results.\
&nbsp;&nbsp;&nbsp;&nbsp;All margins for the menuitem element other than 0 (the default)\
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;will likely produce bad results.\
&nbsp;&nbsp;&nbsp;&nbsp;If height of menuitems is changed after the menu has been constructed\
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`OptiMenu.updateMenuitemHeight()` must be run.

### Activity listeners:

Activity listeners can be registered with the menu which will give feedback when actions are taken on menuitems. These will be called with the original `event` object passed to the listener. The event object may carry additional properties `event.hybridType` and/or `event.menuitem`, containing additional information about the action. There are 3 kinds of activity listeners:

#### Drag/drop

Registered listeners are called for `dragstart` and `drop` events on menuitems. `event.hybridType` property will contain `dragstart` or `drop` respectively.

#### Mouse events

Registered listeners are called for `mousedown` and `mouseup` events. Listeners are also called for `click` events, but only if Action Activity listener is not called, meaning the click was most likely made in a region of the menu where there are no menuitems. `hybridType` property is not set for any of these activities.

#### Actions

Registered listeners are called for `click` events fired on menuitems or menuitem descendants. Again the event is passed as an argument, however an additional property is set `event.menuitem` which will be the related menuitem. `event.hybridType` property may possibly be set, and if so, one of two values:

`action1click`, means click was made on icon 1 - `.opti_menuicon1`\
`action2click`, means click was made on icon 2 - `.opti_menuicon2`

### Usage:

#### HTML:

    <div id="optimenu_container"></div>

#### Javascript:

    let optiMenuContainer = document.getElementById("optimenu_container");
    let optiMenu = new OptiMenu(optiMenuContainer, window, { hideBrokenImageIcons: true });

    optiMenu.updateMenu([{
      "menutextstr": "Cooking with William",
      "menuiconurl1": "data:image/x-icon;base64,AAABAAMAMDA...",
      "menuiconurl2": "../icons/closebutton.png",
      /* No need to explicitly set the next 3 to `false`, just shown for completeness: */
      "noPrefixIcon": false,
      "noSuffixIcon": false,
      "isSelected": false,
      "userDefined": {
        "properties": {
          "tabId": 13,
          "active": true,
          "url": "http://cookingwithwilliam.com/index.html",
        },
        "attributes": {
          "name": "This is the Site",
          "tabid": "13",
        },
        "classes": {
          "boldtext": true,
        }
      }
    }, {...}, {...}, {...}, ...]);
    
#### Adding/removing activity listeners:

#### Drag/drop:

    optiMenu.addActivityDDListener(callback)
    optiMenu.removeActivityDDListener(callback)
    
#### Mouse events:

    optiMenu.addActivityMouseListener(callback)
    optiMenu.removeActivityMouseListener(callback)
    
#### Action:

    optiMenu.addActivityActionListener(callback)
    optiMenu.removeActivityActionListener(callback)
    
    
