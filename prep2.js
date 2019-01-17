document.addEventListener('DOMContentLoaded', () => {
    document.getElementById("changeBgc").onclick =
        () => document.body.style.backgroundColor = "red";

    document.getElementById("myLink").onclick =
        () => {
            alert("Anchor Clicked!");
            return false;
        };
});