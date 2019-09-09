$(function () {
    var data_individuals = [];
    var data_groups = [];
    var headings = [];
    var uploaded_individuals = false;
    var uploaded_groups = false;
    var associated_individuals_groups = [];
    document.getElementById('file-preferences').onchange = function () {
        var file = this.files[0];
        var reader = new FileReader();
        reader.onload = function (progressEvent) {
            var lines = this.result.split('\n');
            headings = lines[0].split(",");
            for (var line = 1; line < lines.length; line++) {
                if (lines[line] != "") {
                    var obj = CSV.csvToObject(lines[line], { columns: headings });
                    data_individuals.push(obj[0]);
                }
            }
            document.getElementById("file-preferences").style.display = "none";
            document.getElementById("file-slots").style.display = "block";
            uploaded_individuals = true;
            $("#jsgrid-preference").jsGrid({
                height: "100%",
                width: "100%",
                autoload: true,
                paging: false,
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
                        .append($("<p>").append($("<strong>").text(user["Full-Name"])));
                    var $data = $("<div>").addClass("client-info")
                        .append($("<p>").append($("<strong>").text((user["allocated"] == null ? 0 : user["allocated"].split(";").length) + " / " + user.capacity)));
                    return $("<tr>").append($("<td>").append($info)).append($("<td>").append($data));
                },
                fields: [
                    { title: "Candidates" }, { title: "slots alloted" }]
            });
        };
        reader.readAsText(file);
    };

    document.getElementById('file-slots').onchange = function () {
        var file = this.files[0];
        var reader = new FileReader();
        reader.onload = function (progressEvent) {
            var lines = this.result.split('\n');
            var headings = lines[0].split(",");
            for (var line = 1; line < lines.length; line++) {
                if (lines[line] != "") {
                    var obj = CSV.csvToObject(lines[line], { columns: headings });
                    data_groups.push(obj[0]);
                }
            }
            document.getElementById("file-slots").style.display = "none";
            uploaded_groups = true;

            $.each(data_groups, function (index, group) {
                associated_individuals = [];
                $.each(data_individuals, function (index, individual) {
                    pos = $.inArray(group["Unique-id"], individual.choices.split(";"));
                    if (pos != -1) {
                        x = new Object();
                        x.pos = pos + 1;
                        x.id = individual["Unique-id"];
                        x.name = individual["Full-Name"];
                        associated_individuals.push(x);
                    }
                });
                associated_individuals.sort(function (a, b) {
                    return a.pos - b.pos;
                });
                individuals = associated_individuals.map(a => a.id);
                (data_groups[group["SrNum"] - 1]).choices = individuals.join(";");
                associated_individuals_groups[group["Unique-id"]] = associated_individuals;
            });
            $("#jsgrid-slots").jsGrid({
                height: "100%",
                width: "100%",
                autoload: true,
                paging: false,
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
                        .append($("<p>").append($("<strong>").text(grp["Full-Name"])));

                    return $("<tr>").append($("<td>").append(grp["Unique-id"])).append($("<td>").append($info)).append($("<td>").append((grp.allocated == null ? 0 : (grp.allocated.split(";").length)) + " / " + grp.capacity));
                },
                fields: [
                    { title: "Course code" }, { title: "Course name" }, { title: "Requirement" }]
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

        formSubmitHandlerPref = function () {
            var allocated = [];
            $("#preference input").each(function (index, value) {
                if (value.checked) {
                    allocated.push(value.id);
                    group = data_groups.find(obj => { return obj["Unique-id"] == value.id });
                    y = group.allocated == null ? [] : group.allocated.split(";");
                    y.push(client["Unique-id"]);
                    group.allocated = y.join(";");
                    data_groups[group["SrNum"] - 1] = group;
                }
                else {
                    group = data_groups.find(obj => { return obj["Unique-id"] == value.id });
                    y = group.allocated == null ? [] : group.allocated.split(";");
                    index = y.indexOf(client["Unique-id"]);
                    if (index > -1) {
                        y.splice(index, 1);
                        group.allocated = y.length > 0 ? y.join(";") : null;
                        data_groups[group["SrNum"] - 1] = group;
                    }
                }
            });
            client["allocated"] = allocated.length > 0 ? allocated.join(";") : null;
            data_individuals[client.SrNum - 1] = client;
            $("#jsgrid-preference").jsGrid("refresh");
            $("#jsgrid-slots").jsGrid("refresh");

            $("#detailsDialogPref").dialog("close");
        };

        $("#detailsDialogPref").dialog("option", "title", dialogType + " Client")
            .dialog("open");
    };

    var showGroup = function (dialogType, client) {
        $("#nameSlot").html(client["Full-Name"]);
        $("#slot div").remove();


        if (associated_individuals_groups[client["Unique-id"]] != []) {
            $.each(associated_individuals_groups[client["Unique-id"]], function (index, individual) {
                $("#slot").append($("<div class=form-group>").append($('<label>', {
                    for: individual.id
                }).text(individual.name)).append($('<input>', {
                    type: 'checkbox',
                    id: individual.id,
                    name: individual.id
                }).prop("checked", false)));
            });
        }

        formSubmitHandlerSlot = function () {
            /* Update data_individuals also */

        };

        $("#detailsDialogSlot").dialog("option", "title", dialogType + " Client")
            .dialog("open");
    };

    $("#detailsFormPref").validate({
        submitHandler: function () {
            formSubmitHandlerPref();
        }
    });

    $("#detailsFormSlot").validate({
        submitHandler: function () {
            formSubmitHandlerSlot();
        }
    });
    var formSubmitHandlerPref = $.noop;
    var formSubmitHandlerSlot = $.noop;

    $("#saveFiles").click(function () {
        if (!uploaded_individuals) alert("Load both files first !");
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
