define('newspaper_viz', ['d3'], function (d3) {

    function draw(container) {

        var margin = {
                top: 20,
                right: 20,
                bottom: 30,
                left: 150
            },
            width = 1200 - margin.left - margin.right,
            gap_between_lines = 40,
            height,
            earliest_date,
            earliest_date_padding,
            latest_date,
            latest_date_padding;


        Promise.all([
        d3.json("datasets/dynamic_io/titles.json"),
        d3.json("datasets/dynamic_io/timeseries_items_hc.json"),
        d3.json("datasets/dynamic_io/timeseries_items_mf.json"),
    ]).then(function (files) {
            // files[0] = titles
            // files[1] = hc timeseries
            // files[2] = mf timeseries
            
            // check first object of timeseries_items_hc.json. Filter to only number keys and get their extent        
       [earliest_date, latest_date] = d3.extent(Object.keys(files[1][Object.keys(files[1])[0]])
                .filter(d => !isNaN(d))
                .map(d => Number(d)));

            earliest_date_padding = earliest_date;
            latest_date_padding = latest_date;

            // combine 3 datasets into 1
            var newspaper_titles_data = files[0].map(function (el) {
                var o = Object.assign({}, el);
                if (typeof files[1][el['Title.ID']] !== "undefined") {
                    o.timeseries_hc = files[1][el['Title.ID']];
                } else {
                    o.timeseries_hc = null;
                };

                if (typeof files[2][el['Title.ID']] !== "undefined") {
                    o.timeseries_mf = files[2][el['Title.ID']];
                } else {
                    o.timeseries_mf = null;
                };

                return o;
            })

            // filter out with no hc or mf timeseries data
            newspaper_titles_data = newspaper_titles_data.filter(function (d) {
                return (d.timeseries_hc != null) || (d.timeseries_mf != null);
            });

            var years_list = [];
            for (var i = earliest_date_padding; i <= latest_date_padding; i++) {
                years_list.push(i);
            };

            function sum(obj) {
                var sum = 0;
                for (var el in obj) {
                    if (obj.hasOwnProperty(el)) {
                        sum += parseFloat(obj[el]);
                    }
                }
                return sum;
            }

            height = gap_between_lines * (newspaper_titles_data.length + 2);

            newspaper_titles_data.forEach(function (d, i) {
                if (d.timeseries_mf != null) {
                    d.mf_canNo_count_below4000 = d.timeseries_mf.Total_canNos_below_4000;
                    delete d.timeseries_mf.Total_canNos_below_4000;
                };
                d.hc_sum = Math.round(sum(d.timeseries_hc));
                d.mf_sum = Math.round(sum(d.timeseries_mf));
                d.mf_hc_ratio = d.mf_sum / (d.hc_sum + d.mf_sum);
                if (d.connectivity) {
                    d.connectivity = d.connectivity.split(",");
                };
                d.timeseries_mf_restructured = [];
                d.timeseries_hc_restructured = [];

                years_list.forEach(function (year) {
                    var count_for_year_mf,
                        count_for_year_hc;
                    if (d.timeseries_mf != null) {
                        if (d.timeseries_mf[year] != 0) {
                            count_for_year_mf = d.timeseries_mf[year];
                            d.timeseries_mf_restructured.push({
                                "date": year,
                                "count": count_for_year_mf
                            });
                        };
                    };
                    if (d.timeseries_hc != null) {
                        if (d.timeseries_hc[year] != 0) {
                            count_for_year_hc = d.timeseries_hc[year];
                            d.timeseries_hc_restructured.push({
                                "date": year,
                                "count": count_for_year_hc
                            });
                        }

                    };
                });

                if (d.timeseries_mf_restructured[0] != null) {
                    var zero_date_earliest = d.timeseries_mf_restructured[0].date - 1;
                    if (zero_date_earliest !== earliest_date - 1) {
                        d.timeseries_mf_restructured.unshift({
                            "date": zero_date_earliest,
                            "count": 0
                        });
                    };
                    var zero_date_latest = d.timeseries_mf_restructured[d.timeseries_mf_restructured.length - 1].date + 1;
                    if (zero_date_latest !== latest_date + 1) {
                        d.timeseries_mf_restructured.push({
                            "date": zero_date_latest,
                            "count": 0
                        });
                    };


                    for (i = (zero_date_earliest + 1); i < zero_date_latest; i++) {
                        if ((d.timeseries_mf[i] == 0) & ((d.timeseries_mf[i - 1] != 0) | (d.timeseries_mf[i + 1] != 0))) {
                            d.timeseries_mf_restructured.push({
                                "date": i,
                                "count": 0
                            });
                        } else if (d.timeseries_mf[i] == 0) {
                            d.timeseries_mf_restructured.push({
                                "date": i,
                                "count": null
                            });
                        };
                    };
                    // order d.timeseries_mf_restructured
                    d.timeseries_mf_restructured.sort((a, b) => (a.date > b.date) ? 1 : ((b.date > a.date) ? -1 : 0));
                };

                if (d.timeseries_hc_restructured[0] != null) {
                    var zero_date_earliest = d.timeseries_hc_restructured[0].date - 1;
                    if (zero_date_earliest !== earliest_date - 1) {
                        d.timeseries_hc_restructured.unshift({
                            "date": zero_date_earliest,
                            "count": 0
                        });
                    };
                    var zero_date_latest = d.timeseries_hc_restructured[d.timeseries_hc_restructured.length - 1].date + 1;
                    if (zero_date_latest !== latest_date + 1) {
                        d.timeseries_hc_restructured.push({
                            "date": zero_date_latest,
                            "count": 0
                        });
                    };

                    for (i = (zero_date_earliest + 1); i < zero_date_latest; i++) {
                        if ((d.timeseries_hc[i] == 0) & ((d.timeseries_hc[i - 1] != 0) | (d.timeseries_hc[i + 1] != 0))) {
                            d.timeseries_hc_restructured.push({
                                "date": i,
                                "count": 0
                            });
                        } else if (d.timeseries_hc[i] == 0) {
                            d.timeseries_hc_restructured.push({
                                "date": i,
                                "count": null
                            });
                        };
                    };
                    // order d.timeseries_hc_restructured
                    d.timeseries_hc_restructured.sort((a, b) => (a.date > b.date) ? 1 : ((b.date > a.date) ? -1 : 0));
                };

            });

            // *************************
            // NEST DATA BY CONNECTIVITY 
            // *************************
            // First order records, those with connectivity first
            newspaper_titles_data.sort(function (a, b) {
                // a is false
                if (typeof a.connectivity == "boolean") {
                    if (typeof b.connectivity == "boolean") {
                        // a is false and b is false
                        return 0;
                    } else {
                        // a is false and b is array
                        return 1;
                    };
                } else {
                    if (typeof b.connectivity == "boolean") {
                        // a is array and b is false
                        return -1;
                    } else {
                        // a is array and b is array
                        return 0;
                    };
                }
            });

            // create new data array for newspaper titles organised into nested groups of connected titles
            // and list of ids already added to new array
            var newspaper_titles_data_nestedConnectivity = [];
            var newspaper_titles_data_nestedConnectivity_title_ids = [];

            newspaper_titles_data.forEach(function (d) {
                // check if d['Title.ID'] already in newspaper_titles_data_nestedConnectivity_title_ids
                var already_in_newspaper_titles_data_nestedConnectivity = newspaper_titles_data_nestedConnectivity_title_ids.includes(d['Title.ID']);
                if (!already_in_newspaper_titles_data_nestedConnectivity) {
                    if (d.connectivity) {
                        // place all connectivity ids in connected_newspaper_titles
                        var connected_newspaper_titles = [];
                        connected_newspaper_titles.push(d['Title.ID']);
                        connected_newspaper_titles = connected_newspaper_titles.concat(d['connectivity']);

                        // check the records in the array of connected to IDs for any additional IDs in connectivity
                        // return new array of (original connected IDs + additional IDs in records' connectivity)
                        function create_new_array_of_connected_ids(old_Array) {
                            var connectivity_new_array = old_Array;
                            old_Array.forEach(function (element) {
                                // for each id in connected_newspaper_titles, find the corresponding record in newspaper_titles_data
                                // if does not exist in connected_newspaper_titles, skip step
                                var newspaper_record = newspaper_titles_data.find(o => o['Title.ID'] === element);
                                // if there is a matching record (some are out of date range) in newspaper_titles_data, concatenate the connectivity array
                                if (newspaper_record) {
                                    if (newspaper_record.connectivity) {
                                        connectivity_new_array = connectivity_new_array.concat(newspaper_record.connectivity);
                                    };
                                };
                            });
                            // ALSO check against other records in newspaper_titles_data, if any others connected to connectivity_new_array (sometimes crawling network will miss records with an assymetric connection)
                            newspaper_titles_data.forEach(function (newspaper_title) {
                                if (newspaper_title['connectivity']) {
                                    const found = newspaper_title['connectivity'].some(r => connectivity_new_array.indexOf(r) >= 0)
                                    if (found) {
                                        connectivity_new_array.push(newspaper_title['Title.ID']);
                                    };
                                };
                            });
                            // filter out duplicates
                            let set = new Set(connectivity_new_array);
                            connectivity_new_array = Array.from(set);
                            return connectivity_new_array;
                        }

                        function all_connected_ids_in_Array(Array) {
                            var connectivity_ids_array = create_new_array_of_connected_ids(Array);
                            if (connectivity_ids_array.length > Array.length) {
                                return false;
                            } else {
                                return true;
                            };
                        }

                        function add_ids_to_Array(Array) {
                            connected_newspaper_titles = create_new_array_of_connected_ids(connected_newspaper_titles);
                        }

                        // check all connectivity data in connected_newspaper_titles
                        // if not, add to connected_newspaper_titles.
                        // Repeat until all connectivity data in connected_newspaper_titles
                        do {
                            add_ids_to_Array(connected_newspaper_titles);
                        }
                        while (!all_connected_ids_in_Array(connected_newspaper_titles));

                        // add nested data to newspaper_titles_data_nestedConnectivity    
                        var new_nested_newspaper_titles = newspaper_titles_data.filter(function (d) {
                            return connected_newspaper_titles.includes(d['Title.ID']);
                        });
                        var new_nested_newspaper_titles_mf_sum = new_nested_newspaper_titles.reduce((total, obj) => obj.mf_sum + total, 0);

                        // check length nested data > 1
                        if (new_nested_newspaper_titles.length > 1) {
                            // order new_nested_newspaper_titles by earliest held date
                            new_nested_newspaper_titles = new_nested_newspaper_titles.sort(function (a, b) {
                                let earliest_a, earliest_b;
                                if (
                                    (a['timeseries_mf_restructured'].length > 0) &&
                                    (a['timeseries_hc_restructured'].length > 0)
                                ) {
                                    earliest_a = Math.min(
                                        a['timeseries_mf_restructured'][1].date,
                                        a['timeseries_hc_restructured'][1].date
                                    );
                                } else if (a['timeseries_mf_restructured'].length > 0) {
                                    earliest_a = a['timeseries_mf_restructured'][1].date;
                                } else if (a['timeseries_hc_restructured'].length > 0) {
                                    earliest_a = a['timeseries_hc_restructured'][1].date;
                                };

                                if (
                                    (b['timeseries_mf_restructured'].length > 0) &&
                                    (b['timeseries_hc_restructured'].length > 0)
                                ) {
                                    earliest_b = Math.min(
                                        b['timeseries_mf_restructured'][1].date,
                                        b['timeseries_hc_restructured'][1].date
                                    );
                                } else if (b['timeseries_mf_restructured'].length > 0) {
                                    earliest_b = b['timeseries_mf_restructured'][1].date;
                                } else if (b['timeseries_hc_restructured'].length > 0) {
                                    earliest_b = b['timeseries_hc_restructured'][1].date;
                                };

                                return earliest_a - earliest_b;
                            });
                            newspaper_titles_data_nestedConnectivity.push({
                                "connected_titles": new_nested_newspaper_titles,
                                "mf_sum": new_nested_newspaper_titles_mf_sum
                            });
                            newspaper_titles_data_nestedConnectivity_title_ids = newspaper_titles_data_nestedConnectivity_title_ids.concat(connected_newspaper_titles);
                        } else {
                            newspaper_titles_data_nestedConnectivity_title_ids.push(d['Title.ID']);
                            newspaper_titles_data_nestedConnectivity.push(d);
                        };
                    } else {
                        newspaper_titles_data_nestedConnectivity_title_ids.push(d['Title.ID']);
                        newspaper_titles_data_nestedConnectivity.push(d);
                    };
                };
            });

            // sort by mf count, then hc count
            newspaper_titles_data.sort(function (a, b) {
                return b.hc_sum - a.hc_sum
            });
            newspaper_titles_data_nestedConnectivity.sort(function (a, b) {
                return b.mf_sum - a.mf_sum
            });

            // check all records still in data
            var data_count = 0;
            newspaper_titles_data_nestedConnectivity.forEach(function (d) {
                if ('connected_titles' in d) {
                    data_count = data_count + d['connected_titles'].length;
                } else {
                    data_count = data_count + 1;
                };
            });
            visualise(newspaper_titles_data_nestedConnectivity);
        });

        function visualise(data) {

            // set the ranges
            var x = d3.scaleLinear().domain([earliest_date_padding, latest_date_padding]).range([0, width]);
            var y = d3.scaleLinear().domain([0, 200]).range([height, 0]);
            var little_y = d3.scaleLinear().domain([0, 5]).range([40, 0]);

            // separate div for fixed xaxis
            var x_axis = d3.select(container).append("div").attr('class', 'x_axis_wrapper').append('svg').attr("width", width + margin.left + margin.right).attr('height', 20).append("g")
                .attr("transform",
                    "translate(" + margin.left + "," + margin.top + ")");

            var svg = d3.select(container).append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform",
                    "translate(" + margin.left + "," + margin.top + ")");

            // Create the svg:defs element and the main gradient definition.
            var svgDefs = svg.append('defs');
            var mainGradient = svgDefs.append('linearGradient')
                .attr('id', 'mainGradient');
            var reverseGradient = svgDefs.append('linearGradient')
                .attr('id', 'reverseGradient');

            // Create the stops of the main gradient. Each stop will be assigned
            // a class to style the stop using CSS.
            mainGradient.append('stop')
                .attr('class', 'stop-left')
                .attr('offset', '0');

            mainGradient.append('stop')
                .attr('class', 'stop-middle')
                .attr('offset', '0.7');

            mainGradient.append('stop')
                .attr('class', 'stop-right')
                .attr('offset', '1');

            reverseGradient.append('stop')
                .attr('class', 'stop-left_reverse')
                .attr('offset', '0');

            reverseGradient.append('stop')
                .attr('class', 'stop-middle_reverse')
                .attr('offset', '0.25');

            reverseGradient.append('stop')
                .attr('class', 'stop-right_reverse')
                .attr('offset', '1');

            // Add the X Axis
            x_axis.append("g")
                .call(d3.axisTop(x).tickFormat(d3.format("d")));

            // gridlines in x axis function
            function make_x_gridlines() {
                return d3.axisBottom(x)
                    .ticks(15)
            }

            // add the X gridlines
            svg.append("g")
                .attr("class", "grid")
                .attr("transform", "translate(0," + height + ")")
                .call(make_x_gridlines()
                    .tickSize(-height)
                    .tickFormat("")
                )

            // Define the div for the tooltip
            var div = d3.select(container).append("div")
                .attr("class", "tooltip")
                .style("opacity", 0);

            var line = d3.line().defined(d => d.count !== null)
                .x(function (d) {
                    return x(d.date);
                }).y(function (d) {
                    return little_y(d.count);
                }).curve(d3.curveBasis);

            var gap_between_lines = 40,
                nested_offset = 15,
                shunt_to_right = 40;

            var nested_count = 0;
            data.forEach(function (d, i) {
                if ('connected_titles' in d) {
                    nested_count = nested_count + d['connected_titles'].length - 1;

                    d['connected_titles'].forEach(function (nested_d, nested_i) {
                        var horizontal_offset = shunt_to_right + nested_i * nested_offset;
                        var vertical_offset = (i + nested_i + nested_count - d['connected_titles'].length + 1) * gap_between_lines;

                        var title_wrapper = svg.append('g').attr('class', 'title_wrapper').attr('transform', 'translate(0,' + vertical_offset + ')');
                        title_wrapper.append("path").attr('class', 'mf_line').attr('d', line(nested_d.timeseries_mf_restructured));
                        title_wrapper.append("path").attr('class', 'hc_line').attr('d', line(nested_d.timeseries_hc_restructured));

                        if (nested_i != 0) {
                            var x1 = shunt_to_right + nested_offset * (nested_i - 1),
                                x2 = shunt_to_right + nested_offset * nested_i;

                            title_wrapper.append('line').attr('class', 'connected_line').attr('x1', x1).attr('x2', x2).attr('y1', 0).attr('y2', gap_between_lines);
                        };

                        var title_nested_offset_wrapper = title_wrapper.append('g').attr('class', 'title_nested_offset_wrapper').attr('transform', 'translate(' + horizontal_offset + ',0)');

                        // additional horizontal offset to titles so doesn't overlap with branching
                        var title_text = title_nested_offset_wrapper.append('text').attr('class', 'title_name_wrapper').attr('transform', 'translate(8,53)');;
                        title_text.append('tspan').attr('class', 'title_geographic_coverage').text(nested_d["General area of coverage"] + ":");
                        title_text.append('tspan').attr('class', 'title_name').text(" " + nested_d["Publication title"]);

                        title_wrapper.append('a').attr('xlink:href', nested_d["Explore link"]).attr('target', '_blank').append('text').attr('class', 'title_id').text(nested_d["Title.ID"]).attr('transform', 'translate(-75,45)');

                        // Create background box for icons, and line
                        if (nested_i != 0) {
                            title_nested_offset_wrapper.append('polygon').attr('class', 'icon_rect').attr('points', '0,0 -5,-15 100,-15 105,0').style('fill', 'rgba(217, 190, 190, 0.35)').attr('transform', 'translate(0,40)');
                            title_nested_offset_wrapper.append('line').attr('class', 'connected_line').attr('x1', 0).attr('x2', width - horizontal_offset).attr('y1', 0).attr('y2', 0).attr('transform', 'translate(0,40)');
                        } else {
                            title_nested_offset_wrapper.append('polygon').attr('class', 'icon_rect').attr('points', -shunt_to_right + ',0 ' + -shunt_to_right + ',-15 100,-15 105,0').classed('filled_reverse', true).attr('transform', 'translate(0,40)');

                            title_nested_offset_wrapper.append('polygon').attr('class', 'icon_rect').attr('points', -shunt_to_right + ',0 ' + -shunt_to_right + ',-15 ' + 0 + ',-15 ' + 5 + ',0').classed('filled', true).attr('transform', 'translate(0,55)');

                            title_nested_offset_wrapper.append('line').attr('class', 'connected_line').attr('x1', -shunt_to_right).attr('x2', width - horizontal_offset).attr('y1', 0).attr('y2', 0).attr('transform', 'translate(0,40)');

                        };

                        title_nested_offset_wrapper.append('text').attr('class', 'mf_sum').text(nested_d["mf_sum"]).attr('transform', 'translate(5,37)');
                        title_nested_offset_wrapper.append('text').attr('class', 'hc_sum').text(nested_d["hc_sum"]).attr('transform', 'translate(42,37)');

                        // append arrows for preceeding, succeeding titles 
                        if (nested_d['Succeeding titles'] != null) {
                            title_nested_offset_wrapper.append('polygon').attr('class', 'arrow').attr('points', "0,0 10,4 0,8").attr('transform', 'translate(84,28)')
                                .on("mouseover", function () {
                                    div.transition()
                                        .duration(200)
                                        .style("opacity", .98);
                                    div.html(nested_d['Succeeding titles']).style('background', 'rgb(219, 232, 237)')
                                        .style("left", (d3.event.pageX + 10) + "px")
                                        .style("top", (d3.event.pageY - 28) + "px");
                                })
                                .on("mouseout", function () {
                                    div.transition()
                                        .duration(500)
                                        .style("opacity", 0);
                                });
                        };
                        if (nested_d['Preceding titles'] != null) {
                            title_nested_offset_wrapper.append('polygon').attr('class', 'arrow').attr('points', "0,0 -10,4 0,8").attr('transform', 'translate(78,28)').on("mouseover", function () {
                                    div.transition()
                                        .duration(200)
                                        .style("opacity", .98);
                                    div.html(nested_d['Preceding titles']).style('background', 'rgb(219, 232, 237)')
                                        .style("left", (d3.event.pageX + 10) + "px")
                                        .style("top", (d3.event.pageY - 28) + "px");
                                })
                                .on("mouseout", function () {
                                    div.transition()
                                        .duration(500)
                                        .style("opacity", 0);
                                });
                        };

                        // add Acetate warning if has canNos < 4000
                        if (nested_d['timeseries_mf'] != null) {
                            if (nested_d.mf_canNo_count_below4000 > 1) {
                                title_nested_offset_wrapper.append('svg:image').attr("xlink:href", "images/warning-16.png").attr('width', 11).attr('transform', function () {
                                        var offset = 15 + (nested_d['mf_sum'].toString().length - 1) * 8;
                                        return 'translate(' + offset + ',26.5)'
                                    })
                                    .on("mouseover", function () {
                                        div.transition()
                                            .duration(200)
                                            .style("opacity", .95);
                                        div.html(Math.trunc(nested_d['mf_canNo_count_below4000']) + " records likely acetate")
                                            .style('background', '#ffb8b8')
                                            .style("left", (d3.event.pageX + 10) + "px")
                                            .style("top", (d3.event.pageY - 28) + "px");
                                    })
                                    .on("mouseout", function () {
                                        div.transition()
                                            .duration(500)
                                            .style("opacity", 0);
                                    });
                            }
                        };

                        // add checkboxes for IDs
                        title_wrapper.append("foreignObject")
                            .attr('transform', 'translate(-95,31)')
                            .attr('width', 30)
                            .attr('height', 20)
                            .append("xhtml:tree")
                            .html("<label class='inline'><input class='title_checkBox' type='checkbox' value='" + nested_d['Title.ID'] + "'><span class='lbl'> </span>");
                    });

                    // connected group of titles
                    var connected_vertical_offset = (i + nested_count - d['connected_titles'].length + 1) * gap_between_lines;
                    var connected_titles_wrapper = svg.append('g').attr('class', 'connected_titles_wrapper').attr('transform', 'translate(0,' + connected_vertical_offset + ')');
                    connected_titles_wrapper.append('text').text(d['mf_sum']).attr('fill', 'red').attr('transform', 'translate(2,53)');

                } else {
                    // single title
                    var title_wrapper = svg.append('g').attr('class', 'title_wrapper').attr('transform', 'translate(0,' + (i + nested_count) * gap_between_lines + ')');
                    title_wrapper.append("path").attr('class', 'mf_line').attr('d', line(d.timeseries_mf_restructured));
                    title_wrapper.append("path").attr('class', 'hc_line').attr('d', line(d.timeseries_hc_restructured));

                    // additional horizontal offset to titles so doesn't overlap with branching
                    var title_text = title_wrapper.append('text').attr('class', 'title_name_wrapper').attr('transform', 'translate(0,53)');;
                    title_text.append('tspan').attr('class', 'title_geographic_coverage').text(d["General area of coverage"] + ":");
                    title_text.append('tspan').attr('class', 'title_name').text(" " + d["Publication title"]);

                    title_wrapper.append('a').attr('xlink:href', d["Explore link"]).attr('target', '_blank').append('text').attr('class', 'title_id').text(d["Title.ID"]).attr('transform', 'translate(-75,45)');

                    // Create background box to icons
                    title_wrapper.append('polygon').attr('class', 'icon_rect').attr('points', '0,0 0,-15 100,-15 105,0').style('fill', 'rgba(217, 190, 190, 0.35)').attr('transform', 'translate(0,40)');
                    // append line
                    title_wrapper.append('line').attr('class', 'connected_line').attr('x1', 0).attr('x2', width).attr('y1', 0).attr('y2', 0).attr('transform', 'translate(0,40)');

                    title_wrapper.append('text').attr('class', 'mf_sum').text(d["mf_sum"]).attr('transform', 'translate(2,38)');
                    title_wrapper.append('text').attr('class', 'hc_sum').text(d["hc_sum"]).attr('transform', 'translate(42,38)');

                    // append arrows for preceeding, succeeding titles
                    if (d['Succeeding titles'] != null) {
                        title_wrapper.append('polygon').attr('class', 'arrow').attr('points', "0,0 10,4 0,8").attr('transform', 'translate(84,28)')
                            .on("mouseover", function () {
                                div.transition()
                                    .duration(200)
                                    .style("opacity", .98);
                                div.html(d['Succeeding titles']).style('background', 'rgb(219, 232, 237)')
                                    .style("left", (d3.event.pageX + 10) + "px")
                                    .style("top", (d3.event.pageY - 28) + "px");
                            })
                            .on("mouseout", function () {
                                div.transition()
                                    .duration(500)
                                    .style("opacity", 0);
                            });
                    };
                    if (d['Preceding titles'] != null) {
                        title_wrapper.append('polygon').attr('class', 'arrow').attr('points', "0,0 -10,4 0,8").attr('transform', 'translate(78,28)').on("mouseover", function () {
                                div.transition()
                                    .duration(200)
                                    .style("opacity", .98);
                                div.html(d['Preceding titles']).style('background', 'rgb(219, 232, 237)')
                                    .style("left", (d3.event.pageX + 10) + "px")
                                    .style("top", (d3.event.pageY - 28) + "px");
                            })
                            .on("mouseout", function () {
                                div.transition()
                                    .duration(500)
                                    .style("opacity", 0);
                            });
                    };

                    // add Acetate warning if has canNos < 4000
                    if (d['timeseries_mf'] != null) {
                        if (d.mf_canNo_count_below4000 > 1) {
                            title_wrapper.append('svg:image').attr("xlink:href", "images/warning-16.png").attr('width', 11).attr('transform', function () {
                                    var offset = 12 + (d['mf_sum'].toString().length - 1) * 8;
                                    return 'translate(' + offset + ',27)'
                                })
                                .on("mouseover", function () {
                                    div.transition()
                                        .duration(200)
                                        .style("opacity", .95);
                                    div.html(Math.trunc(d['mf_canNo_count_below4000']) + " records likely acetate")
                                        .style('background', '#ffb8b8')
                                        .style("left", (d3.event.pageX + 10) + "px")
                                        .style("top", (d3.event.pageY - 28) + "px");
                                })
                                .on("mouseout", function () {
                                    div.transition()
                                        .duration(500)
                                        .style("opacity", 0);
                                });
                        }
                    };

                    // add checkboxes for IDs
                    title_wrapper.append("foreignObject")
                        .attr('transform', 'translate(-95,31)')
                        .attr('width', 30)
                        .attr('height', 20)
                        .append("xhtml:tree")
                        .html("<label class='inline'><input type='checkbox' class='title_checkBox' value='" + d['Title.ID'] + "'><span class='lbl'> </span>");

                    // on change, 
                    d3.selectAll('input[type="checkbox"]').on("change", function () {
                        var selected_IDs_list = [];
                        d3.selectAll("input[type='checkbox']:checked").each(function () {
                            selected_IDs_list.push(this.value);
                        });
                        selected_IDs_list = selected_IDs_list.join(',');
                        var command = "selected_IDs_list='" + selected_IDs_list + "'";
                        IPython.notebook.kernel.execute(command);
                    });
                }

            });
        }
    }
    return draw;
});

element.append('<small>&#x25C9; &#x25CB; &#x25EF; Loaded &#x25CC; &#x25CE; &#x25CF;</small>');