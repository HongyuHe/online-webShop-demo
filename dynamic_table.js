document.addEventListener('DOMContentLoaded', () => {
    var updated = false;

    $(".TopSellTable").css("display", "none");
    $("#latestData").on('click', () => {
        if (!updated) {

            UpdateTable();
            updated = true;
        }
    });

    $("#reset").on('click', () => {

        ResetDatabase();
        UpdateTable();
    });

});

function UpdateTable() {
    $.ajax({
        type: 'GET',
        url: 'https://wt.ops.labs.vu.nl/api19/6bb9b56b',
        success: function(products) {

            InitTable(products);
            InitSort();
        },
    });
}

function ResetDatabase() {
    $.ajax({
        type: 'GET',
        url: 'https://wt.ops.labs.vu.nl/api19/6bb9b56b/reset',
        success: function(products) {

            $(".TopSellTable").fadeOut("slow");
            alert(`${products.Success}`);
        },
    });
}

/* Initial table */
function InitTable(products) {
    $(".TopSellTable").empty();

    var $topsell_table = $(".TopSellTable").first();
    let row_num = ++(products.length);
    const col_num = 6;
    let new_title = "<tr>";
    let new_row = "<tr>";
    const table_titles = [
        "Image", "Product", "Amount", "Origin", "Best Before Date", "Operstion"
    ];
    const title_id = [
        "top_img", "top_pro", "top_amo", "top_ori", "top_dat", "top_opr"
    ];
    const input_row =
        "</tr><tr id='inputRow'><td><input id='image' name='image' type='url' placeholder='Image URL'></td><th><input id='products' name='product' type='text' placeholder='Product's Name' required></th><td><input id='amount' name='amount' type='number' placeholder='Amount(kg)'></td><td><input id='origin' name='origin' type='text' placeholder='Origin'></td><td><input id='bestBeforeDate' name='best_before_date' type='text' placeholder='Best Before Date'></td><td class='Button'><button id='Submit'>Submit</button></td></tr>";

    // Genrate template:
    for (let i = 0; i < col_num; i++) {
        new_title += "<th></th>";
    }
    new_title += "</tr>";
    for (let i = 0; i < col_num; i++) {
        if (i == 1)
            new_row += "<th></th>";
        else
            new_row += "<td></td>";
    }
    new_row += "</tr>";

    // Create table:
    for (let i = 0; i < row_num; i++) {
        if (!i) $topsell_table.append(new_title);
        else
            $topsell_table.append(new_row);
    }
    $topsell_table.children().first().attr("class", "TableHead");

    $.each($(".TopSellTable").children().first().children(),
        function(_index, _th) {
            _th.innerHTML = `${table_titles[_index]}`;
            _th.id = `${title_id[_index]}`;
        });

    // Set falgs:
    $(".TopSellTable tr:gt(0) td:nth-child(1)").each(function() {
        $(this).append("<image class=image></image>")
    });
    $(".TopSellTable tr:gt(0) th").each(function() {
        $(this).attr("class", "product");
    });
    $(".TopSellTable tr:gt(0) td:nth-child(3)").each(function() {
        $(this).attr("class", "amount");
    });
    $(".TopSellTable tr:gt(0) td:nth-child(4)").each(function() {
        $(this).attr("class", "origin");
    });
    $(".TopSellTable tr:gt(0) td:nth-child(5)").each(function() {
        $(this).attr("class", "best_before_date");
    });
    $(".TopSellTable tr:gt(0) td:nth-child(6)").each(function() {
        $(this).html("<button class='Button'>Delete</button>");
    });
    $topsell_table.append(input_row);

    // Fill in data:
    $.each(products, (_index, _product) => {
        $.each(_product, (key, value) => {
            if (key == "image")
                $(".image").eq(_index).attr("src", `${_product.image}`);
            else
                $(`.${key}`).eq(_index).text(`${value}`);
        });
    });
    $(".TopSellTable").fadeIn(3000);
}

function InitSort() {
    $("#top_img").on("click", () => { sortTable(0, "TopSell", "string"); });
    $("#top_pro").on("click", () => { sortTable(0, "TopSell", "string"); });
    $("#top_amo").on("click", () => { sortTable(1, "TopSell", "string"); });
    $("#top_ori").on("click", () => { sortTable(2, "TopSell", "string"); });
    $("#top_dat").on("click", () => { sortTable(3, "TopSell", "string"); });
}