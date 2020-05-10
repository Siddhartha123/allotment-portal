$(function() {
    var d_indvs = [];
    var d_grps = [];
    var headings = ["SrNum", "Full-Name", "Unique-id", "capacity", "allocated", "choices"];
    var headings1, headings2;
    var uploaded_individuals = f;
    var uploaded_groups = f;
    var formHandlerPref, formHandlerSlot = $.noop;
    var lastItemPref, lastItemSlot;
    var t = true,
        f = false;
    var first_target_name, second_target_name;

    function findIndex(data, where, what) {
        result = -1;
        data.some(function(item, i) {
            if (item[where] === what) {
                result = i;
                return t;
            }
        });
        return result;
    }

    function add_check_box(id, for_element, checked) {
        $(id).append($("<div class=form-group>").append($('<label>', {
            for: for_element
        }).text(for_element)).append($('<input>', {
            type: 'checkbox',
            id: for_element,
            name: for_element
        }).prop("checked", checked)));
    }

    function update_count() {
        //update count of individuals and groups
        var ind_cnt_exceed = 0,
            ind_cnt_less = 0,
            ind_cnt_eq = 0;
        var grp_cnt_exceed = 0,
            grp_cnt_less = 0,
            grp_cnt_eq = 0;
        $.each(d_indvs, function(index, ind) {
            allocated = ind.allocated == null ? 0 : ind.allocated.split(";").length;
            if (allocated == ind.capacity) ind_cnt_eq++;
            else if (allocated > ind.capacity) ind_cnt_exceed++;
            else ind_cnt_less++;
        });
        $.each(d_grps, function(index, grp) {
            allocated = grp.allocated == null ? 0 : grp.allocated.split(";").length;
            if (allocated == grp.capacity) grp_cnt_eq++;
            else if (allocated > grp.capacity) grp_cnt_exceed++;
            else grp_cnt_less++;
        });
        return { "individuals": { "equal": ind_cnt_eq, "exceed": ind_cnt_exceed, "less": ind_cnt_less }, "groups": { "equal": grp_cnt_eq, "exceed": grp_cnt_exceed, "less": grp_cnt_less } };
    }

    function update_count_display() {
        count = update_count();
        $("#ind_cnt_exceed").html(count.individuals.exceed);
        $("#ind_cnt_less").html(count.individuals.less);
        $("#ind_cnt_eq").html(count.individuals.equal);
        $("#grp_cnt_exceed").html(count.groups.exceed);
        $("#grp_cnt_less").html(count.groups.less);
        $("#grp_cnt_eq").html(count.groups.equal);
    }
    document.getElementById('file-preferences').onchange = function() {
        var file = this.files[0];
        var subnames = file.name.split(".");
        first_target_name = subnames[0] + "." + (subnames.length == 2 ? "1" : (parseInt(subnames[1]) + 1).toString(10)) + ".csv";
        var reader = new FileReader();
        reader.onload = function(progressEvent) {
            var lines = this.result.split('\n');
            headings1 = (lines[0]).split(",");
            for (var line = 1; line < lines.length; line++) {
                if (lines[line] != "") {
                    var obj = CSV.csvToObject(lines[line], { columns: headings1 });
                    d_indvs.push(obj[0]);
                }
            }
            document.getElementById("individuals_file_input").style.display = "none";
            document.getElementById("groups_file_input").style.display = "block";
            document.getElementById("instructions").style.display = "none";
            uploaded_individuals = t;
            $("#jsgrid-preference").jsGrid({
                height: "100%",
                width: "100%",
                autoload: t,
                paging: f,
                sorting: t,
                filtering: t,
                controller: {
                    loadData: function(filter) {
                        return $.grep(d_indvs, function(individual) {
                            var allocated = individual["allocated"] == null ? 0 : individual["allocated"].split(";").length;
                            return (!filter["Full-Name"] || individual["Full-Name"].indexOf(filter["Full-Name"]) > -1) &&
                                (!("" + filter["Unique-id"]) || ("" + individual["Unique-id"]).indexOf("" + filter["Unique-id"]) > -1) && ((filter["allocated"] == null) || allocated == filter["allocated"]);
                        });
                    }
                },
                rowClick: function(args) {
                    lastItemPref = args;
                    var client = args.item;
                    $("#namePref").html(client["Full-Name"]);
                    $("#preference div").remove();
                    var allotted_slots = client["allocated"] == null ? [] : client["allocated"].split(";");
                    var associated_slots = client.choices == null ? [] : client.choices.split(";");
                    $.each(allotted_slots, function(index, slot) {
                        if ($.inArray(slot, associated_slots) == -1)
                            associated_slots.push(slot);
                    });
                    if (associated_slots != []) {
                        $.each(associated_slots, function(index, slot) {
                            add_check_box("#preference", slot, !($.inArray(slot, allotted_slots) == -1));
                        });
                    }
                    formHandlerPref = function() {
                        allocated = [];
                        $("#preference input").each(function(index, value) {
                            if (value.checked) {
                                allocated.push(value.id);
                                group = d_grps.find(obj => { return value.id.indexOf(obj["Unique-id"]) != -1 });
                                if (group == undefined) alert(value.id + "not found");
                                else {
                                    y = group.allocated == null ? [] : group.allocated.split(";");
                                    if ($.inArray(client["Unique-id"], y) == -1)
                                        y.push(client["Unique-id"]);
                                    group.allocated = y.join(";");
                                    var idx = findIndex(d_grps, "Unique-id", group["Unique-id"]);
                                    d_grps[idx] = group;
                                }
                            } else {
                                group = d_grps.find(obj => { return value.id.indexOf(obj["Unique-id"]) != -1 });
                                //check if group found or not
                                if (group == undefined) alert(value.id + "not found");
                                else {
                                    y = group.allocated == null ? [] : group.allocated.split(";");
                                    index = y.indexOf(client["Unique-id"]);
                                    if (index > -1) {
                                        y.splice(index, 1);
                                        group.allocated = y.length > 0 ? y.join(";") : null;
                                        var idx = findIndex(d_grps, "Unique-id", group["Unique-id"]);
                                        d_grps[idx] = group;
                                    }
                                }
                            }
                        });
                        client["allocated"] = allocated.length > 0 ? allocated.join(";") : null;
                        var idx = findIndex(d_indvs, "Unique-id", client["Unique-id"]);
                        d_indvs[idx] = client;
                        $("#jsgrid-preference").jsGrid("refresh");
                        //check if other dialog was open or not
                        if (lastItemSlot != null)
                            $("#jsgrid-slots").jsGrid("rowClick", lastItemSlot);
                        $("#jsgrid-slots").jsGrid("refresh");
                        lastItemPref = null;
                        $("#detailsDialogPref").modal("hide");
                        update_count_display();
                    };
                    $("#detailsDialogPref").modal({
                        backdrop: f,
                        show: t
                    });
                    $('#detailsDialogPref > .modal-dialog').css({
                        top: 0,
                        left: 0
                    });
                    $('.modal-dialog').draggable({
                        handle: ".modal-header"
                    });
                },
                rowRenderer: function(item) {
                    var user = item;
                    var $info = $("<div>").addClass("client-info")
                        .append($("<p>").text(user["Full-Name"]));
                    var user_allocated = user["allocated"] == null ? 0 : user["allocated"].split(";").length;
                    var p_class = user_allocated > user.capacity ? "exceed_cap" : (user_allocated == user.capacity ? "full_cap" : "within_cap");
                    var $data = $("<div>").addClass("client-info")
                        .append($("<p>").addClass(p_class).text(user_allocated + " / " + user.capacity));
                    return $("<tr>").append($("<td>").append(user["Unique-id"])).append($("<td>").append($info)).append($("<td>").append($data));
                },
                fields: [{
                    title: "ID",
                    name: "Unique-id",
                    sorter: function(id1, id2) {
                        var idx1 = findIndex(d_indvs, "Unique-id", id1);
                        var idx2 = findIndex(d_indvs, "Unique-id", id2);
                        allocated1 = d_indvs[idx1].allocated;
                        allocated2 = d_indvs[idx2].allocated;
                        capacity1 = d_indvs[idx1].capacity;
                        capacity2 = d_indvs[idx2].capacity;
                        var user1_allocated = allocated1 == null ? 0 : allocated1.split(";").length;
                        var user2_allocated = allocated2 == null ? 0 : allocated2.split(";").length;
                        if (user1_allocated != user2_allocated)
                            return user1_allocated - capacity1 > user2_allocated - capacity2;
                        else
                            return user1_allocated > user2_allocated;
                    },
                    type: "text"
                }, { title: "Candidates", name: "Full-Name", type: "text" }, { title: "slots alloted", name: "allocated", type: "number" }]
            });
        };
        reader.readAsText(file);
    };
    document.getElementById('file-slots').onchange = function() {
        var file = this.files[0];
        var subnames = file.name.split(".");
        second_target_name = subnames[0] + "." + (subnames.length == 2 ? "1" : (parseInt(subnames[1]) + 1).toString(10)) + ".csv";
        var reader = new FileReader();
        reader.onload = function(progressEvent) {
            var lines = this.result.split('\n');
            headings2 = (lines[0]).split(",");;
            for (var line = 1; line < lines.length; line++) {
                if (lines[line] != "") {
                    var obj = CSV.csvToObject(lines[line], { columns: headings2 });
                    d_grps.push(obj[0]);
                }
            }
            document.getElementById("groups_file_input").style.display = "none";
            document.getElementById("save_files").style.display = "block";
            $(".count_stats").css("display", "flex");
            update_count_display();
            uploaded_groups = t;
            $("#jsgrid-slots").jsGrid({
                height: "100%",
                width: "100%",
                autoload: t,
                paging: f,
                sorting: t,
                filtering: t,
                controller: {
                    loadData: function(filter) {
                        return $.grep(d_grps, function(group) {
                            var allocated = group["allocated"] == null ? 0 : group["allocated"].split(";").length;
                            return (!filter["Full-Name"] || group["Full-Name"].indexOf(filter["Full-Name"]) > -1) &&
                                (!("" + filter["Unique-id"]) || ("" + group["Unique-id"]).indexOf("" + filter["Unique-id"]) > -1) && (filter["allocated"] == null || filter["allocated"] == allocated);
                        });
                    }
                },
                rowClick: function(args) {
                    lastItemSlot = args;
                    var client = args.item;
                    $("#nameSlot").html(client["Full-Name"]);
                    $("#slot div").remove();
                    var allotted_slots = client["allocated"] == null ? [] : client["allocated"].split(";");
                    var associated_slots = client.choices == null ? [] : client.choices.split(";");
                    $.each(allotted_slots, function(index, slot) {
                        if ($.inArray(slot, associated_slots) == -1)
                            associated_slots.push(slot);
                    });
                    if (associated_slots != []) {
                        $.each(associated_slots, function(index, slot) {
                            add_check_box("#slot", slot, !($.inArray(slot, allotted_slots) == -1));
                        });
                    }
                    formHandlerSlot = function() {
                        allocated = [];
                        $("#slot input").each(function(index, value) {
                            if (value.checked) {
                                allocated.push(value.id);
                                individual = d_indvs.find(obj => { return obj["Unique-id"] == value.id });
                                y = individual.allocated == null ? [] : individual.allocated.split(";");
                                if ($.inArray(client["Unique-id"], y) == -1)
                                    y.push(client["Unique-id"]);
                                individual.allocated = y.join(";");
                                var idx = findIndex(d_indvs, "SrNum", individual["SrNum"]);
                                d_indvs[idx] = individual;
                            } else {
                                individual = d_indvs.find(obj => { return obj["Unique-id"] == value.id });
                                //check if individual found or not
                                y = individual.allocated == null ? [] : individual.allocated.split(";");
                                index = y.indexOf(client["Unique-id"]);
                                if (index > -1) {
                                    y.splice(index, 1);
                                    individual.allocated = y.length > 0 ? y.join(";") : null;
                                    var idx = findIndex(d_indvs, "SrNum", individual["SrNum"]);
                                    d_indvs[idx] = individual;
                                }
                            }
                        });
                        client["allocated"] = allocated.length > 0 ? allocated.join(";") : null;
                        var idx = findIndex(d_grps, "Unique-id", client["Unique-id"]);
                        d_grps[idx] = client;
                        $("#jsgrid-slots").jsGrid("refresh");
                        //check if other dialog was open or not
                        if (lastItemPref != null)
                            $("#jsgrid-preference").jsGrid("rowClick", lastItemPref);
                        $("#jsgrid-preference").jsGrid("refresh");
                        lastItemSlot = null;
                        $("#detailsDialogSlot").modal("hide");
                        update_count_display();
                    };
                    $("#detailsDialogSlot").modal({
                        backdrop: f,
                        show: t
                    });
                    $('#detailsDialogSlot > .modal-dialog').css({
                        top: 0,
                        right: 0
                    });
                    $('.modal-dialog').draggable({
                        handle: ".modal-header"
                    });
                },
                rowRenderer: function(item) {
                    var grp = item;
                    var $info = $("<div>").addClass("client-info")
                        .append($("<p>").text(grp["Full-Name"]));
                    var grp_allocated = grp.allocated == null ? 0 : (grp.allocated.split(";").length);
                    var p_class = grp_allocated > grp.capacity ? "within_cap" : (grp_allocated == grp.capacity ? "full_cap" : "exceed_cap");
                    return $("<tr>").append($("<td>").append(grp["Unique-id"])).append($("<td>").append($info)).append($("<td>").append("<p>").addClass(p_class).text(grp_allocated + " / " + grp.capacity));
                },
                fields: [{
                    title: "Course code",
                    name: "Unique-id",
                    sorter: function(id1, id2) {
                        var idx1 = findIndex(d_grps, "Unique-id", id1);
                        var idx2 = findIndex(d_grps, "Unique-id", id2);
                        allocated1 = d_grps[idx1].allocated;
                        allocated2 = d_grps[idx2].allocated;
                        capacity1 = d_grps[idx1].capacity;
                        capacity2 = d_grps[idx2].capacity;
                        var user1_allocated = allocated1 == null ? 0 : allocated1.split(";").length;
                        var user2_allocated = allocated2 == null ? 0 : allocated2.split(";").length;
                        if (user1_allocated != user2_allocated)
                            return user1_allocated - capacity1 > user2_allocated - capacity2;
                        else
                            return user1_allocated > user2_allocated;
                    },
                    type: "text"
                }, { title: "Course name", name: "Full-Name", type: "text" }, { title: "Requirement", name: "allocated", type: "number" }]
            });
        };
        reader.readAsText(file);
    };
    $("#custom_check_pref").change(function() {
        if ($(this).is(":checked") && $("#custom_input_pref").val() != "") {
            add_check_box("#preference", $("#custom_input_pref").val(), t);
            $(this).prop("checked", f);
            $("#custom_input_pref").val('');
        }
    });
    $("#custom_check_slot").change(function() {
        if ($(this).is(":checked") && $("#custom_input_slot").val() != "") {
            add_check_box("#slot", $("#custom_input_slot").val(), t);
            $(this).prop("checked", f);
            $("#custom_input_slot").val('');
        }
    });
    $("#detailsFormPref").validate({
        submitHandler: function() {
            formHandlerPref();
        }
    });
    $("#detailsFormSlot").validate({
        submitHandler: function() {
            formHandlerSlot();
        }
    });
    $("#saveFiles").click(function() {
        if (!uploaded_individuals || !uploaded_groups) alert("Load both files first !");
        else {
            var data = CSV.objectToCsv(d_indvs, { columns: headings1 });
            var blob = new Blob([data], { type: 'text/csv' });
            if (window.navigator.msSaveOrOpenBlob)
                window.navigator.msSaveBlob(blob, first_target_name);
            else {
                var elem = window.document.createElement('a');
                elem.href = window.URL.createObjectURL(blob);
                elem.download = first_target_name;
                document.body.appendChild(elem);
                elem.click();
                window.URL.revokeObjectURL(elem.href);
                document.body.removeChild(elem);
            }
            data = CSV.objectToCsv(d_grps, { columns: headings2 });
            blob = new Blob([data], { type: 'text/csv' });
            if (window.navigator.msSaveOrOpenBlob)
                window.navigator.msSaveBlob(blob, second_target_name);
            else {
                var elem = window.document.createElement('a');
                elem.href = window.URL.createObjectURL(blob);
                elem.download = second_target_name;
                document.body.appendChild(elem);
                elem.click();
                window.URL.revokeObjectURL(elem.href);
                document.body.removeChild(elem);
            }
        }
    });
});