// ==UserScript==
// @name        PlainCSVToTable
// @description Convert Plain CSV file content to HTML table with formatting, Reference base script - https://github.com/sartor/csv-beautifier/blob/master/content.js
// @namespace   raviksingh.PlainCSVToTable
// @author      Ravi Kant Singh
// @version     0.1
// @match       *://*/*.csv
// @match       *://*/*.CSV
// @match       *://*/*.csv?*
// @match       *://*/*.CSV?*
// @icon        data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant       GM_setValue
// @grant       GM_getValue
// @grant       GM_addStyle
// @grant       GM_getResourceText
// @grant       GM_getResourceURL
// @grant       unsafeWindow
// @require     https://ajax.googleapis.com/ajax/libs/jquery/3.6.4/jquery.min.js
// ==/UserScript==

/*
  On loading the csv file directly in browser it provides a small slider button at top right corner of the page,
  which let's you convert the csv data in html table format. It let's you choose to freeze rows and columns as required.
  The option to choose is provided only once if you click on the button but if you press key 'p' it will bring the preference
  button to change the number of columns and rows to be frozen dynamically.
  You can click on first column of any row to highlight full row, press escape key to remove highlighting.
*/

/* global $, hljs */
/* eslint-disable */
window=unsafeWindow; // actual page window
if(!$) $ = unsafeWindow.$; // currently loading own jQuery, but this will set to actual window's if ever not loaded
/* es-lint-enable */

console.clear(); console.log('** cleared by PlainCSVToTable script **');

window.contentElementID = 'contentelement';
window.tableElementID = 'tableelement';
window.preferenceElementID = 'preferenceelement';

window.freezeConfigSet = false;

function addStylesheet() {
    //$("head").append('<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.6.4/jquery.min.js"></script>');
    //$("head").append('<script src="http://ajax.googleapis.com/ajax/libs/jqueryui/1.13.1/jquery-ui.min.js"></script>');
    //$("head").append('<link href="http://ajax.googleapis.com/ajax/libs/jqueryui/1.13.1/themes/cupertino/jquery-ui.css" rel="stylesheet" type="text/css">');
    // require     https://ajax.googleapis.com/ajax/libs/jquery/3.6.4/jquery.min.js
    // require     http://ajax.googleapis.com/ajax/libs/jqueryui/1.13.1/jquery-ui.min.js
    // resource    jqUI_CSS  http://ajax.googleapis.com/ajax/libs/jqueryui/1.13.1/themes/base/jquery-ui.css

    // Custom CSS for slider switch
    $('head').append(
`<style id="plain-csv-table-stylesheet">
/* ---------- Popup Style ---------------- */

.modal-header {
    background-color: #343a40 !important;
    margin: 0px;
    padding: 5px 0px 5px 0px;
    text-align: center;
    font-size: 15px;
    color: white;
    width: 100%;
    margin: auto;
}

.modal-container {
   display: flex;
   align-items: center;
   justify-content: center;
   position: absolute;
   top: 0;
   left: 0;
   width: 100%;
   height: 100%;
   background-color: rgba(235, 235, 235, 0.5);
}

.modal {
   width: 300px;
   height: 200px;
   background-color: white;
   padding: 20px;
   border: 1px solid black;
   box-shadow: 10px 10px 5px #888888;
}

/* ---------- Switch button style ---------- */
/* The switch - the box around the slider */
.switch {
  position: relative;
  display: inline-block;
  width: 60px;
  height: 34px;
}

/* Hide default HTML checkbox */
.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

/* The slider */
.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  -webkit-transition: .4s;
  transition: .4s;
  border-radius: 34px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 26px;
  width: 26px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  -webkit-transition: .4s;
  transition: .4s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #2196F3;
}

input:focus + .slider {
  box-shadow: 0 0 1px #2196F3;
}

input:checked + .slider:before {
  -webkit-transform: translateX(26px);
  -ms-transform: translateX(26px);
  transform: translateX(26px);
}

/* -------- Buttons --------- */
.button-div {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 20px;
    margin-bottom: 0px;
}
.button-div button {
    display: inline-block;
    font-weight: normal;
    color: #fff;
    background-color: #027cff;
    border-color: #027cff;;
    text-align: center;
    vertical-align: middle;
    user-select: none;
    border: 1px solid transparent;
    padding: .375rem .75rem;
    font-size: 0.75rem;
    line-height: 1;
    border-radius: .25rem;
    width: 100px;
    margin: auto
}

.button-div button:hover {
    color: #fff;
    background-color: #0069d9;
    border-color: #0062cc;;
}

/* ---------- Preferences --------- */
.preferences {
    background-color: white;
    color: black;
    position: relative;
    width: 100%;
    margin: auto;
}

.preferences input {
    width: 60px;
    line-height: 15px;
    border-radius: 5px;
    padding: 0 5px;
    text-align: center;
}

.preferences label {
    display: inline-block;
    width: 180px;
    margin-bottom: 5px;
    margin-left: 5px;
    margin-right: 5px
    font-weight: normal;
    text-align: right;
}

.pref-input-div {
    margin-bottom: 20px;
    margin-top: 20px;
}

</style>`
    );

    // Custom CSS for multi freeze table
    $('head').append(
`<style>

#csvhtmltable {
  transform: translateY(40px);
}

div.table-search {
  position: fixed;
  background-color: white;
  width: 100%;
  height: 20px;
  padding: 10px 0px 10px 5px;
  top: 0;
  left: 0;
  z-index: 9900;
}

.wrapper {
  border: 1px solid #ccc;
  background: #f0f3f9;
  width: 100%;
  height: 100%;
  overflow: auto;
  position: relative;
}

table {
  border-spacing: 0;
  white-space: nowrap;
  table-layout: fixed;
  border-collapse: collapse;
}

thead>tr>td {
  font-weight: bold;
  background: #f0f3f9;
}

thead>tr>th {
  position: sticky;
  background: #e2e8f5;
  border-left: 1px solid #ccb3ae;
}

tbody>tr>th {
  position: sticky;
  background: #f0ffff;
  border-left: 1px solid #ccb3ae;
}

thead {
  position: sticky;
  top: 0;
  z-index: 2;
}

tr>th {
  left: 0;
  z-index: 1;
}

th,
td {
  font-size: 12px;
  font-family: sans-serif;
  border-left: 1px solid #ccb3ae;
  padding: 2px;
}

th:first-child {
  border-right-width: 1px;
  border-left: 0;
}

th+td,
th:first-child+th {
  border-left: 0;
}

tbody tr:last-child>* {
  border-bottom: 0;
}

tr>*:last-child {
  border-right: 0;
}

tbody>tr:nth-child(even) {
  background-color: lightgray;
}

tr.row-selected td {
  background-color: #fffec9;
}

tr.row-selected th {
  background-color: #fffec9;
}

</style>`
    );
}

function createSectionsAndMoveContentToItsOwnElement() {
    // Create new preferences element
    window.preferenceElement = $("<div id=" + window.preferenceElementID + "></div>");

    // Create new content element and copy main content to this element
    window.contentElement = $("<pre id=" + window.contentElementID + " style='unicode-bidi: plaintext'></pre>")
    // Remove new line and spaces from start and end of content.
    window.contentElement.text(document.body.textContent.replace(/(^\s*(?!.+)\n+)|(\n+\s+(?!.+)$)/g, ""));

    // Clear main content
    document.body.textContent = '';

    // Create new table element
    window.tableElement = $("<div id=" + window.tableElementID + " class='no-wrapper'></div>");

    // Append the new elements under body
    window.body = $(document.body);
    window.body.append(window.preferenceElement);
    window.body.append(window.contentElement);
    window.body.append(window.tableElement);

    $(window.preferenceElement).hide();
    $(window.contentElement).show();
    $(window.tableElement).hide();
}

function buildToggleButton() {
    // <!-- Rounded switch button -->
    // <label class="switch">      <input type="checkbox">      <span class="slider round"></span>    </label>
    var button = document.createElement("label")
    $(button).addClass("switch");
    button.style = "top:0;right:0;position:fixed;z-index: 9990"

    var inputCheckBox = document.createElement("input");
    inputCheckBox.setAttribute("type", "checkbox");
    $(inputCheckBox).change(function() {
        buttonCheckboxToggled(this.checked);
    });
    button.appendChild(inputCheckBox);
    window.toggleButton = inputCheckBox;

    var spanCheckBox = document.createElement("span");
    $(spanCheckBox).addClass("slider");
    button.appendChild(spanCheckBox)

    document.body.appendChild(button);
}

function setToggleButton(toChecked) {
    $(window.toggleButton).prop("checked", toChecked);
}

function showCSVData() {
    $(window.preferenceElement).hide();
    $(window.contentElement).show();
    $(window.tableElement).hide();
}

function showTableData() {
    $(window.preferenceElement).hide();
    $(window.contentElement).hide();
    $(window.tableElement).show();
}

function showPreferences() {
    $(window.preferenceElement).show();
    $(window.contentElement).hide();
    $(window.tableElement).hide();

    setToggleButton(true);
    $("#input-freeze-rows").select();
    $("#input-freeze-rows").focus();
}

function buttonCheckboxToggled(isChecked) {
    if (isChecked && !window.freezeConfigSet) {
        showPreferences();
    }
    else if (isChecked) {
        showTableData();
    }
    else {
        showCSVData();
    }

}

function updateTableSection(numHeaderRows, numHeaderColumns) {
    const csv = $(window.contentElement).text();
    const firstLine = csv.split("\n", 1)[0];
    const delimiter = guessDelimiter(firstLine);

    const tbl = insertTable(parse(csv, {delimiter}), numHeaderRows, numHeaderColumns);
}

function buildPreferenceSection() {
    const propNameFreezeTableRows = "config.setFreeTableRows";
    const propNameFreezeTableColumns = "config.freezeTableColumns";

    // Fetch previous values from local storage
    window.freezeTableRows = localStorage.hasOwnProperty(propNameFreezeTableRows) ? localStorage.getItem(propNameFreezeTableRows) : "0";
    window.freezeTableColumns = localStorage.hasOwnProperty(propNameFreezeTableColumns) ? localStorage.getItem(propNameFreezeTableColumns) : "0";

    $(window.preferenceElement).append(`
        <div id="modal-preferences" class="modal-container" style="z-index: 9999">
            <div class="modal">
                <div class="modal-header">Plain CSV to Table</div>
                <div class="preferences">
                   <div class="pref-input-div">
                       <label for="input-freeze-rows">Freeze Row Count : </label>
                       <input type="text" name="input-freeze-rows" id="input-freeze-rows" value="${window.freezeTableRows}">
                   </div>

                   <div class="pref-input-div">
                       <label for="input-freeze-columns">Freeze Column Count : </label>
                       <input type="text" name="input-freeze-columns" id="input-freeze-columns" value="${window.freezeTableColumns}">
                   </div>
                </div>
                <div class="button-div">
                    <button id="modal-button-ok">Ok</button>
                    <button id="modal-button-cancel">Cancel</button>
                </div>
            </div>
        </div>
    `);

    const preferencesModal = document.querySelector("#modal-preferences");

    function goToModalCancelState() {
        window.freezeConfigSet = false;
        // reset the button in case preferences pop up was cancelled by user.
        setToggleButton(false);
        showCSVData();
    }

    function goToModalSubmitState() {
        window.freezeTableRows = $("#input-freeze-rows").val();
        window.freezeTableColumns = $("#input-freeze-columns").val();
        window.freezeConfigSet = true;

        // Store in local storage for future reference.
        localStorage.setItem(propNameFreezeTableRows, window.freezeTableRows);
        localStorage.setItem(propNameFreezeTableColumns, window.freezeTableColumns);

        // Order of these below 2 lines matter as actual width can be calculated only if element is visible.
        showTableData();
        updateTableSection(window.freezeTableRows, window.freezeTableColumns);
    }

    $("input[id='input-freeze-rows']").on('input', function(e) {
        $(this).val($(this).val().replace(/[^0-9]/g, ''));
    });

    $("input[id='input-freeze-columns']").on('input', function(e) {
        $(this).val($(this).val().replace(/[^0-9]/g, ''));
    });

    $("#modal-button-cancel").click( function() {
        goToModalCancelState();
    });

    $("#modal-button-ok").click( function() {
        goToModalSubmitState();
    });

    // If preferences pop up is visible and user presses escape button treat it as Cancel.
    window.addEventListener('keydown', function(e){
        e = e || window.event;
        if($(preferencesModal).is(":visible")) {
            // On escape key close the preferences
            if (e.key=='Escape'||e.key=='Esc'||e.keyCode==27) {
                goToModalCancelState();
            }
            // On Enter submit the preferences
            if (e.which==13||e.keyCode==13) {
                goToModalSubmitState();
            }
        }

        if(!$(preferencesModal).is(":visible")) {
            // On pressing 'p' show the preferences
            if (e.which==80) {
                  switch (e.target.tagName.toLowerCase()) {
                    case "input":
                    case "textarea":
                    case "select":
                    case "button":
                      break;
                    default:
                      e.preventDefault();
                      showPreferences();
                      break;
                }
            }

            // On escape key clear the highlighted rows
            if (e.key=='Escape'||e.key=='Esc'||e.keyCode==27) {
                // Remove highlighted rows on escape.
                var tr = $("#" + window.tableID + " tr");
                if(tr.hasClass("row-selected")) {
                    tr.removeClass("row-selected");
                }
            }
        }
     }, true);

    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function(event) {
        if (event.target == preferencesModal) {
            goToModalCancelState();
        }
    }

}

function init() {
    createSectionsAndMoveContentToItsOwnElement();
    addStylesheet();
    buildToggleButton();
    buildPreferenceSection();

    showCSVData();
}

function guessDelimiter(row) {
    const delimiters = {',': 0, ';': 0, "\t": 0};
    for (let i = 0; i < row.length; i += 1) {
        const c = row.charAt(i);
        if (c === ',' || c === ';' || c === "\t") {
            delimiters[c]++;
        }
    }

    return Object.keys(delimiters).reduce((a, b) => delimiters[a] > delimiters[b] ? a : b);
}

// Reference base script - https://github.com/sartor/csv-beautifier/blob/master/content.js
function insertTable(rows, numHeaderRows, numHeaderColumns) {
    const headerRowClassPrefix = "headerRow";
    const headerColumnClassPrefix = "headerColumn";
    const rowClassPrefix = "row";
    const columnClassPrefix = "column";

    window.tableID = "csvhtmltable";
    const tbl = document.createElement("table");
    tbl.setAttribute("id", window.tableID);

    tbl.style.fontSize = '12px';
    tbl.style.fontFamily = 'sans-serif';
    tbl.style.borderCollapse = 'collapse';
    tbl.style.borderWidth = '1px';

    // Get maximum number of columns across rows.
    var maxColumnCounts = rows.reduce((max, current, idx, arr) => Math.max(max, current.length), Number.NEGATIVE_INFINITY)

    window.headerRowCount = numHeaderRows;
    window.headerColumnCount = numHeaderColumns;
    window.rowCount = rows.length
    window.columnCount = maxColumnCounts;

    function createCellWithHeaderColumns(cellIdx, numHeaderColumns) {
        var cell = null;

        if (cellIdx < numHeaderColumns) {
            cell = document.createElement("th");
            cell.classList.add(headerColumnClassPrefix + cellIdx);
        }
        else {
            cell = document.createElement("td");
        }

        cell.classList.add(columnClassPrefix + cellIdx);
        return cell;
    }

    // Header rows
    const thead = document.createElement("thead");
    tbl.appendChild(thead);
    rows.forEach((row, rowIdx) => {
        if (rowIdx < numHeaderRows) {
            var trow = thead.insertRow(-1);
            trow.classList.add(headerRowClassPrefix + rowIdx);
            trow.classList.add(rowClassPrefix + rowIdx);
            row.forEach((cell, cellIdx) => {
                var tcell = createCellWithHeaderColumns(cellIdx, numHeaderColumns);
                trow.append(tcell);
                tcell.textContent = cell;
            })
            // Fill in remaining empty columns
            for (cellIdx = row.length; cellIdx < maxColumnCounts; cellIdx++) {
                var tcell = createCellWithHeaderColumns(cellIdx, numHeaderColumns);
                trow.append(tcell);
                tcell.textContent = "";
            }
        }
    });

    // Table body, rest of the rows
    const tbody = document.createElement("tbody");
    tbl.appendChild(tbody);
    rows.forEach((row, rowIdx) => {
        if (rowIdx >= numHeaderRows) {
            var trow = tbody.insertRow(-1);
            trow.classList.add(rowClassPrefix + rowIdx);
            row.forEach((cell, cellIdx) => {
                var tcell = createCellWithHeaderColumns(cellIdx, numHeaderColumns);
                trow.append(tcell);
                tcell.textContent = cell;
            })
            // Fill in remaining empty columns
            for (cellIdx = row.length; cellIdx < maxColumnCounts; cellIdx++) {
                var tcell = createCellWithHeaderColumns(cellIdx, numHeaderColumns);
                trow.append(tcell);
                tcell.textContent = "";
            }
        }
    });

    // Clear table element to restart fresh.
    $(window.tableElement).html("");

    // Create search field
    const tableSearchId = "myTableSearch";
    var searchDiv = document.createElement("div");
    searchDiv.classList.add("table-search");
    const fileNameFromURL = window.location.pathname.split("/").pop();
    searchDiv.innerHTML = '<input type="text" id="' + tableSearchId + '" style="width:100%;" placeholder="[file : ' + fileNameFromURL + '] Search here for row values [escape key to clear] ...">';

    // Add search field and table to dom.
    $(window.tableElement).append(searchDiv);
    $(window.tableElement).append(tbl);

    // Add hooks for table search.
    createTableSearchHooks(tableSearchId, window.tableID)

    // Update row and column attributes for freezing rows and columns.
    updateHeaderRowsAndColumnsProperties(tbl, numHeaderRows, numHeaderColumns, rows.length, maxColumnCounts);

    // Highlight row on button click.
    $("#" + window.tableID + " tr").find("th:first").on("click", function() {
        var tr = $(this).parent();
        if(tr.hasClass("row-selected")) {
            tr.removeClass("row-selected");
        } else {
            tr.addClass("row-selected");
        }
    });

    return tbl;
}

function createTableSearchHooks(tableSearchId, tableID) {
    var searchDiv = document.querySelector("#" + tableSearchId);

    searchDiv.onkeyup = function(e) {
      let prefTable = document.querySelector("#" + tableID);
      // Declare variables
      var input, filter, table, tr, td, i;
      input = document.querySelector("#" + tableSearchId);
      if (e.keyCode == 27) input.value = '';
      filter = input.value.toUpperCase();
      tr = prefTable.getElementsByTagName("tr");

      // Loop through all table rows, and hide those who don't match the search query
      // Start search after header rows (frozen)
      for (i = window.headerRowCount; i < tr.length; i++) {
        if (tr[i].innerHTML.toUpperCase().indexOf(filter) > -1) {
          tr[i].style.display = "";
        } else {
          tr[i].style.display = "none";
        }
      }
    }

}

// Update properties especially for freezing header columns at their position.
function updateHeaderRowsAndColumnsProperties(tbl, numHeaderRows, numHeaderColumns, maxRows, maxColumns) {
    if (numHeaderColumns == 0) return;

    // Add left properties for a cell based on previous column
    var offset = 0;
    for (var colIdx = 1; colIdx < numHeaderColumns; colIdx++) {
        var prevColIdx = colIdx - 1;
        // Get visible width of any of the previous columns, assuming all have same width
        var prevColWidth = document.getElementsByClassName("headerColumn" + prevColIdx)[0].offsetWidth;
        offset += prevColWidth;

        // Loop through all cells to update properties
        for (var rowIdx = 0; rowIdx < maxRows; rowIdx++) {
            // set left property, required for freeze behaviour
            document.getElementsByClassName("headerColumn" + colIdx)[rowIdx].style.left = offset + "px";
        }
    }

}

function parse (s, dialect) {
    // When line terminator is not provided then we try to guess it
    // and normalize it across the file.
    s = normalizeLineTerminator(s, dialect);

    // Get rid of any trailing \n
    const options = normalizeDialectOptions(dialect);
    s = chomp(s, options.lineterminator);

    let cur = "", // The character we are currently processing.
        inQuote = false,
        fieldQuoted = false,
        field = "", // Buffer for building up the current field
        row = [],
        out = [],
        processField;

    processField = function(field) {
        if (fieldQuoted !== true) {
            // If field is empty set to null
            if (field === "") {
                field = null;
                // If the field was not quoted and we are trimming fields, trim it
            } else if (options.skipinitialspace === true) {
                field = field.trim();
            }

            // Convert unquoted numbers to their appropriate types
            //if (/^\d+$/.test(field)) {
            //    field = parseInt(field, 10);
            //} else if (/^\d*\.\d+$|^\d+\.\d*$/.test(field)) {
            //    field = parseFloat(field);
            //}
        }
        return field;
    };

    for (let i = 0; i < s.length; i += 1) {
        cur = s.charAt(i);

        // If we are at a EOF or EOR
        if (
            inQuote === false &&
            (cur === options.delimiter || cur === options.lineterminator)
        ) {
            field = processField(field);
            // Add the current field to the current row
            row.push(field);
            // If this is EOR append row to output and flush row
            if (cur === options.lineterminator) {
                out.push(row);
                row = [];
            }
            // Flush the field buffer
            field = "";
            fieldQuoted = false;
        } else {
            // If it's not a quotechar, add it to the field buffer
            if (cur !== options.quotechar) {
                field += cur;
            } else {
                if (!inQuote) {
                    // We are not in a quote, start a quote
                    inQuote = true;
                    fieldQuoted = true;
                } else {
                    // Next char is quotechar, this is an escaped quotechar
                    if (s.charAt(i + 1) === options.quotechar) {
                        field += options.quotechar;
                        // Skip the next char
                        i += 1;
                    } else {
                        // It's not escaping, so end quote
                        inQuote = false;
                    }
                }
            }
        }
    }

    // Add the last field
    field = processField(field);
    row.push(field);
    out.push(row);

    // Expose the ability to discard initial rows
    if (options.skipinitialrows) out = out.slice(options.skipinitialrows);

    return out;
}

function normalizeLineTerminator(csvString, dialect) {
    dialect = dialect || {};

    // Try to guess line terminator if it's not provided.
    if (!dialect.lineterminator) {
        return csvString.replace(/(\r\n|\n|\r)/gm, "\n");
    }
    // if not return the string untouched.
    return csvString;
}

function normalizeDialectOptions(options) {
    // note lower case compared to CSV DDF
    let out = {
        delimiter: ",",
        doublequote: true,
        lineterminator: "\n",
        quotechar: '"',
        skipinitialspace: true,
        skipinitialrows: 0
    };

    for (let key in options) {
        if (key === "trim") {
            out["skipinitialspace"] = options.trim;
        } else if (options.hasOwnProperty(key)) {
            out[key.toLowerCase()] = options[key];
        }
    }
    return out;
}

function chomp(s, lineTerminator) {
    if (s.charAt(s.length - lineTerminator.length) !== lineTerminator) {
        // Does not end with \n, just return string
        return s;
    } else {
        // Remove the \n
        return s.substring(0, s.length - lineTerminator.length);
    }
}

(function() {
    'use strict';

    // Soem pages are matched but are not plain CSV (e.g. properties for confluence attachment)
    if (confirm("PlainCSVToTable : Process as plain CSV?") == false) {
        return;
    }

    init();
})();
