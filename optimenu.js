/*
 * OptiMenu API
 *
 * Optimized HTML menu API which uses minimal DOM resources.
 *
 * A (theoretically) unlimited number of menuitems can be displayed using only
 * enough DOM elements to fill the displayed view.  This proves very useful
 * for improving performance of very large menus.
 *
 * Note that while the height of the menuitems can be set by the user, all
 * menuitems must be the same height for the menu to function and scroll properly.
 *
 * It is up to the user to provide the container in which the menu lives.  This
 * would normally be a 'div' element.  The container must have a declared width,
 * though this width value can be changed at any time and menuitems will adjust
 * to the new width.  More information on appearance is given below.
 *
 * Menu is updated by supplying an array of objects which provide data to
 * display menuitems.  This array would be the list of items you wish to appear
 * in the menu and can (theoretically) be of unlimited length.  Each object in
 * the array may contain the following properties which will determine how the
 * menuitems are displayed:
 *
 *   menutextstr - the text displayed in the menuitem
 *   menuiconurl1 - url of the icon which will be displayed preceding the text (prefix icon)
 *   menuiconurl2 - url of the icon which will be displayed succeeding the text (suffix icon)
 *   noPrefixIcon - flag which collapses the prefix icon
 *   noSuffixIcon - flag which collapses the suffix icon
 *   isSelected - flag which displays the menuitem as selected
 *
 * There is also a userDefined property which can contain a subset of properties
 * which can be set on each menuitem for user access, such as custom displaying
 * of the menuitem, feedback when it is clicked, etc.  The properties are:
 *
 *   userDefined.properties - javascript properties set directly on the menuitem element
 *   userDefined.attributes - element attributes set using setAttribute()
 *   userDefined.classes - css classes set using the classList API
 *
 * Not setting properties for a menu update which were previously set will result
 * in the removal of those properties.  Not setting userDefined.attributes or
 * userDefined.classes which were previously set will also result in the removal
 * of those attributes or classes.
 *
 * The menu is updated by calling `OptiMenu.updateMenu(array, deepClone).
 * OptiMenu keeps a reference to the array and may change properties later, so
 * the deepClone parameter may optionally be passed so that the users passed
 * array will be unaffected.
 *
 * The API includes the following built-in functionality:
 *
 *   Highlighting of menuitems as mouse hovers over them.
 *   Select menuitems using ctrl/cmd + click or shift + click which will leave
 *     the menuitems in highlighted state. (Selecting one or more menuitems
 *     will disable mouse hovering highlighting, unless `selectedPlusHover` is
 *     set, see OptiMenu constructor.)
 *   Drag and drop of selected menuitems.
 *   Activity listeners which can be registered for drag and drop, activation of
 *     prefix or suffix icon, and general mouse events.
 *   Detection of last hovered menuitem (useful for implementing context menu actions).
 *
 * All properties, classes and attributes set on menuitems for the native functionality
 * of the menu are prefixed with 'opti_'.
 *
 * Appearance:
 *
 * This API must be used with the supporting CSS file for proper menu display
 * and behavior. It is possible for the user to override CSS settings by using
 * `!important` declarations or higher specificity in a separate file, and this
 * method is recommended over directly editing the OptiMenu CSS file.
 *
 * Menuitems will always be the width of the container. It is good to note here
 * that all margins for the menuitem element other than 0 (the default)
 * can likely result in undesired or unpredictable results.
 *
 * Usage:
 *
 * <div id="optimenu_container"></div>
 *
 * let optiMenuContainer = document.getElementById("optimenu_container");
 * let optiMenu = new OptiMenu(optiMenuContainer, window, { hideBrokenImageIcons: true });
 *
 * optiMenu.updateMenu([{
 *   "menutextstr": "Cooking with William",
 *   "menuiconurl1": "data:image/x-icon;base64,AAABAAMAMDA...",
 *   "menuiconurl2": "../icons/closebutton.png",
 *   "userDefined": {
 *     "properties": {
 *       "tabId": 13,
 *       "active": true,
 *       "url": "http://cookingwithwilliam.com/index.html",
 *     },
 *     "attributes": {
 *       "name": "This is the Site",
 *       "tabid": "13",
 *     },
 *     "classes": {
 *       "boldtext": true,
 *     }
 *   }
 * }, {...}, {...}, {...}, ...]);
 *
 */

/*
 * OptiMenu constuctor
 *
 * @param {DOM element} menuCntnr required - the container in which the menu lives.
 *   Typically a 'div' element.
 * @param {Chrome window} win required - the `window` object where the menu lives.
 * @param {boolean} selectedPlusHover optional - setting this to `true` will
 *   provide menuitem highlighting for hovered items even after items are
 *   selected.  However, if items have been selected, the highlighting will
 *   be slightly difference in appearance.  This state can be updated after
 *   the menu is constructed by calling `OptiMenu.setSelectedPlusHoverState()`.
 * @param {boolean} hideBrokenImageIcons optional - If url for an image element
 *   is broken, the image element will be hidden rather than displaying the
 *   "broken image" icon. This is done by setting opacity on the element to 0.
 * @param {integer} menuTextWidthCorrectionOffset optional - The text element width
 *   in menuitems must be constrained to not exceed the width of the menuitem
 *   minus the horizontal space taken up by icon elements, or else the appearance
 *   of the menuitem may be undesirable. Thus, OptiMenu uses those factors in
 *   setting the width of the text element.  This parameter allows the user to
 *   adjust the calculated width of the text element, if eg, the user overrides
 *   margin settings for the text element in css.
 *
 *   A negative value will decrease the final width of the text element, a
 *   positive value will increase it.
 *
 *   This value can also be updated after the menu is constructed by calling
 *   `OptiMenu.setMenuTextWidthCorrectionOffset()`.
 */
function OptiMenu(menuCntnr, win, options) {
  this.window = win;
  this.menuCntnr = menuCntnr;

  this.init(options);
}

OptiMenu.prototype = {
  miHeight: 0,
  icon1FullWidth: 0,
  icon2FullWidth: 0,
  menuItemTrailSpace: 6,
  menuItemLeadSpaceCorrection: 6,
  menuTextWidthCorrectionOffset: 0,
  _currentMenuData: [],
  currentMenuFillTotalHeight: 0,
  currentMenuMaxScroll: 0,
  currentMenuMaxTopIndex: 0,
  menuprespacer: null,
  menupostspacer: null,
  menuCntnr: null,
  wheelScrollDistance: 18,
  prevItemsCount: 0,
  currentIndex: 0,
  hideBrokenImageIcons: false,

  activityDDListeners: [],
  activityDDListenersMap: new WeakMap(),
  activityMouseListeners: [],
  activityMouseListenersMap: new WeakMap(),
  activityActionListeners: [],
  activityActionListenersMap: new WeakMap(),

  init(options) {
    let selectedPlusHover = (options && options.selectedPlusHover) || false;
    this.hideBrokenImageIcons = (options && options.hideBrokenImageIcons) || false;
    this.menuTextWidthCorrectionOffset =
      (options && options.menuTextWidthCorrectionOffset) || this.menuTextWidthCorrectionOffset;

    this.select._optiMenu = this;
    this.select.menuCntnr = this.menuCntnr;
    this.dragDrop._optiMenu = this;
    this.dragDrop.menuCntnr = this.menuCntnr;

    this.menuCntnr.classList.add("opti_menu_outer_container");
    if (selectedPlusHover) {
      this.menuCntnr.classList.add("opti_isselectedplushover");
    }

    // Create a menuitem and add it to the DOM, then get computedStyle height.
    // We'll use this for calculating menu spacial data.
    let menuitemInitial = this.createMenuitem();
    let refDiv = this.window.document.createElement("div");
    refDiv.style.float = "left";
    menuitemInitial.appendChild(refDiv);

    this.menuCntnr.appendChild(menuitemInitial);
    let mtext = menuitemInitial.getElementsByClassName("opti_menutext")[0];
    let icon2 = menuitemInitial.getElementsByClassName("opti_menuicon2")[0];

    let miRect = menuitemInitial.getBoundingClientRect();
    let mtextRect = mtext.getBoundingClientRect();
    let icon2Rect = icon2.getBoundingClientRect();
    let refDivRect = refDiv.getBoundingClientRect();

    this.miHeight = miRect.bottom - miRect.top;
    this.icon1FullWidth = mtextRect.left - miRect.left;
    this.icon2FullWidth = refDivRect.left - mtextRect.right;
    this.menuCntnr.removeChild(menuitemInitial);

    let menuprespacer = document.createElement("div");
    menuprespacer.classList.add("opti_menuprespacer");
    this.menuCntnr.appendChild(menuprespacer);
    this.opti_menuprespacer = menuprespacer;

    let menupostspacer = document.createElement("div");
    menupostspacer.classList.add("opti_menupostspacer");
    this.menuCntnr.appendChild(menupostspacer);
    this.opti_menupostspacer = menupostspacer;

    this.wheelScrollDistance = this.miHeight;

    this.menuCntnr.addEventListener("mousedown", this);
    this.window.addEventListener("mouseup", this);
    this.menuCntnr.addEventListener("click", this);
    this.window.addEventListener("resize", this);
    this.menuCntnr.addEventListener("overflow", this);
    this.menuCntnr.addEventListener("underflow", this);
    this.menuCntnr.addEventListener("wheel", this, true);
    this.menuCntnr.addEventListener("scroll", this, true);

    // TODO: beginnings of keyboard navigation
    //this.menuCntnr.addEventListener("mouseover", this);
    //this.menuCntnr.addEventListener("mouseout", this);
    //this.window.addEventListener("keydown", this);

    let dragFeedback = document.createElement("div");
    dragFeedback.id = "opti_dragfeedback";
    // TODO: append to menuCntnr?
    this.window.document.body.appendChild(dragFeedback);
    this.dragDrop.dragFeedback = dragFeedback;

    let style1 = document.getElementById("optimenu_dynamic_css_menu_dimensions");
    if (!style1) {
      style1 = document.createElement("style");
      style1.id = "optimenu_dynamic_css_menu_dimensions";
      this.window.document.head.appendChild(style1);
      this.dynamicCSS1 = style1
    }

    this.updateMenuitemDims();
  },

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
// ACTIVITY LISTENERS

  addActivityDDListener(callback) {
    if (this.activityDDListenersMap[callback]) {
      return;
    }
    this.activityDDListenersMap[callback];
    this.activityDDListeners.push(callback);
  },

  removeActivityDDListener(callback) {
    if (this.activityDDListenersMap[callback]) {
      return;
    }
  },

  callActivityDDListeners(e) {
    for (let listener of this.activityDDListeners) {
      listener(e);
    }
  },

  addActivityMouseListener(callback) {
    if (this.activityMouseListenersMap[callback]) {
      return;
    }
    this.activityMouseListenersMap[callback];
    this.activityMouseListeners.push(callback);
  },

  removeActivityMouseListener(callback) {
    if (this.activityMouseListenersMap[callback]) {
      return;
    }
  },

  callActivityMouseListeners(e) {
    for (let listener of this.activityMouseListeners) {
      listener(e);
    }
  },

  addActivityActionListener(callback) {
    if (this.activityActionListenersMap[callback]) {
      return;
    }
    this.activityActionListenersMap[callback];
    this.activityActionListeners.push(callback);
  },

  removeActivityActionListener(callback) {
    if (this.activityActionListenersMap[callback]) {
      return;
    }
  },

  callActivityActionListeners(e) {
    for (let listener of this.activityActionListeners) {
      listener(e);
    }
  },

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
// MENU CONSTRUCTION

  updateMenuStructure(itemsCount) {
    this.prevItemsCount = itemsCount;

    let viewPortTop = this.menuCntnr.getBoundingClientRect().top;
    let viewPortBot = this.menuCntnr.getBoundingClientRect().bottom;
    let tlHeight = viewPortBot - viewPortTop;

    let psuedoListTotalHeight = this.miHeight * itemsCount;
    let minMenuitemsCount = Math.min((Math.ceil(tlHeight / this.miHeight) + 1), itemsCount);
    let miSpaceHeight = minMenuitemsCount * this.miHeight;
    this.currentMenuFillTotalHeight = psuedoListTotalHeight - miSpaceHeight;

    let currentMenuitemsCount = this.menuCntnr.childNodes.length - 2;
    let itemsToAddCount =  minMenuitemsCount - currentMenuitemsCount;

    if (itemsToAddCount > 0) {
      let currentMenuitems = document.createDocumentFragment();
      let menuitem;
      for (let i=0;i<itemsToAddCount;i++) {
        menuitem = this.createMenuitem();
        currentMenuitems.appendChild(menuitem);
      }
      this.menuCntnr.insertBefore(currentMenuitems, this.opti_menupostspacer);
    } else if (itemsToAddCount < 0) {
      let removeCount = 0 - itemsToAddCount;
      for (let i=0;i<removeCount;i++) {
        this.menuCntnr.removeChild(this.menuCntnr.firstChild.nextSibling);
      }
    }

    this.currentMenuMaxScroll = (itemsCount * this.miHeight) - tlHeight;
    this.currentMenuMaxTopIndex = itemsCount - minMenuitemsCount;

    // Force a refresh of the menu.
    this.psuedoScroll(this.menuCntnr.scrollTop, true);
  },

  createMenuitem() {
    let menuitem = document.createElement('div');
    let menuicon1 = document.createElement('img');
    let menutext = document.createElement('div');
    let menuicon2 = document.createElement('img');

    menuitem.className = "opti_menuitem";
    menuitem.isOptiMenuitem = true;
    menuitem.opti_menutext = menutext;
    menuitem.opti_menuicon1 = menuicon1;
    menuitem.opti_menuicon2 = menuicon2;

    menuicon1.className = "opti_menuicon1";
    menuicon1.opti_menuitem = menuitem;
    if (this.hideBrokenImageIcons) {
      menuicon1.addEventListener("error", e => { e.target.style.opacity = "0"; });
    }

    menutext.className = "opti_menutext";
    menutext.opti_menuitem = menuitem;

    menuicon2.className = "opti_menuicon2";
    menuicon2.opti_menuitem = menuitem;
    if (this.hideBrokenImageIcons) {
      menuicon2.addEventListener("error", e => { e.target.style.opacity = "0"; });
    }

    menuitem.appendChild(menuicon1);
    menuitem.appendChild(menutext);
    menuitem.appendChild(menuicon2);

    return menuitem;
  },

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
// MENU DISPLAY BACKEND

  indexCurrentMenuData() {
    let len = this._currentMenuData.length;
    for (let i = 0; i < len; i++) {
      this._currentMenuData[i].opti_index = i;
    }
  },

  /*
   * updateMenu
   *
   * This updates the menu with new data.  This will also create new or remove
   * menuitems if needed.
   *
   * @param _currentMenuData array - An array of objects to update the menu with.
   * @param deepClone boolean optional - A reference to _currentMenuData is held
   *   and it is possible that properties in the array can be changed later.
   *   This will deep clone the array so that the users passed array will
   *   be unaffected.
   */
  updateMenu(_currentMenuData, deepClone) {
    // Update _currentMenuData.

    // We have the option of a deepClone; while it takes longer, may be more
    // convenient.
    if (_currentMenuData) {
      if (deepClone) {
        this._currentMenuData = _currentMenuData.map(a => Object.assign({}, a));
      } else {
        this._currentMenuData = _currentMenuData.slice();
      }
      this.indexCurrentMenuData();
    }

    this.updateMenuUI();
  },

  updateMenuUI() {
    if (this._currentMenuData.length != this.prevItemsCount) {
      this.updateMenuStructure(this._currentMenuData.length)
    } else {
      // This gets called when updating the scroll structure, otherwise we'll
      // call it now.
      this.updateMenuDisplay(this.currentIndex);
    }
  },

  updateSingleMenuItem(_currentMenuData, index) {
    // Determine if the menuitem data at index is currently displayed,
    // and if so, just update that menuitem.

    // Update _currentMenuData.
    this._currentMenuData = _currentMenuData;
    this.indexCurrentMenuData();

    let currentIndex = this.currentIndex;
    let menuitemsCount = this.menuCntnr.childNodes.length - 2;

    if (index < currentIndex || index > currentIndex + menuitemsCount) {
      return;
    }

    let menuitemAtIndex = this.menuCntnr.childNodes[index - currentIndex + 1];
    this.setMenuitemProperties(menuitemAtIndex, _currentMenuData[index]);
  },

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
// MENU DISPLAY FRONTEND

  /*
   * updateMenuDisplay
   * Updates the graphical display of the menu, in the "psuedo-scroll" context.
   *
   * {@param} index - index of _currentMenuData to begin displaying menu data
   *   (in "psuedo-scroll" context, the menu data entry to "scroll" to).
   */
  updateMenuDisplay(index) {
    index = typeof index == "number" ? index : 0;
    let _currentMenuData = this._currentMenuData;
    let nodes = this.menuCntnr.childNodes;
    let cmDataLen = _currentMenuData.length;

    // First and last nodes are fill spacers.  Ignore those.  Everything else
    // inbetween are menuitems.
    let len = (nodes.length - 1);
    for (let i = 1; i < len; i++) {
      let menuitem = nodes[i];
      if (index < cmDataLen) {
        let data = _currentMenuData[index];
        this.setMenuitemProperties(menuitem, data, index);
        index++;
      }
    }

    let _this = this;
    setTimeout(() => {
      for (let i = 1; i < 10; i++) {
        let menuitem = nodes[i];
      }
    }, 3000)
  },

  setMenuitemProperties(menuitem, data, currentMenuDataIndex) {
    // ONLY OPTI
    // TODO: Can some of the properties being explicitly set below just be
    // accessed through opti_data?
    menuitem.opti_data = data;

    menuitem.currentMenuDataIndex = currentMenuDataIndex;

    if (typeof data.menutextstr == "string") {
      menuitem.opti_menutext.textContent = data.menutextstr;
    } else {
      menuitem.opti_menutext.textContent = "";
      menuitem.opti_menutext.appendChild(data.menutextstr.cloneNode(true));
    }

    // Initialize className..
    menuitem.className = "opti_menuitem";

    if (data.menuiconurl1) {
      menuitem.opti_menuicon1.src = data.menuiconurl1;
      menuitem.opti_menuicon1.style.opacity = "1";
    } else {
      // If existing icon is "broken", removing src attribute won't clear it,
      // and setting to null value also results in a "broken" icon.  Instead,
      // we make it invisible.
      menuitem.opti_menuicon1.style.opacity = "0";
    }

    if (data.noPrefixIcon) {
      menuitem.classList.add("opti_menuitem_icon1_hide");
    }

    if (data.menuiconurl2) {
      menuitem.opti_menuicon2.src = data.menuiconurl2;
      menuitem.opti_menuicon2.style.opacity = "1";
    } else {
      // If existing icon is "broken", removing src attribute won't clear it,
      // and setting to null value also results in a "broken" icon.  Instead,
      // we make it invisible.
      menuitem.opti_menuicon2.style.opacity = "0";
    }
    if (data.noSuffixIcon) {
      menuitem.classList.add("opti_menuitem_icon2_hide");
    }

    if (data.isSelected) {
      menuitem.classList.add("opti_menuitemselected");
      menuitem.isSelected = true;
    } else {
      delete(menuitem.isSelected);
    }

    // USER DEFINED
    if (data.userDefined) {
      // TODO: userDefined properties get set on menuitems directly, thus there
      // is no clean way to remove a previously set property if it does not exist
      // in data.userDefined, because we use other properties that are not
      // userDefined internally.  We should espouse userDefined properties in an
      // object userDefined (or maybe the inverse), where we can easily distinguish
      // and clear all userDefined properties everytime and start afresh.
      // This of course will affect all code which is currently sniffing for
      // userDefined properties on menuitems.
      let { properties, attributes, classes } = data.userDefined;
      if (properties) {
        for (let name in properties) {
          menuitem[name] = properties[name];
        }
      }
      if (attributes) {
        for (let name in attributes) {
          let value = attributes[name];
          if (value) {
            menuitem.setAttribute(name, value);
          } else {
            menuitem.removeAttribute(name);
          }
        }
      }
      if (classes) {
        for (let name in classes) {
          let status = classes[name];
          if (status) {
            menuitem.classList.add(name);
          }
        }
      }
    }
  },

  psuedoScroll(scrollPos, forceRefresh) {
    // TODO : Not sure why we checked currentMenuMaxScroll here but it is
    // introducing a bug.
    //if (scrollPos > this.currentMenuMaxScroll && !forceRefresh) {
    //  return;
    //}

    let index = Math.floor(scrollPos / this.miHeight);

    if (index != this.currentIndex || forceRefresh) {
      let preheight = Math.min((index * this.miHeight), this.currentMenuFillTotalHeight);
      let postheight = this.currentMenuFillTotalHeight - preheight;
      this.opti_menuprespacer.style.height = preheight+"px";
      this.opti_menupostspacer.style.height = postheight+"px";
      this.updateMenuDisplay(Math.min(index, this.currentMenuMaxTopIndex));
    }
    this.currentIndex = index;
  },

  getSelectedMenuData() {
    let selected = [];
    for (let datum of this._currentMenuData) {
      if (datum.isSelected) {
        selected.push(datum);
      }
    }
    return selected;
  },

  prevCntnrWid: 0,

  updateMenuitemDims(force) {
    let cntnrWid = this.menuCntnr.clientWidth;

    // This test is especially necessary because updating the css will trigger
    // a resize (even if css is the same value), creating an infinite loop.
    if (!force && cntnrWid == this.prevCntnrWid) {
      return;
    }
    this.prevCntnrWid = cntnrWid;

    let textWid = cntnrWid - this.icon1FullWidth - this.icon2FullWidth -
                  this.menuItemTrailSpace + this.menuTextWidthCorrectionOffset;

    let textContent = ".opti_menuitem { width: " + cntnrWid + "px; }\n";
    textContent += ".opti_menutext { width: " + textWid + "px; }\n";

    textWid = cntnrWid - this.icon2FullWidth - this.menuItemTrailSpace -
              this.menuItemLeadSpaceCorrection + this.menuTextWidthCorrectionOffset;
    textContent += ".opti_menuitem_icon1_hide > .opti_menutext { width: " + textWid + "px; }\n";

    textWid = cntnrWid - this.icon1FullWidth - this.menuItemTrailSpace +
              this.menuTextWidthCorrectionOffset;
    textContent += ".opti_menuitem_icon2_hide > .opti_menutext { width: " + textWid + "px; }\n";

    textWid = cntnrWid - this.menuItemTrailSpace - this.menuItemLeadSpaceCorrection +
              this.menuTextWidthCorrectionOffset;
    textContent += ".opti_menuitem_icon1_hide.opti_menuitem_icon2_hide > .opti_menutext { width: " + textWid + "px; }\n";

    this.dynamicCSS1.textContent = textContent;
  },

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
// SELECT

  select: {
    _optiMenu: null,
    menuCntnr: null,

    isMenuitemSelected: false,
    lastSelectedMenuDataItem: null,

    handleMenuitemSelect(e) {
      let item = e.target;
      let menuitem = item.opti_menuitem || item;

      let menuitemData = this._optiMenu._currentMenuData[menuitem.currentMenuDataIndex];

      if (e.shiftKey) {
        // Always select for shift key.
        menuitem.isSelected = true;
        menuitem.classList.add("opti_menuitemselected");
        menuitemData.isSelected = true;

        // If shiftKey and there has already been a menuitem selected,
        // select a range between the two.
        if (this.lastSelectedMenuDataItem) {
          this.selectRange(menuitem, menuitemData, this.lastSelectedMenuDataItem);
        }
      } else {
        // If we are here it means that only ctrl and/or cmd key was pressed.
        // Toggle selection state of menuitem.
        if (menuitem.isSelected) {
          delete(menuitem.isSelected);
          menuitem.classList.remove("opti_menuitemselected");
          delete(menuitemData.isSelected);
        } else {
          menuitem.isSelected = true;
          menuitem.classList.add("opti_menuitemselected");
          menuitemData.isSelected = true;
        }
      }

      if (!menuitemData.isSelected && !this.getSelectedMenuData().length) {
        // We unselected the only selected menuitem.
        this.isMenuitemSelected = false;
        this.menuCntnr.classList.remove("opti_ismenuitemselected");
        this.lastSelectedMenuDataItem = null;
      } else {
        this.isMenuitemSelected = true;
        this.menuCntnr.classList.add("opti_ismenuitemselected");
        this.lastSelectedMenuDataItem = menuitemData;
      }
    },

    selectRange(menuitem, menuitemData, lastMenuitemData) {
      // Selects a range between menuitem1 and menuitem2, regardless of which
      // is preceding.
      if (menuitemData.opti_index == lastMenuitemData.opti_index) {
        return;
      }
      let startIndex = Math.min(menuitemData.opti_index, lastMenuitemData.opti_index);
      let endIndex = Math.max(menuitemData.opti_index, lastMenuitemData.opti_index);

      let nodes = this.menuCntnr.childNodes;
      let len = nodes.length - 1;
      for (let i = 1; i < len; i++) {
        let menuitem = nodes[i];
        if (menuitem.currentMenuDataIndex > endIndex) {
          break;
        }
        if (menuitem.currentMenuDataIndex >= startIndex) {
          menuitem.classList.add("opti_menuitemselected");
          menuitem.isSelected = true;
        }
      }
      let _currentMenuData = this._optiMenu._currentMenuData;
      len = _currentMenuData.length;
      for (let i = startIndex; i <= endIndex; i++) {
        _currentMenuData[i].isSelected = true;
      }
    },

    clearMenuitemSelection() {
      let nodes = this.menuCntnr.childNodes;
      let len = nodes.length - 1;
      for (let i=1;i<len;i++) {
        let menuitem = nodes[i];
        menuitem.classList.remove("opti_menuitemselected");
        menuitem.isSelected = false;
      }
      let _currentMenuData = this._optiMenu._currentMenuData;
      len = _currentMenuData.length;
      for (let i = 0; i < len; i++) {
        delete(_currentMenuData[i].isSelected);
      }
      this.isMenuitemSelected = false;
      this.menuCntnr.classList.remove("opti_ismenuitemselected");
      this.lastSelectedMenuDataItem = null;
    },
  },

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
// DRAG/DROP

  dragDrop: {
    _optiMenu: null,
    menuCntnr: null,

    isMenuitemDragListener: false,
    isMenuitemDragging: false,
    dragStartTarget: null,

    /**
     *  dragPrepare
     *
     *  Called on mousedown event.  Prepare just in case we are going to drag.
     *  Add mousemove listener and Record target for dragStart in the event
     *  we actually do drag.  If we get a mousemove while mouse is still down,
     *  we have begun a drag.
     */
    dragPrepare(e) {
      document.addEventListener("mousemove", this);
      this.isMenuitemDragListener = true;
      this.dragStartEvent = e;
    },

    /**
     *  dragStart
     *
     *  Called on the first sign of a mousemove after mousedown (dragPrepare).
     *  We are now dragging.
     */
    dragStart() {
      let nodes = this.menuCntnr.childNodes;
      let len = nodes.length - 1;
      let count = 0;
      for (let i=1;i<len;i++) {
        let menuitem = nodes[i];
        if (menuitem.isSelected) {
          count++;
        }
      }

      // Call listeners
      let e = this.dragStartEvent;
      let target = e.target;
      let menuitem = target.opti_menuitem || (target.isOptiMenuitem ? target : null);

      e.hybridType = "dragstart";
      e.menuitem = menuitem;

      this._optiMenu.callActivityDDListeners(e);
    },

    dragMenuitem(e) {
      if (!this.isMenuitemDragging) {
        this.dragStart();
      }

      this.menuCntnr.classList.add("opti_dragging_menuitem");
      this.dragFeedback.style.display = "block";
      if (!this.isMenuitemDragging) {
        this.initDragFeedbackItem();
      }
      this.updateDragFeedbackItem(e);
      this.isMenuitemDragging = true;
    },

    initDragFeedbackItem(e) {
      let count = this._optiMenu.getSelectedMenuData().length;
      this.dragFeedback.textContent = "Moving "+count+" tab"+(count == 1 ? "" : "s");
    },

    updateDragFeedbackItem(e) {
      let x = e.clientX;
      let y = e.clientY;

      this.dragFeedback.style.display = "block";
      this.dragFeedback.style.left = (x - 10)+"px";
      this.dragFeedback.style.top = (y + 10)+"px";
    },

    /**
     *  Act on dropping on messageCntnr or a menuitem in the tabs menu.
     */
    onDrop(e) {
      if (!e.target || !this.isMenuitemDragging) {
        return;
      }

      // Call listeners
      let target = e.target;
      let menuitem = target.opti_menuitem || (target.isOptiMenuitem ? target : null);

      e.hybridType = "drop";
e.menuitem = menuitem;
      e.opti_selectedMenuData = this._optiMenu.getSelectedMenuData();

      this._optiMenu.callActivityDDListeners(e);
    },

    dragEnd(e) {
      if (!this.isMenuitemDragListener) {
        return;
      }

      this.isMenuitemDragging = false;
      document.removeEventListener("mousemove", this);
      this.isMenuitemDragListener = false;
      this.menuCntnr.classList.remove("opti_dragging_menuitem");
      this.dragFeedback.style.display = "none";
    },

    handleEvent(e) {
      switch(e.type) {
        case "mousemove":
          this.dragMenuitem(e);
          break;
      }
    },
  },

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
// UTILS

  getHoveredMenuitem() {
    let nodes = this.menuCntnr.childNodes;
    let len = nodes.length - 1;
    for (let i = 1; i < len; i++) {
      let menuitem = nodes[i];
      if (menuitem.matches(".opti_menu_outer_container > div:hover")) {
        return menuitem;
      }
    }
  },

  frozenHoveredItem: null,

  freezeHoveredItem(unfreeze) {
    if (unfreeze && this.frozenHoveredItem) {
      this.menuCntnr.classList.remove("opti_menufrozen");
      this.frozenHoveredItem.classList.remove("opti_frozen_menuitem");
      this.frozenHoveredItem = null;
      return;
    }
    this.frozenHoveredItem = this.getHoveredMenuitem();
    if (this.frozenHoveredItem) {
      this.menuCntnr.classList.add("opti_menufrozen");
      this.frozenHoveredItem.classList.add("opti_frozen_menuitem");
    }
  },

  getFrozenHoveredItemIndex() {
    return this.frozenHoveredItem.currentMenuDataIndex;
  },

  setSelectedPlusHoverState(remove) {
    if (remove) {
      this.menuCntnr.classList.remove("opti_isselectedplushover");
    } else {
      this.menuCntnr.classList.add("opti_isselectedplushover");
    }
  },

  /*
   * setMenuTextWidthCorrectionOffset
   *
   * Sets menuTextWidthCorrectionOffset, see constructor for description.
   *
   * @param value integer - the value in pixels, negative value will decrease
   * text width, positive will increase.
   */
  setMenuTextWidthCorrectionOffset(value) {
    this.menuTextWidthCorrectionOffset = value;
    // Force an update of the menuitem dimensions.
    this.updateMenuitemDims(true);
  },

  getScrollPosition() {
    return this.menuCntnr.scrollTop;
  },

  setScrollPosition(scrollPos) {
    this.menuCntnr.scrollTop = scrollPos;
  },

  /*
   * ensureIndexIsVisible
   *
   * If index is not visible, scrolls the menu just enough to bring the index
   * into visibility, whether at the top or bottom, whichever is nearest.
   *
   * @param index number - the index to ensure visibility
   * @param topMargin number - rather than just bringing the index into visiblity
   *                           at the very top of the menu, will ensure it is at
   *                           least topMargin number of indices below that.
   * @param bottomMargin number - rather than just bringing the index into visiblity
   *                              at the very bottom of the menu, will ensure it is at
   *                              least bottomMargin number of indices above that.
   * @param forceToTop boolean - force to the top of menu, regardless of where
   *                             index currently is.
   */
  ensureIndexIsVisible(index, topMargin = 0, bottomMargin = 0, forceToTop) {
    let currentScrollTop = this.menuCntnr.scrollTop;
    let { height } = this.menuCntnr.getBoundingClientRect();

    let indexPixels = index * this.miHeight;
    let topMarginPixels = topMargin * this.miHeight;

    if (forceToTop || indexPixels < currentScrollTop + topMarginPixels) {
      this.menuCntnr.scrollTop = indexPixels - topMarginPixels;
      return;
    }

    let scrollHeight = height - this.miHeight;
    let bottomMarginPixels = bottomMargin * this.miHeight;

    if (indexPixels > (currentScrollTop + scrollHeight) - bottomMarginPixels) {
      this.menuCntnr.scrollTop = indexPixels - scrollHeight;
      return;
    }
  },

  lastKeyHoveredItem: null,

  keyboardAction(e) {
    let keyCode = e.keyCode;
    if (keyCode == 38 || keyCode == 40) {
      let hovered;
      if (!this.lastKeyHoveredItem) {
        for (let item of this.menuCntnr.childNodes) {
          if (item.classList.contains("opti_menuitem") && item.matches(":hover")) {
            hovered = item;
          }
        }
      } else {
        hovered = this.lastKeyHoveredItem;
        hovered.classList.remove("keyhovered");
      }

      if (!hovered) {
        hovered = keyCode == 40 ? this.menuCntnr.firstChild : this.menuCntnr.lastChild;
      }


      if (keyCode == 40) {
        if (hovered.nextSibling.classList.contains("opti_menuitem")) {
          this.lastKeyHoveredItem = hovered.nextSibling;
          this.lastKeyHoveredItem.classList.add("keyhovered");
        } else {
          this.lastKeyHoveredItem = null;
        }
      } else {
        if (hovered.previousSibling.classList.contains("opti_menuitem")) {
          this.lastKeyHoveredItem = hovered.previousSibling;
          this.lastKeyHoveredItem.classList.add("keyhovered");
        } else {
          this.lastKeyHoveredItem = null;
        }
      }
      return;
    }
  },

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
// EVENT HANDLERS

  clearSelectionOnMouseRelease: false,
  inhibitClick: false,

  handleEvent(e) {
    let target = e.target;
    let menuitem;

    switch(e.type) {
      case 'mousedown':
        if (e.button != 0) {
          return;
        }

        e.preventDefault();

        if (this.frozenHoveredItem) {
          return;
        }

        if (e.ctrlKey || e.metaKey || e.shiftKey) {
          this.select.handleMenuitemSelect(e);
        } else if (this.select.isMenuitemSelected) {
          this.clearSelectionOnMouseRelease = true;
          this.dragDrop.dragPrepare(e);
        }

        this.callActivityMouseListeners(e);
        break;
      case 'mouseup':
        if (e.button != 0 || this.frozenHoveredItem) {
          return;
        }

        // Call onDrop() in case we were dragging.
        // (onDrop() will only run if isMenuitemDragging is true.)
        // Important: This must precede code that calls clearMenuitemSelection() !!!
        this.dragDrop.onDrop(e);

        if (this.clearSelectionOnMouseRelease) {
          this.clearSelectionOnMouseRelease = false;
          this.select.clearMenuitemSelection();
          // If we released on a plain click, the click event will immediately be
          // fired next, but we want to inhibit any other action (tab select or close).
          // If we released on a drag, the click event won't get fired right away, so
          // we don't want to inhibitClick on the following click.
          this.inhibitClick = !this.dragDrop.isMenuitemDragging;
        }

        // Call dragEnd() in case we were dragging.
        // (dragEnd() will only run if isMenuitemDragListener is true.)
        // Important: This must succeed the above, otherwise isMenuitemDragging
        // will get cleared, which is needed for the test above.
        this.dragDrop.dragEnd(e);

        this.callActivityMouseListeners(e);
        break;
      case 'mouseover':
        // TODO: beginnings of keyboard navigation
        menuitem = e.target.opti_menuitem || e.target;
        if (menuitem.classList.contains("opti_menuitem")) {
          this.lastKeyHoveredItem.classList.remove("keyhovered");
        }
        break;
      case 'mouseout':
        // TODO: beginnings of keyboard navigation
        break;
      case 'click':
        if (e.button != 0 || this.frozenHoveredItem) {
          return;
        }

        if (this.inhibitClick) {
          this.inhibitClick = false;
          return;
        }

        if (this.select.isMenuitemSelected) {
          return;
        }

        // "opti_menuicon1" and "opti_menuicon2" must precede "opti_menuitem" as they would
        // also trigger a menuitem click.

        if (target.className == "opti_menuicon1") {
          menuitem = target.opti_menuitem;

          e.hybridType = "action1click";
          e.menuitem = menuitem;
          this.callActivityActionListeners(e);

          return;
        }

        if (target.className == "opti_menuicon2") {
          menuitem = target.opti_menuitem;

          e.hybridType = "action2click";
          e.menuitem = menuitem;
          this.callActivityActionListeners(e);

          return;
        }

        // This assumes this listener is only set on this.menuCntnr.
        if (target == this.menuCntnr) {
          return;
        }

        if (target.opti_menuitem || target.isOptiMenuitem) {
          menuitem = target.opti_menuitem || target;
        } else {
          // Target may be some user-defined HTML contained within a menuitem.
          // If we don't find a menuitem before reaching menuCntnr in this
          // routine, it means the user has inserted some of their own items
          // into the menu.
          let count = 0;
          let parent = target;
          while ((parent = parent.parentNode) && (parent != this.menuCntnr)) {
            if (parent.isOptiMenuitem) {
              menuitem = parent;
              break;
            }
          }
        }

        if (menuitem) {
          e.hybridType = "menuitemclick";
          e.menuitem = menuitem;
          this.callActivityActionListeners(e);

          return;
        }

        this.callActivityMouseListeners(e);
        break;
      case "keydown":
        // TODO: beginnings of keyboard navigation
        //this.keyboardAction(e);
        break;
      case "resize":
        this.updateMenuitemDims();
        break;
      case "overflow":
      case "underflow":
        if (target == this.menuCntnr) {
          this.updateMenuitemDims();
        }
        break;
      case "wheel":
        // With mousewheel, we take over and scroll one menuitem at a time.
        // If the clientHeight of the menu is not an even multiple of the
        // menuitem height, logic is implemented to always keep top menuitem
        // justified with top of menu, whether scrolling up or down.
        e.preventDefault();

        let menuCntnr = this.menuCntnr;

        if (menuCntnr.scrollHeight <= this.menuCntnr.clientHeight) {
          return;
        }

        let mult = this.wheelScrollDistance;

        let upFromMaxScroll = (e.deltaY < 0) &&
                              (menuCntnr.scrollHeight - this.menuCntnr.clientHeight == menuCntnr.scrollTop);

        let offset = 0;
        if (upFromMaxScroll) {
          // TODO: don't understand why we have to subtract 1 here.
          offset = (menuCntnr.clientHeight % mult) - 1;
        }
        this.menuCntnr.scrollTop = this.menuCntnr.scrollTop + (e.deltaY * mult) + offset;
        break;
      case "scroll":
        this.psuedoScroll(this.menuCntnr.scrollTop);
        break;
    }
  },
}
