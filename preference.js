$(function () {
    var result = [];
    var headings = [];
    var uploaded = false;
    document.getElementById('file-preferences').onchange = function () {
        var file = this.files[0];
        var reader = new FileReader();
        reader.onload = function (progressEvent) {
            var lines = this.result.split('\n');
            headings = lines[0].split(",");
            for (var line = 1; line < lines.length; line++) {
                if (lines[line] != "") {
                    var obj = CSV.csvToObject(lines[line], { columns: headings });
                    result.push(obj[0]);
                }
            }
            document.getElementById("file-preferences").style.display = "none";
            uploaded = true;
            $("#jsgrid-preference").jsGrid({
                height: "100%",
                width: "100%",
                autoload: true,
                paging: false,
                controller: {
                    loadData: function () {
                        return result;
                    }
                },
                rowClick: function (args) {
                    showDetailsDialog("Edit", args.item);
                },
                rowRenderer: function (item) {
                    var user = item;
                    var $info = $("<div>").addClass("client-info")
                        .append($("<p>").append($("<strong>").text(user["Full-Name"])));
                    var $data = $("<div>").addClass("client-info")
                        .append($("<p>").append($("<strong>").text((user["allocated-semi-colon-separated"] == null ? 0 : user["allocated-semi-colon-separated"].split(";").length) + " / " + user.capacity)));
                    return $("<tr>").append($("<td>").append($info)).append($("<td>").append($data));
                },
                fields: [
                    { title: "Candidates" }, { title: "slots alloted" }]
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
    var showDetailsDialog = function (dialogType, client) {
        $("#namePref").html(client["Full-Name"]);
        $("#preference div").remove();

        // $("#preference").append($('<option>',{
        //     value : "",
        //     text : 'Select slot'
        // }));

        var allotted_slots = client["allocated-semi-colon-separated"] == null ? undefined : client["allocated-semi-colon-separated"].split(";");
        if (allotted_slots != undefined) {
            $.each(allotted_slots, function (index, slot) {
                $("#preference").append($("<div class=form-group>").append($('<label>', {
                    for: slot
                }).text(slot)).append($('<input>', {
                    type: 'checkbox',
                    id: slot,
                    name: slot
                }).prop("checked", true)));
            });
        }
        $("#preference").append($("<div class=form-group>").append($('<label>', {
            for: client.choice1
        }).text(client.choice1)).append($('<input>', {
            type: 'checkbox',
            id: client.choice1,
            name: client.choice1
        })));

        formSubmitHandler = function () {
            saveClient(client);
        };

        $("#detailsDialogPref").dialog("option", "title", dialogType + " Client")
            .dialog("open");
    };

    $("#detailsFormPref").validate({
        submitHandler: function () {
            formSubmitHandler();
        }
    });

    var formSubmitHandler = $.noop;

    var saveClient = function (client) {
        var allocated = [];
        $("#preference input").each(function (index, value) {
            if (value.checked) allocated.push(value.id);
        });
        client["allocated-semi-colon-separated"] = allocated.join(";");
        result[client.SrNum - 1] = client;
        $("#jsgrid-preference").jsGrid("refresh");
        $("#detailsDialogPref").dialog("close");
    };

    $("#savePref").click(function () {
        if(!uploaded)  alert("Load the preference file first !");
        else {
            var data = CSV.objectToCsv(result, { columns: headings });
            var blob = new Blob([data], { type: 'text/csv' });
            if (window.navigator.msSaveOrOpenBlob) {
                window.navigator.msSaveBlob(blob, 'test.csv');
            }
            else {
                var elem = window.document.createElement('a');
                elem.href = window.URL.createObjectURL(blob);
                elem.download = 'test.csv';
                document.body.appendChild(elem);
                elem.click();
                window.URL.revokeObjectURL(elem.href);
                document.body.removeChild(elem);
                
            }
        }
    });
});
