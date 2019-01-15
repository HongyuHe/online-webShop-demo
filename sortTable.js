function sortTable(n, id, isNumber) {
  var table, rows, switching, i, x, y, shouldSwitch, dir, switchcount = 0, offSet = 1, tempx, tempy;
  if(id == "TopSell"){
    offSet = 2;
  }
  table = document.getElementById(id);
  switching = true;
  // Set the sorting direction to ascending:
  dir = "asc";
  /* Make a loop that will continue until
  no switching has been done: */
  while (switching) {
    // Start by saying: no switching is done:
    switching = false;
    rows = table.rows;
    /* Loop through all table rows (except the
    first, which contains table headers): */
    for (i = 1; i < (rows.length - offSet); i++) {
      // Start by saying there should be no switching:
      shouldSwitch = false;
      /* Get the two elements you want to compare,
      one from current row and one from the next: */
      if (id == "TopSell" && n == 0){
        x = rows[i].getElementsByTagName("TH")[n];
        y = rows[i + 1].getElementsByTagName("TH")[n];
      } else {
        x = rows[i].getElementsByTagName("TD")[n];
        y = rows[i + 1].getElementsByTagName("TD")[n];
      }
      /* Check if the two rows should switch place,
      based on the direction, asc or desc: */

      if (dir == "asc") {
        if(!isNumber){
          if (x.innerHTML.toLowerCase() > y.innerHTML.toLowerCase()) {
            // If so, mark as a switch and break the loop:
            shouldSwitch = true;
            break;
          }
        } else { //if column is a number
          tempx = x.innerHTML.substring(0, x.innerHTML.length-2);
          tempy = y.innerHTML.substring(0, y.innerHTML.length-2);
          console.log(tempx);
          console.log(tempy);
          if (Number(tempx) > Number(tempy)) {
            shouldSwitch = true;
            break;
          }
        }
      } else if (dir == "desc") {
        if (!isNumber){
          if (x.innerHTML.toLowerCase() < y.innerHTML.toLowerCase()) {
            // If so, mark as a switch and break the loop:
            shouldSwitch = true;
            break;
          }
        } else { //If column is a number
          tempx = x.innerHTML.substring(0, x.innerHTML.length-2);
          tempy = y.innerHTML.substring(0, y.innerHTML.length-2);
          console.log(tempx);
          console.log(tempy);
          if (Number(tempx) < Number(tempy)) {
            shouldSwitch = true;
            break;
          }
        }
      }
    }
    if (shouldSwitch) {
      /* If a switch has been marked, make the switch
      and mark that a switch has been done: */
      rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
      switching = true;
      // Each time a switch is done, increase this count by 1:
      switchcount ++;
    } else {
      /* If no switching has been done AND the direction is "asc",
      set the direction to "desc" and run the while loop again. */
      if (switchcount == 0 && dir == "asc") {
        dir = "desc";
        switching = true;
      }
    }
  }
}
