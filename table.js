document.addEventListener('DOMContentLoaded', () => {
    var updated = false;

    $("#latestData").on('click', () => {
        if (!updated) {
            $.ajax({
                type: 'GET',
                url: 'https://wt.ops.labs.vu.nl/api19/6bb9b56b',
                success: function(products) {
                    // $.each(products[0], function(key, value) {
                    //     console.log(key, value);
                    // });
                    $(".TopSellTable").css("display", "none");
                    InitTable(products);
                    $(".TopSellTable").fadeIn(3000);
                },
            });
            updated = true;
        }
    })
});

/* Initial table */
function InitTable(products) {
    var $topsell_table = $(".TopSellTable").first();
    let row_num = ++(products.length);
    const col_num = 6;
    let new_title = "<tr>";
    let new_row = "<tr>";
    const table_titles = [
        "Image", "Product", "Amount", "Origin", "Best Before Date", "Operstion"
    ];

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

    // Create table:
    for (let i = 0; i < row_num; i++) {
        if (!i) $topsell_table.append(new_title);
        else $topsell_table.append(new_row);
    }
    $topsell_table.children().first().attr("class", "TableHead");

    $.each($(".TopSellTable").children().first().children(),
        (_index, _th) => {
            _th.innerHTML = table_titles[_index];
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
        $(this).html("<button>Delete</button>");
    });

    // Fill in data:
    $.each(products, (_index, _product) => {
        $.each(_product, (key, value) => {
            if (key == "image")
                $(".image").eq(_index).attr("src", `${_product.image}`);
            else
                $(`.${key}`).eq(_index).text(`${value}`);
        });
    });
}