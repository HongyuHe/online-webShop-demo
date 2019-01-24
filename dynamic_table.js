document.addEventListener('DOMContentLoaded', () => {
    var updated = false; // Dirty flag;

    $("#TopSell").css("display", "none");
    if (!updated) {

        UpdateData();
        $(".TopSellTable").fadeIn(1500);
        updated = true;
    }

    // Reset table:
    $("#reset").on('click', () => {

        ResetData();
        $(".TopSellTable").fadeOut(1500);
        UpdateData();
        $(".TopSellTable").fadeIn(1500);
        updated = true;
    });

    // Submit new item:
    $("#TopSell").delegate("#submit", "click", () => {

        SubmitData();
        update = false;

        // Do not reload the entire page:
        return false;
    });

    // Delete data allows a user to delete a product from database
    $("#TopSell").delegate(".Delete", "click", function() {

        // let id = Number($(this).closest('.id').text());
        let ancestor = $(this).closest("tr");
        let id = Number(ancestor.children().eq(5).text());

        DeleteData(id);
        ancestor.fadeOut(500, () => {
            ancestor.remove();
        });
        updated = false;
    });

    // Delete data (fake) allows a user to hide a product
    $("#TopSell").delegate(".Edit", "click", function() {

        let ancestor = $(this).closest("tr");
        let id = Number(ancestor.children().eq(5).text());
        const im_src = ancestor.children().eq(0).children()[0].src;
        const edit_row =
            "<tr id='editRow'><form>" +
            `<td><input id='e_image' name='image' type='url' placeholder=${im_src}></td>` +
            `<th><input id='e_product' value=${ancestor.children().eq(1).text()} name='product' type='text' required></th>` +
            `<td><input id='e_amount' value=${parseInt(ancestor.children().eq(2).text())} name='amount' type='number' ></td>` +
            `<td><input id='e_origin'value=${ancestor.children().eq(3).text()} name='origin' type='text' ></td>` +
            `<td><input id='e_best_before_date'value=${ancestor.children().eq(4).text()} name='best_before_date' type='text' ></td>` +
            `<td class='Button'><button id='save'>Save</button>` +
            "</td></form></tr>";

        ancestor.empty();
        ancestor.after(edit_row);
        $("#editRow").css('display', 'none');
        $("#editRow").fadeIn(1000);

        $('#save').on('click', () => {
            EditData(id, im_src);
            // UpdateData();
        });

        updated = false;
    });
});

/**
 * AJAX functions
 */
function UpdateData() {
    /* AJAX request for the data stored in the database */
    $.ajax({
        type: 'GET',
        url: 'http://localhost:8874/products',
        success: function(products) {

            InitTable(products); //Initialize table with received variables
            InitSort(); //Initialise new sort
            InitButton(); //Initialise submit button
        },
    });
}

function ResetData() {
    /* Send reset command to server, resets to banana and apple */
    $.ajax({
        type: 'DELETE',
        url: 'http://localhost:8874/products/reset'
    });
}

function SubmitData() {
    var new_data = {
        "image": `${$("#image").val()}`,
        "product": `${$("#product").val()}`,
        "amount": `${$("#amount").val()}`,
        "origin": `${$("#origin").val()}`,
        "best_before_date": `${$("#best_before_date").val()}`
    };
    /* AJAX post request to server with input data */
    $.ajax({
        type: 'POST',
        url: 'http://localhost:8874/products/create',
        data: JSON.stringify(new_data),
        success: function(sourse) {
            AddNewData(sourse);
        },
    });
}

function DeleteData(id) {

    let id_msg = { 'id': id };
    $.ajax({
        type: 'DELETE',
        url: 'http://localhost:8874/products/delete',
        data: JSON.stringify(id_msg)
    });
}

function EditData(id, im_src) {

    var edit_data = {
        "image": `${im_src}`,
        "product": `${$("#e_product").val()}`,
        "amount": `${$("#e_amount").val()}`,
        "origin": `${$("#e_origin").val()}`,
        "best_before_date": `${$("#e_best_before_date").val()}`,
        "id": id
    };
    $.ajax({
        type: 'PUT',
        url: 'http://localhost:8874/products/edit',
        data: JSON.stringify(edit_data),
        success: function(data) {
            UpdateData();
        }
    });
}

/**
 * Helper functions
 */

/* Initial table using DOM */
function InitTable(products) {
    $(".TopSellTable").empty();

    var $topsell_table = $(".TopSellTable").first();
    let row_num = ++(products.length);
    const col_num = 7;
    let new_title = "<tr>";
    let new_row = "<tr>";
    const table_titles = [
        "Image", "Product", "Amount", "Origin", "Best Before Date", "Operation"
    ];
    const title_id = [ //Top row ids
        "top_img", "top_pro", "top_amo", "top_ori", "top_dat", "top_opr"
    ];
    const input_row = // Final input row HTML code
        "<tr id='inputRow'><form><td><input id='image' name='image' type='url' placeholder='Image URL'></td><th><input id='product' name='product' type='text' placeholder='Product's Name' required></th><td><input id='amount' name='amount' type='number' placeholder='Amount(kg)' ></td><td><input id='origin' name='origin' type='text' placeholder='Origin' ></td><td><input id='best_before_date' name='best_before_date' type='text' placeholder='Best Before Date' ></td><td class='Button'><button id='submit'>Submit</button></td></form></tr>";

    // Genrate template:
    for (let i = 0; i < col_num - 1; i++) {
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

    // Set classes:
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
        $(this).attr("class", "id");
    });
    $(".TopSellTable tr:gt(0) td:nth-child(7)").each(function() {
        $(this).html("<div><button class='Edit'>Edit</button></div>" +
            "<div><button class='Delete'>Delete</button></div>"
        );
    });
    $topsell_table.append(input_row);

    // Fill in data:
    FillData(0, products);
}

/* Initial Event listeners */
function InitSort() {
    $("#top_img").on("click", () => { sortTable(0, "TopSell", "string"); }); //Image
    $("#top_pro").on("click", () => { sortTable(0, "TopSell", "string"); }); //Product
    $("#top_amo").on("click", () => { sortTable(1, "TopSell", "number"); }); //Amount
    $("#top_ori").on("click", () => { sortTable(2, "TopSell", "string"); }); //Origin
    $("#top_dat").on("click", () => { sortTable(3, "TopSell", "date"); }); //Best Before
}

/* Initial submit button */
function InitButton() {
    // By default, submit button is disabled
    document.querySelector('#submit').disabled = true;
    $("#submit").css({ "background": "gray", "cursor": "not-allowed" });
    // Enable button only if there is text in the input field
    $("#TopSell").delegate("#inputRow", "keyup", () => {
        if (document.querySelector('#image').value.length > 0 &&
            document.querySelector('#product').value.length > 0 &&
            document.querySelector('#amount').value.length > 0 &&
            document.querySelector('#origin').value.length > 0 &&
            document.querySelector('#best_before_date').value.length > 0) {

            document.querySelector('#submit').disabled = false;
            $("#submit").css({ "background": "rgb(76, 194, 61)", "cursor": "pointer" });
        } else
            document.querySelector('#submit').disabled = true;
    });
}

/* Fill in data using DOM */
function FillData(cur_index, products) {
    if (!cur_index) {
        $.each(products, (_index, _product) => {
            _fillRow(_index, _product);
            cur_index++;
        });
    } else {
        _fillRow(2, products);
    }

    // Clear input feilds:
    $.each($("#inputRow input"), function() {
        $(this).val("");
    });

    function _fillRow(_index, _product) {
        $.each(_product, (key, value) => {
            if (key == "image")
                $(".image").eq(cur_index).attr("src", `${_product.image}`);
            else if (key == "amount" && _index > 1)
                $(`.${key}`).eq(cur_index).text(`${value}kg`);
            else
                $(`.${key}`).eq(cur_index).text(`${value}`);
        });
    }
}

/* Add new data without reloading the entire page */
function AddNewData(sourse) {
    const new_row = "<tr>" +
        "<td><image class='image'></image></td>" +
        "<th class='product'></th>" +
        "<td class='amount'></td>" +
        "<td class='origin'></td>" +
        "<td class='best_before_date'></td>" +
        "<td class='id'></td>" +
        "<td><div><button class='Edit'>Edit</button></div>" +
        "<div><button class='Delete'>Delete</button></div></td>";

    $.ajax({
        type: 'GET',
        url: `${sourse.URI}`,
        success: function(products) {

            let cur_index = $(".TopSellTable").children().length - 2;

            $("#inputRow").before(new_row);
            $(".TopSellTable").children().eq(cur_index + 1).css("display", "none");
            FillData(cur_index, products[0]);
            $(".TopSellTable").children().eq(cur_index + 1).fadeIn(1500);
        },
    });
}