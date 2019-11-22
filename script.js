$(function () {
    var data_individuals = [];
    var data_groups = [];
    var headings = ["SrNum", "Full-Name", "Unique-id", "capacity", "allocated", "choices"];
    var uploaded_individuals = false;
    var uploaded_groups = false;
    var formSubmitHandler = $.noop;

    function findIndex(data, where, what) {
        var options = {
            data: data,
            where: where,
            what: what
        },
            result = -1;
        data.some(function (item, i) {
            if (item[options.where] === options.what) {
                result = i;
                return true;
            }
        });
        return result;
    }

    function update_count() {
        //update count of individuals and groups
        var ind_cnt_exceed = 0, ind_cnt_less = 0, ind_cnt_eq = 0;
        var grp_cnt_exceed = 0, grp_cnt_less = 0, grp_cnt_eq = 0;

        $.each(data_individuals, function (index, ind) {
            allocated = ind.allocated == null ? 0 : ind.allocated.split(";").length;
            if (allocated == ind.capacity) ind_cnt_eq++;
            else if (allocated > ind.capacity) ind_cnt_exceed++;
            else ind_cnt_less++;
        });

        $.each(data_groups, function (index, grp) {
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
    document.getElementById('file-preferences').onchange = function () {
        var file = this.files[0];
        var reader = new FileReader();
        reader.onload = function (progressEvent) {
            var lines = this.result.split('\n');
            //headings = lines[0].split(",");
            for (var line = 1; line < lines.length; line++) {
                if (lines[line] != "") {
                    var obj = CSV.csvToObject(lines[line], { columns: headings });
                    data_individuals.push(obj[0]);
                }
            }
            document.getElementById("individuals_file_input").style.display = "none";
            document.getElementById("groups_file_input").style.display = "block";
            uploaded_individuals = true;
            $("#jsgrid-preference").jsGrid({
                height: "100%",
                width: "100%",
                autoload: true,
                paging: false,
                sorting: true,
                controller: {
                    loadData: function () {
                        return data_individuals;
                    }
                },
                rowClick: function (args) {
                    showIndividual("Edit", args.item);
                },
                rowRenderer: function (item) {
                    var user = item;
                    var $info = $("<div>").addClass("client-info")
                        .append($("<p>").text(user["Full-Name"]));
                    var user_allocated = user["allocated"] == null ? 0 : user["allocated"].split(";").length;
                    var p_class = user_allocated > user.capacity ? "exceed_cap" : (user_allocated == user.capacity ? "full_cap" : "within_cap");
                    var $data = $("<div>").addClass("client-info")
                        .append($("<p>").addClass(p_class).text(user_allocated + " / " + user.capacity));
                    return $("<tr>").append($("<td>").append(user["Unique-id"])).append($("<td>").append($info)).append($("<td>").append($data));
                },
                fields: [
                    {
                        title: "ID", name: "Unique-id",
                        sorter: function (id1, id2) {
                            var idx1 = findIndex(data_individuals, "Unique-id", id1);
                            var idx2 = findIndex(data_individuals, "Unique-id", id2);
                            allocated1 = data_individuals[idx1].allocated;
                            allocated2 = data_individuals[idx2].allocated;
                            capacity1 = data_individuals[idx1].capacity;
                            capacity2 = data_individuals[idx2].capacity;

                            var user1_allocated = allocated1 == null ? 0 : allocated1.split(";").length;
                            var user2_allocated = allocated2 == null ? 0 : allocated2.split(";").length;
                            return user1_allocated - capacity1 > user2_allocated - capacity2;
                        }
                    }, { title: "Candidates", name: "Full-Name" }, { title: "slots alloted" }]
            });
        };
        reader.readAsText(file);
    };

    document.getElementById('file-slots').onchange = function () {
        var file = this.files[0];
        var reader = new FileReader();
        reader.onload = function (progressEvent) {
            var lines = this.result.split('\n');
            //var headings = lines[0].split(",");
            for (var line = 1; line < lines.length; line++) {
                if (lines[line] != "") {
                    var obj = CSV.csvToObject(lines[line], { columns: headings });
                    data_groups.push(obj[0]);
                }
            }
            document.getElementById("groups_file_input").style.display = "none";
            document.getElementById("count_stats").style.display = "flex";
            update_count_display();
            uploaded_groups = true;
            $("#jsgrid-slots").jsGrid({
                height: "100%",
                width: "100%",
                autoload: true,
                paging: false,
                sorting: true,
                controller: {
                    loadData: function () {
                        return data_groups;
                    }
                },
                rowClick: function (args) {
                    showGroup("Edit", args.item);
                },
                rowRenderer: function (item) {
                    var grp = item;
                    var $info = $("<div>").addClass("client-info")
                        .append($("<p>").text(grp["Full-Name"]));
                    var grp_allocated = grp.allocated == null ? 0 : (grp.allocated.split(";").length);
                    var p_class = grp_allocated > grp.capacity ? "within_cap" : (grp_allocated == grp.capacity ? "full_cap" : "exceed_cap");
                    return $("<tr>").append($("<td>").append(grp["Unique-id"])).append($("<td>").append($info)).append($("<td>").append("<p>").addClass(p_class).text(grp_allocated + " / " + grp.capacity));
                },
                fields: [
                    {
                        title: "Course code", name: "Unique-id",
                        sorter: function (id1, id2) {
                            var idx1 = findIndex(data_groups, "Unique-id", id1);
                            var idx2 = findIndex(data_groups, "Unique-id", id2);
                            allocated1 = data_groups[idx1].allocated;
                            allocated2 = data_groups[idx2].allocated;
                            capacity1 = data_groups[idx1].capacity;
                            capacity2 = data_groups[idx2].capacity;

                            var user1_allocated = allocated1 == null ? 0 : allocated1.split(";").length;
                            var user2_allocated = allocated2 == null ? 0 : allocated2.split(";").length;
                            return user1_allocated - capacity1 > user2_allocated - capacity2;
                        }
                    }, { title: "Course name", name: "Full-Name" }, { title: "Requirement" }]
            });
        };
        reader.readAsText(file);
    };

    $("#detailsDialogPref").dialog({
        autoOpen: false,
        width: 400,
        close: function () {
            $("#detailsFormPref").validate().resetForm();
            $("#detailsFormPref").find(".error").removeClass("error");
        }
    });

    $("#detailsDialogSlot").dialog({
        autoOpen: false,
        width: 400,
        close: function () {
            $("#detailsFormSlot").validate().resetForm();
            $("#detailsFormSlot").find(".error").removeClass("error");
        }
    });

    var showIndividual = function (dialogType, client) {
        $("#namePref").html(client["Full-Name"]);
        $("#preference div").remove();

        var allotted_slots = client["allocated"] == null ? [] : client["allocated"].split(";");
        var associated_slots = client.choices == null ? [] : client.choices.split(";");
        $.each(allotted_slots, function (index, slot) {
            if ($.inArray(slot, associated_slots) == -1)
                associated_slots.push(slot);
        });
        if (associated_slots != []) {
            $.each(associated_slots, function (index, slot) {
                $("#preference").append($("<div class=form-group>").append($('<label>', {
                    for: slot
                }).text(slot)).append($('<input>', {
                    type: 'checkbox',
                    id: slot,
                    name: slot
                }).prop("checked", !($.inArray(slot, allotted_slots) == -1))));
            });
        }

        formSubmitHandler = function () {
            allocated = [];
            $("#preference input").each(function (index, value) {
                if (value.checked) {
                    allocated.push(value.id);
                    group = data_groups.find(obj => { return obj["Unique-id"] == value.id });
                    y = group.allocated == null ? [] : group.allocated.split(";");
                    if ($.inArray(client["Unique-id"], y) == -1)
                        y.push(client["Unique-id"]);
                    group.allocated = y.join(";");
                    var idx = findIndex(data_groups, "Unique-id", group["Unique-id"]);
                    data_groups[idx] = group;
                }
                else {
                    group = data_groups.find(obj => { return obj["Unique-id"] == value.id });
                    //check if group found or not
                    y = group.allocated == null ? [] : group.allocated.split(";");
                    index = y.indexOf(client["Unique-id"]);
                    if (index > -1) {
                        y.splice(index, 1);
                        group.allocated = y.length > 0 ? y.join(";") : null;
                        var idx = findIndex(data_groups, "Unique-id", group["Unique-id"]);
                        data_groups[idx] = group;
                    }
                }
            });
            client["allocated"] = allocated.length > 0 ? allocated.join(";") : null;
            var idx = findIndex(data_individuals, "Unique-id", client["Unique-id"]);
            data_individuals[idx] = client;
            $("#jsgrid-preference").jsGrid("refresh");
            $("#jsgrid-slots").jsGrid("refresh");
            $("#detailsDialogPref").dialog("close");
            update_count_display();
        };

        $("#detailsDialogPref").dialog("option", "title", dialogType + " Client")
            .dialog("open");
    };

    var showGroup = function (dialogType, client) {
        $("#nameSlot").html(client["Full-Name"]);
        $("#slot div").remove();

        var allotted_slots = client["allocated"] == null ? [] : client["allocated"].split(";");
        var associated_slots = client.choices == null ? [] : client.choices.split(";");
        $.each(allotted_slots, function (index, slot) {
            if ($.inArray(slot, associated_slots) == -1)
                associated_slots.push(slot);
        });
        if (associated_slots != []) {
            $.each(associated_slots, function (index, slot) {
                $("#slot").append($("<div class=form-group>").append($('<label>', {
                    for: slot
                }).text(slot)).append($('<input>', {
                    type: 'checkbox',
                    id: slot,
                    name: slot
                }).prop("checked", !($.inArray(slot, allotted_slots) == -1))));
            });
        }

        formSubmitHandler = function () {
            allocated = [];
            $("#slot input").each(function (index, value) {
                if (value.checked) {
                    allocated.push(value.id);
                    individual = data_individuals.find(obj => { return obj["Unique-id"] == value.id });
                    y = individual.allocated == null ? [] : individual.allocated.split(";");
                    if ($.inArray(client["Unique-id"], y) == -1)
                        y.push(client["Unique-id"]);
                    individual.allocated = y.join(";");
                    var idx = findIndex(data_individuals, "SrNum", individual["SrNum"]);
                    data_individuals[idx] = individual;
                }
                else {
                    individual = data_individuals.find(obj => { return obj["Unique-id"] == value.id });
                    //check if individual found or not
                    y = individual.allocated == null ? [] : individual.allocated.split(";");
                    index = y.indexOf(client["Unique-id"]);
                    if (index > -1) {
                        y.splice(index, 1);
                        individual.allocated = y.length > 0 ? y.join(";") : null;
                        var idx = findIndex(data_individuals, "SrNum", individual["SrNum"]);
                        data_individuals[idx] = individual;
                    }
                }
            });
            client["allocated"] = allocated.length > 0 ? allocated.join(";") : null;
            var idx = findIndex(data_groups, "Unique-id", client["Unique-id"]);
            data_groups[idx] = client;
            $("#jsgrid-preference").jsGrid("refresh");
            $("#jsgrid-slots").jsGrid("refresh");
            $("#detailsDialogSlot").dialog("close");
            update_count_display();
        };

        $("#detailsDialogSlot").dialog("option", "title", dialogType + " Client")
            .dialog("open");
    };

    $("#detailsFormPref").validate({
        submitHandler: function () {
            formSubmitHandler();
        }
    });

    $("#detailsFormSlot").validate({
        submitHandler: function () {
            formSubmitHandler();
        }
    });

    $("#saveFiles").click(function () {
        if (!uploaded_individuals || !uploaded_groups) alert("Load both files first !");
        else {
            var data = CSV.objectToCsv(data_individuals, { columns: headings });
            var blob = new Blob([data], { type: 'text/csv' });
            if (window.navigator.msSaveOrOpenBlob)
                window.navigator.msSaveBlob(blob, 'individuals.csv');
            else {
                var elem = window.document.createElement('a');
                elem.href = window.URL.createObjectURL(blob);
                elem.download = 'individuals.csv';
                document.body.appendChild(elem);
                elem.click();
                window.URL.revokeObjectURL(elem.href);
                document.body.removeChild(elem);
            }

            data = CSV.objectToCsv(data_groups, { columns: headings });
            blob = new Blob([data], { type: 'text/csv' });
            if (window.navigator.msSaveOrOpenBlob)
                window.navigator.msSaveBlob(blob, 'groups.csv');
            else {
                var elem = window.document.createElement('a');
                elem.href = window.URL.createObjectURL(blob);
                elem.download = 'groups.csv';
                document.body.appendChild(elem);
                elem.click();
                window.URL.revokeObjectURL(elem.href);
                document.body.removeChild(elem);
            }
        }
    });
});
