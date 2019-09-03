$(function () {
    document.getElementById('file-slots').onchange = function () {
        var file = this.files[0];
        console.log(this.files);
        var reader = new FileReader();
        var result = [];
        reader.onload = function (progressEvent) {
            var lines = this.result.split('\n');
            var headings = lines[0].split(",");
            for (var line = 1; line < lines.length; line++) {
                var obj = CSV.csvToObject(lines[line], { columns: headings });
                result.push(obj[0]);
            }
            document.getElementById("file-slots").style.display = "none";

            $("#jsgrid-slots").jsGrid({
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

                    return $("<tr>").append($("<td>").append($info));
                },
                fields: [
                    { title: "Candidates" } ]
            });
        };
        reader.readAsText(file);
    };
    $("#detailsDialogSlot").dialog({
        autoOpen: false,
        width: 400,
        close: function () {
            $("#detailsFormSlot").validate().resetForm();
            $("#detailsFormSlot").find(".error").removeClass("error");
        }
    });
    var showDetailsDialog = function (dialogType, client) {
        $("#nameSlot").val(client["Full-Name"]);
        formSubmitHandler = function () {
            saveClient(client, dialogType === "Add");
        };
        $("#detailsDialogSlot").dialog("option", "title", dialogType + " Client")
            .dialog("open");
    };
});