// Access elements
// 1. Access by ID
const searchInput = document.getElementById("search-input")
const searchButton = document.getElementById("search-btn")

// 2. QuerySelector (CSS selectors)
const clearSearchBtn = document.querySelector(".cds--search-close") // The first
const rows = document.querySelectorAll(".cds--row") // get a list of all that match
const bordered = document.querySelectorAll(".cds--row, .cds--grid") // get a list of all that match

// 3. Elements List
const divs = document.getElementsByClassName("search-row cds--row")
const svgs = document.getElementsByTagName("svg")
const meta = document.getElementsByName("viewport")


console.log("We have found the following element ", meta)


// Events
document.addEventListener("DOMContentLoaded", (e) => {
    console.log("This event has been triggered ", e)
})
