/*
   Licensed to the Apache Software Foundation (ASF) under one or more
   contributor license agreements.  See the NOTICE file distributed with
   this work for additional information regarding copyright ownership.
   The ASF licenses this file to You under the Apache License, Version 2.0
   (the "License"); you may not use this file except in compliance with
   the License.  You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
var showControllersOnly = false;
var seriesFilter = "";
var filtersOnlySampleSeries = true;

/*
 * Add header in statistics table to group metrics by category
 * format
 *
 */
function summaryTableHeader(header) {
    var newRow = header.insertRow(-1);
    newRow.className = "tablesorter-no-sort";
    var cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Requests";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 3;
    cell.innerHTML = "Executions";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 7;
    cell.innerHTML = "Response Times (ms)";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Throughput";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 2;
    cell.innerHTML = "Network (KB/sec)";
    newRow.appendChild(cell);
}

/*
 * Populates the table identified by id parameter with the specified data and
 * format
 *
 */
function createTable(table, info, formatter, defaultSorts, seriesIndex, headerCreator) {
    var tableRef = table[0];

    // Create header and populate it with data.titles array
    var header = tableRef.createTHead();

    // Call callback is available
    if(headerCreator) {
        headerCreator(header);
    }

    var newRow = header.insertRow(-1);
    for (var index = 0; index < info.titles.length; index++) {
        var cell = document.createElement('th');
        cell.innerHTML = info.titles[index];
        newRow.appendChild(cell);
    }

    var tBody;

    // Create overall body if defined
    if(info.overall){
        tBody = document.createElement('tbody');
        tBody.className = "tablesorter-no-sort";
        tableRef.appendChild(tBody);
        var newRow = tBody.insertRow(-1);
        var data = info.overall.data;
        for(var index=0;index < data.length; index++){
            var cell = newRow.insertCell(-1);
            cell.innerHTML = formatter ? formatter(index, data[index]): data[index];
        }
    }

    // Create regular body
    tBody = document.createElement('tbody');
    tableRef.appendChild(tBody);

    var regexp;
    if(seriesFilter) {
        regexp = new RegExp(seriesFilter, 'i');
    }
    // Populate body with data.items array
    for(var index=0; index < info.items.length; index++){
        var item = info.items[index];
        if((!regexp || filtersOnlySampleSeries && !info.supportsControllersDiscrimination || regexp.test(item.data[seriesIndex]))
                &&
                (!showControllersOnly || !info.supportsControllersDiscrimination || item.isController)){
            if(item.data.length > 0) {
                var newRow = tBody.insertRow(-1);
                for(var col=0; col < item.data.length; col++){
                    var cell = newRow.insertCell(-1);
                    cell.innerHTML = formatter ? formatter(col, item.data[col]) : item.data[col];
                }
            }
        }
    }

    // Add support of columns sort
    table.tablesorter({sortList : defaultSorts});
}

$(document).ready(function() {

    // Customize table sorter default options
    $.extend( $.tablesorter.defaults, {
        theme: 'blue',
        cssInfoBlock: "tablesorter-no-sort",
        widthFixed: true,
        widgets: ['zebra']
    });

    var data = {"OkPercent": 66.66666666666667, "KoPercent": 33.333333333333336};
    var dataset = [
        {
            "label" : "FAIL",
            "data" : data.KoPercent,
            "color" : "#FF6347"
        },
        {
            "label" : "PASS",
            "data" : data.OkPercent,
            "color" : "#9ACD32"
        }];
    $.plot($("#flot-requests-summary"), dataset, {
        series : {
            pie : {
                show : true,
                radius : 1,
                label : {
                    show : true,
                    radius : 3 / 4,
                    formatter : function(label, series) {
                        return '<div style="font-size:8pt;text-align:center;padding:2px;color:white;">'
                            + label
                            + '<br/>'
                            + Math.round10(series.percent, -2)
                            + '%</div>';
                    },
                    background : {
                        opacity : 0.5,
                        color : '#000'
                    }
                }
            }
        },
        legend : {
            show : true
        }
    });

    // Creates APDEX table
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.5644444444444444, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [1.0, 500, 1500, "HTTP Request of Login Page-0"], "isController": false}, {"data": [0.6933333333333334, 500, 1500, "HTTP Request of Login Page-1"], "isController": false}, {"data": [0.0, 500, 1500, "HTTP Request of Login Page"], "isController": false}]}, function(index, item){
        switch(index){
            case 0:
                item = item.toFixed(3);
                break;
            case 1:
            case 2:
                item = formatDuration(item);
                break;
        }
        return item;
    }, [[0, 0]], 3);

    // Create statistics table
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 900, 300, 33.333333333333336, 461.27888888888833, 113, 1259, 514.0, 759.0, 835.7999999999997, 1109.9, 8.930875027288785, 204.88161861566476, 2.7560122154523983], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["HTTP Request of Login Page-0", 300, 0, 0.0, 136.70333333333335, 113, 425, 129.0, 150.0, 160.0, 400.4300000000005, 2.9887027037797127, 0.8493286003905238, 0.6917212312458906], "isController": false}, {"data": ["HTTP Request of Login Page-1", 300, 0, 0.0, 554.96, 350, 1044, 532.0, 706.0, 765.75, 994.8500000000001, 2.987184976451025, 101.94382310824065, 0.6913699603700126], "isController": false}, {"data": ["HTTP Request of Login Page", 300, 300, 100.0, 692.1733333333334, 478, 1259, 662.0, 845.9000000000001, 918.9, 1202.7000000000003, 2.976958342429595, 102.44080930783238, 1.3780061077261991], "isController": false}]}, function(index, item){
        switch(index){
            // Errors pct
            case 3:
                item = item.toFixed(2) + '%';
                break;
            // Mean
            case 4:
            // Mean
            case 7:
            // Median
            case 8:
            // Percentile 1
            case 9:
            // Percentile 2
            case 10:
            // Percentile 3
            case 11:
            // Throughput
            case 12:
            // Kbytes/s
            case 13:
            // Sent Kbytes/s
                item = item.toFixed(2);
                break;
        }
        return item;
    }, [[0, 0]], 0, summaryTableHeader);

    // Create error table
    createTable($("#errorsTable"), {"supportsControllersDiscrimination": false, "titles": ["Type of error", "Number of errors", "% in errors", "% in all samples"], "items": [{"data": ["Tidy Parser errors: 13 (allowed 0) Tidy Parser warnings: 131 (allowed 1)", 289, 96.33333333333333, 32.111111111111114], "isController": false}, {"data": ["The operation lasted too long: It took 1,173 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, 0.3333333333333333, 0.1111111111111111], "isController": false}, {"data": ["The operation lasted too long: It took 1,123 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, 0.3333333333333333, 0.1111111111111111], "isController": false}, {"data": ["The operation lasted too long: It took 1,156 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, 0.3333333333333333, 0.1111111111111111], "isController": false}, {"data": ["The operation lasted too long: It took 1,203 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, 0.3333333333333333, 0.1111111111111111], "isController": false}, {"data": ["The operation lasted too long: It took 1,075 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, 0.3333333333333333, 0.1111111111111111], "isController": false}, {"data": ["The operation lasted too long: It took 1,110 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 2, 0.6666666666666666, 0.2222222222222222], "isController": false}, {"data": ["The operation lasted too long: It took 1,118 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, 0.3333333333333333, 0.1111111111111111], "isController": false}, {"data": ["The operation lasted too long: It took 1,259 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, 0.3333333333333333, 0.1111111111111111], "isController": false}, {"data": ["The operation lasted too long: It took 1,100 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, 0.3333333333333333, 0.1111111111111111], "isController": false}, {"data": ["The operation lasted too long: It took 1,255 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, 0.3333333333333333, 0.1111111111111111], "isController": false}]}, function(index, item){
        switch(index){
            case 2:
            case 3:
                item = item.toFixed(2) + '%';
                break;
        }
        return item;
    }, [[1, 1]]);

        // Create top5 errors by sampler
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 900, 300, "Tidy Parser errors: 13 (allowed 0) Tidy Parser warnings: 131 (allowed 1)", 289, "The operation lasted too long: It took 1,110 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 2, "The operation lasted too long: It took 1,173 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, "The operation lasted too long: It took 1,123 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, "The operation lasted too long: It took 1,156 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": [], "isController": false}, {"data": [], "isController": false}, {"data": ["HTTP Request of Login Page", 300, 300, "Tidy Parser errors: 13 (allowed 0) Tidy Parser warnings: 131 (allowed 1)", 289, "The operation lasted too long: It took 1,110 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 2, "The operation lasted too long: It took 1,173 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, "The operation lasted too long: It took 1,123 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1, "The operation lasted too long: It took 1,156 milliseconds, but should not have lasted longer than 1,000 milliseconds.", 1], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
